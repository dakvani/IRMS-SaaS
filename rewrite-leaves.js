import fs from 'fs';

const newLeaves = `import React, { useState, useEffect } from 'react';
import { CalendarOff, Plus, X, Eye, CheckCircle, XCircle, Search, MessageSquare, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Leaves() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Review Modal State
  const [reviewingLeave, setReviewingLeave] = useState<any | null>(null);
  const [leaveHistory, setLeaveHistory] = useState<any[]>([]);
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const [actionType, setActionType] = useState<'rejected' | 'on-hold' | null>(null);
  const [actionReason, setActionReason] = useState('');

  const [formData, setFormData] = useState({
    employeeId: '',
    siteId: '',
    projectId: '',
    leaveType: 'Annual',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = (window as any)._token;
      const headers = { Authorization: \`Bearer \${token}\` };
      const [leavesRes, empRes, siteRes, projRes] = await Promise.all([
        fetch('/api/leaves', { headers }),
        fetch('/api/employees', { headers }),
        fetch('/api/sites', { headers }),
        fetch('/api/projects', { headers })
      ]);
      
      if (leavesRes.ok) setLeaves(await leavesRes.json());
      if (empRes.ok) setEmployees(await empRes.json());
      if (siteRes.ok) setSites(await siteRes.json());
      if (projRes.ok) setProjects(await projRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = (window as any)._token;
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: \`Bearer \${token}\`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsAdding(false);
        setFormData({ employeeId: '', siteId: '', projectId: '', leaveType: 'Annual', startDate: '', endDate: '', reason: '' });
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create leave request');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const openReviewModal = async (leave: any) => {
    setReviewingLeave(leave);
    setActionType(null);
    setActionReason('');
    setIsReviewLoading(true);
    try {
      const token = (window as any)._token;
      const histRes = await fetch(\`/api/leaves/\${leave.id}/history\`, {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      if (histRes.ok) {
        setLeaveHistory(await histRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsReviewLoading(false);
    }
  };

  const submitAction = async (status: string) => {
    if ((status === 'rejected' || status === 'on-hold') && !actionReason.trim()) {
      alert('Please provide a reason.');
      return;
    }
    
    try {
      const token = (window as any)._token;
      const res = await fetch(\`/api/leaves/\${reviewingLeave.id}/action\`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: \`Bearer \${token}\`
        },
        body: JSON.stringify({ status, reason: actionReason })
      });
      
      if (!res.ok) throw new Error('Failed to update status');
      
      setReviewingLeave(null);
      setActionType(null);
      setActionReason('');
      fetchData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const filteredLeaves = leaves.filter(l => 
    (l.employee?.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (l.employee?.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.site?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.project?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col gap-6 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Leave Management</h1>
          <p className="text-neutral-500 mt-1">Review and manage site employee time off.</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Request Leave
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex justify-between items-center mb-6 border-b border-neutral-100 pb-4">
            <h3 className="font-bold text-neutral-900 text-lg">New Leave Request</h3>
            <button onClick={() => setIsAdding(false)} className="text-neutral-400 hover:text-neutral-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Site</label>
                <select 
                  value={formData.siteId}
                  onChange={e => setFormData({...formData, siteId: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-sm bg-white"
                >
                  <option value="">None / Global</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Project</label>
                <select 
                  value={formData.projectId}
                  onChange={e => setFormData({...formData, projectId: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-sm bg-white"
                >
                  <option value="">None / Global</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Employee *</label>
                <select 
                  required
                  value={formData.employeeId}
                  onChange={e => setFormData({...formData, employeeId: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-sm bg-white"
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeId})</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Leave Type *</label>
                <select 
                  required
                  value={formData.leaveType}
                  onChange={e => setFormData({...formData, leaveType: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-sm bg-white"
                >
                  <option value="Annual">Annual Leave</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Unpaid">Unpaid Leave</option>
                  <option value="Maternity">Maternity Leave</option>
                  <option value="Paternity">Paternity Leave</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Start Date *</label>
                <input 
                  type="date" required
                  value={formData.startDate}
                  onChange={e => setFormData({...formData, startDate: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">End Date *</label>
                <input 
                  type="date" required
                  value={formData.endDate}
                  onChange={e => setFormData({...formData, endDate: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-neutral-700">Reason / Notes</label>
              <textarea
                value={formData.reason}
                onChange={e => setFormData({...formData, reason: e.target.value})}
                placeholder="Details for this leave request..."
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm resize-none h-20"
              />
            </div>
            
            <div className="pt-4 flex justify-end gap-3 border-t border-neutral-100">
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-neutral-600 hover:text-neutral-900 font-medium text-sm transition-colors">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
                Submit Leave Request
              </button>
            </div>
          </form>
        </div>
      )}

      {!isAdding && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm flex-1 flex flex-col min-h-0">
          <div className="p-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 rounded-t-2xl">
            <div className="relative w-72">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Search leaves..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left text-sm">
              <thead className="bg-white sticky top-0 z-10 border-b border-neutral-200 text-neutral-500 font-semibold uppercase text-xs shadow-sm">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Site / Project</th>
                  <th className="px-6 py-4">Leave Type</th>
                  <th className="px-6 py-4">Dates</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {isLoading ? (
                  <tr><td colSpan={6} className="text-center py-12"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></td></tr>
                ) : filteredLeaves.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-neutral-500">No leave requests found.</td></tr>
                ) : filteredLeaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="px-6 py-4 font-medium text-neutral-900">
                      {leave.employee ? \`\${leave.employee.firstName} \${leave.employee.lastName}\` : '-'}
                      <div className="text-xs text-neutral-500 font-normal">{leave.employee?.employeeId}</div>
                    </td>
                    <td className="px-6 py-4 text-neutral-600">
                      <div>{leave.site?.name || 'N/A'}</div>
                      <div className="text-xs text-neutral-400">{leave.project?.name || ''}</div>
                    </td>
                    <td className="px-6 py-4 text-neutral-600 font-medium">{leave.leaveType}</td>
                    <td className="px-6 py-4 text-neutral-600">
                      <div>{leave.startDate ? new Date(leave.startDate).toLocaleDateString() : 'N/A'}</div>
                      <div className="text-xs text-neutral-400">to {leave.endDate ? new Date(leave.endDate).toLocaleDateString() : 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={\`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider \${
                        leave.status === 'approved' ? 'bg-green-100 text-green-700' : 
                        leave.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        leave.status === 'on-hold' ? 'bg-orange-100 text-orange-700' : 'bg-neutral-100 text-neutral-600'
                      }\`}>
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => openReviewModal(leave)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 text-neutral-700 rounded-lg text-sm font-medium transition-all shadow-sm"
                      >
                        <Eye className="w-4 h-4" /> Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal */}
      <AnimatePresence>
        {reviewingLeave && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
              onClick={() => setReviewingLeave(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-white sticky top-0 z-20">
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">Review Leave Request</h3>
                  <p className="text-sm text-neutral-500 mt-0.5">Application details and approval workflow</p>
                </div>
                <button onClick={() => setReviewingLeave(null)} className="p-2 hover:bg-neutral-100 rounded-full text-neutral-400 hover:text-neutral-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 custom-scrollbar">
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-y-6 gap-x-8 mb-6">
                    <div>
                      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">Employee</p>
                      <p className="font-medium text-neutral-900">{reviewingLeave.employee?.firstName} {reviewingLeave.employee?.lastName}</p>
                      <p className="text-sm text-neutral-500">{reviewingLeave.employee?.employeeId}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">Type & Status</p>
                      <p className="font-medium text-neutral-900">{reviewingLeave.leaveType}</p>
                      <span className={\`inline-flex items-center px-2 py-0.5 mt-1 rounded text-[11px] font-bold uppercase tracking-wider \${
                        reviewingLeave.status === 'approved' ? 'bg-green-100 text-green-700' : 
                        reviewingLeave.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        reviewingLeave.status === 'on-hold' ? 'bg-orange-100 text-orange-700' : 'bg-neutral-100 text-neutral-600'
                      }\`}>
                        {reviewingLeave.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">Dates</p>
                      <p className="font-medium text-neutral-900">{new Date(reviewingLeave.startDate).toLocaleDateString()} &mdash; {new Date(reviewingLeave.endDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">Assignment</p>
                      <p className="font-medium text-neutral-900">{reviewingLeave.site?.name || 'Global'}</p>
                      <p className="text-sm text-neutral-500">{reviewingLeave.project?.name}</p>
                    </div>
                  </div>

                  <div className="mb-2">
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Reason provided</p>
                    <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 text-sm text-neutral-700 leading-relaxed min-h-[80px]">
                      {reviewingLeave.reason || 'No reason provided by applicant.'}
                    </div>
                  </div>
                </div>

                <div className="border-t border-neutral-100 bg-neutral-50 px-6 py-4 max-h-48 overflow-y-auto custom-scrollbar">
                  <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2 mb-3">
                    <History className="w-4 h-4 text-neutral-500" /> Review History
                  </h4>
                  {isReviewLoading ? (
                    <div className="animate-pulse flex space-x-4"><div className="h-4 bg-neutral-200 rounded w-3/4"></div></div>
                  ) : leaveHistory.length > 0 ? (
                    <div className="space-y-3">
                      {leaveHistory.map(log => (
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
                        <div className="flex justify-end gap-3 pt-2">
                          <button onClick={() => { setActionType(null); setActionReason(''); }} className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg text-sm font-medium transition-colors">
                            Cancel
                          </button>
                          <button 
                            disabled={!actionReason.trim()}
                            onClick={() => submitAction(actionType)}
                            className={\`px-6 py-2 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed \${actionType === 'rejected' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'}\`}
                          >
                            Confirm {actionType === 'rejected' ? 'Rejection' : 'Hold'}
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="action-buttons"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-3"
                      >
                        <button 
                          onClick={() => submitAction('approved')}
                          className="flex-1 px-4 py-2.5 bg-neutral-900 hover:bg-black text-white rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 group"
                        >
                          <CheckCircle className="w-4 h-4 text-green-400 group-hover:scale-110 transition-transform" /> Approve Leave
                        </button>
                        <button 
                          onClick={() => setActionType('on-hold')}
                          className="px-4 py-2.5 bg-white border border-neutral-200 hover:border-orange-300 hover:bg-orange-50 text-neutral-700 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
                        >
                          Put On-Hold
                        </button>
                        <button 
                          onClick={() => setActionType('rejected')}
                          className="px-4 py-2.5 bg-white border border-neutral-200 hover:border-red-300 hover:bg-red-50 text-neutral-700 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4 text-red-500" /> Reject
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
`;
fs.writeFileSync('src/components/Leaves.tsx', newLeaves);
