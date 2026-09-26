import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Truck, Users, Search, Plus, Filter, MoreHorizontal, MapPin, Mail, Phone, Calendar, Download, Building2, Briefcase, FileText, ChevronRight, X, ArrowLeft, Edit, Printer, Package, Home, Bed, Clock, User, ShieldCheck, LayoutGrid, List, Layers, Eye, CheckCircle2, FileDown, Globe } from 'lucide-react';
import EmployeeDossierModal from './EmployeeDossierModal.tsx';
import EmployeeDossierPdfModal from './EmployeeDossierPdfModal.tsx';
import GccDocumentUploadModal from './GccDocumentUploadModal.tsx';
import GccDocumentViewerModal from './GccDocumentViewerModal.tsx';
import WorkforceTrendChart from './WorkforceTrendChart.tsx';

export default function Employees() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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

  // Profile-specific data & Full 360° History
  const [assignments, setAssignments] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  
  // Accommodation & Housing History
  const [accommodationHistory, setAccommodationHistory] = useState<any[]>([]);
  const [activeAccommodation, setActiveAccommodation] = useState<any | null>(null);

  // Vehicle & Car History
  const [vehicleHistory, setVehicleHistory] = useState<any[]>([]);
  const [activeVehicle, setActiveVehicle] = useState<any | null>(null);

  // Asset Lifecycle History
  const [assetHistory, setAssetHistory] = useState<any[]>([]);
  const [employeeAssets, setEmployeeAssets] = useState<any[]>([]);

  // Leaves & Timesheets
  const [leaves, setLeaves] = useState<any[]>([]);
  const [timesheets, setTimesheets] = useState<any[]>([]);

  // Documents & Scans
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Category & Tab in profile
  const [profileTab, setProfileTab] = useState<'overview' | 'housing' | 'assignments' | 'assets' | 'vehicles' | 'leaves' | 'timesheets' | 'documents'>('overview');
  const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);
  const [isProfilePdfModalOpen, setIsProfilePdfModalOpen] = useState(false);
  
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedAssignId, setSelectedAssignId] = useState<number | null>(null);
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [assetFormAction, setAssetFormAction] = useState<'assign' | 'transfer' | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [transferTargetId, setTransferTargetId] = useState('');
  const [availableAssets, setAvailableAssets] = useState<any[]>([]);
  const [assignAssetForm, setAssignAssetForm] = useState({ assetId: '' });
  const [assignForm, setAssignForm] = useState({ role: '', siteId: '', projectId: '', startDate: '', endDate: '', status: 'Active' });

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isGccDocModalOpen, setIsGccDocModalOpen] = useState(false);
  const [viewerDoc, setViewerDoc] = useState<any | null>(null);

  const [showDocForm, setShowDocForm] = useState(false);
  const [docForm, setDocForm] = useState({ documentType: '', documentUrl: '', issueDate: '', expiryDate: '' });

  const profileDossierData = useMemo(() => ({
    employee: selectedEmployee,
    activeAccommodation,
    accommodationHistory,
    activeAssignment: assignments.find(a => a.status?.toLowerCase() === 'active') || null,
    assignmentHistory: assignments,
    activeVehicle,
    vehicleHistory,
    assets: employeeAssets,
    assetHistory,
    leaves,
    timesheets,
    documents,
  }), [selectedEmployee, activeAccommodation, accommodationHistory, assignments, activeVehicle, vehicleHistory, employeeAssets, assetHistory, leaves, timesheets, documents]);

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


  const fetchProfileData = async (empId: number, retryCount = 0) => {
    setIsLoadingProfile(true);
    try {
      const token = (window as any)._token;
      if (!token && retryCount < 4) {
        setTimeout(() => fetchProfileData(empId, retryCount + 1), 250);
        return;
      }
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/employees/${empId}/dossier`, { headers });
      if (res.ok) {
        const d = await res.json();
        setAssignments(d.assignmentHistory || []);
        setEmployeeAssets(d.assets || []);
        setAssetHistory(d.assetHistory || []);
        setActiveAccommodation(d.activeAccommodation || null);
        setAccommodationHistory(d.accommodationHistory || []);
        setActiveVehicle(d.activeVehicle || null);
        setVehicleHistory(d.vehicleHistory || []);
        setDocuments(d.documents || []);
        setLeaves(d.leaves || []);
        setTimesheets(d.timesheets || []);
        if (d.employee) {
          setSelectedEmployee(d.employee);
        }
      } else if (res.status === 404) {
        navigate('/employees', { replace: true });
      }
    } catch (e) {
      console.error('Error fetching employee 360 profile data:', e);
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
    navigate(`/employees/${emp.id}`);
  };

  const backToDirectory = () => {
    setView('directory');
    setSelectedEmployee(null);
    navigate('/employees');
  };

  // Sync route param :id with profile view and trigger 360 data fetch
  useEffect(() => {
    if (id) {
      const empId = parseInt(id, 10);
      if (!isNaN(empId)) {
        setView('profile');
        const found = employees.find((e) => e.id === empId);
        if (found) setSelectedEmployee(found);
        fetchProfileData(empId);
      }
    } else {
      if (view === 'profile') {
        setView('directory');
        setSelectedEmployee(null);
      }
    }
  }, [id, employees.length]);

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
      
      fetchEmployees();
      if (selectedEmployee) {
        fetchProfileData(selectedEmployee.id);
        setView('profile');
      } else {
        backToDirectory();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = (window as any)._token;
      const url = selectedAssignId ? `/api/assignments/${selectedAssignId}` : '/api/assignments';
      const method = selectedAssignId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...assignForm, employeeId: selectedEmployee.id })
      });
      if (res.ok) {
        setShowAssignForm(false);
        setSelectedAssignId(null);
        fetchProfileData(selectedEmployee.id);
      } else throw new Error(await res.text());
    } catch (e: any) { alert(e.message); }
  };

  const handleUnassignAssignment = async (id: number) => {
    if (!confirm('Are you sure you want to remove this assignment?')) return;
    try {
      const token = (window as any)._token;
      const res = await fetch(`/api/assignments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchProfileData(selectedEmployee.id);
      }
    } catch (e: any) { alert(e.message); }
  };

  const handleEditAssignment = (ass: any) => {
    setSelectedAssignId(ass.id);
    setAssignForm({
       role: ass.role || '',
       status: ass.status || 'Active',
       siteId: ass.siteId?.toString() || '',
       projectId: ass.projectId?.toString() || '',
       startDate: ass.startDate ? ass.startDate.split('T')[0] : '',
       endDate: ass.endDate ? ass.endDate.split('T')[0] : ''
    });
    setShowAssignForm(true);
  };

  

  const handleOpenAssignAsset = async () => {
     setAssetFormAction('assign');
     setShowAssetForm(true);
     try {
       const token = (window as any)._token;
       const res = await fetch(`/api/assets?status=available`, { headers: { Authorization: `Bearer ${token}` }});
       if (res.ok) setAvailableAssets(await res.json());
     } catch(e){}
  };

  const handleAssignAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = (window as any)._token;
      if (assetFormAction === 'assign' && assignAssetForm.assetId) {
         const res = await fetch(`/api/assets/${assignAssetForm.assetId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ assignedToEmployeeId: selectedEmployee.id, assignedToSiteId: null, status: 'assigned' })
         });
         if (res.ok) {
            setShowAssetForm(false);
            fetchProfileData(selectedEmployee.id);
         }
      } else if (assetFormAction === 'transfer' && selectedAssetId && transferTargetId) {
         const res = await fetch(`/api/assets/${selectedAssetId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ assignedToEmployeeId: parseInt(transferTargetId), status: 'assigned' })
         });
         if (res.ok) {
            setShowAssetForm(false);
            fetchProfileData(selectedEmployee.id);
         }
      }
    } catch (e) {}
  };

  const handleUnassignAsset = async (assetId: number) => {
     try {
       const token = (window as any)._token;
       const res = await fetch(`/api/assets/${assetId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ assignedToEmployeeId: null, status: 'available' })
       });
       if (res.ok) {
          fetchProfileData(selectedEmployee.id);
       }
     } catch (e) {}
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
          {/* Executive Workforce KPI Metrics Banner (Matching Accommodations Styling) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
                  Total Workforce
                </span>
                <span className="text-2xl font-black text-neutral-900 mt-1 block">
                  {employees.length}
                </span>
                <span className="text-[11px] text-neutral-500 mt-0.5 block">
                  Registered Personnel
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
                  Active On-Site
                </span>
                <span className="text-2xl font-black text-emerald-600 mt-1 block">
                  {employees.filter(e => e.status?.toLowerCase() === 'active').length}
                </span>
                <span className="text-[11px] text-neutral-500 mt-0.5 block">
                  Field & Project Assigned
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
                  On Approved Leave
                </span>
                <span className="text-2xl font-black text-amber-600 mt-1 block">
                  {employees.filter(e => e.status?.toLowerCase() === 'leave' || e.status?.toLowerCase() === 'inactive').length}
                </span>
                <span className="text-[11px] text-neutral-500 mt-0.5 block">
                  Annual / Medical Rest
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
                  Active Departments
                </span>
                <span className="text-2xl font-black text-blue-600 mt-1 block">
                  {new Set(employees.map(e => e.department).filter(Boolean)).size || 5}
                </span>
                <span className="text-[11px] text-neutral-500 mt-0.5 block">
                  Divisions & Crews
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Briefcase className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* 12-Month Workforce Onboarding, Headcount Growth & Status Trend Visualization */}
          <WorkforceTrendChart employees={employees} />

          {/* Directory Header Bar & Controls */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Workforce Directory</h2>
              <p className="text-xs text-neutral-500 font-medium mt-0.5">
                Personnel records, driver credentials, housing admissions & master dossiers.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input 
                  type="text" 
                  placeholder="Search by name, ID, department..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 text-xs bg-neutral-50/50 focus:bg-white"
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200/80">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'grid' ? 'bg-white shadow-2xs text-neutral-900 font-bold' : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                  title="Card Grid View (Matching Accommodations)"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'table' ? 'bg-white shadow-2xs text-neutral-900 font-bold' : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                  title="Table View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={openAddForm}
                className="bg-neutral-900 hover:bg-neutral-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" /> Add Personnel
              </button>
            </div>
          </div>

          {/* GRID VIEW (Equal scale & styling to Staff Accommodations) */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(emp => {
                const isActive = emp.status?.toLowerCase() === 'active';
                return (
                  <div
                    key={emp.id}
                    onClick={() => openProfile(emp)}
                    className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between cursor-pointer group"
                  >
                    <div>
                      {/* Top Row: Department and Status Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide uppercase bg-neutral-100 text-neutral-800 border border-neutral-200">
                          {emp.department || 'Operations'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-neutral-600 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-200">
                            {emp.employeeId}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-neutral-100 text-neutral-600'
                            }`}
                          >
                            {emp.status || 'Active'}
                          </span>
                        </div>
                      </div>

                      {/* Name & Job Title */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-11 h-11 rounded-xl bg-neutral-900 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                          {emp.firstName?.[0] || 'E'}{emp.lastName?.[0] || ''}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-neutral-950 text-base tracking-tight truncate group-hover:text-indigo-600 transition-colors">
                            {emp.firstName} {emp.lastName}
                          </h3>
                          <p className="text-xs text-neutral-500 font-medium truncate mt-0.5">
                            {emp.jobTitle || 'Technician'} • {emp.position || 'Staff'}
                          </p>
                        </div>
                      </div>

                      {/* Contact / Saudi Details */}
                      <div className="space-y-1 mb-3 text-xs text-neutral-600">
                        {emp.mobile && (
                          <div className="flex items-center gap-1.5 truncate">
                            <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <span>{emp.mobile}</span>
                          </div>
                        )}
                        {emp.email && (
                          <div className="flex items-center gap-1.5 truncate text-neutral-500">
                            <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <span className="truncate">{emp.email}</span>
                          </div>
                        )}
                      </div>

                      {/* Informative Specs 3-Box Card (matching Accommodations layout) */}
                      <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 space-y-2 mb-4">
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="border-r border-neutral-200 pr-1">
                            <span className="text-[10px] uppercase text-neutral-400 block font-semibold">
                              Nationality
                            </span>
                            <span className="font-bold text-neutral-800 truncate block">
                              {emp.nationality || 'Saudi'}
                            </span>
                          </div>
                          <div className="border-r border-neutral-200 pr-1">
                            <span className="text-[10px] uppercase text-neutral-400 block font-semibold">
                              Type
                            </span>
                            <span className="font-bold text-neutral-800 truncate block">
                              {emp.employmentType || 'Full-time'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-neutral-400 block font-semibold">
                              Joined
                            </span>
                            <span className="font-bold text-neutral-900 truncate block">
                              {emp.joiningDate ? new Date(emp.joiningDate).getFullYear() : '2023'}
                            </span>
                          </div>
                        </div>

                        {/* Status bar */}
                        <div>
                          <div className="flex justify-between text-[11px] font-medium text-neutral-600 mb-1">
                            <span>Compliance Status</span>
                            <span className="font-bold text-emerald-700">Verified GOSI / Qiwa</span>
                          </div>
                          <div className="w-full bg-neutral-200 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-500 w-full" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Row */}
                    <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEmployee(emp);
                          setIsDossierModalOpen(true);
                        }}
                        className="flex-1 py-2 px-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        title="View all data and history for this employee"
                      >
                        <User className="w-3.5 h-3.5 text-indigo-400" />
                        <span>360° Master Dossier</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditForm(emp);
                        }}
                        className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
                        title="Edit Employee"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <div className="col-span-full p-12 text-center text-neutral-500 flex flex-col items-center bg-white rounded-2xl border border-neutral-200">
                  <Users className="w-12 h-12 text-neutral-300 mb-3" />
                  <p className="font-semibold text-neutral-700">No employees found matching your search.</p>
                </div>
              )}
            </div>
          ) : (
            /* TABLE VIEW */
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
                      <td className="px-6 py-4 text-neutral-600 font-mono text-xs">{emp.employeeId}</td>
                      <td className="px-6 py-4 text-neutral-600">{emp.department}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${emp.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-neutral-100 text-neutral-700'}`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEmployee(emp);
                              setIsDossierModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-lg transition-colors border border-indigo-200 inline-flex items-center gap-1 shadow-2xs"
                            title="View all data and history for this employee"
                          >
                            <User className="w-3.5 h-3.5 text-indigo-600" /> 360° History
                          </button>
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
          )}
        </>
      )}

      {view === 'form' && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex justify-between items-center mb-6 border-b border-neutral-100 pb-4">
            <h3 className="font-bold text-xl text-neutral-900">{selectedEmployee ? 'Edit Employee' : 'Add Employee'}</h3>
            <button onClick={() => (selectedEmployee ? setView('profile') : backToDirectory())} className="text-neutral-400 hover:text-neutral-600">
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
              <button type="button" onClick={() => (selectedEmployee ? setView('profile') : backToDirectory())} className="mr-3 px-6 py-2 rounded-lg font-medium text-neutral-600 hover:bg-neutral-100">Cancel</button>
              <button type="submit" className="bg-neutral-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-neutral-800">
                {selectedEmployee ? 'Update' : 'Save'} Employee
              </button>
            </div>
          </form>
        </div>
      )}

      {view === 'profile' && selectedEmployee && (
        <div className="flex-1 flex flex-col min-h-0 space-y-6">
          {/* Top Profile Header Bar */}
          <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={backToDirectory}
                className="p-2.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer shrink-0 border border-neutral-200"
                title="Back to Workforce Directory"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white font-black text-lg flex items-center justify-center shadow-sm shrink-0">
                  {selectedEmployee.firstName?.[0] || 'E'}{selectedEmployee.lastName?.[0] || ''}
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-black text-neutral-950 tracking-tight">
                      {selectedEmployee.firstName} {selectedEmployee.lastName}
                    </h2>
                    <span className="bg-neutral-100 text-neutral-700 text-xs px-2.5 py-1 rounded-full font-mono font-bold border border-neutral-200">
                      ID: {selectedEmployee.employeeId}
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-semibold border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active Record
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-500 mt-1 flex items-center gap-2">
                    <span className="font-semibold text-neutral-700">{selectedEmployee.jobTitle || 'Staff Member'}</span>
                    <span>•</span>
                    <span>{selectedEmployee.department || 'General Workforce'}</span>
                    {selectedEmployee.nationality && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5 text-neutral-400" />
                          {selectedEmployee.nationality}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Header Action Buttons: Single Export Button for PDF Preview + 360 Master Dossier + Edit */}
            <div className="flex items-center gap-2.5 flex-wrap self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setIsProfilePdfModalOpen(true)}
                className="bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98"
                title="Preview and export employee dossier report as PDF or print"
              >
                <FileDown className="w-4 h-4 text-indigo-400" />
                <span>Export</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDossierModalOpen(true)}
                className="bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
                title="Open comprehensive 360° Master Dossier modal"
              >
                <Layers className="w-4 h-4 text-neutral-500" />
                <span className="hidden md:inline">360° Master Dossier</span>
              </button>

              <button
                type="button"
                onClick={() => openEditForm(selectedEmployee)}
                className="bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
              >
                <Edit className="w-4 h-4 text-neutral-500" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>

          {/* Big, Wide, and Prominent Navigation Tabs */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 custom-scrollbar border-b border-neutral-200/90">
            {[
              { id: 'overview', label: 'Summary Overview & 360° Timeline', icon: Layers, count: null },
              { id: 'housing', label: 'Staff Accommodation & Housing', icon: Home, count: accommodationHistory.length },
              { id: 'assignments', label: 'Deployments & Projects', icon: Briefcase, count: assignments.length },
              { id: 'assets', label: 'Assets & Equipment', icon: Package, count: employeeAssets.length + assetHistory.length },
              { id: 'vehicles', label: 'Vehicles & Fleet', icon: Truck, count: vehicleHistory.length },
              { id: 'leaves', label: 'Leaves & Absences', icon: Calendar, count: leaves.length },
              { id: 'timesheets', label: 'Timesheets & Hours', icon: Clock, count: timesheets.length },
              { id: 'documents', label: 'Official GCC Documents', icon: FileText, count: documents.length },
            ].map((t) => {
              const Icon = t.icon;
              const isActive = profileTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setProfileTab(t.id as any)}
                  className={`px-5 py-3.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-neutral-900 text-white shadow-md shadow-neutral-900/10'
                      : 'bg-white hover:bg-neutral-100 text-neutral-600 border border-neutral-200/90 hover:border-neutral-300 shadow-2xs'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                  <span>{t.label}</span>
                  {t.count !== null && (
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Main Profile Grid: Left Info Panel + Right Tabbed Details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
            {/* Left Column: Personnel & Employment Details */}
            <div className="lg:col-span-4 space-y-6">
              {/* Personal Information Card */}
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6">
                <h3 className="font-bold text-neutral-900 mb-4 pb-2.5 border-b border-neutral-100 flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-neutral-500" />
                  <span>Personal Information</span>
                </h3>
                <div className="space-y-3.5 text-xs sm:text-sm">
                  <div className="flex justify-between py-1 border-b border-neutral-50">
                    <span className="text-neutral-400 font-medium">Email Address</span>
                    <span className="font-semibold text-neutral-900 truncate max-w-[180px]">{selectedEmployee.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-50">
                    <span className="text-neutral-400 font-medium">Mobile Phone</span>
                    <span className="font-semibold text-neutral-900 font-mono">{selectedEmployee.mobile || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-50">
                    <span className="text-neutral-400 font-medium">Gender</span>
                    <span className="font-semibold text-neutral-900">{selectedEmployee.gender || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-50">
                    <span className="text-neutral-400 font-medium">Date of Birth</span>
                    <span className="font-semibold text-neutral-900">
                      {selectedEmployee.dateOfBirth ? new Date(selectedEmployee.dateOfBirth).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-50">
                    <span className="text-neutral-400 font-medium">Nationality</span>
                    <span className="font-semibold text-neutral-900">{selectedEmployee.nationality || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-50">
                    <span className="text-neutral-400 font-medium">National ID / Iqama</span>
                    <span className="font-mono font-bold text-neutral-900">{selectedEmployee.nationalId || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-400 font-medium">Emergency Contact</span>
                    <span className="font-semibold text-neutral-900">{selectedEmployee.emergencyContact || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Employment Details Card */}
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6">
                <h3 className="font-bold text-neutral-900 mb-4 pb-2.5 border-b border-neutral-100 flex items-center gap-2 text-sm">
                  <Briefcase className="w-4 h-4 text-neutral-500" />
                  <span>Employment Details</span>
                </h3>
                <div className="space-y-3.5 text-xs sm:text-sm">
                  <div className="flex justify-between py-1 border-b border-neutral-50">
                    <span className="text-neutral-400 font-medium">Joining Date</span>
                    <span className="font-semibold text-neutral-900">
                      {selectedEmployee.joiningDate ? new Date(selectedEmployee.joiningDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-50">
                    <span className="text-neutral-400 font-medium">Department</span>
                    <span className="font-semibold text-neutral-900">{selectedEmployee.department || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-50">
                    <span className="text-neutral-400 font-medium">Job Title</span>
                    <span className="font-semibold text-neutral-900">{selectedEmployee.jobTitle || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-50">
                    <span className="text-neutral-400 font-medium">Position</span>
                    <span className="font-semibold text-neutral-900">{selectedEmployee.position || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-400 font-medium">Employment Type</span>
                    <span className="font-semibold text-neutral-900">{selectedEmployee.employmentType || 'Full-time'}</span>
                  </div>
                </div>
              </div>

              {/* 360 Operational Snapshot Card */}
              <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-700/80">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-neutral-400">360° Operational State</span>
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-indigo-300 font-semibold font-mono">
                    All-Systems
                  </span>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-300 flex items-center gap-1.5"><Home className="w-3.5 h-3.5 text-orange-400" /> Housing:</span>
                    <span className="font-bold text-white truncate max-w-[150px]">
                      {activeAccommodation ? `Room ${activeAccommodation.room?.roomNumber}` : 'Unassigned'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-300 flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-blue-400" /> Vehicle:</span>
                    <span className="font-bold text-white truncate max-w-[150px]">
                      {activeVehicle ? `${activeVehicle.vehicle?.make} (${activeVehicle.vehicle?.licensePlate})` : 'None Assigned'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-300 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-emerald-400" /> Deployment:</span>
                    <span className="font-bold text-white truncate max-w-[150px]">
                      {assignments.find(a => a.status?.toLowerCase() === 'active')?.role || 'Available'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-300 flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-purple-400" /> Custody Assets:</span>
                    <span className="font-bold text-white">
                      {employeeAssets.length} active items
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Tabbed 360° History & Management */}
            <div className="lg:col-span-8 space-y-6">
              {isLoadingProfile && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center text-neutral-500 shadow-2xs">
                  <div className="w-7 h-7 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm font-semibold text-neutral-800">Synchronizing 360° employee dossier...</p>
                  <p className="text-xs text-neutral-400 mt-0.5">Fetching housing stays, vehicle allocations, project deployments, and certified documents.</p>
                </div>
              )}

              {/* TAB 1: OVERVIEW & 360° UNIFIED MASTER TIMELINE */}
              {profileTab === 'overview' && (
                <div className="space-y-6">
                  {/* Top 4 Metric KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
                      <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Housing</span>
                      <span className="text-sm font-black text-neutral-900 mt-1 block truncate">
                        {activeAccommodation ? `Room ${activeAccommodation.room?.roomNumber}` : 'Unassigned'}
                      </span>
                      <span className="text-[11px] text-neutral-500 block mt-0.5">
                        {accommodationHistory.length} total stays
                      </span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
                      <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Vehicle</span>
                      <span className="text-sm font-black text-neutral-900 mt-1 block truncate">
                        {activeVehicle ? activeVehicle.vehicle?.licensePlate : 'None'}
                      </span>
                      <span className="text-[11px] text-neutral-500 block mt-0.5">
                        {vehicleHistory.length} assignments
                      </span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
                      <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Deployment</span>
                      <span className="text-sm font-black text-neutral-900 mt-1 block truncate">
                        {assignments.find(a => a.status?.toLowerCase() === 'active')?.role || 'Available'}
                      </span>
                      <span className="text-[11px] text-neutral-500 block mt-0.5">
                        {assignments.length} logged
                      </span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
                      <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Documents</span>
                      <span className="text-sm font-black text-neutral-900 mt-1 block">
                        {documents.length} Records
                      </span>
                      <span className="text-[11px] text-neutral-500 block mt-0.5">
                        Saudi/GCC certified
                      </span>
                    </div>
                  </div>

                  {/* Complete 360° Chronological Activity Timeline */}
                  <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6">
                    <div className="flex items-center justify-between pb-3 mb-5 border-b border-neutral-100">
                      <div>
                        <h3 className="font-bold text-neutral-950 text-base">360° Complete History & Lifecycle Timeline</h3>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          Consolidated chronological log across accommodation, projects, vehicles, equipment, and records.
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-full">
                        {accommodationHistory.length + assignments.length + vehicleHistory.length + employeeAssets.length + assetHistory.length + documents.length + leaves.length} Events
                      </span>
                    </div>

                    {/* Timeline Event Stream */}
                    <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200">
                      {/* Accommodation Events */}
                      {accommodationHistory.map((acc: any) => (
                        <div key={`acc-${acc.id}`} className="relative group">
                          <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full bg-orange-500 ring-4 ring-white" />
                          <div className="bg-neutral-50 hover:bg-neutral-100/80 p-3.5 rounded-xl border border-neutral-200 transition-colors">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Home className="w-3 h-3" /> Housing Admission
                              </span>
                              <span className="text-xs font-mono text-neutral-500">
                                {acc.startDate ? new Date(acc.startDate).toLocaleDateString() : 'Active'}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-neutral-900 mt-1.5">
                              Room {acc.room?.roomNumber} • {acc.accommodation?.name || 'Staff Housing'}
                            </p>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              {acc.accommodation?.location || acc.accommodation?.address || 'Site Housing'} • Building {acc.room?.building || 'Main'}, Floor {acc.room?.floor || '1'}
                            </p>
                          </div>
                        </div>
                      ))}

                      {/* Project Deployments */}
                      {assignments.map((ass: any) => (
                        <div key={`ass-${ass.id}`} className="relative group">
                          <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-white" />
                          <div className="bg-neutral-50 hover:bg-neutral-100/80 p-3.5 rounded-xl border border-neutral-200 transition-colors">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Briefcase className="w-3 h-3" /> Deployment
                              </span>
                              <span className="text-xs font-mono text-neutral-500">
                                {ass.startDate ? new Date(ass.startDate).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-neutral-900 mt-1.5">{ass.role}</p>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              Site: <strong>{ass.site?.name || 'N/A'}</strong> • Project: <strong>{ass.project?.name || 'N/A'}</strong>
                            </p>
                          </div>
                        </div>
                      ))}

                      {/* Vehicles */}
                      {vehicleHistory.map((veh: any) => (
                        <div key={`veh-${veh.id}`} className="relative group">
                          <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full bg-blue-500 ring-4 ring-white" />
                          <div className="bg-neutral-50 hover:bg-neutral-100/80 p-3.5 rounded-xl border border-neutral-200 transition-colors">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Truck className="w-3 h-3" /> Vehicle Assigned
                              </span>
                              <span className="text-xs font-mono text-neutral-500">
                                {veh.startDate ? new Date(veh.startDate).toLocaleDateString() : 'Active'}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-neutral-900 mt-1.5">
                              {veh.vehicle?.make} {veh.vehicle?.model} ({veh.vehicle?.year || ''})
                            </p>
                            <p className="text-xs text-neutral-500 mt-0.5 font-mono">
                              Plate: {veh.vehicle?.licensePlate} • VIN: {veh.vehicle?.vin || 'N/A'}
                            </p>
                          </div>
                        </div>
                      ))}

                      {/* Equipment & Assets */}
                      {employeeAssets.map((asset: any) => (
                        <div key={`ast-${asset.id}`} className="relative group">
                          <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full bg-purple-500 ring-4 ring-white" />
                          <div className="bg-neutral-50 hover:bg-neutral-100/80 p-3.5 rounded-xl border border-neutral-200 transition-colors">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Package className="w-3 h-3" /> Equipment Custody
                              </span>
                              <span className="text-xs font-mono text-neutral-500 uppercase">{asset.status}</span>
                            </div>
                            <p className="text-sm font-bold text-neutral-900 mt-1.5">{asset.name}</p>
                            <p className="text-xs text-neutral-500 mt-0.5 font-mono">
                              Tag: {asset.assetTag} • Type: {asset.type}
                            </p>
                          </div>
                        </div>
                      ))}

                      {/* Documents */}
                      {documents.map((doc: any) => (
                        <div key={`doc-${doc.id}`} className="relative group">
                          <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full bg-indigo-500 ring-4 ring-white" />
                          <div className="bg-neutral-50 hover:bg-neutral-100/80 p-3.5 rounded-xl border border-neutral-200 transition-colors">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <FileText className="w-3 h-3" /> GCC Document Archive
                              </span>
                              <span className="text-xs font-mono text-neutral-500">
                                {doc.issueDate ? new Date(doc.issueDate).toLocaleDateString() : 'Certified'}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-neutral-900 mt-1.5">{doc.documentType}</p>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              Expiry: {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : 'No expiry'}
                            </p>
                          </div>
                        </div>
                      ))}

                      {accommodationHistory.length === 0 && assignments.length === 0 && vehicleHistory.length === 0 && employeeAssets.length === 0 && documents.length === 0 && (
                        <div className="p-8 text-center text-neutral-400 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                          <Layers className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                          <p className="text-xs font-semibold text-neutral-600">No lifecycle activity logged yet.</p>
                          <p className="text-[11px] text-neutral-400 mt-0.5">Deployments, housing stays, vehicles, and assets will appear here automatically.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: STAFF ACCOMMODATION & HOUSING */}
              {profileTab === 'housing' && (
                <div className="space-y-6">
                  {/* Current Active Housing Room */}
                  <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100">
                      <div className="flex items-center gap-2">
                        <Home className="w-5 h-5 text-orange-600" />
                        <div>
                          <h3 className="font-bold text-neutral-900">Current Assigned Accommodation</h3>
                          <p className="text-xs text-neutral-500">Active housing unit and room admission</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${activeAccommodation ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'}`}>
                        {activeAccommodation ? 'Resident' : 'Not Admitted'}
                      </span>
                    </div>

                    {activeAccommodation ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-orange-50/50 border border-orange-200/80 rounded-xl p-4">
                        <div>
                          <span className="text-[11px] text-neutral-500 font-semibold uppercase block">Room Details</span>
                          <p className="text-base font-bold text-neutral-900 mt-0.5">
                            Room {activeAccommodation.room?.roomNumber}
                          </p>
                          <p className="text-xs text-neutral-600">
                            Building {activeAccommodation.room?.building || 'Main'} • Floor {activeAccommodation.room?.floor || '1'}
                          </p>
                        </div>
                        <div>
                          <span className="text-[11px] text-neutral-500 font-semibold uppercase block">Facility & Location</span>
                          <p className="text-sm font-bold text-neutral-900 mt-0.5">
                            {activeAccommodation.accommodation?.name || 'Staff Camp'}
                          </p>
                          <p className="text-xs text-neutral-600">
                            {activeAccommodation.accommodation?.location || activeAccommodation.accommodation?.address || 'Site Area'}
                          </p>
                        </div>
                        <div>
                          <span className="text-[11px] text-neutral-500 font-semibold uppercase block">Check-in Date</span>
                          <p className="text-sm font-bold text-neutral-900 mt-0.5">
                            {activeAccommodation.startDate ? new Date(activeAccommodation.startDate).toLocaleDateString() : 'N/A'}
                          </p>
                          <span className="text-xs text-emerald-700 font-medium">Currently Residing</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                        <Bed className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-neutral-600">No active housing stay recorded.</p>
                        <p className="text-[11px] text-neutral-400 mt-0.5">Staff can be admitted via the Accommodations module.</p>
                      </div>
                    )}
                  </div>

                  {/* Accommodation Stay History Table */}
                  <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100">
                      <h3 className="font-bold text-neutral-900 text-sm sm:text-base">Complete Accommodation Stay History</h3>
                      <span className="text-xs font-mono font-bold text-neutral-500">
                        {accommodationHistory.length} total records
                      </span>
                    </div>

                    {accommodationHistory.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-sm">
                          <thead className="bg-neutral-50 text-neutral-500 uppercase text-[11px] font-bold border-b border-neutral-200">
                            <tr>
                              <th className="px-4 py-3">Room / Unit</th>
                              <th className="px-4 py-3">Accommodation Name</th>
                              <th className="px-4 py-3">Location</th>
                              <th className="px-4 py-3">Check-In</th>
                              <th className="px-4 py-3">Check-Out</th>
                              <th className="px-4 py-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100">
                            {accommodationHistory.map((item: any) => (
                              <tr key={item.id} className="hover:bg-neutral-50/80 transition-colors">
                                <td className="px-4 py-3 font-bold text-neutral-900">
                                  Room {item.room?.roomNumber || 'N/A'}
                                </td>
                                <td className="px-4 py-3 text-neutral-800">{item.accommodation?.name || 'N/A'}</td>
                                <td className="px-4 py-3 text-neutral-500">{item.accommodation?.location || 'N/A'}</td>
                                <td className="px-4 py-3 font-mono text-neutral-600">
                                  {item.startDate ? new Date(item.startDate).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="px-4 py-3 font-mono text-neutral-600">
                                  {item.endDate ? new Date(item.endDate).toLocaleDateString() : 'Current'}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                    item.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'
                                  }`}>
                                    {item.status || 'Active'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-500 text-center py-6">No previous accommodation stays found.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: DEPLOYMENTS & PROJECTS */}
              {profileTab === 'assignments' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-emerald-600" />
                        <div>
                          <h3 className="font-bold text-neutral-900">Project Deployments & Site Assignments</h3>
                          <p className="text-xs text-neutral-500">Assign staff to client projects and operational locations</p>
                        </div>
                      </div>
                      {!showAssignForm && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAssignId(null);
                            setAssignForm({ role: '', status: 'Active', siteId: '', projectId: '', startDate: '', endDate: '' });
                            setShowAssignForm(true);
                          }}
                          className="bg-neutral-900 hover:bg-neutral-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Assign to Project</span>
                        </button>
                      )}
                    </div>

                    {showAssignForm && (
                      <form onSubmit={handleAssignSubmit} className="mb-6 bg-neutral-50 p-4 rounded-xl border border-neutral-200 shadow-2xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="text-xs font-semibold text-neutral-700 block mb-1">Assigned Role</label>
                            <input
                              required
                              className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded-lg bg-white"
                              value={assignForm.role || ''}
                              onChange={(e) => setAssignForm({ ...assignForm, role: e.target.value })}
                              placeholder="e.g. Site Supervisor, MEP Specialist"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-neutral-700 block mb-1">Status</label>
                            <select
                              className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded-lg bg-white"
                              value={assignForm.status || 'Active'}
                              onChange={(e) => setAssignForm({ ...assignForm, status: e.target.value })}
                            >
                              <option>Active</option>
                              <option>Completed</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-neutral-700 block mb-1">Site</label>
                            <select
                              className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded-lg bg-white"
                              value={assignForm.siteId || ''}
                              onChange={(e) => setAssignForm({ ...assignForm, siteId: e.target.value })}
                            >
                              <option value="">-- Choose Site --</option>
                              {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-neutral-700 block mb-1">Project</label>
                            <select
                              className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded-lg bg-white"
                              value={assignForm.projectId || ''}
                              onChange={(e) => setAssignForm({ ...assignForm, projectId: e.target.value })}
                            >
                              <option value="">-- Choose Project --</option>
                              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-neutral-700 block mb-1">Start Date</label>
                            <input
                              type="date"
                              required
                              className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded-lg bg-white"
                              value={assignForm.startDate || ''}
                              onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-neutral-700 block mb-1">End Date</label>
                            <input
                              type="date"
                              className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded-lg bg-white"
                              value={assignForm.endDate || ''}
                              onChange={(e) => setAssignForm({ ...assignForm, endDate: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowAssignForm(false)}
                            className="px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 text-xs font-semibold bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                          >
                            {selectedAssignId ? 'Update Assignment' : 'Save Assignment'}
                          </button>
                        </div>
                      </form>
                    )}

                    {assignments.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-sm">
                          <thead className="bg-neutral-50 text-neutral-500 uppercase text-[11px] font-bold border-b border-neutral-200">
                            <tr>
                              <th className="px-4 py-3">Role</th>
                              <th className="px-4 py-3">Site</th>
                              <th className="px-4 py-3">Project / Client</th>
                              <th className="px-4 py-3">Start Date</th>
                              <th className="px-4 py-3">End Date</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100">
                            {assignments.map((ass: any) => (
                              <tr key={ass.id} className="hover:bg-neutral-50/80 transition-colors">
                                <td className="px-4 py-3 font-bold text-neutral-900">{ass.role}</td>
                                <td className="px-4 py-3 text-neutral-700">{ass.site?.name || 'N/A'}</td>
                                <td className="px-4 py-3 text-neutral-700">{ass.project?.name || 'N/A'}</td>
                                <td className="px-4 py-3 font-mono text-neutral-600">
                                  {ass.startDate ? new Date(ass.startDate).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="px-4 py-3 font-mono text-neutral-600">
                                  {ass.endDate ? new Date(ass.endDate).toLocaleDateString() : 'Ongoing'}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                    ass.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'
                                  }`}>
                                    {ass.status || 'Active'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right space-x-2">
                                  <button
                                    onClick={() => handleEditAssignment(ass)}
                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleUnassignAssignment(ass.id)}
                                    className="text-xs font-semibold text-red-600 hover:text-red-800 cursor-pointer"
                                  >
                                    Unassign
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                        <Briefcase className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-neutral-600">No project assignments found.</p>
                        <p className="text-[11px] text-neutral-400 mt-0.5">Click + Assign to Project above to deploy this employee.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: ASSETS & EQUIPMENT */}
              {profileTab === 'assets' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100">
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-purple-600" />
                        <div>
                          <h3 className="font-bold text-neutral-900">Assigned Assets & Equipment</h3>
                          <p className="text-xs text-neutral-500">Tools, hardware, and equipment in employee custody</p>
                        </div>
                      </div>
                      {!showAssetForm && (
                        <button
                          type="button"
                          onClick={handleOpenAssignAsset}
                          className="bg-neutral-900 hover:bg-neutral-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Assign Asset</span>
                        </button>
                      )}
                    </div>

                    {showAssetForm && (
                      <form onSubmit={handleAssignAssetSubmit} className="mb-6 bg-neutral-50 p-4 rounded-xl border border-neutral-200 shadow-2xs">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-3">
                          {assetFormAction === 'assign' ? 'Assign Available Asset' : 'Transfer Asset Custody'}
                        </h4>
                        <div className="mb-3">
                          {assetFormAction === 'assign' ? (
                            <>
                              <label className="text-xs font-semibold text-neutral-700 block mb-1">Select Available Asset</label>
                              <select
                                required
                                className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded-lg bg-white"
                                value={assignAssetForm.assetId}
                                onChange={(e) => setAssignAssetForm({ assetId: e.target.value })}
                              >
                                <option value="">-- Choose Asset --</option>
                                {availableAssets.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.assetTag}) - {a.type}</option>)}
                              </select>
                            </>
                          ) : (
                            <>
                              <label className="text-xs font-semibold text-neutral-700 block mb-1">Select Target Recipient Employee</label>
                              <select
                                required
                                className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded-lg bg-white"
                                value={transferTargetId}
                                onChange={(e) => setTransferTargetId(e.target.value)}
                              >
                                <option value="">-- Choose Employee --</option>
                                {employees.filter((emp) => emp.id !== selectedEmployee.id).map((e) => (
                                  <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeId})</option>
                                ))}
                              </select>
                            </>
                          )}
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowAssetForm(false)}
                            className="px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 text-xs font-semibold bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                          >
                            {assetFormAction === 'assign' ? 'Assign Asset' : 'Confirm Transfer'}
                          </button>
                        </div>
                      </form>
                    )}

                    {employeeAssets.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                        {employeeAssets.map((asset: any) => (
                          <div key={asset.id} className="border border-neutral-200 rounded-xl p-4 bg-neutral-50/50 flex flex-col justify-between gap-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-bold text-neutral-900">{asset.name}</p>
                                <p className="text-xs font-mono text-neutral-500 mt-0.5">Tag: {asset.assetTag}</p>
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-800">
                                {asset.type}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-neutral-100">
                              <span className="text-[11px] text-neutral-500 font-mono">{asset.make || 'Tool'} {asset.model || ''}</span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAssetFormAction('transfer');
                                    setSelectedAssetId(asset.id);
                                    setShowAssetForm(true);
                                  }}
                                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                                >
                                  Transfer
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUnassignAsset(asset.id)}
                                  className="text-xs font-semibold text-red-600 hover:text-red-800 cursor-pointer"
                                >
                                  Unassign
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-neutral-50 rounded-xl border border-dashed border-neutral-200 mb-6">
                        <Package className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-neutral-600">No active assets in custody.</p>
                      </div>
                    )}

                    {/* Historical Asset Allocations */}
                    <div className="pt-4 border-t border-neutral-100">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">Asset Allocation History</h4>
                      {assetHistory.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-neutral-50 text-neutral-500 uppercase text-[10px] font-bold border-b border-neutral-200">
                              <tr>
                                <th className="px-3 py-2">Asset Tag</th>
                                <th className="px-3 py-2">Name</th>
                                <th className="px-3 py-2">Type</th>
                                <th className="px-3 py-2">Assigned Date</th>
                                <th className="px-3 py-2">Returned Date</th>
                                <th className="px-3 py-2">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                              {assetHistory.map((h: any) => (
                                <tr key={h.id} className="hover:bg-neutral-50/60">
                                  <td className="px-3 py-2 font-mono font-bold">{h.asset?.assetTag || 'N/A'}</td>
                                  <td className="px-3 py-2 text-neutral-800">{h.asset?.name || 'Equipment'}</td>
                                  <td className="px-3 py-2 text-neutral-500">{h.asset?.type || 'N/A'}</td>
                                  <td className="px-3 py-2 font-mono">{h.startDate ? new Date(h.startDate).toLocaleDateString() : 'N/A'}</td>
                                  <td className="px-3 py-2 font-mono">{h.endDate ? new Date(h.endDate).toLocaleDateString() : 'Current'}</td>
                                  <td className="px-3 py-2">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-700">
                                      {h.status || 'Past'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-400 text-center py-4">No previous asset records logged.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: VEHICLES & FLEET */}
              {profileTab === 'vehicles' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100">
                      <div className="flex items-center gap-2">
                        <Truck className="w-5 h-5 text-blue-600" />
                        <div>
                          <h3 className="font-bold text-neutral-900">Current Assigned Vehicle</h3>
                          <p className="text-xs text-neutral-500">Fleet car, truck, or operational vehicle handover</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${activeVehicle ? 'bg-blue-100 text-blue-800' : 'bg-neutral-100 text-neutral-600'}`}>
                        {activeVehicle ? 'Assigned' : 'No Vehicle'}
                      </span>
                    </div>

                    {activeVehicle ? (
                      <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <span className="text-[11px] text-neutral-500 font-semibold uppercase block">Make & Model</span>
                          <p className="text-base font-bold text-neutral-900 mt-0.5">
                            {activeVehicle.vehicle?.make} {activeVehicle.vehicle?.model}
                          </p>
                          <p className="text-xs text-neutral-600">Year: {activeVehicle.vehicle?.year || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-[11px] text-neutral-500 font-semibold uppercase block">License Plate</span>
                          <p className="text-base font-black font-mono text-neutral-900 mt-0.5">
                            {activeVehicle.vehicle?.licensePlate}
                          </p>
                          <p className="text-xs text-neutral-500 font-mono">VIN: {activeVehicle.vehicle?.vin || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-[11px] text-neutral-500 font-semibold uppercase block">Current Mileage</span>
                          <p className="text-sm font-bold text-neutral-900 mt-0.5">
                            {activeVehicle.vehicle?.currentMileage ? `${activeVehicle.vehicle.currentMileage} km` : 'N/A'}
                          </p>
                          <span className="text-xs text-blue-700 font-semibold">Active Fleet Handover</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                        <Truck className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-neutral-600">No active vehicle assigned.</p>
                      </div>
                    )}
                  </div>

                  {/* Vehicle Assignment History */}
                  <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6">
                    <h3 className="font-bold text-neutral-900 text-sm sm:text-base pb-3 mb-4 border-b border-neutral-100">
                      Vehicle Handover & Assignment History ({vehicleHistory.length})
                    </h3>
                    {vehicleHistory.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-sm">
                          <thead className="bg-neutral-50 text-neutral-500 uppercase text-[11px] font-bold border-b border-neutral-200">
                            <tr>
                              <th className="px-4 py-3">Vehicle</th>
                              <th className="px-4 py-3">License Plate</th>
                              <th className="px-4 py-3">Site / Project</th>
                              <th className="px-4 py-3">Assigned Date</th>
                              <th className="px-4 py-3">Returned Date</th>
                              <th className="px-4 py-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100">
                            {vehicleHistory.map((v: any) => (
                              <tr key={v.id} className="hover:bg-neutral-50/80 transition-colors">
                                <td className="px-4 py-3 font-bold text-neutral-900">
                                  {v.vehicle?.make} {v.vehicle?.model}
                                </td>
                                <td className="px-4 py-3 font-mono font-bold text-neutral-700">{v.vehicle?.licensePlate || 'N/A'}</td>
                                <td className="px-4 py-3 text-neutral-600">{v.site?.name || 'N/A'}</td>
                                <td className="px-4 py-3 font-mono text-neutral-600">
                                  {v.startDate ? new Date(v.startDate).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="px-4 py-3 font-mono text-neutral-600">
                                  {v.endDate ? new Date(v.endDate).toLocaleDateString() : 'Current'}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                    v.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-neutral-100 text-neutral-600'
                                  }`}>
                                    {v.status || 'Past'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-500 text-center py-6">No previous vehicle assignments recorded.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: LEAVES & ABSENCES */}
              {profileTab === 'leaves' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-amber-600" />
                        <div>
                          <h3 className="font-bold text-neutral-900">Leaves & Absences History</h3>
                          <p className="text-xs text-neutral-500">Official leave requests, approvals, and annual entitlements</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-full">
                        {leaves.length} records
                      </span>
                    </div>

                    {leaves.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-sm">
                          <thead className="bg-neutral-50 text-neutral-500 uppercase text-[11px] font-bold border-b border-neutral-200">
                            <tr>
                              <th className="px-4 py-3">Leave Type</th>
                              <th className="px-4 py-3">Start Date</th>
                              <th className="px-4 py-3">End Date</th>
                              <th className="px-4 py-3">Days</th>
                              <th className="px-4 py-3">Reason</th>
                              <th className="px-4 py-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100">
                            {leaves.map((l: any) => {
                              const s = l.startDate ? new Date(l.startDate) : null;
                              const e = l.endDate ? new Date(l.endDate) : null;
                              const days = s && e ? Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 3600 * 24)) + 1) : 1;
                              return (
                                <tr key={l.id} className="hover:bg-neutral-50/80 transition-colors">
                                  <td className="px-4 py-3 font-bold text-neutral-900">{l.leaveType || 'Annual Leave'}</td>
                                  <td className="px-4 py-3 font-mono text-neutral-600">{s ? s.toLocaleDateString() : 'N/A'}</td>
                                  <td className="px-4 py-3 font-mono text-neutral-600">{e ? e.toLocaleDateString() : 'N/A'}</td>
                                  <td className="px-4 py-3 font-bold text-neutral-900">{days}d</td>
                                  <td className="px-4 py-3 text-neutral-600 truncate max-w-[200px]">{l.reason || 'Routine Leave'}</td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                      l.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                                      l.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                      {l.status || 'Approved'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                        <Calendar className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-neutral-600">No leaves logged for this employee.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 7: TIMESHEETS & HOURS */}
              {profileTab === 'timesheets' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-indigo-600" />
                        <div>
                          <h3 className="font-bold text-neutral-900">Timesheets & Hours Logged</h3>
                          <p className="text-xs text-neutral-500">Recent operational shifts, regular hours, and overtime</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-full">
                        {timesheets.length} shifts
                      </span>
                    </div>

                    {timesheets.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-sm">
                          <thead className="bg-neutral-50 text-neutral-500 uppercase text-[11px] font-bold border-b border-neutral-200">
                            <tr>
                              <th className="px-4 py-3">Date</th>
                              <th className="px-4 py-3">Total Hours</th>
                              <th className="px-4 py-3">Regular</th>
                              <th className="px-4 py-3">Overtime</th>
                              <th className="px-4 py-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100">
                            {timesheets.map((t: any) => (
                              <tr key={t.id} className="hover:bg-neutral-50/80 transition-colors">
                                <td className="px-4 py-3 font-mono font-semibold text-neutral-900">
                                  {t.date ? new Date(t.date).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="px-4 py-3 font-bold text-neutral-900">{t.totalHours || t.hoursWorked || 8} hrs</td>
                                <td className="px-4 py-3 text-neutral-600">{t.regularHours || 8} hrs</td>
                                <td className="px-4 py-3 text-neutral-600">{t.overtimeHours ? `${t.overtimeHours} hrs` : '0 hrs'}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                    t.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'
                                  }`}>
                                    {t.status || 'Approved'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                        <Clock className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-neutral-600">No recent timesheet shifts logged.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 8: OFFICIAL GCC DOCUMENTS */}
              {profileTab === 'documents' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        <div>
                          <h3 className="font-bold text-neutral-900 leading-tight">Official GCC Certified Archive</h3>
                          <p className="text-[11px] text-neutral-500">Saudi Arabia & GCC certified multi-section scanned archive</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsGccDocModalOpen(true)}
                        className="text-xs bg-neutral-900 hover:bg-neutral-800 text-white px-3.5 py-2 rounded-xl font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Upload Official Document</span>
                      </button>
                    </div>

                    {documents.length > 0 ? (
                      <div className="space-y-3">
                        {documents.map((doc: any) => {
                          let isMultiPage = false;
                          let docNum = '';
                          try {
                            if (doc.documentUrl?.startsWith('{')) {
                              const parsed = JSON.parse(doc.documentUrl);
                              if (parsed.firstPageUrl && parsed.secondPageUrl) isMultiPage = true;
                              docNum = parsed.documentNumber || '';
                            }
                          } catch {}

                          return (
                            <div
                              key={doc.id}
                              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-neutral-200/80 rounded-xl p-3.5 hover:border-indigo-300 bg-neutral-50/50 hover:bg-indigo-50/20 transition-all"
                            >
                              <div className="flex items-start gap-3">
                                <div className="bg-indigo-50 text-indigo-600 p-2 rounded-xl border border-indigo-100 shrink-0 mt-0.5">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-sm text-neutral-900">{doc.documentType}</span>
                                    {docNum && (
                                      <span className="font-mono text-xs font-bold text-neutral-600 bg-white px-2 py-0.5 rounded border border-neutral-200">
                                        #{docNum}
                                      </span>
                                    )}
                                    {isMultiPage ? (
                                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                        <Layers className="w-3 h-3 text-emerald-600" /> Page 1 & 2 (Front & Back) Attached
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full">
                                        1 Page Attached
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-neutral-500 mt-1">
                                    Exp: <strong className="text-neutral-700">{doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : 'No expiry'}</strong>
                                    {doc.issueDate && <span className="text-neutral-400"> • Issued: {new Date(doc.issueDate).toLocaleDateString()}</span>}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                <button
                                  type="button"
                                  onClick={() => setViewerDoc(doc)}
                                  className="px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200 rounded-lg text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>View Scans</span>
                                </button>
                                {doc.documentUrl && !doc.documentUrl.startsWith('{') && (
                                  <a
                                    href={doc.documentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-neutral-400 hover:text-indigo-600 hover:bg-neutral-100 rounded-lg transition-colors"
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                        <FileText className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                        <p className="text-neutral-600 text-xs font-semibold">No official documents recorded yet.</p>
                        <p className="text-neutral-400 text-[11px] mt-0.5">Attach Iqama, National ID, Driving License, or CR copy scans.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Official Saudi & GCC Document Upload Modal */}
      <GccDocumentUploadModal
        isOpen={isGccDocModalOpen}
        onClose={() => setIsGccDocModalOpen(false)}
        employeeId={selectedEmployee?.id}
        employeeName={selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : ''}
        onSuccess={() => {
          if (selectedEmployee) fetchProfileData(selectedEmployee.id);
          fetchEmployees();
        }}
      />

      {/* Official Saudi & GCC Document Viewer Modal */}
      <GccDocumentViewerModal
        isOpen={!!viewerDoc}
        onClose={() => setViewerDoc(null)}
        document={viewerDoc}
        employeeName={selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : ''}
      />

      {/* Employee 360° PDF Export Preview Modal */}
      <EmployeeDossierPdfModal
        isOpen={isProfilePdfModalOpen}
        onClose={() => setIsProfilePdfModalOpen(false)}
        employee={selectedEmployee}
        dossierData={profileDossierData}
      />

      {/* Employee 360° Interactive Master Dossier Modal */}
      {selectedEmployee && (
        <EmployeeDossierModal
          employeeId={selectedEmployee.id}
          isOpen={isDossierModalOpen}
          onClose={() => setIsDossierModalOpen(false)}
          initialTab={profileTab === 'housing' ? 'accommodation' : (profileTab as any)}
        />
      )}
    </div>
  );
}
