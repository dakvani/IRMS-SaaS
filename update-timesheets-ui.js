import fs from 'fs';
const code = `import React, { useState, useEffect, useRef } from 'react';
import { FileText, CheckCircle, XCircle, FileSpreadsheet, Upload, Download, AlertCircle, Save, Send, Eye } from 'lucide-react';

export default function Timesheets() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'upload'>('dashboard');
  const [batches, setBatches] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Upload State
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = (window as any)._token;
      const headers = { Authorization: \\\`Bearer \\\${token}\\\` };
      const [batchRes, empRes, siteRes, projRes] = await Promise.all([
        fetch('/api/timesheet-batches', { headers }),
        fetch('/api/employees', { headers }),
        fetch('/api/sites', { headers }),
        fetch('/api/projects', { headers })
      ]);
      if (batchRes.ok) setBatches(await batchRes.json());
      if (empRes.ok) setEmployees(await empRes.json());
      if (siteRes.ok) setSites(await siteRes.json());
      if (projRes.ok) setProjects(await projRes.json());
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const downloadTemplate = () => {
    const headers = [
      "Emp ID", "Emp Name", "Allocated Site", "Allocated Project", "Common Working Time", "Shift",
      ...Array.from({length: 31}, (_, i) => (i+1).toString())
    ];
    const row = ["EMP-001", "John Doe", "Site A", "Project Alpha", "8", "Day", "8", "8", "8", "", "8", "8", "8", "8", "8", "8"];
    
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\\n" + row.join(',');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "timesheet_monthly_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedMonth) {
      alert("Please select a month first.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\\n');
      const errors: string[] = [];
      const newParsed: any[] = [];
      
      const headerLength = 6 + 31; // 6 metadata cols + 31 days

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const cols = line.split(',');
        const empCode = cols[0]?.trim();
        const empName = cols[1]?.trim();
        const siteName = cols[2]?.trim();
        const projName = cols[3]?.trim();
        const workingTime = cols[4]?.trim();
        const shift = cols[5]?.trim();

        if (!empCode) continue;

        // Find matches
        const emp = employees.find(e => e.employeeId === empCode || e.id.toString() === empCode);
        if (!emp) {
          errors.push(\\\`Row \\\${i+1}: Employee \\\${empCode} not found.\\\`);
          continue;
        }

        let siteId = null;
        if (siteName) {
          const site = sites.find(s => s.name.toLowerCase() === siteName.toLowerCase());
          if (site) siteId = site.id;
          else errors.push(\\\`Row \\\${i+1}: Site '\\\${siteName}' not found.\\\`);
        }

        let projId = null;
        if (projName) {
          const proj = projects.find(p => p.name.toLowerCase() === projName.toLowerCase());
          if (proj) projId = proj.id;
          else errors.push(\\\`Row \\\${i+1}: Project '\\\${projName}' not found.\\\`);
        }

        // Parse days
        let totalHours = 0;
        const dailyRecords = [];
        
        for (let day = 1; day <= 31; day++) {
          const val = cols[5 + day]?.trim();
          if (!val) continue;
          
          let hours = 0;
          if (val.includes('-')) {
             // Basic parse for 08:00-17:00
             const [start, end] = val.split('-');
             if (start && end) {
                const startH = parseInt(start.split(':')[0] || '0');
                const endH = parseInt(end.split(':')[0] || '0');
                hours = endH - startH;
                if (hours < 0) hours += 24; // night shift rough calc
             }
          } else {
             hours = parseFloat(val) || 0;
          }

          if (hours > 0) {
            totalHours += hours;
            const dateStr = \\\`\\\${selectedMonth}-\\\${day.toString().padStart(2, '0')}\\\`;
            // Check if valid date
            const dateObj = new Date(dateStr);
            if (!isNaN(dateObj.getTime()) && dateObj.toISOString().startsWith(selectedMonth)) {
               dailyRecords.push({
                 employeeId: emp.id,
                 siteId: siteId,
                 projectId: projId,
                 date: dateObj.toISOString(),
                 hoursWorked: hours,
                 notes: \\\`Shift: \\\${shift}, Working Time: \\\${workingTime}\\\`,
                 attendanceStatus: 'Present'
               });
            }
          }
        }
        
        if (dailyRecords.length > 0) {
           newParsed.push({
             empName: emp.firstName + ' ' + emp.lastName,
             siteName,
             projName,
             totalHours,
             records: dailyRecords
           });
        }
      }

      setParsedData(newParsed);
      setCsvErrors(errors);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleBulkSubmit = async (status: 'draft' | 'submitted') => {
    if (parsedData.length === 0) return;
    
    // Flatten all daily records
    const allRecords = parsedData.flatMap(p => p.records).map(r => ({ ...r, status }));

    try {
      const token = (window as any)._token;
      const res = await fetch('/api/timesheets/bulk-upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: \\\`Bearer \\\${token}\\\` },
        body: JSON.stringify({ records: allRecords })
      });
      if (!res.ok) throw new Error(await res.text());
      
      alert(\\\`Successfully saved \\\${allRecords.length} daily records!\\\`);
      setParsedData([]);
      setActiveTab('dashboard');
      fetchData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleBatchAction = async (month: string, siteId: number, projectId: number, status: 'approved' | 'rejected') => {
    try {
      const token = (window as any)._token;
      const res = await fetch('/api/timesheet-batches/approve', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: \\\`Bearer \\\${token}\\\` },
        body: JSON.stringify({ month, siteId, projectId, status })
      });
      if (!res.ok) throw new Error(await res.text());
      fetchData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center items-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Timesheet Dashboard</h1>
          <p className="text-neutral-500 font-medium mt-1">Review and approve uploaded monthly timesheets.</p>
        </div>
        <div className="flex bg-neutral-100 p-1 rounded-lg">
          <button onClick={() => setActiveTab('dashboard')} className={\\\`px-4 py-2 rounded-md text-sm font-medium transition-colors \\\${activeTab === 'dashboard' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}\\\`}>Dashboard</button>
          <button onClick={() => setActiveTab('upload')} className={\\\`px-4 py-2 rounded-md text-sm font-medium transition-colors \\\${activeTab === 'upload' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}\\\`}>Upload Batch</button>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-neutral-100 flex justify-between items-center">
            <h3 className="font-bold text-neutral-900">Uploaded Timesheets</h3>
          </div>
          {batches.length > 0 ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-100 text-neutral-500 font-semibold uppercase text-xs">
                <tr>
                  <th className="px-5 py-3">Month</th>
                  <th className="px-5 py-3">Site Name</th>
                  <th className="px-5 py-3">Project Name</th>
                  <th className="px-5 py-3">Employees</th>
                  <th className="px-5 py-3">Total Hrs</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {batches.map((b, i) => (
                  <tr key={i} className="hover:bg-neutral-50">
                    <td className="px-5 py-3 font-medium text-neutral-900">{b.month}</td>
                    <td className="px-5 py-3">{b.site_name || '-'}</td>
                    <td className="px-5 py-3">{b.project_name || '-'}</td>
                    <td className="px-5 py-3">{b.employee_count}</td>
                    <td className="px-5 py-3">{b.total_hours}</td>
                    <td className="px-5 py-3">
                       <span className={\\\`px-2.5 py-1 rounded-full text-xs font-semibold \\\${b.status === 'approved' ? 'bg-green-100 text-green-700' : b.status === 'rejected' ? 'bg-red-100 text-red-700' : b.status === 'submitted' ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-700'}\\\`}>
                         {b.status}
                       </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {b.status === 'submitted' && (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleBatchAction(b.month, b.site_id, b.project_id, 'rejected')} className="px-3 py-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-md font-medium transition-colors">Reject</button>
                          <button onClick={() => handleBatchAction(b.month, b.site_id, b.project_id, 'approved')} className="px-3 py-1.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-md font-medium transition-colors">Approve</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-neutral-500">
              <FileSpreadsheet className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
              <p>No timesheet batches uploaded yet.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'upload' && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <h3 className="font-bold text-neutral-900 text-lg">Upload Monthly Timesheet</h3>
            <button onClick={downloadTemplate} className="text-sm flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-medium">
              <Download className="w-4 h-4" /> CSV Template
            </button>
          </div>
          
          <div className="flex items-end gap-4 mb-8">
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium mb-1">Select Month *</label>
              <input type="month" className="w-full px-3 py-2 border border-neutral-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none rounded-lg" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} />
            </div>
            <div>
              <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg font-medium flex items-center gap-2 transition-colors">
                <Upload className="w-4 h-4" /> Select CSV File
              </button>
            </div>
          </div>

          {csvErrors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl">
              <h4 className="text-red-800 font-bold flex items-center gap-2 mb-2"><AlertCircle className="w-4 h-4" /> Import Warnings</h4>
              <ul className="text-sm text-red-600 list-disc pl-5 space-y-1">
                {csvErrors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}

          {parsedData.length > 0 && (
            <div>
              <h4 className="font-bold text-neutral-900 mb-3">Preview ({parsedData.length} Employees)</h4>
              <div className="overflow-x-auto border border-neutral-200 rounded-xl mb-6">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Allocated Site</th>
                      <th className="px-4 py-3">Allocated Project</th>
                      <th className="px-4 py-3">Days Logged</th>
                      <th className="px-4 py-3">Total Hrs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {parsedData.map((row, i) => (
                      <tr key={i} className="hover:bg-neutral-50">
                        <td className="px-4 py-3 font-medium text-neutral-900">{row.empName}</td>
                        <td className="px-4 py-3">{row.siteName || '-'}</td>
                        <td className="px-4 py-3">{row.projName || '-'}</td>
                        <td className="px-4 py-3">{row.records.length} days</td>
                        <td className="px-4 py-3 font-medium">{row.totalHours}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="flex gap-3 justify-end">
                <button onClick={() => handleBulkSubmit('draft')} className="px-5 py-2 font-medium text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-lg flex items-center gap-2 shadow-sm">
                  <Save className="w-4 h-4" /> Save as Draft
                </button>
                <button onClick={() => handleBulkSubmit('submitted')} className="px-5 py-2 font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2 shadow-sm">
                  <Send className="w-4 h-4" /> Submit for Approval
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
`;
fs.writeFileSync('src/components/Timesheets.tsx', code);
