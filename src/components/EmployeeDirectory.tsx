import React, { useEffect, useState } from 'react';
import { Plus, X, Edit, Search, Check, AlertCircle } from 'lucide-react';

export default function EmployeeDirectory() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<any | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', employeeId: '', nationality: '', gender: 'Male', dateOfBirth: '', nationalId: '',
    joiningDate: '', department: '', jobTitle: '', position: '', employmentType: 'Full-time',
    mobile: '', email: '', emergencyContact: ''
  });

  const [searchTerm, setSearchTerm] = useState('');

  const fetchEmployees = async () => {
    try {
      const token = (window as any)._token;
      const res = await fetch('/api/employees', { headers: { Authorization: `Bearer ${token}` }});
      if (!res.ok) throw new Error('Failed to fetch employees');
      setEmployees(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const openAddForm = () => {
    setEditEmployee(null);
    setFormData({
      firstName: '', lastName: '', employeeId: '', nationality: '', gender: 'Male', dateOfBirth: '', nationalId: '',
      joiningDate: '', department: '', jobTitle: '', position: '', employmentType: 'Full-time',
      mobile: '', email: '', emergencyContact: ''
    });
    setIsFormOpen(true);
  };

  const openEditForm = (emp: any) => {
    setEditEmployee(emp);
    setFormData({
      firstName: emp.firstName || '', lastName: emp.lastName || '', employeeId: emp.employeeId || '', 
      nationality: emp.nationality || '', gender: emp.gender || 'Male', 
      dateOfBirth: emp.dateOfBirth ? new Date(emp.dateOfBirth).toISOString().split('T')[0] : '', 
      nationalId: emp.nationalId || '', joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : '', 
      department: emp.department || '', jobTitle: emp.jobTitle || '', position: emp.position || '', 
      employmentType: emp.employmentType || 'Full-time', mobile: emp.mobile || '', email: emp.email || '', emergencyContact: emp.emergencyContact || ''
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = (window as any)._token;
      const url = editEmployee ? `/api/employees/${editEmployee.id}` : '/api/employees';
      const method = editEmployee ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error('Failed to save employee');
      
      setIsFormOpen(false);
      fetchEmployees();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filtered = employees.filter(e => 
    `${e.firstName} ${e.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.employeeId && e.employeeId.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (e.department && e.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) return <div className="p-8 text-neutral-500">Loading employees...</div>;

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input 
            type="text" 
            placeholder="Search employees..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        {!isFormOpen && (
          <button onClick={openAddForm} className="bg-neutral-900 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">{editEmployee ? 'Edit Employee' : 'Add Employee'}</h3>
            <button onClick={() => setIsFormOpen(false)} className="text-neutral-400 hover:text-neutral-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">First Name</label>
                <input required type="text" value={formData.firstName || ''} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Last Name</label>
                <input required type="text" value={formData.lastName || ''} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Employee ID</label>
                <input required type="text" value={formData.employeeId || ''} onChange={e => setFormData({...formData, employeeId: e.target.value})} className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Department</label>
                <input type="text" value={formData.department || ''} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Job Title</label>
                <input type="text" value={formData.jobTitle || ''} onChange={e => setFormData({...formData, jobTitle: e.target.value})} className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Email</label>
                <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700">
                {editEmployee ? 'Update' : 'Save'} Employee
              </button>
            </div>
          </form>
        </div>
      )}

      {!isFormOpen && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 sticky top-0 z-10 border-b border-neutral-200 text-neutral-500 font-semibold uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Employee</th>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Approval</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map(emp => (
                <tr key={emp.id} className="hover:bg-neutral-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center font-bold text-xs text-neutral-600">
                        {emp.firstName[0]}{emp.lastName[0]}
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900">{emp.firstName} {emp.lastName}</div>
                        <div className="text-neutral-500 text-xs">{emp.jobTitle}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{emp.employeeId}</td>
                  <td className="px-6 py-4">{emp.department}</td>
                  <td className="px-6 py-4">
                    <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-medium">
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium">
                      {emp.approvalStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEditForm(emp)} className="text-neutral-400 hover:text-blue-600">
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-12 text-center text-neutral-500">
              No employees found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
