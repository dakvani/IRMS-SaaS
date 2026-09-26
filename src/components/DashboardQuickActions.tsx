import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  UserPlus, 
  Clock, 
  Briefcase, 
  X, 
  Check, 
  AlertCircle, 
  Loader2, 
  ChevronDown,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  FileDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuickActionsProps {
  employees: any[];
  sites?: any[];
  projects?: any[];
  onSuccessRefresh: () => void;
  onDownloadReport?: () => void;
  mode?: 'fab' | 'dropdown' | 'both';
}

export default function DashboardQuickActions({
  employees,
  sites = [],
  projects = [],
  onSuccessRefresh,
  onDownloadReport,
  mode = 'both'
}: QuickActionsProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'addEmployee' | 'logTime' | 'createProject' | null>(null);

  // Form states
  const [employeeForm, setEmployeeForm] = useState({
    firstName: '',
    lastName: '',
    employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
    department: 'Operations',
    jobTitle: '',
    mobile: '',
    email: '',
    employmentType: 'Full-time'
  });

  const [timeForm, setTimeForm] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    hoursWorked: '8',
    siteId: '',
    projectId: '',
    status: 'approved',
    notes: ''
  });

  const [projectForm, setProjectForm] = useState({
    name: '',
    code: `PRJ-${Math.floor(100 + Math.random() * 900)}`,
    client: '',
    siteId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: 'active'
  });

  const [localSites, setLocalSites] = useState<any[]>(sites);
  const [localProjects, setLocalProjects] = useState<any[]>(projects);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLDivElement>(null);

  // Fetch sites and projects if not provided
  useEffect(() => {
    if (localSites.length === 0 || localProjects.length === 0) {
      const fetchSitesAndProjects = async () => {
        try {
          const token = (window as any)._token;
          if (!token) return;
          const headers = { Authorization: `Bearer ${token}` };
          const [sRes, pRes] = await Promise.all([
            fetch('/api/sites', { headers }),
            fetch('/api/projects', { headers })
          ]);
          if (sRes.ok) {
            const data = await sRes.json();
            if (Array.isArray(data)) setLocalSites(data);
          }
          if (pRes.ok) {
            const data = await pRes.json();
            if (Array.isArray(data)) setLocalProjects(data);
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchSitesAndProjects();
    }
  }, [sites, projects]);

  // Click outside listener for dropdown and FAB
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsFabOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-hide toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Pre-fill default employee in log time form if available
  useEffect(() => {
    if (employees.length > 0 && !timeForm.employeeId) {
      setTimeForm(prev => ({ ...prev, employeeId: String(employees[0].id) }));
    }
  }, [employees]);

  // Pre-fill site in project form if available
  useEffect(() => {
    if (localSites.length > 0 && !projectForm.siteId) {
      setProjectForm(prev => ({ ...prev, siteId: String(localSites[0].id) }));
    }
    if (localSites.length > 0 && !timeForm.siteId) {
      setTimeForm(prev => ({ ...prev, siteId: String(localSites[0].id) }));
    }
  }, [localSites]);

  const openAction = (action: 'addEmployee' | 'logTime' | 'createProject') => {
    setIsDropdownOpen(false);
    setIsFabOpen(false);
    setFormError(null);
    setActiveModal(action);
  };

  // Submit Add Employee
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const token = (window as any)._token;
      if (!token) throw new Error("Authentication token not found");

      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName: employeeForm.firstName.trim(),
          lastName: employeeForm.lastName.trim(),
          employeeId: employeeForm.employeeId.trim(),
          department: employeeForm.department,
          jobTitle: employeeForm.jobTitle.trim(),
          mobile: employeeForm.mobile.trim(),
          email: employeeForm.email.trim(),
          employmentType: employeeForm.employmentType,
          gender: 'Male',
          joiningDate: new Date().toISOString()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add employee');
      }

      setToastMessage(`Employee ${employeeForm.firstName} ${employeeForm.lastName} (${employeeForm.employeeId}) created successfully!`);
      setActiveModal(null);
      // Reset form
      setEmployeeForm({
        firstName: '',
        lastName: '',
        employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        department: 'Operations',
        jobTitle: '',
        mobile: '',
        email: '',
        employmentType: 'Full-time'
      });
      onSuccessRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Error creating employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Log Time
  const handleLogTime = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const token = (window as any)._token;
      if (!token) throw new Error("Authentication token not found");

      const hours = parseFloat(timeForm.hoursWorked);
      if (isNaN(hours) || hours <= 0 || hours > 24) {
        throw new Error("Hours worked must be a valid number between 1 and 24");
      }

      const res = await fetch('/api/timesheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId: parseInt(timeForm.employeeId),
          date: timeForm.date,
          hoursWorked: hours,
          siteId: timeForm.siteId ? parseInt(timeForm.siteId) : null,
          projectId: timeForm.projectId ? parseInt(timeForm.projectId) : null,
          status: timeForm.status
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to log timesheet hours');
      }

      setToastMessage(`Logged ${hours} hours successfully for ${timeForm.date}!`);
      setActiveModal(null);
      onSuccessRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Error logging time');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Create Project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const token = (window as any)._token;
      if (!token) throw new Error("Authentication token not found");

      const payload: any = {
        name: projectForm.name.trim(),
        code: projectForm.code.trim(),
        client: projectForm.client.trim(),
        siteId: projectForm.siteId ? parseInt(projectForm.siteId) : null,
        status: projectForm.status,
        startDate: projectForm.startDate || null,
        endDate: projectForm.endDate || null
      };

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      setToastMessage(`Project "${projectForm.name}" created successfully!`);
      setActiveModal(null);
      // Reset form
      setProjectForm({
        name: '',
        code: `PRJ-${Math.floor(100 + Math.random() * 900)}`,
        client: '',
        siteId: localSites[0]?.id ? String(localSites[0].id) : '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        status: 'active'
      });
      onSuccessRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Error creating project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-neutral-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-neutral-800 text-sm font-medium"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Dropdown Menu Trigger */}
      {(mode === 'dropdown' || mode === 'both') && (
        <div className="relative inline-block" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-all shadow-xs focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-900"
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Quick Actions</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-neutral-200/90 shadow-xl py-1.5 z-40"
              >
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-neutral-400 border-b border-neutral-100">
                  Instant Operations
                </div>

                <button
                  type="button"
                  onClick={() => openAction('addEmployee')}
                  className="w-full text-left px-3.5 py-2.5 text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 flex items-center gap-2.5 transition-colors"
                >
                  <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                    <UserPlus className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block font-semibold">Add Employee</span>
                    <span className="block text-[11px] text-neutral-400">Onboard new personnel</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => openAction('logTime')}
                  className="w-full text-left px-3.5 py-2.5 text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 flex items-center gap-2.5 transition-colors"
                >
                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block font-semibold">Log Time</span>
                    <span className="block text-[11px] text-neutral-400">Submit employee hours</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => openAction('createProject')}
                  className="w-full text-left px-3.5 py-2.5 text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 flex items-center gap-2.5 transition-colors"
                >
                  <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block font-semibold">Create Project</span>
                    <span className="block text-[11px] text-neutral-400">Initialize new job code</span>
                  </div>
                </button>

                {onDownloadReport && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onDownloadReport();
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 flex items-center gap-2.5 transition-colors border-t border-neutral-100"
                  >
                    <div className="p-1.5 rounded-lg bg-orange-50 text-orange-700">
                      <FileDown className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="block font-semibold">Export Report</span>
                      <span className="block text-[11px] text-neutral-400">Preview & export KPI metrics as PDF/Print</span>
                    </div>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Floating Action Button (FAB) anchored at bottom-right */}
      {(mode === 'fab' || mode === 'both') && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2" ref={fabRef}>
          <AnimatePresence>
            {isFabOpen && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.95 }}
                className="bg-white rounded-2xl border border-neutral-200 shadow-2xl p-2 mb-2 w-52 flex flex-col gap-1"
              >
                <button
                  onClick={() => openAction('addEmployee')}
                  className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-indigo-50 text-neutral-800 hover:text-indigo-900 text-xs font-semibold transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <UserPlus className="w-3.5 h-3.5" />
                  </div>
                  <span>Add Employee</span>
                </button>

                <button
                  onClick={() => openAction('logTime')}
                  className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-amber-50 text-neutral-800 hover:text-amber-900 text-xs font-semibold transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <span>Log Time</span>
                </button>

                <button
                  onClick={() => openAction('createProject')}
                  className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-blue-50 text-neutral-800 hover:text-blue-900 text-xs font-semibold transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                  <span>Create Project</span>
                </button>

                {onDownloadReport && (
                  <button
                    onClick={() => {
                      setIsFabOpen(false);
                      onDownloadReport();
                    }}
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-orange-50 text-neutral-800 hover:text-orange-950 text-xs font-semibold transition-colors text-left border-t border-neutral-100 mt-1"
                  >
                    <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                      <FileDown className="w-3.5 h-3.5" />
                    </div>
                    <span>Export Report</span>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={() => setIsFabOpen(!isFabOpen)}
            className="w-13 h-13 rounded-2xl bg-neutral-900 text-white shadow-xl hover:bg-neutral-800 flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 group focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-900"
            title="Quick Actions"
            aria-label="Quick Actions"
          >
            <Plus className={`w-6 h-6 transition-transform duration-300 ${isFabOpen ? 'rotate-45' : 'group-hover:rotate-90'}`} />
          </button>
        </div>
      )}

      {/* MODAL 1: Add Employee */}
      <AnimatePresence>
        {activeModal === 'addEmployee' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-lg w-full overflow-hidden"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-neutral-900">Quick Add Employee</h3>
                    <p className="text-xs text-neutral-500">Rapidly register personnel to the active workforce roster</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleAddEmployee} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. John"
                      value={employeeForm.firstName}
                      onChange={e => setEmployeeForm({ ...employeeForm, firstName: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Last Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Doe"
                      value={employeeForm.lastName}
                      onChange={e => setEmployeeForm({ ...employeeForm, lastName: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Employee ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={employeeForm.employeeId}
                      onChange={e => setEmployeeForm({ ...employeeForm, employeeId: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono font-semibold border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Department</label>
                    <select
                      value={employeeForm.department}
                      onChange={e => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                    >
                      <option value="Operations">Operations</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Logistics">Logistics</option>
                      <option value="HSE">HSE</option>
                      <option value="Administration">Administration</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Job Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Field Engineer"
                      value={employeeForm.jobTitle}
                      onChange={e => setEmployeeForm({ ...employeeForm, jobTitle: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Employment Type</label>
                    <select
                      value={employeeForm.employmentType}
                      onChange={e => setEmployeeForm({ ...employeeForm, employmentType: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Part-time">Part-time</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Mobile / Phone</label>
                    <input
                      type="text"
                      placeholder="+966 50 123 4567"
                      value={employeeForm.mobile}
                      onChange={e => setEmployeeForm({ ...employeeForm, mobile: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="name@company.com"
                      value={employeeForm.email}
                      onChange={e => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-semibold bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Create Employee</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Log Time */}
      <AnimatePresence>
        {activeModal === 'logTime' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-lg w-full overflow-hidden"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-neutral-900">Quick Log Time</h3>
                    <p className="text-xs text-neutral-500">Record billable or operational hours directly to timesheets</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleLogTime} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Select Employee <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={timeForm.employeeId}
                    onChange={e => setTimeForm({ ...timeForm, employeeId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                  >
                    <option value="">-- Choose Employee --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeId}) - {emp.department || 'General'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="date"
                      value={timeForm.date}
                      onChange={e => setTimeForm({ ...timeForm, date: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Hours Worked <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="24"
                      value={timeForm.hoursWorked}
                      onChange={e => setTimeForm({ ...timeForm, hoursWorked: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-semibold border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Site</label>
                    <select
                      value={timeForm.siteId}
                      onChange={e => setTimeForm({ ...timeForm, siteId: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                    >
                      <option value="">-- No specific site --</option>
                      {localSites.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.code || 'Site'})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Project</label>
                    <select
                      value={timeForm.projectId}
                      onChange={e => setTimeForm({ ...timeForm, projectId: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                    >
                      <option value="">-- No specific project --</option>
                      {localProjects.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.code || 'Project'})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Approval Status</label>
                  <select
                    value={timeForm.status}
                    onChange={e => setTimeForm({ ...timeForm, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                  >
                    <option value="approved">Approved</option>
                    <option value="pending">Pending Review</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-semibold bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Record Hours</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Create Project */}
      <AnimatePresence>
        {activeModal === 'createProject' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-lg w-full overflow-hidden"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-neutral-900">Quick Create Project</h3>
                    <p className="text-xs text-neutral-500">Initiate a new client engagement or field operation</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateProject} className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Project Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Metro Line Extension"
                      value={projectForm.name}
                      onChange={e => setProjectForm({ ...projectForm, name: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={projectForm.code}
                      onChange={e => setProjectForm({ ...projectForm, code: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono font-semibold border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Client Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Municipal Authority"
                      value={projectForm.client}
                      onChange={e => setProjectForm({ ...projectForm, client: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Primary Site</label>
                    <select
                      value={projectForm.siteId}
                      onChange={e => setProjectForm({ ...projectForm, siteId: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                    >
                      <option value="">-- No primary site --</option>
                      {localSites.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={projectForm.startDate}
                      onChange={e => setProjectForm({ ...projectForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Status</label>
                    <select
                      value={projectForm.status}
                      onChange={e => setProjectForm({ ...projectForm, status: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                    >
                      <option value="active">Active / Ongoing</option>
                      <option value="planning">Planning</option>
                      <option value="on-hold">On Hold</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-semibold bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Create Project</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
