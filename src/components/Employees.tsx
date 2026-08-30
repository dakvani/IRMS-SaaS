import React, { useEffect, useState } from 'react';
import { Users, Search, Plus, Filter, MoreHorizontal, MapPin, Mail, Phone, Calendar, Download, Building2, Briefcase, FileText, ChevronRight, X, ArrowLeft, Edit, Printer } from 'lucide-react';

export default function Employees() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Views: 'directory' | 'form' | 'profile'
  const [view, setView] = useState<'directory' | 'form' | 'profile'>('directory');
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', employeeId: '', nationality: '', gender: 'Male', dateOfBirth: '', nationalId: '',
    joiningDate: '', department: '', jobTitle: '', position: '', employmentType: 'Full-time',
    mobile: '', email: '', emergencyContact: ''
  });

  // Profile-specific data
  const [assignments, setAssignments] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignForm, setAssignForm] = useState({ role: '', siteId: '', projectId: '', startDate: '', endDate: '', status: 'Active' });

  const [showDocForm, setShowDocForm] = useState(false);
  const [docForm, setDocForm] = useState({ documentType: '', documentUrl: '', issueDate: '', expiryDate: '' });

  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const token = (window as any)._token;
      const res = await fetch('/api/employees', { headers: { Authorization: `Bearer ${token}` }});
      if (res.ok) setEmployees(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchSitesAndProjects();
  }, []);

  const fetchSitesAndProjects = async () => {
    try {
      const token = (window as any)._token;
      const headers = { Authorization: `Bearer ${token}` };
      const [sRes, pRes] = await Promise.all([
        fetch('/api/sites', { headers }),
        fetch('/api/projects', { headers })
      ]);
      if (sRes.ok) setSites(await sRes.json());
      if (pRes.ok) setProjects(await pRes.json());
    } catch (e) {
      console.error(e);
    }
  };


  const fetchProfileData = async (empId: number) => {
    setIsLoadingProfile(true);
    try {
      const token = (window as any)._token;
      const [assRes, docRes] = await Promise.all([
        fetch('/api/assignments', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/employee-documents', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (assRes.ok) {
        const allAssignments = await assRes.json();
        setAssignments(allAssignments.filter((a: any) => a.employee?.id === empId));
      }
      
      if (docRes.ok) {
        const allDocs = await docRes.json();
        setDocuments(allDocs.filter((d: any) => d.employee?.id === empId));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const openAddForm = () => {
    setSelectedEmployee(null);
    setFormData({
      firstName: '', lastName: '', employeeId: '', nationality: '', gender: 'Male', dateOfBirth: '', nationalId: '',
      joiningDate: '', department: '', jobTitle: '', position: '', employmentType: 'Full-time',
      mobile: '', email: '', emergencyContact: ''
    });
    setView('form');
  };

  const openEditForm = (emp: any) => {
    setSelectedEmployee(emp);
    setFormData({
      firstName: emp.firstName || '', lastName: emp.lastName || '', employeeId: emp.employeeId || '', 
      nationality: emp.nationality || '', gender: emp.gender || 'Male', 
      dateOfBirth: emp.dateOfBirth ? new Date(emp.dateOfBirth).toISOString().split('T')[0] : '', 
      nationalId: emp.nationalId || '', joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : '', 
      department: emp.department || '', jobTitle: emp.jobTitle || '', position: emp.position || '', 
      employmentType: emp.employmentType || 'Full-time', mobile: emp.mobile || '', email: emp.email || '', emergencyContact: emp.emergencyContact || ''
    });
    setView('form');
  };

  const openProfile = (emp: any) => {
    setSelectedEmployee(emp);
    fetchProfileData(emp.id);
    setView('profile');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = (window as any)._token;
      const url = selectedEmployee ? `/api/employees/${selectedEmployee.id}` : '/api/employees';
      const method = selectedEmployee ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error('Failed to save employee');
      
      setView('directory');
      fetchEmployees();
    } catch (err: any) {
      alert(err.message);
    }
  };

  
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = (window as any)._token;
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...assignForm, employeeId: selectedEmployee.id })
      });
      if (res.ok) {
        setShowAssignForm(false);
        fetchProfileData(selectedEmployee.id);
      } else throw new Error(await res.text());
    } catch (e: any) { alert(e.message); }
  };

  const handleDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = (window as any)._token;
      const res = await fetch('/api/employee-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...docForm, employeeId: selectedEmployee.id })
      });
      if (res.ok) {
        setShowDocForm(false);
        fetchProfileData(selectedEmployee.id);
      } else throw new Error(await res.text());
    } catch (e: any) { alert(e.message); }
  };

  const filtered = employees.filter(e => 
    `${e.firstName} ${e.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.employeeId && e.employeeId.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (e.department && e.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) return <div className="p-8 text-neutral-500">Loading workforce directory...</div>;

  return (
    <div className="h-full flex flex-col gap-6 print:block print:h-auto print:gap-0">
      {view === 'directory' && (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Workforce Directory</h1>
              <p className="text-neutral-500 font-medium mt-1">Manage employee records, profiles, and assignments.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input 
                  type="text" 
                  placeholder="Search employees..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                />
              </div>
              <button onClick={openAddForm} className="bg-neutral-900 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Employee
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm flex-1 min-h-[400px] md:min-h-0 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 sticky top-0 z-10 border-b border-neutral-200 text-neutral-500 font-semibold uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Employee</th>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map(emp => (
                  <tr key={emp.id} className="hover:bg-neutral-50/50 cursor-pointer" onClick={() => openProfile(emp)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center font-bold text-sm text-neutral-600 border border-neutral-200">
                          {emp.firstName[0]}{emp.lastName[0]}
                        </div>
                        <div>
                          <div className="font-medium text-neutral-900">{emp.firstName} {emp.lastName}</div>
                          <div className="text-neutral-500 text-xs">{emp.jobTitle}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-600">{emp.employeeId}</td>
                    <td className="px-6 py-4 text-neutral-600">{emp.department}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-700'}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={(e) => { e.stopPropagation(); openEditForm(emp); }} className="text-neutral-400 hover:text-neutral-900 transition-colors p-1" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="p-12 text-center text-neutral-500 flex flex-col items-center">
                <Users className="w-12 h-12 text-neutral-300 mb-3" />
                <p>No employees found matching your search.</p>
              </div>
            )}
          </div>
        </>
      )}

      {view === 'form' && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex justify-between items-center mb-6 border-b border-neutral-100 pb-4">
            <h3 className="font-bold text-xl text-neutral-900">{selectedEmployee ? 'Edit Employee' : 'Add Employee'}</h3>
            <button onClick={() => setView('directory')} className="text-neutral-400 hover:text-neutral-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-neutral-700">First Name</label>
                <input required type="text" value={formData.firstName || ''} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-neutral-700">Last Name</label>
                <input required type="text" value={formData.lastName || ''} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-neutral-700">Employee ID</label>
                <input required type="text" value={formData.employeeId || ''} onChange={e => setFormData({...formData, employeeId: e.target.value})} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900" />
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-semibold text-neutral-700">Gender</label>
                <select value={formData.gender || ''} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-neutral-700">Date of Birth</label>
                <input type="date" value={formData.dateOfBirth || ''} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-neutral-700">Nationality</label>
                <input type="text" value={formData.nationality || ''} onChange={e => setFormData({...formData, nationality: e.target.value})} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-neutral-700">National ID / Passport</label>
                <input type="text" value={formData.nationalId || ''} onChange={e => setFormData({...formData, nationalId: e.target.value})} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900" />
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-semibold text-neutral-700">Mobile</label>
                <input type="text" value={formData.mobile || ''} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-neutral-700">Email</label>
                <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-neutral-700">Emergency Contact</label>
                <input type="text" value={formData.emergencyContact || ''} onChange={e => setFormData({...formData, emergencyContact: e.target.value})} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900" />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-neutral-700">Joining Date</label>
                <input type="date" value={formData.joiningDate || ''} onChange={e => setFormData({...formData, joiningDate: e.target.value})} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-neutral-700">Department</label>
                <input type="text" value={formData.department || ''} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-neutral-700">Job Title</label>
                <input type="text" value={formData.jobTitle || ''} onChange={e => setFormData({...formData, jobTitle: e.target.value})} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-neutral-700">Position</label>
                <input type="text" value={formData.position || ''} onChange={e => setFormData({...formData, position: e.target.value})} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-neutral-700">Employment Type</label>
                <select value={formData.employmentType || ''} onChange={e => setFormData({...formData, employmentType: e.target.value})} className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900">
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Intern">Intern</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-neutral-100">
              <button type="button" onClick={() => setView('directory')} className="mr-3 px-6 py-2 rounded-lg font-medium text-neutral-600 hover:bg-neutral-100">Cancel</button>
              <button type="submit" className="bg-neutral-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-neutral-800">
                {selectedEmployee ? 'Update' : 'Save'} Employee
              </button>
            </div>
          </form>
        </div>
      )}

      {view === 'profile' && selectedEmployee && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setView('directory')} className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
                  {selectedEmployee.firstName} {selectedEmployee.lastName}
                  <span className="bg-neutral-100 text-neutral-600 text-sm px-3 py-1 rounded-full font-medium border border-neutral-200">
                    ID: {selectedEmployee.employeeId}
                  </span>
                </h2>
                <p className="text-neutral-500 mt-1">{selectedEmployee.jobTitle} • {selectedEmployee.department}</p>
              </div>
            </div>
            <button onClick={() => openEditForm(selectedEmployee)} className="bg-white border border-neutral-200 text-neutral-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-neutral-50 shadow-sm">
              <Edit className="w-4 h-4" /> Edit Profile
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0 overflow-y-auto pb-6">
            {/* Left Column: Details */}
            <div className="md:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
                <h3 className="font-bold text-neutral-900 mb-4 pb-2 border-b border-neutral-100 flex items-center gap-2">
                  <Users className="w-5 h-5 text-neutral-400" /> Personal Info
                </h3>
                <div className="space-y-4">
                  <div><span className="block text-xs text-neutral-500 uppercase font-semibold">Email</span><span className="text-sm font-medium">{selectedEmployee.email || 'N/A'}</span></div>
                  <div><span className="block text-xs text-neutral-500 uppercase font-semibold">Mobile</span><span className="text-sm font-medium">{selectedEmployee.mobile || 'N/A'}</span></div>
                  <div><span className="block text-xs text-neutral-500 uppercase font-semibold">Gender</span><span className="text-sm font-medium">{selectedEmployee.gender || 'N/A'}</span></div>
                  <div><span className="block text-xs text-neutral-500 uppercase font-semibold">Date of Birth</span><span className="text-sm font-medium">{selectedEmployee.dateOfBirth ? new Date(selectedEmployee.dateOfBirth).toLocaleDateString() : 'N/A'}</span></div>
                  <div><span className="block text-xs text-neutral-500 uppercase font-semibold">Nationality</span><span className="text-sm font-medium">{selectedEmployee.nationality || 'N/A'}</span></div>
                  <div><span className="block text-xs text-neutral-500 uppercase font-semibold">National ID</span><span className="text-sm font-medium">{selectedEmployee.nationalId || 'N/A'}</span></div>
                  <div><span className="block text-xs text-neutral-500 uppercase font-semibold">Emergency Contact</span><span className="text-sm font-medium">{selectedEmployee.emergencyContact || 'N/A'}</span></div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
                <h3 className="font-bold text-neutral-900 mb-4 pb-2 border-b border-neutral-100 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-neutral-400" /> Employment Details
                </h3>
                <div className="space-y-4">
                  <div><span className="block text-xs text-neutral-500 uppercase font-semibold">Joining Date</span><span className="text-sm font-medium">{selectedEmployee.joiningDate ? new Date(selectedEmployee.joiningDate).toLocaleDateString() : 'N/A'}</span></div>
                  <div><span className="block text-xs text-neutral-500 uppercase font-semibold">Department</span><span className="text-sm font-medium">{selectedEmployee.department || 'N/A'}</span></div>
                  <div><span className="block text-xs text-neutral-500 uppercase font-semibold">Job Title</span><span className="text-sm font-medium">{selectedEmployee.jobTitle || 'N/A'}</span></div>
                  <div><span className="block text-xs text-neutral-500 uppercase font-semibold">Position</span><span className="text-sm font-medium">{selectedEmployee.position || 'N/A'}</span></div>
                  <div><span className="block text-xs text-neutral-500 uppercase font-semibold">Employment Type</span><span className="text-sm font-medium">{selectedEmployee.employmentType || 'N/A'}</span></div>
                </div>
              </div>
            </div>

            {/* Right Column: Assignments & Documents */}
            <div className="md:col-span-2 flex flex-col gap-6">
              {/* Assignments */}
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
                <h3 className="font-bold text-neutral-900 mb-4 pb-2 border-b border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-neutral-400" /> Active Assignments</div>
                  {!showAssignForm && (
                    <button onClick={() => setShowAssignForm(true)} className="text-sm bg-neutral-100 hover:bg-neutral-200 text-neutral-900 px-3 py-1.5 rounded-lg font-medium transition-colors">
                      + Assign
                    </button>
                  )}
                </h3>
                
                {showAssignForm && (
                  <form onSubmit={handleAssignSubmit} className="mb-4 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div><label className="text-xs font-semibold text-neutral-700 block mb-1">Role</label><input required className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded" value={assignForm.role || ''} onChange={e=>setAssignForm({...assignForm, role: e.target.value})} /></div>
                      <div><label className="text-xs font-semibold text-neutral-700 block mb-1">Status</label><select className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded" value={assignForm.status || ''} onChange={e=>setAssignForm({...assignForm, status: e.target.value})}><option>Active</option><option>Completed</option></select></div>
                      <div>
                        <label className="text-xs font-semibold text-neutral-700 block mb-1">Site</label>
                        <select className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded" value={assignForm.siteId || ''} onChange={e=>setAssignForm({...assignForm, siteId: e.target.value})}>
                          <option value="">--</option>{sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-neutral-700 block mb-1">Project</label>
                        <select className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded" value={assignForm.projectId || ''} onChange={e=>setAssignForm({...assignForm, projectId: e.target.value})}>
                          <option value="">--</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <div><label className="text-xs font-semibold text-neutral-700 block mb-1">Start Date</label><input type="date" required className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded" value={assignForm.startDate || ''} onChange={e=>setAssignForm({...assignForm, startDate: e.target.value})} /></div>
                      <div><label className="text-xs font-semibold text-neutral-700 block mb-1">End Date</label><input type="date" className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded" value={assignForm.endDate || ''} onChange={e=>setAssignForm({...assignForm, endDate: e.target.value})} /></div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setShowAssignForm(false)} className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-200 rounded">Cancel</button>
                      <button type="submit" className="px-3 py-1.5 text-xs font-medium bg-neutral-900 text-white rounded hover:bg-neutral-800">Save Assignment</button>
                    </div>
                  </form>
                )}

                {isLoadingProfile ? (
                  <p className="text-neutral-400 text-sm">Loading assignments...</p>
                ) : assignments.length > 0 ? (
                  <div className="space-y-3">
                    {assignments.map(ass => (
                      <div key={ass.id} className="border border-neutral-100 rounded-xl p-4 hover:border-neutral-200 bg-neutral-50/50">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-neutral-900">{ass.role}</p>
                            <p className="text-sm text-neutral-500 mt-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {ass.site?.name || 'N/A'} • {ass.project?.name || 'N/A'}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ass.status === 'Active' ? 'bg-blue-100 text-blue-700' : 'bg-neutral-100 text-neutral-600'}`}>
                            {ass.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                    <p className="text-neutral-500 text-sm">No assignments found for this employee.</p>
                  </div>
                )}
              </div>

              {/* Documents */}
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
                <h3 className="font-bold text-neutral-900 mb-4 pb-2 border-b border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-neutral-400" /> Documents</div>
                  {!showDocForm && (
                    <button onClick={() => setShowDocForm(true)} className="text-sm bg-neutral-100 hover:bg-neutral-200 text-neutral-900 px-3 py-1.5 rounded-lg font-medium transition-colors">
                      + Upload
                    </button>
                  )}
                </h3>
                
                {showDocForm && (
                  <form onSubmit={handleDocSubmit} className="mb-4 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="col-span-2"><label className="text-xs font-semibold text-neutral-700 block mb-1">Document Title/Type</label><input required className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded" value={docForm.documentType || ''} onChange={e=>setDocForm({...docForm, documentType: e.target.value})} placeholder="e.g., Passport, Certificate" /></div>
                      <div><label className="text-xs font-semibold text-neutral-700 block mb-1">Issue Date</label><input type="date" className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded" value={docForm.issueDate || ''} onChange={e=>setDocForm({...docForm, issueDate: e.target.value})} /></div>
                      <div><label className="text-xs font-semibold text-neutral-700 block mb-1">Expiry Date</label><input type="date" className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded" value={docForm.expiryDate || ''} onChange={e=>setDocForm({...docForm, expiryDate: e.target.value})} /></div>
                      <div className="col-span-2"><label className="text-xs font-semibold text-neutral-700 block mb-1">Document URL (Optional)</label><input type="url" className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded" value={docForm.documentUrl || ''} onChange={e=>setDocForm({...docForm, documentUrl: e.target.value})} placeholder="https://..." /></div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setShowDocForm(false)} className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-200 rounded">Cancel</button>
                      <button type="submit" className="px-3 py-1.5 text-xs font-medium bg-neutral-900 text-white rounded hover:bg-neutral-800">Save Document</button>
                    </div>
                  </form>
                )}

                {isLoadingProfile ? (
                  <p className="text-neutral-400 text-sm">Loading documents...</p>
                ) : documents.length > 0 ? (
                  <div className="space-y-3">
                    {documents.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between border border-neutral-100 rounded-xl p-3 hover:border-neutral-200 bg-neutral-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="bg-red-50 p-2 rounded-lg">
                            <FileText className="w-5 h-5 text-red-500" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-neutral-900">{doc.documentType}</p>
                            <p className="text-xs text-neutral-500">Exp: {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : 'N/A'}</p>
                          </div>
                        </div>
                        {doc.documentUrl && (
                          <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                    <p className="text-neutral-500 text-sm">No documents found for this employee.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
