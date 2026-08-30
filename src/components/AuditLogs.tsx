import React, { useState, useEffect } from 'react';
import { History, Search, ShieldAlert, ArrowRight } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  useEffect(() => {
    setLogs([
      { id: 1, action: 'CREATE', entity: 'EMPLOYEE', details: 'Added new employee John Doe', user: 'Admin User', date: new Date().toISOString() },
      { id: 2, action: 'UPDATE', entity: 'TIMESHEET', details: 'Approved timesheet for week 4', user: 'Jane Manager', date: new Date(Date.now() - 86400000).toISOString() },
      { id: 3, action: 'DELETE', entity: 'VEHICLE', details: 'Removed retired vehicle XYZ-987', user: 'Admin User', date: new Date(Date.now() - 172800000).toISOString() }
    ]);
  }, []);

  
  const filtered = logs.filter((item: any) => 
    (item.action && String(item.action).toLowerCase().includes(searchTerm.toLowerCase())) || (item.entity && String(item.entity).toLowerCase().includes(searchTerm.toLowerCase())) || (item.details && String(item.details).toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Audit Logs</h1>
          <p className="text-neutral-500 font-medium mt-1">Immutable record of system activities.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm flex-1 min-h-[400px] md:min-h-0 overflow-y-auto custom-scrollbar">
        <div className="p-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50/50">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
            <input type="text" placeholder="Search logs..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-neutral-900 outline-none" />
          </div>
        </div>
        
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 sticky top-0 z-10 border-b border-neutral-200 text-neutral-500 font-semibold uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Timestamp</th>
              <th className="px-6 py-3">Action</th>
              <th className="px-6 py-3">Entity</th>
              <th className="px-6 py-3">Details</th>
              <th className="px-6 py-3">User</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filtered.map(log => (
              <tr key={log.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-6 py-4 text-neutral-500 font-medium">
                  {new Date(log.date).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                    log.action === 'CREATE' ? 'bg-green-100 text-green-700' :
                    log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-neutral-600 text-xs">
                  {log.entity}
                </td>
                <td className="px-6 py-4 text-neutral-900">
                  {log.details}
                </td>
                <td className="px-6 py-4 text-neutral-600 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-700">
                    {log.user[0]}
                  </div>
                  {log.user}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
