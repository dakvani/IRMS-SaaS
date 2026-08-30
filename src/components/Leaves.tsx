import React, { useEffect, useState } from 'react';
import { CalendarOff, Plus, X , Search} from 'lucide-react';

export default function Leaves() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    leaveType: 'Annual',
    startDate: '',
    endDate: '',
    status: 'pending'
  });

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = (window as any)._token;
      if (!token) throw new Error("No auth token");

      const [leaveRes, empRes] = await Promise.all([
        fetch('/api/leaves', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/employees', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (!leaveRes.ok || !empRes.ok) {
        throw new Error(`Failed to fetch leave data`);
      }

      setLeaves(await leaveRes.json());
      setEmployees(await empRes.json());
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = (window as any)._token;
      if (!token) throw new Error("No auth token");

      const payload = { ...formData };

      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Failed to add leave: ${res.statusText}`);
      }

      await fetchData();
      setIsAdding(false);
      setFormData({ employeeId: '', leaveType: 'Annual', startDate: '', endDate: '', status: 'pending' });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unknown error occurred');
    }
  };

  
  const filtered = leaves.filter((item: any) => 
    (item.type && String(item.type).toLowerCase().includes(searchTerm.toLowerCase())) || (item.status && String(item.status).toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50/50">
        <h2 className="text-lg font-semibold">Leaves & Time Off</h2>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Request Leave
          </button>
        )}
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 text-red-700 border-b border-red-100 text-sm">
          {error}
        </div>
      )}

      {isAdding && (
        <div className="p-6 border-b border-neutral-200 bg-neutral-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-neutral-900">Request Leave</h3>
            <button onClick={() => setIsAdding(false)} className="text-neutral-400 hover:text-neutral-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Employee *</label>
                <select 
                  required
                  value={formData.employeeId || ''}
                  onChange={e => setFormData({...formData, employeeId: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeId})</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Leave Type *</label>
                <select 
                  required
                  value={formData.leaveType || ''}
                  onChange={e => setFormData({...formData, leaveType: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                >
                  <option value="Annual">Annual Leave</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Unpaid">Unpaid Leave</option>
                  <option value="Maternity">Maternity Leave</option>
                  <option value="Paternity">Paternity Leave</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Start Date *</label>
                <input 
                  type="date" 
                  required
                  value={formData.startDate || ''}
                  onChange={e => setFormData({...formData, startDate: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">End Date *</label>
                <input 
                  type="date" 
                  required
                  value={formData.endDate || ''}
                  onChange={e => setFormData({...formData, endDate: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Status</label>
                <select 
                  required
                  value={formData.status || ''}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            
            <div className="pt-2 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-neutral-600 hover:text-neutral-900 font-medium text-sm transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm"
              >
                Save Leave Request
              </button>
            </div>
          </form>
        </div>
      )}
      
      {isLoading ? (
        <div className="p-12 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-neutral-500">
          <CalendarOff className="w-12 h-12 mx-auto text-neutral-300 mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-1">No leave requests</h3>
          <p>Submit and track employee time off.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm flex-1 min-h-[400px] md:min-h-0 overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 sticky top-0 z-10 text-neutral-500 border-b border-neutral-200 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-3">Employee</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Dates</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((leave) => (
                <tr key={leave.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-neutral-900">
                    {leave.employee ? `${leave.employee.firstName} ${leave.employee.lastName} (${leave.employee.employeeId})` : '-'}
                  </td>
                  <td className="px-6 py-4 text-neutral-600">{leave.leaveType}</td>
                  <td className="px-6 py-4 text-neutral-600">
                    {leave.startDate ? new Date(leave.startDate).toLocaleDateString() : 'N/A'} - {leave.endDate ? new Date(leave.endDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      leave.status === 'approved' 
                        ? 'bg-green-100 text-green-800' 
                        : leave.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {leave.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
