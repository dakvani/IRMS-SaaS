import React, { useState, useEffect, useRef } from 'react';
import { FileText, CheckCircle, XCircle, FileSpreadsheet, Upload, Download, AlertCircle, Save, Send, Eye, Search, X, MessageSquare, History, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Timesheets() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'upload'>('dashboard');
  const [batches, setBatches] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dashboard Search
  const [searchTerm, setSearchTerm] = useState('');

  // Upload State
  
  const [selectedUploadSite, setSelectedUploadSite] = useState('');
  const [selectedUploadProject, setSelectedUploadProject] = useState('');

  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const maxMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Review Modal State
  const [reviewingBatch, setReviewingBatch] = useState<any | null>(null);
  const [batchDetails, setBatchDetails] = useState<any[]>([]);

  const [batchHistory, setBatchHistory] = useState<any[]>([]);

  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const [actionType, setActionType] = useState<'rejected' | 'on-hold' | null>(null);
  const [actionReason, setActionReason] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = (window as any)._token;
      const headers = { Authorization: `Bearer ${token}` };
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

  const downloadTemplate = async () => {
    try {
      const token = (window as any)._token;
      let url = '/api/timesheets/template-data?';
      if (selectedUploadSite) url += `siteId=${selectedUploadSite}&`;
      if (selectedUploadProject) url += `projectId=${selectedUploadProject}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      const [yearStr, monthStr] = selectedMonth.split('-');
      const daysInMonth = yearStr && monthStr ? new Date(parseInt(yearStr), parseInt(monthStr), 0).getDate() : 31;
      
      const headers = [
        "Emp ID", "Emp Name", "Allocated Site", "Allocated Project", "Common Working Time", "Shift",
        ...Array.from({length: daysInMonth}, (_, i) => (i+1).toString())
      ];
      
      let rows = data.map((emp: any) => {
        return [
          emp.employeeId, 
          `${emp.firstName} ${emp.lastName}`,
          emp.siteName || '',
          emp.projectName || '',
          "8", "Day",
          ...Array.from({length: daysInMonth}, () => "8")
        ].join(',');
      });

      if (rows.length === 0) {
        rows = [
          ["EMP-001", "John Doe", "Site A", "Project Alpha", "8", "Day", ...Array.from({length: daysInMonth}, () => "8")].join(',')
        ];
      }

      const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\n" + rows.join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `timesheet_template_${selectedMonth}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      alert('Failed to generate template');
    }
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
      const lines = text.split('\n');
      const errors: string[] = [];
      const newParsed: any[] = [];
      
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

        const emp = employees.find(e => e.employeeId === empCode || e.id.toString() === empCode);
        if (!emp) {
          errors.push(`Row ${i+1}: Employee ${empCode} not found.`);
          continue;
        }

        let siteId = null;
        if (siteName) {
          const site = sites.find(s => s.name.toLowerCase() === siteName.toLowerCase());
          if (site) siteId = site.id;
          else errors.push(`Row ${i+1}: Site '${siteName}' not found.`);
        }

        let projId = null;
        if (projName) {
          const proj = projects.find(p => p.name.toLowerCase() === projName.toLowerCase());
          if (proj) projId = proj.id;
          else errors.push(`Row ${i+1}: Project '${projName}' not found.`);
        }

        let totalHours = 0;
        const dailyRecords = [];
        
        for (let day = 1; day <= 31; day++) {
          const val = cols[5 + day]?.trim();
          if (!val) continue;
          
          let hours = 0;
          if (val.includes('-')) {
             const [start, end] = val.split('-');
             if (start && end) {
                const startH = parseInt(start.split(':')[0] || '0');
                const endH = parseInt(end.split(':')[0] || '0');
                hours = endH - startH;
                if (hours < 0) hours += 24; 
             }
          } else {
             hours = parseFloat(val) || 0;
          }

          if (hours > 0) {
            totalHours += hours;
            const dateStr = `${selectedMonth}-${day.toString().padStart(2, '0')}`;
            const dateObj = new Date(dateStr);
            if (!isNaN(dateObj.getTime())) {
               dailyRecords.push({
                 employeeId: emp.id,
                 siteId: siteId,
                 projectId: projId,
                 date: dateStr,
                 hoursWorked: hours,
                 notes: `Shift: ${shift}, Working Time: ${workingTime}`,
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
    const allRecords = parsedData.flatMap(p => p.records).map(r => ({ ...r, status }));

    try {
      const token = (window as any)._token;
      const res = await fetch('/api/timesheets/bulk-upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ records: allRecords })
      });
      if (!res.ok) throw new Error(await res.text());
      
      alert(`Successfully saved ${allRecords.length} daily records!`);
      setParsedData([]);
      setActiveTab('dashboard');
      fetchData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleBatchAction = async (month: string, siteId: number, projectId: number, status: 'approved' | 'rejected' | 'on-hold', reason?: string) => {
    try {
      const token = (window as any)._token;
      const res = await fetch('/api/timesheet-batches/approve', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ month, siteId, projectId, status, reason })
      });
      if (!res.ok) throw new Error(await res.text());
      
      setReviewingBatch(null);
      setActionType(null);
      setActionReason('');
      fetchData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const openReviewModal = async (batch: any) => {
    setReviewingBatch(batch);
    setActionType(null);
    setActionReason('');
    setIsReviewLoading(true);
    try {
      const token = (window as any)._token;
      const params = new URLSearchParams();
      params.append('month', batch.month);
      if (batch.site_id) params.append('siteId', batch.site_id);
      if (batch.project_id) params.append('projectId', batch.project_id);
      
      const res = await fetch(`/api/timesheets?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const histRes = await fetch(`/api/timesheet-batches/history?month=${batch.month}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        setBatchDetails(await res.json());
      }
      if (histRes.ok) {
        setBatchHistory(await histRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsReviewLoading(false);
    }
  };

  
  const [yearStr, monthStr] = reviewingBatch?.month?.split('-') || [];
  const daysInMonth = yearStr && monthStr ? new Date(parseInt(yearStr), parseInt(monthStr), 0).getDate() : 31;
  const daysArray = Array.from({length: daysInMonth}, (_, i) => i + 1);

  const employeeData = React.useMemo(() => {
    const map = new Map();
    batchDetails.forEach(detail => {
      const empId = detail.employee?.id;
      if (!map.has(empId)) {
        map.set(empId, {
          id: empId,
          name: `${detail.employee?.firstName} ${detail.employee?.lastName}`,
          records: {},
          total: 0,
          shift: '-',
          workingTime: '-'
        });
      }
      const emp = map.get(empId);
      
      // Extract shift and working time from notes of the first available record
      if (detail.notes && emp.shift === '-') {
        const shiftMatch = detail.notes.match(/Shift: (.*?),/);
        const wtMatch = detail.notes.match(/Working Time: (.*)/);
        if (shiftMatch) emp.shift = shiftMatch[1];
        if (wtMatch) emp.workingTime = wtMatch[1];
      }

      if (detail.date) {
        const dayStr = detail.date.split('T')[0].split('-')[2];
        const day = parseInt(dayStr, 10);
        emp.records[day] = detail;
        emp.total += (detail.hoursWorked || 0);
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [batchDetails]);

  if (isLoading) return <div className="p-8 flex justify-center items-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  const filteredBatches = batches.filter(b => 
    (b.site_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (b.project_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.month.includes(searchTerm)
  );

  return (
    <div className="h-full flex flex-col gap-6 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Timesheet Dashboard</h1>
          <p className="text-neutral-500 font-medium mt-1">Review and approve uploaded monthly timesheets.</p>
        </div>
        <div className="flex bg-neutral-100 p-1 rounded-lg">
          <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}>Dashboard</button>
          <button onClick={() => setActiveTab('upload')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'upload' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}>Upload Batch</button>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-neutral-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="font-bold text-neutral-900">Uploaded Timesheets</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input 
                type="text" 
                placeholder="Search site, project, or month..." 
                className="pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          {filteredBatches.length > 0 ? (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-sm table-auto">
                <thead className="bg-neutral-50 border-b border-neutral-100 text-neutral-500 font-semibold uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 w-24">Month</th>
                    <th className="px-4 py-3">Site / Project</th>
                    <th className="px-4 py-3 w-24 text-center">Employees</th>
                    <th className="px-4 py-3 w-24 text-center">Total Hrs</th>
                    <th className="px-4 py-3 w-32">Status</th>
                    <th className="px-4 py-3 w-28 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                        {employeeData.map(emp => (
                          <tr key={emp.id} className="hover:bg-neutral-50">
                            <td className="px-4 py-3 sticky left-0 bg-white group-hover:bg-neutral-50 z-10 font-medium text-neutral-900 shadow-[1px_0_0_#e5e5e5]">
                              {emp.name}
                            </td>
                            <td className="px-3 py-3 text-neutral-600 text-[11px] truncate max-w-[120px] border-l border-neutral-100">
                              {reviewingBatch?.site_name} / {reviewingBatch?.project_name}
                            </td>
                            <td className="px-2 py-3 text-center text-neutral-600 font-medium text-xs border-l border-neutral-100">
                              {emp.workingTime}
                            </td>
                            <td className="px-2 py-3 text-center text-neutral-600 font-medium text-xs border-l border-neutral-100">
                              {emp.shift}
                            </td>
                            <td className="px-3 py-3 font-bold text-indigo-700 text-center shadow-[-1px_0_0_#e5e5e5] border-l border-neutral-100 bg-white">
                              {emp.total}
                            </td>
                            {daysArray.map(day => {
                              const rec = emp.records[day];
                              return (
                                <td key={day} className="px-1.5 py-3 text-center border-l border-neutral-50" title={rec?.notes || ''}>
                                  {rec ? (
                                    <span className={`inline-flex items-center justify-center w-6 h-6 text-xs rounded ${rec.attendanceStatus === 'Present' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'bg-neutral-100 text-neutral-600'}`}>
                                      {rec.hoursWorked}
                                    </span>
                                  ) : (
                                    <span className="text-neutral-300">-</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-neutral-500">
              <FileSpreadsheet className="w-12 h-12 mx-auto text-neutral-300 mb-4" />
              <p className="text-base font-medium text-neutral-900 mb-1">No timesheets found</p>
              <p className="text-sm">Try adjusting your search or upload a new batch.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'upload' && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <h3 className="font-bold text-neutral-900 text-lg">Upload Monthly Timesheet</h3>
            <button onClick={downloadTemplate} className="text-sm flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-medium bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
              <Download className="w-4 h-4" /> CSV Template
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 mb-8">
            <div className="flex-1 w-full max-w-xs">
              <label className="block text-sm font-medium mb-1 text-neutral-700">Site</label>
              <select className="w-full px-3 py-2 border border-neutral-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none rounded-lg" value={selectedUploadSite} onChange={e=>setSelectedUploadSite(e.target.value)}>
                <option value="">All Sites</option>
                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="flex-1 w-full max-w-xs">
              <label className="block text-sm font-medium mb-1 text-neutral-700">Project</label>
              <select className="w-full px-3 py-2 border border-neutral-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none rounded-lg" value={selectedUploadProject} onChange={e=>setSelectedUploadProject(e.target.value)}>
                <option value="">All Projects</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="flex-1 w-full max-w-xs">
              <label className="block text-sm font-medium mb-1 text-neutral-700">Select Month *</label>
              <input type="month" className="w-full px-3 py-2 border border-neutral-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none rounded-lg" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} />
            </div>
            <div className="w-full sm:w-auto">
              <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              <button onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors">
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
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h4 className="font-bold text-neutral-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" /> Preview ({parsedData.length} Employees)
              </h4>
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
                      <tr key={i} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-neutral-900">{row.empName}</td>
                        <td className="px-4 py-3 text-neutral-600">{row.siteName || '-'}</td>
                        <td className="px-4 py-3 text-neutral-600">{row.projName || '-'}</td>
                        <td className="px-4 py-3 font-medium">{row.records.length} days</td>
                        <td className="px-4 py-3 font-bold text-indigo-700">{row.totalHours}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="flex gap-3 justify-end pt-2">
                <button onClick={() => handleBulkSubmit('draft')} className="px-5 py-2 font-medium text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-lg flex items-center gap-2 shadow-sm transition-colors">
                  <Save className="w-4 h-4" /> Save as Draft
                </button>
                <button onClick={() => handleBulkSubmit('submitted')} className="px-5 py-2 font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2 shadow-sm transition-colors">
                  <Send className="w-4 h-4" /> Submit for Approval
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Review Modal */}
      <AnimatePresence>
        {reviewingBatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setReviewingBatch(null)} 
              className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col relative z-10 overflow-hidden border border-neutral-200"
            >
              <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">Review Batch: {reviewingBatch.month}</h2>
                  <p className="text-sm text-neutral-500 font-medium mt-0.5">
                    {reviewingBatch.site_name || 'No Site'} &bull; {reviewingBatch.project_name || 'No Project'}
                  </p>
                </div>
                <button onClick={() => setReviewingBatch(null)} className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-0 flex-1 overflow-y-auto custom-scrollbar">
                {isReviewLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : employeeData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-white sticky top-0 z-10 border-b border-neutral-200 text-neutral-500 font-semibold uppercase text-[10px] shadow-sm">
                        <tr>
                          <th className="px-4 py-3 sticky left-0 bg-white z-20 shadow-[1px_0_0_#e5e5e5]">Employee</th>
                          <th className="px-3 py-3 border-l border-neutral-100">Site/Proj</th>
                          <th className="px-2 py-3 text-center border-l border-neutral-100" title="Common Working Time">CWT</th>
                          <th className="px-2 py-3 text-center border-l border-neutral-100">Shift</th>
                          <th className="px-3 py-3 text-center bg-white shadow-[-1px_0_0_#e5e5e5] border-l border-neutral-100">Total</th>
                          {daysArray.map(day => (
                            <th key={day} className="px-1.5 py-3 text-center min-w-[32px]">{day}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {employeeData.map(emp => (
                          <tr key={emp.id} className="hover:bg-neutral-50">
                            <td className="px-4 py-3 sticky left-0 bg-white group-hover:bg-neutral-50 z-10 font-medium text-neutral-900 shadow-[1px_0_0_#e5e5e5]">
                              {emp.name}
                            </td>
                            <td className="px-4 py-3 font-bold text-indigo-700 text-center shadow-[-1px_0_0_#e5e5e5] border-l border-neutral-100 bg-white">
                              {emp.total}
                            </td>
                            {daysArray.map(day => {
                              const rec = emp.records[day];
                              return (
                                <td key={day} className="px-2 py-3 text-center border-l border-neutral-50" title={rec?.notes || ''}>
                                  {rec ? (
                                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md ${rec.attendanceStatus === 'Present' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'bg-neutral-100 text-neutral-600'}`}>
                                      {rec.hoursWorked}
                                    </span>
                                  ) : (
                                    <span className="text-neutral-300">-</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-neutral-500">
                    <p>No detailed records found for this batch.</p>
                  </div>
                )}
              </div>
              
              <div className="border-t border-neutral-100 bg-neutral-50 px-6 py-4 max-h-48 overflow-y-auto custom-scrollbar">
                <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2 mb-3">
                  <History className="w-4 h-4 text-neutral-500" /> Review History
                </h4>
                {batchHistory.length > 0 ? (
                  <div className="space-y-3">
                    {batchHistory.map(log => (
                      <div key={log.id} className="flex gap-3 text-sm">
                        <div className="mt-0.5">
                          {log.action === 'APPROVE' && <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />}
                          {log.action === 'REJECT' && <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5" />}
                          {log.action === 'ON_HOLD' && <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5" />}
                          {log.action === 'SUBMIT' && <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5" />}
                          {!['APPROVE', 'REJECT', 'ON_HOLD', 'SUBMIT'].includes(log.action) && <div className="w-2 h-2 rounded-full bg-neutral-400 mt-1.5" />}
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">
                            {log.user?.name || 'System User'} <span className="text-neutral-500 font-normal">({log.action})</span>
                          </p>
                          <p className="text-neutral-600">{log.details}</p>
                          <p className="text-xs text-neutral-400 mt-0.5">{new Date(log.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">No review history available.</p>
                )}
              </div>
              
              <div className="p-5 border-t border-neutral-100 bg-white">
                <AnimatePresence mode="wait">
                  {actionType ? (
                    <motion.div 
                      key="action-palette"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex flex-col gap-3"
                    >
                      <label className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4" /> 
                        {actionType === 'rejected' ? 'Rejection Reason' : 'On-Hold Reason'} <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        autoFocus
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        placeholder="Please provide a detailed reason..."
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-none h-24"
                      />
                      <div className="flex justify-end gap-3 mt-2">
                        <button 
                          onClick={() => setActionType(null)} 
                          className="px-5 py-2 font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          disabled={!actionReason.trim()}
                          onClick={() => handleBatchAction(reviewingBatch.month, reviewingBatch.site_id, reviewingBatch.project_id, actionType, actionReason)} 
                          className="px-5 py-2 font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
                        >
                          Confirm {actionType === 'rejected' ? 'Rejection' : 'Hold'}
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="action-buttons"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex justify-between items-center"
                    >
                      <div className="text-sm text-neutral-500 font-medium">
                        Current Status: <span className="font-bold text-neutral-900 uppercase">{reviewingBatch.status}</span>
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => setReviewingBatch(null)} 
                          className="px-4 py-2 font-medium text-neutral-600 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-lg transition-colors"
                        >
                          Close
                        </button>
                        {(reviewingBatch.status === 'submitted' || reviewingBatch.status === 'on-hold') && (
                          <>
                            {reviewingBatch.status !== 'on-hold' && (
                              <button 
                                onClick={() => setActionType('on-hold')} 
                                className="px-5 py-2 font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors"
                              >
                                Put On-Hold
                              </button>
                            )}
                            <button 
                              onClick={() => setActionType('rejected')} 
                              className="px-5 py-2 font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                            >
                              Reject
                            </button>
                            <button 
                              onClick={() => handleBatchAction(reviewingBatch.month, reviewingBatch.site_id, reviewingBatch.project_id, 'approved')} 
                              className="px-5 py-2 font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                            >
                              Approve Batch
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
