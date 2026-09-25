import React, { useEffect, useState } from 'react';
import { Download, FileText, ClipboardList, Clock, ArrowDownToLine, History } from 'lucide-react';

export default function Reports() {
  const [activeTab, setActiveTab] = useState<'exports' | 'audit' | 'assets'>('exports');
  const [assetReports, setAssetReports] = useState<any[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  
  const fetchAssetReports = async () => {
    setIsLoadingAssets(true);
    try {
      const token = (window as any)._token;
      const res = await fetch('/api/reports/assets', { headers: { Authorization: `Bearer ${token}` }});
      if (res.ok) setAssetReports(await res.json());
    } catch(e) { console.error(e); } finally { setIsLoadingAssets(false); }
  };

  const fetchAuditLogs = async () => {
    setIsLoadingLogs(true);
    setError(null);
    try {
      const token = (window as any)._token;
      if (!token) throw new Error("No auth token");

      const res = await fetch('/api/audit-logs', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to fetch audit logs');
      
      const data = await res.json();
      setAuditLogs(data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unknown error occurred');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit') fetchAuditLogs();
    if (activeTab === 'assets') fetchAssetReports();
  }, [activeTab]);

  const handleExport = async (endpoint: string, filename: string) => {
    try {
      const token = (window as any)._token;
      if (!token) throw new Error("No auth token");

      // Log the export action
      await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          action: 'EXPORT',
          entity: filename.toUpperCase().split('.')[0],
          details: { endpoint }
        })
      });

      const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Failed to fetch data for export`);
      
      const data = await res.json();
      if (!data || data.length === 0) {
        alert('No data to export.');
        return;
      }
      
      // Convert JSON to CSV
      const headers = Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object'); // Flattening simplified for MVP
      const csvRows = [];
      csvRows.push(headers.join(','));
      
      for (const row of data) {
        const values = headers.map(header => {
          const val = row[header];
          if (val === null || val === undefined) return '';
          return `"${String(val).replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
      }
      
      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', filename);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
    } catch (err: any) {
      console.error(err);
      alert('Error exporting data: ' + err.message);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50/50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            Reports & Audit Logs
          </h2>
        </div>
        
        <div className="flex gap-4 border-b border-neutral-200">
          <button 
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'exports' ? 'border-blue-600 text-blue-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
            onClick={() => setActiveTab('exports')}
          >
            Data Exports
          </button>
          <button className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'audit' ? 'border-blue-600 text-blue-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`} onClick={() => setActiveTab('audit')}>Audit Logs</button>
          <button className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'assets' ? 'border-blue-600 text-blue-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`} onClick={() => setActiveTab('assets')}>Asset Performance</button>
        </div>
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 text-red-700 border-b border-red-100 text-sm">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {/* EXPORTS TAB */}
        {activeTab === 'exports' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ExportCard 
                title="Employee Roster" 
                description="Export a complete list of all employees and their current status."
                icon={<FileText className="w-6 h-6 text-blue-600" />}
                onExport={() => handleExport('/api/employees', 'employees.csv')}
              />
              <ExportCard 
                title="Sites & Locations" 
                description="Download site details and their current operational status."
                icon={<FileText className="w-6 h-6 text-emerald-600" />}
                onExport={() => handleExport('/api/sites', 'sites.csv')}
              />
              <ExportCard 
                title="Active Projects" 
                description="List of all projects with start and end dates."
                icon={<FileText className="w-6 h-6 text-purple-600" />}
                onExport={() => handleExport('/api/projects', 'projects.csv')}
              />
              <ExportCard 
                title="Timesheets Summary" 
                description="Export timesheet records for auditing and payroll integration."
                icon={<FileText className="w-6 h-6 text-amber-600" />}
                onExport={() => handleExport('/api/timesheets', 'timesheets.csv')}
              />
              <ExportCard 
                title="Asset Inventory" 
                description="Current inventory of tools, vehicles, and equipment."
                icon={<FileText className="w-6 h-6 text-orange-600" />}
                onExport={() => handleExport('/api/assets', 'assets.csv')}
              />
            </div>
          </div>
        )}

        {/* AUDIT LOGS TAB */}
        
        {/* ASSETS PERFORMANCE TAB */}
        {activeTab === 'assets' && (
          <div>
            <div className="p-6 bg-neutral-50 border-b border-neutral-200">
              <h3 className="text-lg font-bold text-neutral-900 mb-1">Asset Downtime & Service Report</h3>
              <p className="text-sm text-neutral-600">Calculates total downtime days and service frequency over the last 12 months for underperforming equipment.</p>
            </div>
            {isLoadingAssets ? (
              <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
            ) : assetReports.length === 0 ? (
              <div className="p-12 text-center text-neutral-500"><p>No service history found in the last 12 months.</p></div>
            ) : (
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm flex-1 min-h-[400px] md:min-h-0 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-50 sticky top-0 z-10 text-neutral-500 border-b border-neutral-200 uppercase text-xs font-semibold">
                    <tr>
                      <th className="px-6 py-3">Asset Name</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3">Asset Tag</th>
                      <th className="px-6 py-3">12m Service Frequency</th>
                      <th className="px-6 py-3">Total Downtime (Days)</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {assetReports.sort((a,b) => b.downtime - a.downtime).map((report) => (
                      <tr key={report.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-neutral-900">{report.name}</td>
                        <td className="px-6 py-4"><span className="px-2 py-1 bg-neutral-100 text-neutral-700 rounded text-xs">{report.type}</span></td>
                        <td className="px-6 py-4 font-mono text-neutral-500 text-xs">{report.assetTag}</td>
                        <td className="px-6 py-4 font-bold text-neutral-700">{report.serviceCount}x</td>
                        <td className="px-6 py-4 font-bold text-red-600">{report.downtime} days</td>
                        <td className="px-6 py-4">
                          {report.downtime > 14 || report.serviceCount > 3 ? (
                            <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">High Risk</span>
                          ) : (
                            <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">Healthy</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'audit' && (
          <div>
            {isLoadingLogs ? (
              <div className="p-12 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="p-12 text-center text-neutral-500">
                <History className="w-12 h-12 mx-auto text-neutral-300 mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-1">No audit logs found</h3>
                <p>System activities and changes will appear here.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm flex-1 min-h-[400px] md:min-h-0 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-50 sticky top-0 z-10 text-neutral-500 border-b border-neutral-200 uppercase text-xs font-semibold">
                    <tr>
                      <th className="px-6 py-3">Timestamp</th>
                      <th className="px-6 py-3">User</th>
                      <th className="px-6 py-3">Action</th>
                      <th className="px-6 py-3">Entity</th>
                      <th className="px-6 py-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-neutral-600">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 font-medium text-neutral-900">
                          {log.user ? log.user.name || log.user.email : 'Unknown User'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            log.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                            log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                            log.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                            log.action === 'EXPORT' ? 'bg-purple-100 text-purple-800' :
                            'bg-neutral-100 text-neutral-800'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs text-neutral-600 bg-neutral-100 px-2 py-1 rounded">
                            {log.entity} {log.entityId ? `#${log.entityId}` : ''}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-neutral-500">
                          {log.details ? log.details : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ExportCard({ title, description, icon, onExport }: { title: string, description: string, icon: React.ReactNode, onExport: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 flex flex-col h-full hover:border-blue-300 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-neutral-50 rounded-lg">
          {icon}
        </div>
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-neutral-900 mb-1">{title}</h3>
        <p className="text-sm text-neutral-500">{description}</p>
      </div>
      <div className="mt-6 pt-4 border-t border-neutral-100">
        <button 
          onClick={onExport}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <ArrowDownToLine className="w-4 h-4" />
          Export CSV
        </button>
      </div>
    </div>
  );
}
