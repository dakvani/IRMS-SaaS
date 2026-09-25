import React, { useEffect, useState, useMemo } from 'react';
import {
  Home, Plus, X, Search, MapPin, Building2, Bed, Users, Filter,
  Navigation, CheckCircle2, AlertCircle, Edit, Trash2, ExternalLink,
  Phone, Sparkles, Layers, ArrowRight, UserCheck, Calendar, LogOut,
  Maximize2, Eye, ShieldCheck, Wifi, Wind, Utensils, Shirt, Bus,
  LayoutDashboard, FileDown, Clock, User
} from 'lucide-react';
import AccommodationMap, { calculateDistanceKm } from './accommodations/AccommodationMap.tsx';
import AdmissionsModal from './accommodations/AdmissionsModal.tsx';
import OccupancyDashboard from './accommodations/OccupancyDashboard.tsx';
import MonthlyUtilizationPdfModal from './accommodations/MonthlyUtilizationPdfModal.tsx';
import EmployeeDossierModal from './EmployeeDossierModal.tsx';

export default function Accommodations() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'properties' | 'rooms' | 'admissions' | 'history' | 'map'>('dashboard');
  
  const [accommodations, setAccommodations] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dossier modal state
  const [dossierEmployeeId, setDossierEmployeeId] = useState<number | null>(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [roomAccFilter, setRoomAccFilter] = useState('');
  const [roomStatusFilter, setRoomStatusFilter] = useState('');
  const [admissionStatusFilter, setAdmissionStatusFilter] = useState('');

  // Modals
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<any | null>(null);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any | null>(null);
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [admitInitialAcc, setAdmitInitialAcc] = useState<any | null>(null);
  const [admitInitialRoom, setAdmitInitialRoom] = useState<any | null>(null);

  // PDF Report Modal
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfInitialLocation, setPdfInitialLocation] = useState<string>('');

  // Map state
  const [mapSelectedAccId, setMapSelectedAccId] = useState<number | null>(null);
  const [isMapPicking, setIsMapPicking] = useState(false);

  // Property Form Data
  const initialPropertyForm = {
    name: '',
    type: 'Staff Compound',
    location: '',
    address: '',
    latitude: '',
    longitude: '',
    gpsCoordinates: '',
    roomCapacity: 20,
    perRoomCapacity: 4,
    roomTypes: 'Quad Standard, Double Supervisor',
    totalAdmitCapacity: 80,
    nearSiteId: '',
    nearProjectId: '',
    amenities: 'WiFi, AC, Mess Hall, Laundry, Transport Shuttle, 24/7 Security',
    contactNumber: '',
    status: 'active',
    autoCreateRooms: true,
  };
  const [propertyForm, setPropertyForm] = useState<any>(initialPropertyForm);

  // Room Form Data
  const initialRoomForm = {
    accommodationId: '',
    building: 'Block A',
    floor: '1',
    roomNumber: '',
    roomType: 'Standard',
    capacity: 2,
    status: 'available',
  };
  const [roomForm, setRoomForm] = useState<any>(initialRoomForm);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = (window as any)._token;
      const headers = { Authorization: `Bearer ${token}` };

      const [accRes, roomRes, assignRes, siteRes, projRes, empRes] = await Promise.all([
        fetch('/api/accommodations', { headers }),
        fetch('/api/rooms', { headers }),
        fetch('/api/room-assignments', { headers }),
        fetch('/api/sites', { headers }),
        fetch('/api/projects', { headers }),
        fetch('/api/employees', { headers }),
      ]);

      if (accRes.ok) setAccommodations(await accRes.json());
      if (roomRes.ok) setRooms(await roomRes.json());
      if (assignRes.ok) setAdmissions(await assignRes.json());
      if (siteRes.ok) setSites(await siteRes.json());
      if (projRes.ok) setProjects(await projRes.json());
      if (empRes.ok) setEmployees(await empRes.json());
    } catch (e) {
      console.error('Error fetching accommodation data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Summary Metrics
  const summary = useMemo(() => {
    const totalProperties = accommodations.length;
    const totalCapacity = accommodations.reduce((acc, a) => acc + (a.totalCapacity || a.totalAdmitCapacity || 0), 0);
    const totalOccupied = accommodations.reduce((acc, a) => acc + (a.occupiedBeds || 0), 0);
    const totalAvailable = Math.max(0, totalCapacity - totalOccupied);
    const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;
    const activeAdmissions = admissions.filter((ad) => ad.status === 'active').length;
    const nearCapacityCount = accommodations.filter((a) => {
      const cap = a.totalCapacity || a.totalAdmitCapacity || 0;
      const occ = a.occupiedBeds || 0;
      const rate = cap > 0 ? (occ / cap) * 100 : 0;
      const avail = Math.max(0, cap - occ);
      return cap > 0 && (rate >= 80 || avail <= 3);
    }).length;

    return {
      totalProperties,
      totalCapacity,
      totalOccupied,
      totalAvailable,
      occupancyRate,
      activeAdmissions,
      nearCapacityCount,
    };
  }, [accommodations, admissions]);

  // Unique locations from accommodations
  const uniqueLocations = useMemo(() => {
    return Array.from(new Set(accommodations.map((a) => a.location).filter(Boolean)));
  }, [accommodations]);

  // Filtered Properties
  const filteredAccommodations = useMemo(() => {
    return accommodations.filter((a) => {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        !term ||
        (a.name && a.name.toLowerCase().includes(term)) ||
        (a.location && a.location.toLowerCase().includes(term)) ||
        (a.address && a.address.toLowerCase().includes(term)) ||
        (a.type && a.type.toLowerCase().includes(term));
      const matchType = !typeFilter || a.type === typeFilter;
      const matchLoc = !locationFilter || a.location === locationFilter;
      return matchSearch && matchType && matchLoc;
    });
  }, [accommodations, searchTerm, typeFilter, locationFilter]);

  // Filtered Rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        !term ||
        (r.roomNumber && String(r.roomNumber).toLowerCase().includes(term)) ||
        (r.building && r.building.toLowerCase().includes(term)) ||
        (r.accommodation?.name && r.accommodation.name.toLowerCase().includes(term));
      const matchAcc = !roomAccFilter || String(r.accommodationId) === String(roomAccFilter);
      const matchStatus = !roomStatusFilter || r.status === roomStatusFilter;
      return matchSearch && matchAcc && matchStatus;
    });
  }, [rooms, searchTerm, roomAccFilter, roomStatusFilter]);

  // Filtered Admissions (supports searching employee name, ID, job, department, building, room, campus, work location)
  const filteredAdmissions = useMemo(() => {
    return admissions.filter((adm) => {
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        (adm.employee?.firstName && adm.employee.firstName.toLowerCase().includes(term)) ||
        (adm.employee?.lastName && adm.employee.lastName.toLowerCase().includes(term)) ||
        (adm.employee?.employeeId && adm.employee.employeeId.toLowerCase().includes(term)) ||
        (adm.employee?.jobTitle && adm.employee.jobTitle.toLowerCase().includes(term)) ||
        (adm.employee?.department && adm.employee.department.toLowerCase().includes(term)) ||
        (adm.accommodation?.name && adm.accommodation.name.toLowerCase().includes(term)) ||
        (adm.accommodation?.location && adm.accommodation.location.toLowerCase().includes(term)) ||
        (adm.room?.roomNumber && String(adm.room.roomNumber).toLowerCase().includes(term)) ||
        (adm.room?.building && adm.room.building.toLowerCase().includes(term)) ||
        (adm.workLocation?.siteName && adm.workLocation.siteName.toLowerCase().includes(term)) ||
        (adm.workLocation?.projectName && adm.workLocation.projectName.toLowerCase().includes(term));
      const matchStatus = !admissionStatusFilter || adm.status === admissionStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [admissions, searchTerm, admissionStatusFilter]);

  // Group all admissions by employee to provide complete stay history for every employee
  const employeeStayHistoryMap = useMemo(() => {
    const map = new Map<number, { employee: any; stays: any[]; activeStay: any | null }>();
    admissions.forEach((adm) => {
      const empId = adm.employeeId;
      if (!empId) return;
      if (!map.has(empId)) {
        map.set(empId, {
          employee: adm.employee || employees.find((e) => e.id === empId),
          stays: [],
          activeStay: null,
        });
      }
      const entry = map.get(empId)!;
      entry.stays.push(adm);
      if (adm.status === 'active') {
        entry.activeStay = adm;
      }
    });
    return map;
  }, [admissions, employees]);

  // When searching, find employees matching searchTerm and their full accommodation history
  const matchedEmployeeStays = useMemo(() => {
    if (!searchTerm || searchTerm.trim().length < 2) return [];
    const term = searchTerm.toLowerCase().trim();
    const results: { employee: any; stays: any[]; activeStay: any | null }[] = [];

    employeeStayHistoryMap.forEach((data) => {
      const emp = data.employee;
      const fullName = `${emp?.firstName || ''} ${emp?.lastName || ''}`.toLowerCase();
      const empCode = String(emp?.employeeId || '').toLowerCase();
      const job = String(emp?.jobTitle || '').toLowerCase();
      const dep = String(emp?.department || '').toLowerCase();

      const employeeMatches = fullName.includes(term) || empCode.includes(term) || job.includes(term) || dep.includes(term);
      const stayMatches = data.stays.some(
        (s) =>
          s.accommodation?.name?.toLowerCase().includes(term) ||
          String(s.room?.roomNumber || '').toLowerCase().includes(term) ||
          s.room?.building?.toLowerCase().includes(term) ||
          s.workLocation?.siteName?.toLowerCase().includes(term) ||
          s.workLocation?.projectName?.toLowerCase().includes(term)
      );

      if (employeeMatches || stayMatches) {
        const sortedStays = [...data.stays].sort(
          (a, b) => new Date(b.startDate || b.createdAt).getTime() - new Date(a.startDate || a.createdAt).getTime()
        );
        results.push({
          ...data,
          stays: sortedStays,
        });
      }
    });

    return results;
  }, [employeeStayHistoryMap, searchTerm]);

  // Handlers for Accommodation Property CRUD
  const openAddProperty = () => {
    setEditingProperty(null);
    setPropertyForm(initialPropertyForm);
    setIsPropertyModalOpen(true);
  };

  const openEditProperty = (acc: any) => {
    setEditingProperty(acc);
    setPropertyForm({
      name: acc.name || '',
      type: acc.type || 'Staff Compound',
      location: acc.location || '',
      address: acc.address || '',
      latitude: acc.latitude || '',
      longitude: acc.longitude || '',
      gpsCoordinates: acc.gpsCoordinates || '',
      roomCapacity: acc.roomCapacity || acc.totalRooms || 20,
      perRoomCapacity: acc.perRoomCapacity || 4,
      roomTypes: acc.roomTypes || 'Standard',
      totalAdmitCapacity: acc.totalCapacity || acc.totalAdmitCapacity || 80,
      nearSiteId: acc.nearSiteId ? String(acc.nearSiteId) : '',
      nearProjectId: acc.nearProjectId ? String(acc.nearProjectId) : '',
      amenities: acc.amenities || '',
      contactNumber: acc.contactNumber || '',
      status: acc.status || 'active',
      autoCreateRooms: false,
    });
    setIsPropertyModalOpen(true);
  };

  const handlePropertySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = (window as any)._token;
      const url = editingProperty ? `/api/accommodations/${editingProperty.id}` : '/api/accommodations';
      const method = editingProperty ? 'PUT' : 'POST';

      const payload = { ...propertyForm };
      if (!payload.latitude && payload.gpsCoordinates?.includes(',')) {
        payload.latitude = payload.gpsCoordinates.split(',')[0].trim();
        payload.longitude = payload.gpsCoordinates.split(',')[1].trim();
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save property');
      }

      setIsPropertyModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteProperty = async (id: number) => {
    if (!confirm('Are you sure you want to delete this accommodation property? All rooms will be removed.')) return;
    try {
      const token = (window as any)._token;
      const res = await fetch(`/api/accommodations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete property');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handlers for Room CRUD
  const openAddRoom = (defaultAccId?: number) => {
    setEditingRoom(null);
    setRoomForm({
      ...initialRoomForm,
      accommodationId: defaultAccId ? String(defaultAccId) : accommodations[0]?.id ? String(accommodations[0].id) : '',
    });
    setIsRoomModalOpen(true);
  };

  const openEditRoom = (rm: any) => {
    setEditingRoom(rm);
    setRoomForm({
      accommodationId: String(rm.accommodationId),
      building: rm.building || 'Block A',
      floor: rm.floor || '1',
      roomNumber: rm.roomNumber || '',
      roomType: rm.roomType || 'Standard',
      capacity: rm.capacity || 2,
      status: rm.status || 'available',
    });
    setIsRoomModalOpen(true);
  };

  const handleRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = (window as any)._token;
      const url = editingRoom ? `/api/rooms/${editingRoom.id}` : '/api/rooms';
      const method = editingRoom ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(roomForm),
      });

      if (!res.ok) throw new Error('Failed to save room');
      setIsRoomModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteRoom = async (id: number) => {
    if (!confirm('Are you sure you want to delete this room?')) return;
    try {
      const token = (window as any)._token;
      const res = await fetch(`/api/rooms/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete room');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handlers for Admission Check-out
  const handleCheckoutAdmission = async (admissionId: number) => {
    if (!confirm('Check out this resident and free up their accommodation bed?')) return;
    try {
      const token = (window as any)._token;
      const res = await fetch(`/api/room-assignments/${admissionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          status: 'completed',
          endDate: new Date().toISOString().split('T')[0],
        }),
      });
      if (!res.ok) throw new Error('Failed to check out resident');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openAdmitModal = (acc?: any, room?: any) => {
    setAdmitInitialAcc(acc?.id || null);
    setAdmitInitialRoom(room?.id || null);
    setIsAdmitModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3 text-neutral-400">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Loading accommodations and room inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
                Staff Accommodation
              </h1>
              <p className="text-xs text-neutral-500 font-medium">
                Unified housing campuses, room capacities, employee admissions, and Google Maps geo-explorer.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              setPdfInitialLocation('');
              setIsPdfModalOpen(true);
            }}
            className="bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <FileDown className="w-4 h-4 text-orange-600" />
            Monthly PDF Report
          </button>
          <button
            onClick={() => openAdmitModal()}
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <UserCheck className="w-4 h-4" />
            Admit Employee
          </button>
          <button
            onClick={() => openAddRoom()}
            className="bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Bed className="w-4 h-4 text-neutral-500" />
            Add Room
          </button>
          <button
            onClick={openAddProperty}
            className="bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Accommodation Property
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
              Properties & Camps
            </span>
            <span className="text-2xl font-black text-neutral-900 mt-1 block">
              {summary.totalProperties}
            </span>
            <span className="text-[11px] text-neutral-500 mt-0.5 block">
              Across {uniqueLocations.length} locations
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
              Total Admit Capacity
            </span>
            <span className="text-2xl font-black text-neutral-900 mt-1 block">
              {summary.totalCapacity} <span className="text-xs font-normal text-neutral-400">Beds</span>
            </span>
            <span className="text-[11px] text-neutral-500 mt-0.5 block">
              {rooms.length} configured rooms
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Bed className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
              Current Residents
            </span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">
              {summary.totalOccupied} <span className="text-xs font-normal text-neutral-400">Admitted</span>
            </span>
            <span className="text-[11px] text-neutral-500 mt-0.5 block">
              {summary.occupancyRate}% occupancy rate
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
              Available Vacancies
            </span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">
              {summary.totalAvailable} <span className="text-xs font-normal text-neutral-400">Beds</span>
            </span>
            <span className="text-[11px] text-neutral-500 mt-0.5 block">
              Ready for immediate check-in
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Universal Accommodation & Resident Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200/90 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
            <input
              type="text"
              placeholder="Search anything: Type employee name or ID for full accommodation history, housing campus, room number, or status..."
              className="w-full pl-10 pr-9 py-2 text-xs md:text-sm border border-neutral-200 rounded-xl bg-neutral-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-neutral-900 placeholder:text-neutral-400 transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 p-0.5 rounded-full hover:bg-neutral-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {searchTerm && (
            <div className="flex items-center gap-2 shrink-0 text-xs">
              <span className="font-semibold text-neutral-600">
                Filtered: {filteredAccommodations.length} properties, {filteredRooms.length} rooms, {filteredAdmissions.length} stays
              </span>
              {matchedEmployeeStays.length > 0 && (
                <span className="font-bold text-orange-700 bg-orange-100 px-2.5 py-0.5 rounded-full border border-orange-200">
                  {matchedEmployeeStays.length} employee stay {matchedEmployeeStays.length === 1 ? 'history' : 'histories'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Real-time Employee Accommodation History Match Section */}
        {matchedEmployeeStays.length > 0 && (
          <div className="pt-3 border-t border-neutral-100 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-orange-950 flex items-center gap-1.5">
                <Home className="w-4 h-4 text-orange-600" />
                Employee Accommodation History ({matchedEmployeeStays.length} matching {matchedEmployeeStays.length === 1 ? 'personnel' : 'personnel'})
              </h3>
              <span className="text-[11px] text-neutral-500">
                Showing complete recorded housing history from date employee was added to system
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {matchedEmployeeStays.map(({ employee, stays, activeStay }) => (
                <div
                  key={employee?.id || Math.random()}
                  className="bg-neutral-50/80 border border-orange-200/70 rounded-2xl p-4 shadow-2xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200/70">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                        {employee?.firstName?.[0] || 'E'}{employee?.lastName?.[0] || ''}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-neutral-900">
                            {employee?.firstName} {employee?.lastName}
                          </span>
                          <span className="font-mono text-xs font-semibold text-neutral-600 bg-white px-2 py-0.5 rounded-md border border-neutral-200">
                            {employee?.employeeId}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            activeStay ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-neutral-200 text-neutral-700'
                          }`}>
                            {activeStay ? 'Active Resident' : 'Past Resident / Checked Out'}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {employee?.jobTitle || 'Technician'} • {employee?.department || 'Operations'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setDossierEmployeeId(employee.id);
                          setIsDossierOpen(true);
                        }}
                        className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <User className="w-3.5 h-3.5" /> View Full 360° Dossier
                      </button>
                    </div>
                  </div>

                  {/* Stays Timeline / Table */}
                  <div>
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      Accommodation Stays Timeline ({stays.length} recorded {stays.length === 1 ? 'stay' : 'stays'})
                    </h5>
                    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[10px] font-semibold">
                          <tr>
                            <th className="px-3.5 py-2">Housing Campus</th>
                            <th className="px-3.5 py-2">Room / Bed</th>
                            <th className="px-3.5 py-2">Assigned Work Site</th>
                            <th className="px-3.5 py-2">Check-in Date</th>
                            <th className="px-3.5 py-2">Checkout Date</th>
                            <th className="px-3.5 py-2">Stay Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {stays.map((st: any) => {
                            const isCurrent = st.status === 'active';
                            return (
                              <tr key={st.id} className="hover:bg-neutral-50/50">
                                <td className="px-3.5 py-2.5">
                                  <span className="font-bold text-neutral-900 block">{st.accommodation?.name || 'Compound'}</span>
                                  <span className="text-[10px] text-neutral-400">{st.accommodation?.location}</span>
                                </td>
                                <td className="px-3.5 py-2.5">
                                  <span className="font-semibold text-neutral-800">
                                    Room {st.room?.roomNumber} ({st.room?.building || 'Main'})
                                  </span>
                                </td>
                                <td className="px-3.5 py-2.5 text-neutral-600">
                                  {st.workLocation?.siteName || st.workLocation?.projectName || 'General Operations'}
                                </td>
                                <td className="px-3.5 py-2.5 text-neutral-800 font-medium">
                                  {st.startDate ? new Date(st.startDate).toLocaleDateString() : '-'}
                                </td>
                                <td className="px-3.5 py-2.5 text-neutral-600">
                                  {st.endDate ? new Date(st.endDate).toLocaleDateString() : (isCurrent ? 'Present / Active' : '-')}
                                </td>
                                <td className="px-3.5 py-2.5">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isCurrent ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'
                                  }`}>
                                    {isCurrent ? 'Checked In' : 'Checked Out'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-2 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs tracking-tight transition-all shrink-0 ${
            activeTab === 'dashboard'
              ? 'bg-neutral-900 text-white shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 text-orange-400" />
          Occupancy Dashboard
          {summary.nearCapacityCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1 animate-pulse">
              {summary.nearCapacityCount} Alert
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('properties')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs tracking-tight transition-all shrink-0 ${
            activeTab === 'properties'
              ? 'bg-neutral-900 text-white shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Properties & Campuses ({accommodations.length})
        </button>

        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs tracking-tight transition-all shrink-0 ${
            activeTab === 'rooms'
              ? 'bg-neutral-900 text-white shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <Bed className="w-4 h-4" />
          Room Inventory ({rooms.length})
        </button>

        <button
          onClick={() => setActiveTab('admissions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs tracking-tight transition-all shrink-0 ${
            activeTab === 'admissions'
              ? 'bg-neutral-900 text-white shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Employee Admissions & Stays ({summary.activeAdmissions})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs tracking-tight transition-all shrink-0 ${
            activeTab === 'history'
              ? 'bg-neutral-900 text-white shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <Clock className="w-4 h-4 text-orange-400" />
          Resident Stay History ({admissions.length})
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs tracking-tight transition-all shrink-0 ${
            activeTab === 'map'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Google Map Geo-Explorer
          <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1">
            Live
          </span>
        </button>
      </div>

      {/* TAB 0: OCCUPANCY DASHBOARD */}
      {activeTab === 'dashboard' && (
        <OccupancyDashboard
          accommodations={accommodations}
          rooms={rooms}
          admissions={admissions}
          sites={sites}
          projects={projects}
          onAdmitStaff={(acc) => openAdmitModal(acc)}
          onViewRooms={(accId) => {
            setRoomAccFilter(String(accId));
            setActiveTab('rooms');
          }}
          onOpenPdfReport={(loc) => {
            setPdfInitialLocation(loc || '');
            setIsPdfModalOpen(true);
          }}
        />
      )}

      {/* TAB 1: PROPERTIES & CAMPUSES */}
      {activeTab === 'properties' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-sm">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
              <input
                type="text"
                placeholder="Search properties, locations, types..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-neutral-200 rounded-xl bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
              <select
                className="text-xs px-3 py-2 border border-neutral-200 rounded-xl bg-white text-neutral-700"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All Housing Types</option>
                <option value="Staff Compound">Staff Compound</option>
                <option value="Apartment Complex">Apartment Complex</option>
                <option value="Villa / House">Villa / House</option>
                <option value="Modular Camp">Modular Camp</option>
                <option value="Hotel / Guesthouse">Hotel / Guesthouse</option>
                <option value="Dormitory">Dormitory</option>
              </select>

              <select
                className="text-xs px-3 py-2 border border-neutral-200 rounded-xl bg-white text-neutral-700"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                <option value="">All Locations / Areas</option>
                {uniqueLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>

              {(searchTerm || typeFilter || locationFilter) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setTypeFilter('');
                    setLocationFilter('');
                  }}
                  className="text-xs text-neutral-500 hover:text-neutral-900 underline px-2"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAccommodations.map((acc) => {
              const cap = acc.totalCapacity || acc.totalAdmitCapacity || 0;
              const occ = acc.occupiedBeds || 0;
              const avail = acc.availableBeds ?? Math.max(0, cap - occ);
              const occPercent = cap > 0 ? Math.round((occ / cap) * 100) : 0;

              return (
                <div
                  key={acc.id}
                  className="bg-white rounded-2xl border border-neutral-200/90 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Type and Status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide uppercase bg-orange-50 text-orange-700 border border-orange-200">
                        {acc.type || 'Staff Housing'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          acc.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {acc.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-neutral-900 text-base tracking-tight mb-1">
                      {acc.name}
                    </h3>

                    {/* Location Badge (Supports any area created for the first time) */}
                    <div className="flex items-start gap-1.5 text-xs text-neutral-500 mb-3">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-neutral-700">
                          {acc.location || 'Any Regional Location'}
                        </span>
                        {acc.address && <p className="text-[11px] text-neutral-400 mt-0.5">{acc.address}</p>}
                      </div>
                    </div>

                    {/* Capacity Specs Card */}
                    <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 space-y-2 mb-4">
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="border-r border-neutral-200 pr-1">
                          <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Rooms</span>
                          <span className="font-bold text-neutral-800">{acc.roomsCount || acc.totalRooms || 0}</span>
                        </div>
                        <div className="border-r border-neutral-200 pr-1">
                          <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Beds/Room</span>
                          <span className="font-bold text-neutral-800">{acc.perRoomCapacity || 4} Beds</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Admit Cap</span>
                          <span className="font-bold text-neutral-900">{cap} Beds</span>
                        </div>
                      </div>

                      {/* Capacity Progress Bar */}
                      <div>
                        <div className="flex justify-between text-[11px] font-medium text-neutral-600 mb-1">
                          <span>Occupancy</span>
                          <span>{occ} / {cap} Beds ({occPercent}%)</span>
                        </div>
                        <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              occPercent > 90
                                ? 'bg-red-500'
                                : occPercent > 70
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, occPercent)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
                          <span className="text-emerald-700 font-semibold">{avail} Available Beds</span>
                          <span>Room Types: {acc.roomTypes || 'Standard'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Nearest Site / Project Linkage */}
                    {acc.nearSiteName && (
                      <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50/70 border border-blue-100 p-2 rounded-lg mb-3">
                        <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate">
                          Nearest Site: <strong>{acc.nearSiteName}</strong>
                        </span>
                      </div>
                    )}

                    {/* Amenities Badges */}
                    {acc.amenities && (
                      <div className="flex flex-wrap gap-1 text-[10px] text-neutral-600 mb-4">
                        {acc.amenities.split(',').map((am: string, i: number) => (
                          <span key={i} className="bg-neutral-100 px-2 py-0.5 rounded-md font-medium">
                            {am.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openAdmitModal(acc)}
                        className="bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-colors"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Admit Staff
                      </button>
                      <button
                        onClick={() => {
                          setMapSelectedAccId(acc.id);
                          setActiveTab('map');
                        }}
                        className="text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                        title="View on Google Map"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        Map
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openAddRoom(acc.id)}
                        className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg"
                        title="Add Room to this Facility"
                      >
                        <Bed className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditProperty(acc)}
                        className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg"
                        title="Edit Property"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProperty(acc.id)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete Property"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredAccommodations.length === 0 && (
              <div className="col-span-full p-12 text-center border-2 border-dashed border-neutral-200 rounded-3xl bg-white">
                <Home className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                <h4 className="font-bold text-neutral-800 text-base">No Accommodation Properties Found</h4>
                <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1 mb-4">
                  Add accommodation properties in any location, define types, room counts, and total admit capacity.
                </p>
                <button
                  onClick={openAddProperty}
                  className="bg-neutral-900 text-white text-xs font-semibold px-4 py-2 rounded-xl inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Property in Any Location
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ROOM INVENTORY */}
      {activeTab === 'rooms' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-sm">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
              <input
                type="text"
                placeholder="Search rooms, buildings, campuses..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-neutral-200 rounded-xl bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
              <select
                className="text-xs px-3 py-2 border border-neutral-200 rounded-xl bg-white text-neutral-700"
                value={roomAccFilter}
                onChange={(e) => setRoomAccFilter(e.target.value)}
              >
                <option value="">All Facilities</option>
                {accommodations.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>

              <select
                className="text-xs px-3 py-2 border border-neutral-200 rounded-xl bg-white text-neutral-700"
                value={roomStatusFilter}
                onChange={(e) => setRoomStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
              </select>

              <button
                onClick={() => openAddRoom()}
                className="bg-neutral-900 hover:bg-neutral-800 text-white px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Room
              </button>
            </div>
          </div>

          {/* Rooms Table */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-6 py-3.5">Facility / Campus</th>
                    <th className="px-6 py-3.5">Building & Floor</th>
                    <th className="px-6 py-3.5">Room #</th>
                    <th className="px-6 py-3.5">Type</th>
                    <th className="px-6 py-3.5">Bed Capacity & Vacancy</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredRooms.map((r) => {
                    const occ = r.occupiedBeds || 0;
                    const avail = r.availableBeds ?? Math.max(0, r.capacity - occ);
                    const isFull = avail === 0;

                    return (
                      <tr key={r.id} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-bold text-neutral-900 block">{r.accommodation?.name || 'Facility'}</span>
                          <span className="text-[11px] text-neutral-400">{r.accommodation?.location || '-'}</span>
                        </td>
                        <td className="px-6 py-4 text-neutral-600 font-medium">
                          {r.building || 'Block A'} {r.floor ? `/ Fl ${r.floor}` : ''}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-neutral-900 flex items-center gap-1.5">
                            <Bed className="w-3.5 h-3.5 text-neutral-400" />
                            {r.roomNumber}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-neutral-700">
                          <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 font-medium text-[11px]">
                            {r.roomType || 'Standard'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-neutral-900">{r.capacity} Beds</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                isFull
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isFull ? 'Full (0 free)' : `${avail} beds vacant`}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              isFull
                                ? 'bg-neutral-100 text-neutral-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {isFull ? 'Occupied' : 'Available'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isFull && (
                              <button
                                onClick={() => openAdmitModal({ id: r.accommodationId }, r)}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-lg font-semibold text-[11px] flex items-center gap-1"
                                title="Admit employee into this room"
                              >
                                <UserCheck className="w-3 h-3" /> Admit
                              </button>
                            )}
                            <button
                              onClick={() => openEditRoom(r)}
                              className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg"
                              title="Edit Room"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRoom(r.id)}
                              className="p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete Room"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredRooms.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-neutral-400">
                        No rooms found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EMPLOYEE ADMISSIONS & STAYS */}
      {activeTab === 'admissions' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-sm">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
              <input
                type="text"
                placeholder="Search admitted employees, badge #, property..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-neutral-200 rounded-xl bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
              <select
                className="text-xs px-3 py-2 border border-neutral-200 rounded-xl bg-white text-neutral-700"
                value={admissionStatusFilter}
                onChange={(e) => setAdmissionStatusFilter(e.target.value)}
              >
                <option value="">All Stay Statuses</option>
                <option value="active">Active Residents (Checked-In)</option>
                <option value="completed">Past Residents (Checked-Out)</option>
              </select>

              <button
                onClick={() => openAdmitModal()}
                className="bg-neutral-900 hover:bg-neutral-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <UserCheck className="w-4 h-4" /> Admit Employee
              </button>
            </div>
          </div>

          {/* Admissions Roster Table */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-6 py-3.5">Resident Employee</th>
                    <th className="px-6 py-3.5">Assigned Work Site / Project</th>
                    <th className="px-6 py-3.5">Housing Property & Room</th>
                    <th className="px-6 py-3.5">Check-in Date</th>
                    <th className="px-6 py-3.5">Checkout / Duration</th>
                    <th className="px-6 py-3.5">Stay Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredAdmissions.map((adm) => {
                    const isActive = adm.status === 'active';
                    const workLoc = adm.workLocation?.siteName || adm.workLocation?.projectName || 'General Operations';

                    return (
                      <tr key={adm.id} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-neutral-200 text-neutral-700 font-bold flex items-center justify-center text-xs">
                              {adm.employee?.firstName?.[0] || 'E'}
                            </div>
                            <div>
                              <span className="font-bold text-neutral-900 block">
                                {adm.employee?.firstName} {adm.employee?.lastName}
                              </span>
                              <span className="text-[11px] text-neutral-400">
                                {adm.employee?.employeeId || `EMP-${adm.employeeId}`} • {adm.employee?.jobTitle || 'Technician'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-blue-700">
                            <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span className="font-semibold">{workLoc}</span>
                          </div>
                          <span className="text-[10px] text-neutral-400 block mt-0.5">
                            Admitted near site location
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-bold text-neutral-900 block">{adm.accommodation?.name || 'Housing'}</span>
                          <span className="text-[11px] text-neutral-500 flex items-center gap-1 mt-0.5">
                            <Bed className="w-3 h-3 text-neutral-400" />
                            Room {adm.room?.roomNumber} ({adm.room?.building || 'Main'} {adm.room?.floor ? `/ Fl ${adm.room.floor}` : ''})
                          </span>
                        </td>

                        <td className="px-6 py-4 text-neutral-700 font-medium">
                          {adm.startDate ? new Date(adm.startDate).toLocaleDateString() : '-'}
                        </td>

                        <td className="px-6 py-4 text-neutral-600">
                          {adm.endDate ? new Date(adm.endDate).toLocaleDateString() : 'Ongoing / Active'}
                          {adm.notes && <p className="text-[10px] text-neutral-400 italic mt-0.5">{adm.notes}</p>}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              isActive
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-neutral-100 text-neutral-600'
                            }`}
                          >
                            {isActive ? 'Checked In' : 'Checked Out'}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setDossierEmployeeId(adm.employeeId);
                                setIsDossierOpen(true);
                              }}
                              className="text-xs font-semibold px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-800 rounded-lg transition-colors inline-flex items-center gap-1 border border-orange-200"
                              title="View full accommodation stay history & employee dossier"
                            >
                              <Clock className="w-3 h-3 text-orange-600" /> Stay History
                            </button>
                            {isActive && (
                              <button
                                onClick={() => handleCheckoutAdmission(adm.id)}
                                className="text-xs font-semibold px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition-colors inline-flex items-center gap-1"
                                title="Check out employee"
                              >
                                <LogOut className="w-3 h-3" /> Check Out
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredAdmissions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-neutral-400">
                        No admissions found. Use "Admit Employee" to assign housing to site personnel.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COMPLETE RESIDENT STAY HISTORY & TIMELINES */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Comprehensive Resident Stay History Directory
                </h3>
                <p className="text-xs text-neutral-500">
                  Full chronological records of all personnel housing stays, past compounds, duration, and checkout status.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold px-3 py-1.5 rounded-xl bg-orange-50 text-orange-800 border border-orange-200">
                {admissions.length} Total Admissions Stored
              </span>
              <span className="font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                {summary.activeAdmissions} Currently Active
              </span>
            </div>
          </div>

          {/* Grouped by Employee Stay History Table */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
              <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                All Housing Admissions ({filteredAdmissions.length} records matching)
              </h4>
              <span className="text-[11px] text-neutral-500">
                Click "360° Dossier" on any resident to view their full lifecycle (housing, assets, car, and project assignments)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Employee Resident</th>
                    <th className="px-5 py-3.5">Housing Property</th>
                    <th className="px-5 py-3.5">Room & Building</th>
                    <th className="px-5 py-3.5">Assigned Work Site</th>
                    <th className="px-5 py-3.5">Check-In Date</th>
                    <th className="px-5 py-3.5">Check-Out Date</th>
                    <th className="px-5 py-3.5">Stay Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredAdmissions.map((adm) => {
                    const isActive = adm.status === 'active';
                    return (
                      <tr key={adm.id} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-neutral-200 text-neutral-800 font-bold flex items-center justify-center text-xs">
                              {adm.employee?.firstName?.[0] || 'E'}
                            </div>
                            <div>
                              <span className="font-bold text-neutral-900 block">
                                {adm.employee?.firstName} {adm.employee?.lastName}
                              </span>
                              <span className="text-[11px] text-neutral-400">
                                {adm.employee?.employeeId} • {adm.employee?.jobTitle || 'Technician'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="font-bold text-neutral-900 block">{adm.accommodation?.name || 'Housing'}</span>
                          <span className="text-[10px] text-neutral-400">{adm.accommodation?.location}</span>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-neutral-800">
                            Room {adm.room?.roomNumber} ({adm.room?.building || 'Main'})
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-neutral-600">
                          {adm.workLocation?.siteName || adm.workLocation?.projectName || 'General Operations'}
                        </td>

                        <td className="px-5 py-3.5 text-neutral-700 font-medium">
                          {adm.startDate ? new Date(adm.startDate).toLocaleDateString() : '-'}
                        </td>

                        <td className="px-5 py-3.5 text-neutral-600">
                          {adm.endDate ? new Date(adm.endDate).toLocaleDateString() : (isActive ? 'Active Resident' : '-')}
                        </td>

                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              isActive
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-neutral-100 text-neutral-600'
                            }`}
                          >
                            {isActive ? 'Active' : 'Checked Out'}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => {
                              setDossierEmployeeId(adm.employeeId);
                              setIsDossierOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg transition-colors inline-flex items-center gap-1 shadow-2xs"
                          >
                            <User className="w-3 h-3" /> Full 360° Record
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredAdmissions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-neutral-400">
                        No accommodation stay history matches the search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GOOGLE MAP GEO-EXPLORER */}
      {activeTab === 'map' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-600" />
                Accommodation & Site Proximity Map
              </h2>
              <p className="text-xs text-neutral-500">
                Visualize all accommodation facilities, construction sites, and client projects across regions.
              </p>
            </div>
            <button
              onClick={() => {
                setIsMapPicking(!isMapPicking);
              }}
              className={`text-xs px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-colors ${
                isMapPicking
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              {isMapPicking ? 'Exit Pin Drop Mode' : 'Pin New Property Location'}
            </button>
          </div>

          <AccommodationMap
            accommodations={accommodations}
            sites={sites}
            projects={projects}
            selectedAccommodationId={mapSelectedAccId}
            onSelectAccommodation={(acc) => {
              openEditProperty(acc);
            }}
            onAdmitToAccommodation={(acc) => {
              openAdmitModal(acc);
            }}
            isPickingLocation={isMapPicking}
            onPickCoordinates={(coords) => {
              setPropertyForm((prev: any) => ({
                ...prev,
                latitude: String(coords.lat),
                longitude: String(coords.lng),
                gpsCoordinates: `${coords.lat}, ${coords.lng}`,
              }));
              setIsPropertyModalOpen(true);
              setIsMapPicking(false);
            }}
          />
        </div>
      )}

      {/* ADD / EDIT PROPERTY MODAL */}
      {isPropertyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-2xl w-full p-6 my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
                    {editingProperty ? 'Edit Accommodation Property' : 'New Accommodation Property'}
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Add housing in any area/location with room capacities & admission specs.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPropertyModalOpen(false)}
                className="p-2 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePropertySubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Property Name *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Al-Hamra Waterfront Staff Villas"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-sm bg-white"
                    value={propertyForm.name || ''}
                    onChange={(e) => setPropertyForm({ ...propertyForm, name: e.target.value })}
                  />
                </div>

                {/* Type of Accommodation */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Type of Accommodation *
                  </label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-sm bg-white"
                    value={propertyForm.type || 'Staff Compound'}
                    onChange={(e) => setPropertyForm({ ...propertyForm, type: e.target.value })}
                  >
                    <option value="Staff Compound">Staff Compound</option>
                    <option value="Apartment Complex">Apartment Complex</option>
                    <option value="Villa / House">Villa / House</option>
                    <option value="Modular Camp">Modular Camp</option>
                    <option value="Hotel / Guesthouse">Hotel / Guesthouse</option>
                    <option value="Dormitory">Dormitory</option>
                  </select>
                </div>
              </div>

              {/* Location (Prime requirement: enable adding property in ANY location, not mandatory in project/site location) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Location / Area Name *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Al-Hamra Seafront, Jeddah (Any new area)"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-sm bg-white"
                    value={propertyForm.location || ''}
                    onChange={(e) => setPropertyForm({ ...propertyForm, location: e.target.value })}
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">
                    Can be any area where creating first time (not mandatory to be in a project or site location).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    placeholder="Street, District, City"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-sm bg-white"
                    value={propertyForm.address || ''}
                    onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })}
                  />
                </div>
              </div>

              {/* Capacities: Room Capacity, Per Room Capacity, Total Admit Capacity */}
              <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 block">
                  Capacity & Room Structure
                </span>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      Room Capacity (Rooms) *
                    </label>
                    <input
                      required
                      type="number"
                      min="1"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-sm bg-white"
                      value={propertyForm.roomCapacity || ''}
                      onChange={(e) => {
                        const roomsCount = parseInt(e.target.value) || 0;
                        const perRoom = parseInt(propertyForm.perRoomCapacity) || 4;
                        setPropertyForm({
                          ...propertyForm,
                          roomCapacity: roomsCount,
                          totalAdmitCapacity: roomsCount * perRoom,
                        });
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      Per Room Capacity (Beds) *
                    </label>
                    <input
                      required
                      type="number"
                      min="1"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-sm bg-white"
                      value={propertyForm.perRoomCapacity || ''}
                      onChange={(e) => {
                        const perRoom = parseInt(e.target.value) || 0;
                        const roomsCount = parseInt(propertyForm.roomCapacity) || 0;
                        setPropertyForm({
                          ...propertyForm,
                          perRoomCapacity: perRoom,
                          totalAdmitCapacity: roomsCount * perRoom,
                        });
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      Total Admit Capacity *
                    </label>
                    <input
                      required
                      type="number"
                      min="1"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-sm bg-white font-bold text-neutral-900"
                      value={propertyForm.totalAdmitCapacity || ''}
                      onChange={(e) =>
                        setPropertyForm({ ...propertyForm, totalAdmitCapacity: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    Types of Room
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Single Executive, Double Suite, Quad Staff Dormitory"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-sm bg-white"
                    value={propertyForm.roomTypes || ''}
                    onChange={(e) => setPropertyForm({ ...propertyForm, roomTypes: e.target.value })}
                  />
                </div>
              </div>

              {/* Google Maps Coordinates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Latitude (Google Maps)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 21.5169"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-sm bg-white font-mono"
                    value={propertyForm.latitude || ''}
                    onChange={(e) => setPropertyForm({ ...propertyForm, latitude: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Longitude (Google Maps)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 39.1558"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-sm bg-white font-mono"
                    value={propertyForm.longitude || ''}
                    onChange={(e) => setPropertyForm({ ...propertyForm, longitude: e.target.value })}
                  />
                </div>
              </div>

              {/* Nearby Site / Project Linkage (Optional) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Nearby Construction Site (Optional)
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-sm bg-white"
                    value={propertyForm.nearSiteId || ''}
                    onChange={(e) => setPropertyForm({ ...propertyForm, nearSiteId: e.target.value })}
                  >
                    <option value="">None (Independent location)</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.location || 'Site'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Nearby Project (Optional)
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-sm bg-white"
                    value={propertyForm.nearProjectId || ''}
                    onChange={(e) => setPropertyForm({ ...propertyForm, nearProjectId: e.target.value })}
                  >
                    <option value="">None (Independent location)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Amenities & Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Amenities</label>
                  <input
                    type="text"
                    placeholder="WiFi, AC, Mess Hall, Laundry, Transport Shuttle"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-sm bg-white"
                    value={propertyForm.amenities || ''}
                    onChange={(e) => setPropertyForm({ ...propertyForm, amenities: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Property Manager Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+966 50 123 4567"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-sm bg-white"
                    value={propertyForm.contactNumber || ''}
                    onChange={(e) => setPropertyForm({ ...propertyForm, contactNumber: e.target.value })}
                  />
                </div>
              </div>

              {/* Auto Create Rooms Option */}
              {!editingProperty && (
                <label className="flex items-center gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={propertyForm.autoCreateRooms}
                    onChange={(e) => setPropertyForm({ ...propertyForm, autoCreateRooms: e.target.checked })}
                    className="rounded text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-xs text-neutral-700 font-medium">
                    Automatically generate starter rooms for this property (based on Room Capacity & Beds)
                  </span>
                </label>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsPropertyModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl shadow-sm"
                >
                  {editingProperty ? 'Save Changes' : 'Create Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT ROOM MODAL */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-lg w-full p-6 my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Bed className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
                    {editingRoom ? 'Edit Room' : 'New Room Inventory'}
                  </h2>
                  <p className="text-xs text-neutral-500">Configure building, floor, room number, and bed capacity.</p>
                </div>
              </div>
              <button
                onClick={() => setIsRoomModalOpen(false)}
                className="p-2 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRoomSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                  Accommodation Facility *
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-sm bg-white"
                  value={roomForm.accommodationId || ''}
                  onChange={(e) => setRoomForm({ ...roomForm, accommodationId: e.target.value })}
                >
                  <option value="">Select facility...</option>
                  {accommodations.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.location || 'Facility'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Building / Block</label>
                  <input
                    type="text"
                    placeholder="e.g. Block A, Villa 2"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-sm bg-white"
                    value={roomForm.building || ''}
                    onChange={(e) => setRoomForm({ ...roomForm, building: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Floor</label>
                  <input
                    type="text"
                    placeholder="e.g. 1, 2, Ground"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-sm bg-white"
                    value={roomForm.floor || ''}
                    onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Room Number *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. 101, 204"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-sm bg-white font-bold"
                    value={roomForm.roomNumber || ''}
                    onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Bed Capacity *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-sm bg-white"
                    value={roomForm.capacity || ''}
                    onChange={(e) => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Room Type</label>
                  <select
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-sm bg-white"
                    value={roomForm.roomType || 'Standard'}
                    onChange={(e) => setRoomForm({ ...roomForm, roomType: e.target.value })}
                  >
                    <option value="Single Executive">Single Executive</option>
                    <option value="Double Deluxe">Double Deluxe</option>
                    <option value="Quad Standard">Quad Standard</option>
                    <option value="Dormitory">Dormitory</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Status</label>
                  <select
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl text-sm bg-white"
                    value={roomForm.status || 'available'}
                    onChange={(e) => setRoomForm({ ...roomForm, status: e.target.value })}
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl shadow-sm"
                >
                  {editingRoom ? 'Save Room' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIT EMPLOYEE MODAL */}
      <AdmissionsModal
        isOpen={isAdmitModalOpen}
        onClose={() => setIsAdmitModalOpen(false)}
        onSuccess={() => fetchData()}
        employees={employees}
        accommodations={accommodations}
        rooms={rooms}
        sites={sites}
        projects={projects}
        initialAccommodationId={admitInitialAcc}
        initialRoomId={admitInitialRoom}
      />

      {/* MONTHLY UTILIZATION PDF REPORT MODAL */}
      <MonthlyUtilizationPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        accommodations={accommodations}
        rooms={rooms}
        admissions={admissions}
        initialLocation={pdfInitialLocation}
      />

      {/* EMPLOYEE MASTER DOSSIER & 360° HISTORY MODAL */}
      {dossierEmployeeId && (
        <EmployeeDossierModal
          employeeId={dossierEmployeeId}
          isOpen={isDossierOpen}
          onClose={() => {
            setIsDossierOpen(false);
            setDossierEmployeeId(null);
          }}
          initialTab="accommodation"
        />
      )}
    </div>
  );
}
