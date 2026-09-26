import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FileText,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  Upload,
  Download,
  AlertCircle,
  Save,
  Send,
  Eye,
  Search,
  X,
  MessageSquare,
  History,
  Printer,
  Calendar,
  Clock,
  Briefcase,
  UserCheck,
  UserX,
  Plus,
  Trash2,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Building,
  Check,
  ArrowRight,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { printElement } from '../utils/printElement.ts';

interface DailyWorkerRow {
  employeeId: number;
  employeeCode: string;
  name: string;
  jobTitle: string;
  attendanceStatus: 'Present' | 'Absent' | 'Leave' | 'Off';
  hoursWorked: number;
  overtimeHours: number;
  checkIn: string;
  checkOut: string;
  notes: string;
  status: 'draft' | 'submitted' | 'approved';
}

export default function Timesheets() {
  const [activeTab, setActiveTab] = useState<'daily' | 'board' | 'batches' | 'upload'>('daily');
  
  // Core Entities
  const [batches, setBatches] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Daily Project Timesheet States
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [shiftType, setShiftType] = useState<string>('Day Shift (07:00 - 16:00)');
  const [dailyRoster, setDailyRoster] = useState<DailyWorkerRow[]>([]);
  const [dailyNotes, setDailyNotes] = useState<string>('');
  const [supervisorSignoff, setSupervisorSignoff] = useState<string>('');
  const [isDailyLoading, setIsDailyLoading] = useState(false);
  const [isSavingDaily, setIsSavingDaily] = useState(false);
  const [dailyFeedback, setDailyFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [rosterSearch, setRosterSearch] = useState<string>('');
  const [selectedWorkerToAdd, setSelectedWorkerToAdd] = useState<string>('');
  const [printStatus, setPrintStatus] = useState<string | null>(null);
  const dailyPrintRef = useRef<HTMLDivElement>(null);

  // Daily Dispatch Board States
  const [boardDate, setBoardDate] = useState<string>(todayStr);
  const [dailyStatusBoard, setDailyStatusBoard] = useState<any | null>(null);
  const [isBoardLoading, setIsBoardLoading] = useState(false);

  // Monthly Batches & Review Modal States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUploadSite, setSelectedUploadSite] = useState('');
  const [selectedUploadProject, setSelectedUploadProject] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reviewingBatch, setReviewingBatch] = useState<any | null>(null);
  const [batchDetails, setBatchDetails] = useState<any[]>([]);
  const [batchHistory, setBatchHistory] = useState<any[]>([]);
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const [actionType, setActionType] = useState<'rejected' | 'on-hold' | null>(null);
  const [actionReason, setActionReason] = useState('');

  // 1. Initial Load of Reference Data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = (window as any)._token;
      const headers = { Authorization: `Bearer ${token}` };
      const [batchRes, empRes, siteRes, projRes, assignRes] = await Promise.all([
        fetch('/api/timesheet-batches', { headers }),
        fetch('/api/employees', { headers }),
        fetch('/api/sites', { headers }),
        fetch('/api/projects', { headers }),
        fetch('/api/assignments', { headers })
      ]);
      
      const bData = batchRes.ok ? await batchRes.json() : [];
      const eData = empRes.ok ? await empRes.json() : [];
      const sData = siteRes.ok ? await siteRes.json() : [];
      const pData = projRes.ok ? await projRes.json() : [];
      const aData = assignRes.ok ? await assignRes.json() : [];

      setBatches(bData);
      setEmployees(eData);
      setSites(sData);
      setProjects(pData);
      setAssignments(aData);

      if (pData.length > 0 && !selectedProjectId) {
        setSelectedProjectId(pData[0].id);
      }
    } catch (e) {
      console.error('Error fetching timesheet references:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Fetch Daily Project Dispatch Status Board
  const fetchStatusBoard = async (targetDate: string) => {
    setIsBoardLoading(true);
    try {
      const token = (window as any)._token;
      const res = await fetch(`/api/timesheets/daily-project-status?date=${targetDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDailyStatusBoard(data);
      }
    } catch (err) {
      console.error('Error fetching daily status board:', err);
    } finally {
      setIsBoardLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'board') {
      fetchStatusBoard(boardDate);
    }
  }, [activeTab, boardDate]);

  // 3. Load or Build Daily Roster for Selected Project & Date
  const currentProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  const designatedInCharge = useMemo(() => {
    if (!currentProject) return null;
    if (currentProject.manager) {
      return `${currentProject.manager.firstName} ${currentProject.manager.lastName}`;
    }
    // Check if user is coordinator or manager
    return 'Project Supervisor / Field In-Charge';
  }, [currentProject]);

  useEffect(() => {
    if (currentProject && designatedInCharge) {
      setSupervisorSignoff(designatedInCharge);
    }
  }, [currentProject, designatedInCharge]);

  const loadDailyRoster = async () => {
    if (!selectedProjectId) return;
    setIsDailyLoading(true);
    setDailyFeedback(null);

    try {
      const token = (window as any)._token;
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Fetch existing timesheets recorded for this project and date
      const timesheetRes = await fetch(`/api/timesheets?projectId=${selectedProjectId}&date=${selectedDate}`, { headers });
      const existingTimesheets: any[] = timesheetRes.ok ? await timesheetRes.json() : [];

      // 2. Find employees assigned to this project
      const projectAssignments = assignments.filter(
        a => a.projectId === selectedProjectId && a.status === 'active'
      );

      // Build initial roster list
      const rosterMap = new Map<number, DailyWorkerRow>();

      // A. Populate from existing saved timesheets for this date
      existingTimesheets.forEach((ts: any) => {
        const emp = ts.employee || employees.find(e => e.id === ts.employeeId);
        if (emp) {
          rosterMap.set(emp.id, {
            employeeId: emp.id,
            employeeCode: emp.employeeId || `EMP-${emp.id}`,
            name: `${emp.firstName} ${emp.lastName}`,
            jobTitle: emp.jobTitle || 'Technician',
            attendanceStatus: ts.attendanceStatus || 'Present',
            hoursWorked: ts.hoursWorked !== undefined ? ts.hoursWorked : 8,
            overtimeHours: ts.overtimeHours || 0,
            checkIn: ts.checkIn || '07:00',
            checkOut: ts.checkOut || '16:00',
            notes: ts.notes || '',
            status: ts.status || 'submitted',
          });
        }
      });

      // B. Merge assigned employees who don't have records yet
      projectAssignments.forEach((assign: any) => {
        const empId = assign.employeeId;
        if (!rosterMap.has(empId)) {
          const emp = assign.employee || employees.find(e => e.id === empId);
          if (emp) {
            rosterMap.set(empId, {
              employeeId: emp.id,
              employeeCode: emp.employeeId || `EMP-${emp.id}`,
              name: `${emp.firstName} ${emp.lastName}`,
              jobTitle: assign.role || emp.jobTitle || 'Field Specialist',
              attendanceStatus: 'Present',
              hoursWorked: 8,
              overtimeHours: 0,
              checkIn: '07:00',
              checkOut: '16:00',
              notes: '',
              status: 'draft',
            });
          }
        }
      });

      // C. If still zero workers, provide initial staff from directory
      if (rosterMap.size === 0 && employees.length > 0) {
        employees.slice(0, 6).forEach((emp: any) => {
          rosterMap.set(emp.id, {
            employeeId: emp.id,
            employeeCode: emp.employeeId || `EMP-${emp.id}`,
            name: `${emp.firstName} ${emp.lastName}`,
            jobTitle: emp.jobTitle || 'Craftsman',
            attendanceStatus: 'Present',
            hoursWorked: 8,
            overtimeHours: 0,
            checkIn: '07:00',
            checkOut: '16:00',
            notes: '',
            status: 'draft',
          });
        });
      }

      setDailyRoster(Array.from(rosterMap.values()));
    } catch (err) {
      console.error('Failed to load daily roster:', err);
    } finally {
      setIsDailyLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId && selectedDate) {
      loadDailyRoster();
    }
  }, [selectedProjectId, selectedDate]);

  // Update Worker Field in Daily Roster
  const updateWorker = (index: number, updates: Partial<DailyWorkerRow>) => {
    setDailyRoster(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  // Quick Preset Actions
  const markAllPresent = () => {
    setDailyRoster(prev =>
      prev.map(w => ({
        ...w,
        attendanceStatus: 'Present',
        hoursWorked: 8,
        checkIn: '07:00',
        checkOut: '16:00',
      }))
    );
  };

  const applyDayShift = () => {
    setDailyRoster(prev =>
      prev.map(w => ({
        ...w,
        checkIn: '07:00',
        checkOut: '16:00',
        hoursWorked: w.attendanceStatus === 'Present' ? 8 : 0,
      }))
    );
  };

  const handleAddWorkerToRoster = () => {
    if (!selectedWorkerToAdd) return;
    const empId = parseInt(selectedWorkerToAdd);
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;

    if (dailyRoster.some(w => w.employeeId === empId)) {
      setDailyFeedback({ type: 'error', message: 'Employee is already on the project roster for today.' });
      return;
    }

    setDailyRoster(prev => [
      ...prev,
      {
        employeeId: emp.id,
        employeeCode: emp.employeeId || `EMP-${emp.id}`,
        name: `${emp.firstName} ${emp.lastName}`,
        jobTitle: emp.jobTitle || 'Technician',
        attendanceStatus: 'Present',
        hoursWorked: 8,
        overtimeHours: 0,
        checkIn: '07:00',
        checkOut: '16:00',
        notes: 'Added to site team',
        status: 'draft',
      }
    ]);
    setSelectedWorkerToAdd('');
  };

  const removeWorkerFromRoster = (empId: number) => {
    setDailyRoster(prev => prev.filter(w => w.employeeId !== empId));
  };

  // Save or Submit Daily Project Timesheet
  const handleSaveOrSubmitDaily = async (targetStatus: 'draft' | 'submitted') => {
    if (!selectedProjectId || dailyRoster.length === 0) return;
    setIsSavingDaily(true);
    setDailyFeedback(null);

    try {
      const token = (window as any)._token;
      const recordsToUpsert = dailyRoster.map(w => ({
        employeeId: w.employeeId,
        projectId: selectedProjectId,
        date: selectedDate,
        attendanceStatus: w.attendanceStatus,
        hoursWorked: w.attendanceStatus === 'Present' ? w.hoursWorked : 0,
        overtimeHours: w.attendanceStatus === 'Present' ? w.overtimeHours : 0,
        checkIn: w.checkIn,
        checkOut: w.checkOut,
        notes: w.notes ? `${w.notes} · In-Charge: ${supervisorSignoff}` : `In-Charge: ${supervisorSignoff}`,
        status: targetStatus,
      }));

      const res = await fetch('/api/timesheets/bulk-upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ records: recordsToUpsert })
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      setDailyRoster(prev => prev.map(w => ({ ...w, status: targetStatus })));

      // Audit Log
      fetch('/api/audit-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: targetStatus === 'submitted' ? 'SUBMIT' : 'SAVE_DRAFT',
          entity: 'DAILY_PROJECT_TIMESHEET',
          details: {
            projectId: selectedProjectId,
            projectName: currentProject?.name,
            date: selectedDate,
            workersCount: dailyRoster.length,
            inCharge: supervisorSignoff,
          }
        })
      }).catch(console.error);

      setDailyFeedback({
        type: 'success',
        message: targetStatus === 'submitted'
          ? `Daily timesheet for ${currentProject?.name} successfully submitted to Operations & HR for ${selectedDate}!`
          : `Daily draft saved with ${dailyRoster.length} workers.`
      });

      // Refresh batches & board
      fetchData();
      if (boardDate === selectedDate) {
        fetchStatusBoard(boardDate);
      }
    } catch (err: any) {
      console.error('Error saving daily timesheet:', err);
      setDailyFeedback({ type: 'error', message: err.message || 'Failed to save daily timesheet.' });
    } finally {
      setIsSavingDaily(false);
    }
  };

  // Direct Print of Daily Project Timesheet
  const handlePrintDailyTimesheet = () => {
    if (!dailyPrintRef.current) return;
    setPrintStatus('Opening Printer...');
    printElement(dailyPrintRef.current, `Daily_Timesheet_${currentProject?.code || 'PRJ'}_${selectedDate}`);
    setTimeout(() => {
      setPrintStatus('Print Dialog Ready');
      setTimeout(() => setPrintStatus(null), 2500);
    }, 400);
  };

  // Calculations for Daily Roster
  const filteredRoster = useMemo(() => {
    if (!rosterSearch) return dailyRoster;
    const q = rosterSearch.toLowerCase();
    return dailyRoster.filter(
      w => w.name.toLowerCase().includes(q) || w.employeeCode.toLowerCase().includes(q) || w.jobTitle.toLowerCase().includes(q)
    );
  }, [dailyRoster, rosterSearch]);

  const dailyStats = useMemo(() => {
    const total = dailyRoster.length;
    const present = dailyRoster.filter(w => w.attendanceStatus === 'Present').length;
    const absent = dailyRoster.filter(w => w.attendanceStatus === 'Absent').length;
    const leave = dailyRoster.filter(w => w.attendanceStatus === 'Leave' || w.attendanceStatus === 'Off').length;
    const regHours = dailyRoster.reduce((sum, w) => sum + (w.attendanceStatus === 'Present' ? (w.hoursWorked || 0) : 0), 0);
    const otHours = dailyRoster.reduce((sum, w) => sum + (w.attendanceStatus === 'Present' ? (w.overtimeHours || 0) : 0), 0);
    const totalHours = regHours + otHours;
    const isAllSubmitted = total > 0 && dailyRoster.every(w => w.status === 'submitted' || w.status === 'approved');
    return { total, present, absent, leave, regHours, otHours, totalHours, isAllSubmitted };
  }, [dailyRoster]);

  // Download CSV template
  const downloadTemplate = async () => {
    try {
      const token = (window as any)._token;
      let url = '/api/timesheets/template-data?';
      if (selectedUploadSite) url += `siteId=${selectedUploadSite}&`;
      if (selectedUploadProject) url += `projectId=${selectedUploadProject}`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
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

  // Handle CSV Upload
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
          
          let hours = parseFloat(val) || 0;
          if (hours > 0) {
            totalHours += hours;
            const dateStr = `${selectedMonth}-${day.toString().padStart(2, '0')}`;
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

  const handleBulkSubmitCsv = async (status: 'draft' | 'submitted') => {
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
      setActiveTab('batches');
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
      
      if (res.ok) setBatchDetails(await res.json());
      if (histRes.ok) setBatchHistory(await histRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsReviewLoading(false);
    }
  };

  const [yearStr, monthStr] = reviewingBatch?.month?.split('-') || [];
  const daysInMonth = yearStr && monthStr ? new Date(parseInt(yearStr), parseInt(monthStr), 0).getDate() : 31;
  const daysArray = Array.from({length: daysInMonth}, (_, i) => i + 1);

  const employeeData = useMemo(() => {
    const map = new Map();
    batchDetails.forEach(detail => {
      const empId = detail.employee?.id;
      if (!map.has(empId)) {
        map.set(empId, {
          id: empId,
          name: `${detail.employee?.firstName} ${detail.employee?.lastName}`,
          records: {},
          total: 0,
        });
      }
      const emp = map.get(empId);
      if (detail.date) {
        const dayStr = detail.date.split('T')[0].split('-')[2];
        const day = parseInt(dayStr, 10);
        emp.records[day] = detail;
        emp.total += (detail.hoursWorked || 0);
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [batchDetails]);

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const filteredBatches = batches.filter(b => 
    (b.site_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (b.project_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.month.includes(searchTerm)
  );

  return (
    <div className="h-full flex flex-col gap-6 relative">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-neutral-950 tracking-tight">
              Project Timesheets & Daily Labor Dispatch
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
              Project-Based
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-1">
            Timesheets are project-based. Each active project must dispatch its daily roster and man-hours certified by the Project In-Charge.
          </p>
        </div>

        {/* Top Navigation Tabs */}
        <div className="flex items-center bg-neutral-100 p-1 rounded-xl self-start md:self-auto border border-neutral-200/60 shadow-2xs">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'daily'
                ? 'bg-white text-neutral-950 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>Daily Project Timesheet</span>
          </button>

          <button
            onClick={() => setActiveTab('board')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'board'
                ? 'bg-white text-neutral-950 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>All Projects Status</span>
          </button>

          <button
            onClick={() => setActiveTab('batches')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'batches'
                ? 'bg-white text-neutral-950 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-600" />
            <span>Monthly Archive</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'upload'
                ? 'bg-white text-neutral-950 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Upload className="w-4 h-4 text-blue-600" />
            <span>Bulk CSV</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DAILY PROJECT TIMESHEET (CORE WORKFLOW) */}
      {activeTab === 'daily' && (
        <div className="flex flex-col gap-6">
          {/* Top Control Bar: Project Selection, Responsible In-Charge, Date */}
          <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-5 flex flex-col lg:flex-row justify-between lg:items-center gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
              {/* Project Dropdown */}
              <div className="flex-1 min-w-[240px]">
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                  Select Project
                </label>
                <select
                  value={selectedProjectId || ''}
                  onChange={(e) => setSelectedProjectId(parseInt(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 cursor-pointer"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.code ? `(${p.code})` : ''} • {p.client || 'Client'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Selector */}
              <div className="w-full sm:w-48">
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  Timesheet Date
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={selectedDate}
                    max={todayStr}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 cursor-pointer"
                  />
                  {selectedDate !== todayStr && (
                    <button
                      onClick={() => setSelectedDate(todayStr)}
                      className="px-2.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Jump to today"
                    >
                      Today
                    </button>
                  )}
                </div>
              </div>

              {/* Shift Selector */}
              <div className="w-full sm:w-56">
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  Operational Shift
                </label>
                <select
                  value={shiftType}
                  onChange={(e) => setShiftType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 cursor-pointer"
                >
                  <option value="Day Shift (07:00 - 16:00)">Day Shift (07:00 - 16:00)</option>
                  <option value="Night Shift (19:00 - 04:00)">Night Shift (19:00 - 04:00)</option>
                  <option value="Split / Overtime Shift">Split / Overtime Shift</option>
                  <option value="Emergency Maintenance Shift">Emergency Maintenance Shift</option>
                </select>
              </div>
            </div>

            {/* In-Charge Details Box */}
            <div className="bg-neutral-50 border border-neutral-200/80 rounded-xl p-3.5 sm:min-w-[280px] shrink-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block">
                Responsible Project In-Charge
              </span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white font-bold text-xs flex items-center justify-center">
                  PM
                </div>
                <div className="truncate">
                  <span className="font-bold text-sm text-neutral-900 block truncate">
                    {designatedInCharge}
                  </span>
                  <span className="text-[11px] text-neutral-500 block truncate">
                    {currentProject?.client ? `Client: ${currentProject.client}` : 'Operations Lead'} • {currentProject?.location || 'Site Location'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Snapshot Cards for this Project & Date */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Total Roster
              </span>
              <span className="text-xl font-black text-neutral-900 mt-1 block">
                {dailyStats.total} Workers
              </span>
              <span className="text-[10px] text-neutral-500 mt-0.5 block">Allocated to site</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Present On Site
              </span>
              <span className="text-xl font-black text-emerald-600 mt-1 block">
                {dailyStats.present} Present
              </span>
              <span className="text-[10px] text-emerald-700 mt-0.5 block">Active today</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Absent / Leave
              </span>
              <span className="text-xl font-black text-rose-600 mt-1 block">
                {dailyStats.absent + dailyStats.leave}
              </span>
              <span className="text-[10px] text-rose-700 mt-0.5 block">{dailyStats.absent} absent · {dailyStats.leave} leave</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Regular Hours
              </span>
              <span className="text-xl font-black text-blue-600 mt-1 block font-mono">
                {dailyStats.regHours} hrs
              </span>
              <span className="text-[10px] text-neutral-500 mt-0.5 block">Base man-hours</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Overtime Hours
              </span>
              <span className="text-xl font-black text-purple-600 mt-1 block font-mono">
                {dailyStats.otHours} hrs
              </span>
              <span className="text-[10px] text-neutral-500 mt-0.5 block">Extended work</span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Daily Status
              </span>
              <div className="mt-1">
                {dailyStats.isAllSubmitted ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                    <CheckCircle className="w-3 h-3" /> Submitted
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[11px] font-bold">
                    <Clock className="w-3 h-3" /> Pending
                  </span>
                )}
              </div>
              <span className="text-[10px] text-neutral-400 mt-0.5 block">For {selectedDate}</span>
            </div>
          </div>

          {/* Feedback Banner */}
          {dailyFeedback && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between text-xs sm:text-sm font-medium ${
                dailyFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border-rose-200'
              }`}
            >
              <span>{dailyFeedback.message}</span>
              <button onClick={() => setDailyFeedback(null)} className="p-1 hover:opacity-70 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Daily Roster Management Container */}
          <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-sm overflow-hidden flex flex-col">
            {/* Roster Action Topbar */}
            <div className="p-4 sm:p-5 border-b border-neutral-200/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-neutral-50/50">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={markAllPresent}
                  type="button"
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Mark All Present (8h)
                </button>

                <button
                  onClick={applyDayShift}
                  type="button"
                  className="px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5 text-neutral-500" />
                  Standard Shift (07:00-16:00)
                </button>

                <button
                  onClick={handlePrintDailyTimesheet}
                  type="button"
                  className="px-3.5 py-1.5 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Print official daily project timesheet directly to printer"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{printStatus || 'Print Daily Timesheet'}</span>
                </button>
              </div>

              {/* Quick Search & Add Worker */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Filter roster..."
                    value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <select
                    value={selectedWorkerToAdd}
                    onChange={(e) => setSelectedWorkerToAdd(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    <option value="">+ Add employee to project...</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.firstName} {e.lastName} ({e.employeeId || e.id}) - {e.jobTitle || 'Staff'}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddWorkerToRoster}
                    disabled={!selectedWorkerToAdd}
                    type="button"
                    className="p-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 text-white rounded-lg transition-colors cursor-pointer"
                    title="Add to roster"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Roster Table */}
            {isDailyLoading ? (
              <div className="p-12 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
              </div>
            ) : filteredRoster.length === 0 ? (
              <div className="p-12 text-center text-neutral-500">
                <UserX className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                <p className="font-semibold text-neutral-800">No workers on the daily roster for this project.</p>
                <p className="text-xs text-neutral-400 mt-1">Use the dropdown above to add workers or check active project assignments.</p>
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-neutral-50/90 text-neutral-500 uppercase font-semibold text-[11px] border-b border-neutral-200">
                    <tr>
                      <th className="px-4 py-3 min-w-[180px]">Worker & Badge</th>
                      <th className="px-4 py-3 min-w-[210px]">Attendance Status</th>
                      <th className="px-3 py-3 w-24 text-center">Regular (h)</th>
                      <th className="px-3 py-3 w-24 text-center">Overtime (h)</th>
                      <th className="px-3 py-3 w-28 text-center">In / Out</th>
                      <th className="px-4 py-3 min-w-[200px]">Site Work Notes / Task</th>
                      <th className="px-3 py-3 w-20 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200/80">
                    {filteredRoster.map((worker, idx) => (
                      <tr key={worker.employeeId} className="hover:bg-neutral-50/60 transition-colors">
                        {/* Worker Identity */}
                        <td className="px-4 py-3">
                          <span className="font-bold text-neutral-900 block text-xs">
                            {worker.name}
                          </span>
                          <span className="text-[11px] font-mono text-neutral-500 block">
                            {worker.employeeCode} • {worker.jobTitle}
                          </span>
                        </td>

                        {/* Attendance Status Selector */}
                        <td className="px-4 py-3">
                          <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-100 p-0.5">
                            {(['Present', 'Absent', 'Leave', 'Off'] as const).map(status => {
                              const isActive = worker.attendanceStatus === status;
                              return (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => {
                                    updateWorker(idx, {
                                      attendanceStatus: status,
                                      hoursWorked: status === 'Present' ? (worker.hoursWorked || 8) : 0,
                                      overtimeHours: status === 'Present' ? worker.overtimeHours : 0
                                    });
                                  }}
                                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                                    isActive
                                      ? status === 'Present'
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : status === 'Absent'
                                        ? 'bg-rose-600 text-white shadow-xs'
                                        : 'bg-neutral-800 text-white shadow-xs'
                                      : 'text-neutral-600 hover:text-neutral-950'
                                  }`}
                                >
                                  {status}
                                </button>
                              );
                            })}
                          </div>
                        </td>

                        {/* Regular Hours */}
                        <td className="px-3 py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="24"
                            disabled={worker.attendanceStatus !== 'Present'}
                            value={worker.hoursWorked}
                            onChange={(e) => updateWorker(idx, { hoursWorked: parseFloat(e.target.value) || 0 })}
                            className="w-16 px-2 py-1 bg-neutral-50 border border-neutral-200 rounded-md text-center font-mono font-bold text-xs focus:outline-none focus:ring-1 focus:ring-neutral-900 disabled:opacity-40"
                          />
                        </td>

                        {/* Overtime Hours */}
                        <td className="px-3 py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="16"
                            disabled={worker.attendanceStatus !== 'Present'}
                            value={worker.overtimeHours}
                            onChange={(e) => updateWorker(idx, { overtimeHours: parseFloat(e.target.value) || 0 })}
                            className="w-16 px-2 py-1 bg-neutral-50 border border-neutral-200 rounded-md text-center font-mono font-bold text-xs text-purple-700 focus:outline-none focus:ring-1 focus:ring-purple-700 disabled:opacity-40"
                          />
                        </td>

                        {/* In / Out Timings */}
                        <td className="px-3 py-3 text-center">
                          <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-neutral-600">
                            <input
                              type="text"
                              value={worker.checkIn}
                              disabled={worker.attendanceStatus !== 'Present'}
                              onChange={(e) => updateWorker(idx, { checkIn: e.target.value })}
                              className="w-12 text-center bg-transparent border-b border-neutral-300 focus:outline-none focus:border-neutral-900"
                              placeholder="07:00"
                            />
                            <span>-</span>
                            <input
                              type="text"
                              value={worker.checkOut}
                              disabled={worker.attendanceStatus !== 'Present'}
                              onChange={(e) => updateWorker(idx, { checkOut: e.target.value })}
                              className="w-12 text-center bg-transparent border-b border-neutral-300 focus:outline-none focus:border-neutral-900"
                              placeholder="16:00"
                            />
                          </div>
                        </td>

                        {/* Notes / Task Description */}
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            placeholder="Daily task summary (e.g. welding, concrete pour)..."
                            value={worker.notes}
                            onChange={(e) => updateWorker(idx, { notes: e.target.value })}
                            className="w-full px-2.5 py-1 bg-neutral-50 border border-neutral-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-neutral-900"
                          />
                        </td>

                        {/* Remove Action */}
                        <td className="px-3 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeWorkerFromRoster(worker.employeeId)}
                            className="p-1 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Remove from today's roster"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bottom Project Daily Sign-off & Dispatch Bar */}
            <div className="p-4 sm:p-5 bg-neutral-50 border-t border-neutral-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
                <div className="text-xs text-neutral-600 font-medium">
                  Project Sign-off by:
                </div>
                <input
                  type="text"
                  value={supervisorSignoff}
                  onChange={(e) => setSupervisorSignoff(e.target.value)}
                  placeholder="Supervisor / Project In-Charge Name"
                  className="px-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 w-full sm:w-64"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveOrSubmitDaily('draft')}
                  disabled={isSavingDaily || dailyRoster.length === 0}
                  className="px-4 py-2 border border-neutral-300 bg-white hover:bg-neutral-100 disabled:opacity-40 text-neutral-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Draft
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveOrSubmitDaily('submitted')}
                  disabled={isSavingDaily || dailyRoster.length === 0}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  {isSavingDaily ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending Timesheet...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Daily Project Timesheet</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* HIDDEN PRINTABLE DAILY PROJECT TIMESHEET TEMPLATE */}
          <div style={{ display: 'none' }}>
            <div
              ref={dailyPrintRef}
              className="p-8 bg-white text-neutral-950 font-sans"
              style={{ width: '100%', maxWidth: '210mm', minHeight: '297mm' }}
            >
              {/* Header */}
              <div className="border-b-2 border-neutral-900 pb-4 mb-4 flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-black uppercase tracking-tight text-neutral-950">
                    IRMS INDUSTRIAL RESOURCE MANAGEMENT
                  </h1>
                  <p className="text-xs text-neutral-600 font-semibold tracking-wider uppercase">
                    Official Daily Site Labor Dispatch & Timesheet
                  </p>
                </div>
                <div className="text-right text-xs">
                  <span className="font-mono font-bold block text-neutral-900">
                    DOC REF: IRMS-TS-D-{currentProject?.code || 'PRJ'}-{selectedDate}
                  </span>
                  <span className="text-neutral-500 block">Date: {selectedDate}</span>
                </div>
              </div>

              {/* Project Meta Details */}
              <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs">
                <div>
                  <p><strong>Project Name:</strong> {currentProject?.name}</p>
                  <p><strong>Project Code:</strong> {currentProject?.code || 'N/A'}</p>
                  <p><strong>Client:</strong> {currentProject?.client || 'Enterprise Client'}</p>
                </div>
                <div>
                  <p><strong>Site Location:</strong> {currentProject?.location || 'Operational Site'}</p>
                  <p><strong>Project In-Charge:</strong> {supervisorSignoff || designatedInCharge}</p>
                  <p><strong>Shift:</strong> {shiftType}</p>
                </div>
              </div>

              {/* Roster Table */}
              <table className="w-full text-left text-xs border border-neutral-300 rounded mb-4">
                <thead className="bg-neutral-100 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2 border-b w-[25%]">Worker Name</th>
                    <th className="p-2 border-b w-[15%]">Badge ID</th>
                    <th className="p-2 border-b w-[15%]">Trade / Role</th>
                    <th className="p-2 border-b w-[15%] text-center">Status</th>
                    <th className="p-2 border-b w-[10%] text-center">Regular (h)</th>
                    <th className="p-2 border-b w-[10%] text-center">OT (h)</th>
                    <th className="p-2 border-b w-[10%] text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {dailyRoster.map((w) => (
                    <tr key={w.employeeId}>
                      <td className="p-2 font-semibold">{w.name}</td>
                      <td className="p-2 font-mono">{w.employeeCode}</td>
                      <td className="p-2 text-neutral-600">{w.jobTitle}</td>
                      <td className="p-2 text-center font-bold">{w.attendanceStatus}</td>
                      <td className="p-2 text-center font-mono">{w.attendanceStatus === 'Present' ? w.hoursWorked : 0}</td>
                      <td className="p-2 text-center font-mono">{w.attendanceStatus === 'Present' ? w.overtimeHours : 0}</td>
                      <td className="p-2 text-right font-mono font-bold">
                        {w.attendanceStatus === 'Present' ? w.hoursWorked + w.overtimeHours : 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Daily Summary */}
              <div className="grid grid-cols-4 gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded text-xs mb-8">
                <div><span className="text-neutral-500 block">Total Staff:</span><strong>{dailyStats.total} Workers</strong></div>
                <div><span className="text-neutral-500 block">Present On Site:</span><strong>{dailyStats.present} Workers</strong></div>
                <div><span className="text-neutral-500 block">Regular Man-Hours:</span><strong>{dailyStats.regHours} hrs</strong></div>
                <div><span className="text-neutral-500 block">Total Site Hours:</span><strong className="text-indigo-800">{dailyStats.totalHours} hrs</strong></div>
              </div>

              {/* Signatures */}
              <div className="pt-8 border-t-2 border-neutral-300 flex justify-between text-xs text-neutral-600">
                <div>
                  <div className="w-48 border-b border-neutral-400 mb-1"></div>
                  <p className="font-bold text-neutral-900">Project In-Charge Signature</p>
                  <p>{supervisorSignoff || designatedInCharge}</p>
                </div>
                <div className="text-right">
                  <div className="w-48 border-b border-neutral-400 mb-1 ml-auto"></div>
                  <p className="font-bold text-neutral-900">Operations & HR Approval</p>
                  <p>Certified Inspection Stamp</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALL PROJECTS DAILY STATUS BOARD */}
      {activeTab === 'board' && (
        <div className="flex flex-col gap-6">
          {/* Top Board Filter */}
          <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-base font-bold text-neutral-950">
                Daily Project Timesheet Dispatch Board
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Real-time tracking of daily timesheets received from all project sites.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-neutral-600">Audit Date:</label>
              <input
                type="date"
                value={boardDate}
                max={todayStr}
                onChange={(e) => setBoardDate(e.target.value)}
                className="px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 cursor-pointer"
              />
              <button
                onClick={() => fetchStatusBoard(boardDate)}
                className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Refresh Board
              </button>
            </div>
          </div>

          {/* Board KPI Summary */}
          {dailyStatusBoard && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
                  Total Active Projects
                </span>
                <span className="text-2xl font-black text-neutral-900 mt-1 block">
                  {dailyStatusBoard.totalProjects} Projects
                </span>
                <span className="text-[11px] text-neutral-500 mt-0.5 block">Operating today</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
                  Timesheets Dispatched
                </span>
                <span className="text-2xl font-black text-emerald-600 mt-1 block">
                  {dailyStatusBoard.submittedCount} Submitted
                </span>
                <span className="text-[11px] text-emerald-700 mt-0.5 block">Received by Operations</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
                  Pending Dispatch
                </span>
                <span className="text-2xl font-black text-rose-600 mt-1 block">
                  {dailyStatusBoard.pendingCount} Missing
                </span>
                <span className="text-[11px] text-rose-700 mt-0.5 block">Awaiting Project In-Charge</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
                  Compliance Rate
                </span>
                <span className="text-2xl font-black text-indigo-600 mt-1 block font-mono">
                  {dailyStatusBoard.totalProjects > 0
                    ? Math.round((dailyStatusBoard.submittedCount / dailyStatusBoard.totalProjects) * 100)
                    : 100}%
                </span>
                <span className="text-[11px] text-neutral-500 mt-0.5 block">Daily reporting rate</span>
              </div>
            </div>
          )}

          {/* Missing Alert if any */}
          {dailyStatusBoard && dailyStatusBoard.pendingCount > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs sm:text-sm text-amber-900">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>
                  <strong>Daily Dispatch Notice:</strong> {dailyStatusBoard.pendingCount} active project(s) have not sent their daily timesheet for {boardDate}. Project In-Charges must complete and send timesheets before end-of-shift.
                </span>
              </div>
            </div>
          )}

          {/* Project Dispatch Status Grid */}
          {isBoardLoading ? (
            <div className="p-12 flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dailyStatusBoard?.projects?.map((item: any) => {
                const isSubmitted = item.submissionStatus === 'submitted' || item.submissionStatus === 'approved';
                const isMissing = item.submissionStatus === 'missing';
                const managerName = item.project.manager
                  ? `${item.project.manager.firstName} ${item.project.manager.lastName}`
                  : 'Designated Field Supervisor';

                return (
                  <div
                    key={item.project.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isSubmitted
                        ? 'bg-white border-neutral-200/90 shadow-2xs hover:border-neutral-300'
                        : 'bg-amber-50/40 border-amber-200/80 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <span className="text-[11px] font-mono font-bold text-neutral-500 uppercase tracking-wider block">
                          {item.project.code || `PRJ-${item.project.id}`} • {item.project.client || 'Client'}
                        </span>
                        <h3 className="font-bold text-base text-neutral-950 mt-0.5">
                          {item.project.name}
                        </h3>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          isSubmitted
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                        }`}
                      >
                        {isSubmitted ? 'Submitted Today' : 'Missing Today'}
                      </span>
                    </div>

                    <div className="text-xs text-neutral-600 space-y-1 mb-4">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">In-Charge:</span>
                        <strong className="text-neutral-900">{managerName}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Site Location:</span>
                        <span className="text-neutral-700">{item.project.location || 'Active Site'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Workers Recorded:</span>
                        <strong className="text-neutral-900 font-mono">{item.workersCount} Staff ({item.presentCount} Present)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Total Man-Hours:</span>
                        <strong className="text-indigo-700 font-mono">{item.totalManHours} hrs</strong>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                      <span className="text-[11px] text-neutral-400 font-mono">Date: {boardDate}</span>
                      <button
                        onClick={() => {
                          setSelectedProjectId(item.project.id);
                          setSelectedDate(boardDate);
                          setActiveTab('daily');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                      >
                        <span>{isSubmitted ? 'View / Edit Roster' : 'Dispatch Timesheet'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MONTHLY BATCHES ARCHIVE */}
      {activeTab === 'batches' && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-neutral-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-neutral-900 text-base">Monthly Timesheet Batches</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Audit site attendance and verify contractor work hours.</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input 
                type="text" 
                placeholder="Search site, project, or month..." 
                className="pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900 w-full sm:w-64"
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
                    <th className="px-5 py-3 w-28">Period</th>
                    <th className="px-5 py-3">Site / Construction Project</th>
                    <th className="px-5 py-3 w-28 text-center">Workforce</th>
                    <th className="px-5 py-3 w-32 text-center">Total Hours</th>
                    <th className="px-5 py-3 w-32">Status</th>
                    <th className="px-5 py-3 w-36 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredBatches.map(batch => (
                    <tr key={`${batch.month}-${batch.site_id}-${batch.project_id}`} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-xs text-neutral-900">
                        {batch.month}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-neutral-950 block">{batch.site_name || 'All Operating Sites'}</span>
                        <span className="text-xs text-neutral-500 mt-0.5 block">{batch.project_name || 'General Enterprise Project'}</span>
                      </td>
                      <td className="px-5 py-4 text-center font-bold text-neutral-800">
                        {batch.employee_count || 0} Staff
                      </td>
                      <td className="px-5 py-4 text-center font-mono font-bold text-indigo-700">
                        {batch.total_hours || 0} hrs
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${
                          batch.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : batch.status === 'rejected'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {batch.status || 'Pending Review'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => openReviewModal(batch)}
                          className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                        >
                          Audit & Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-neutral-500">
              <FileSpreadsheet className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="font-semibold text-neutral-800">No monthly timesheet batches recorded.</p>
              <p className="text-xs text-neutral-400 mt-1">Submit daily timesheets from active projects or upload a batch via CSV.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: BULK CSV UPLOAD */}
      {activeTab === 'upload' && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 max-w-2xl mx-auto flex flex-col gap-6">
          <div>
            <h3 className="font-bold text-neutral-900 text-lg">Bulk Upload Monthly Timesheet</h3>
            <p className="text-xs text-neutral-500 mt-1">
              Select project, download the pre-populated CSV template, fill worker hours, and upload for processing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1.5">Project Scope</label>
              <select
                value={selectedUploadProject}
                onChange={(e) => setSelectedUploadProject(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-neutral-900"
              >
                <option value="">All Active Projects</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1.5">Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
          </div>

          <button
            onClick={downloadTemplate}
            className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-neutral-600" />
            Download Pre-Populated CSV Template
          </button>

          <div className="border-2 border-dashed border-neutral-300 rounded-2xl p-8 text-center bg-neutral-50/50">
            <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-neutral-800">Select Completed CSV File</p>
            <p className="text-[11px] text-neutral-500 mt-1 mb-4">Accepts standard IRMS timesheet spreadsheet.</p>
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="text-xs text-neutral-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-neutral-900 file:text-white hover:file:bg-neutral-800 cursor-pointer"
            />
          </div>

          {parsedData.length > 0 && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-emerald-900 text-xs block">
                  {parsedData.length} Employee Roster Parsed
                </span>
                <span className="text-[11px] text-emerald-700">
                  Ready to commit to monthly records.
                </span>
              </div>
              <button
                onClick={() => handleBulkSubmitCsv('submitted')}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Upload & Submit
              </button>
            </div>
          )}

          {csvErrors.length > 0 && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
              <strong className="block mb-1">CSV Errors Encountered:</strong>
              {csvErrors.slice(0, 5).map((err, i) => (
                <p key={i}>• {err}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MONTHLY BATCH AUDIT MODAL (PRESERVED) */}
      <AnimatePresence>
        {reviewingBatch && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="p-5 border-b border-neutral-200 flex justify-between items-center bg-neutral-50/80">
                <div>
                  <h3 className="text-base font-bold text-neutral-950">
                    Monthly Timesheet Audit: {reviewingBatch.month}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {reviewingBatch.site_name || 'Operating Site'} • {reviewingBatch.project_name || 'Project'}
                  </p>
                </div>
                <button
                  onClick={() => setReviewingBatch(null)}
                  className="p-2 text-neutral-400 hover:text-neutral-700 rounded-xl cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-6 custom-scrollbar">
                {isReviewLoading ? (
                  <div className="p-12 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : employeeData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
                      <thead className="bg-white sticky top-0 z-10 border-b border-neutral-200 text-neutral-500 font-semibold uppercase text-[10px]">
                        <tr>
                          <th className="px-4 py-3 sticky left-0 bg-white z-20">Employee</th>
                          <th className="px-3 py-3 text-center border-l border-neutral-100">Total (h)</th>
                          {daysArray.map(day => (
                            <th key={day} className="px-1.5 py-3 text-center min-w-[28px]">{day}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {employeeData.map(emp => (
                          <tr key={emp.id} className="hover:bg-neutral-50">
                            <td className="px-4 py-3 sticky left-0 bg-white font-semibold text-neutral-900">
                              {emp.name}
                            </td>
                            <td className="px-4 py-3 font-bold text-indigo-700 text-center border-l border-neutral-100 font-mono">
                              {emp.total}
                            </td>
                            {daysArray.map(day => {
                              const rec = emp.records[day];
                              return (
                                <td key={day} className="px-1 py-2 text-center border-l border-neutral-50">
                                  {rec ? (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-indigo-50 text-indigo-700 font-bold font-mono text-[10px]">
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

              {/* Modal Review Actions */}
              <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex justify-between items-center">
                <div className="text-xs text-neutral-500">
                  Status: <strong className="uppercase text-neutral-900">{reviewingBatch.status}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setReviewingBatch(null)}
                    className="px-4 py-2 border border-neutral-300 bg-white text-neutral-700 rounded-xl text-xs font-bold hover:bg-neutral-100 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleBatchAction(reviewingBatch.month, reviewingBatch.site_id, reviewingBatch.project_id, 'approved')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Approve Batch
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
