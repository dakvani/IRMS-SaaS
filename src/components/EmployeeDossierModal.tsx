import React, { useEffect, useState } from 'react';
import {
  X, User, Home, Bed, Building2, MapPin, Briefcase, Package, Truck,
  Calendar, Clock, ShieldCheck, FileText, Phone, Mail, Globe, CheckCircle2,
  AlertCircle, Printer, ExternalLink, ChevronRight, Layers, Tag
} from 'lucide-react';

interface EmployeeDossierModalProps {
  employeeId: number;
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'accommodation' | 'assignments' | 'assets' | 'vehicles' | 'overview';
}

export default function EmployeeDossierModal({
  employeeId,
  isOpen,
  onClose,
  initialTab = 'overview',
}: EmployeeDossierModalProps) {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'accommodation' | 'assignments' | 'assets' | 'vehicles' | 'documents'>(
    initialTab as any
  );

  useEffect(() => {
    if (isOpen && employeeId) {
      fetchDossier();
    }
  }, [isOpen, employeeId]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab as any);
    }
  }, [initialTab]);

  const fetchDossier = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = (window as any)._token;
      const res = await fetch(`/api/employees/${employeeId}/dossier`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch employee dossier');
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      console.error('Error fetching employee dossier:', e);
      setError(e.message || 'Failed to load employee record');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const emp = data?.employee;
  const activeAcc = data?.activeAccommodation;
  const accHistory = data?.accommodationHistory || [];
  const activeAssign = data?.activeAssignment;
  const assignHistory = data?.assignmentHistory || [];
  const activeVeh = data?.activeVehicle;
  const vehHistory = data?.vehicleHistory || [];
  const assetsList = data?.assets || [];
  const assetHist = data?.assetHistory || [];
  const docs = data?.documents || [];
  const leaves = data?.leaves || [];
  const timesheets = data?.timesheets || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="bg-neutral-900 text-white px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 text-white">
              <User className="w-5 h-5 text-neutral-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-white">
                  Employee Master Dossier & 360° History
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded-full">
                  All Records
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Complete system timeline: accommodation, assignments, assets, vehicles & documents.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors hidden sm:flex items-center gap-1.5 text-xs font-medium"
              title="Print Dossier"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-16 gap-3">
            <div className="w-8 h-8 border-3 border-neutral-900 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium text-neutral-500">Loading complete employee records & history...</p>
          </div>
        ) : error || !emp ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
            <h3 className="text-base font-bold text-neutral-900 mb-1">Failed to load dossier</h3>
            <p className="text-xs text-neutral-500 mb-4">{error || 'Employee record could not be found.'}</p>
            <button
              onClick={fetchDossier}
              className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-semibold hover:bg-neutral-800"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Personnel Profile Header Card */}
            <div className="p-6 bg-gradient-to-b from-neutral-50 to-white border-b border-neutral-200">
              <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-neutral-900 text-white text-xl font-bold flex items-center justify-center shrink-0 shadow-md">
                    {emp.profilePhotoUrl ? (
                      <img src={emp.profilePhotoUrl} alt={emp.firstName} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      `${emp.firstName?.[0] || ''}${emp.lastName?.[0] || ''}`
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-bold text-neutral-900">
                        {emp.firstName} {emp.lastName}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-neutral-100 text-neutral-700 border border-neutral-200">
                        {emp.employeeId}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                          emp.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-neutral-600 mt-1">
                      {emp.jobTitle || 'Technician'} • {emp.department || 'Operations'} • {emp.position || 'Staff'} ({emp.employmentType || 'Full-time'})
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-xs text-neutral-500">
                      {emp.mobile && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-neutral-400" /> {emp.mobile}
                        </span>
                      )}
                      {emp.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-neutral-400" /> {emp.email}
                        </span>
                      )}
                      {emp.nationality && (
                        <span className="flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5 text-neutral-400" /> {emp.nationality}
                        </span>
                      )}
                      {emp.joiningDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-neutral-400" /> Joined {new Date(emp.joiningDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick 4-Way Operational Snapshot */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full md:w-auto shrink-0">
                  <div className="bg-white p-3 rounded-2xl border border-neutral-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block flex items-center gap-1">
                      <Home className="w-3 h-3 text-orange-500" /> Housing
                    </span>
                    <span className="text-xs font-bold text-neutral-900 block truncate mt-1">
                      {activeAcc ? `${activeAcc.accommodation?.name}` : 'Not Housed'}
                    </span>
                    <span className="text-[10px] text-neutral-500 block">
                      {activeAcc ? `Room ${activeAcc.room?.roomNumber}` : `${accHistory.length} past stays`}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-2xl border border-neutral-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-blue-500" /> Deployment
                    </span>
                    <span className="text-xs font-bold text-neutral-900 block truncate mt-1">
                      {activeAssign ? `${activeAssign.project?.name || activeAssign.site?.name}` : 'Unassigned'}
                    </span>
                    <span className="text-[10px] text-neutral-500 block">
                      {activeAssign?.role || `${assignHistory.length} total assignments`}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-2xl border border-neutral-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block flex items-center gap-1">
                      <Truck className="w-3 h-3 text-emerald-500" /> Car / Vehicle
                    </span>
                    <span className="text-xs font-bold text-neutral-900 block truncate mt-1">
                      {activeVeh ? `${activeVeh.vehicle?.make} ${activeVeh.vehicle?.model}` : 'No Vehicle'}
                    </span>
                    <span className="text-[10px] text-neutral-500 block">
                      {activeVeh ? `${activeVeh.vehicle?.licensePlate}` : `${vehHistory.length} past vehicles`}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-2xl border border-neutral-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block flex items-center gap-1">
                      <Package className="w-3 h-3 text-purple-500" /> Assets
                    </span>
                    <span className="text-xs font-bold text-neutral-900 block truncate mt-1">
                      {assetsList.length} Active
                    </span>
                    <span className="text-[10px] text-neutral-500 block">
                      {assetHist.length} allocations logged
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 mt-5 border-t border-neutral-200/80 pt-4 overflow-x-auto no-scrollbar">
                {[
                  { id: 'overview', label: 'Summary Overview', icon: Layers, count: null },
                  { id: 'accommodation', label: 'Staff Accommodation & History', icon: Home, count: accHistory.length },
                  { id: 'assignments', label: 'Deployments & Assignments', icon: Briefcase, count: assignHistory.length },
                  { id: 'assets', label: 'Assets & Equipment History', icon: Package, count: assetsList.length + assetHist.length },
                  { id: 'vehicles', label: 'Car & Vehicle History', icon: Truck, count: vehHistory.length },
                  { id: 'documents', label: 'Documents & Records', icon: FileText, count: docs.length },
                ].map((t) => {
                  const Icon = t.icon;
                  const isActive = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id as any)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
                        isActive
                          ? 'bg-neutral-900 text-white shadow-sm'
                          : 'bg-white hover:bg-neutral-100 text-neutral-600 border border-neutral-200'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                      {t.label}
                      {t.count !== null && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
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
            </div>

            {/* TAB CONTENTS */}
            <div className="p-6 space-y-6">
              {/* TAB: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Current Active Housing & Current Vehicle Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Housing Card */}
                    <div className="bg-orange-50/50 border border-orange-200/80 rounded-2xl p-4.5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
                            <Home className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-orange-950">
                              Current Housing Assignment
                            </h4>
                            <p className="text-[11px] text-orange-800">
                              {activeAcc ? 'Currently Resident' : 'No Active Housing'}
                            </p>
                          </div>
                        </div>
                        {activeAcc && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Active Resident
                          </span>
                        )}
                      </div>

                      {activeAcc ? (
                        <div className="space-y-2 bg-white/80 rounded-xl p-3.5 border border-orange-100 text-xs">
                          <div className="flex justify-between">
                            <span className="text-neutral-500 font-medium">Property:</span>
                            <span className="font-bold text-neutral-900">{activeAcc.accommodation?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-500 font-medium">Room & Building:</span>
                            <span className="font-semibold text-neutral-800">
                              Room {activeAcc.room?.roomNumber} ({activeAcc.room?.building || 'Main'} - Floor {activeAcc.room?.floor || '1'})
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-500 font-medium">Check-In Date:</span>
                            <span className="font-semibold text-neutral-800">
                              {activeAcc.startDate ? new Date(activeAcc.startDate).toLocaleDateString() : '-'}
                            </span>
                          </div>
                          {activeAcc.accommodation?.location && (
                            <div className="flex justify-between">
                              <span className="text-neutral-500 font-medium">Location:</span>
                              <span className="font-medium text-neutral-700">{activeAcc.accommodation?.location}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-500 italic py-2">
                          Employee is currently not checked into any accommodation property.
                        </p>
                      )}
                    </div>

                    {/* Vehicle Card */}
                    <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-4.5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                              Current Vehicle / Car
                            </h4>
                            <p className="text-[11px] text-emerald-800">
                              {activeVeh ? 'Assigned Fleet Vehicle' : 'No Vehicle Assigned'}
                            </p>
                          </div>
                        </div>
                        {activeVeh && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Active Fleet
                          </span>
                        )}
                      </div>

                      {activeVeh ? (
                        <div className="space-y-2 bg-white/80 rounded-xl p-3.5 border border-emerald-100 text-xs">
                          <div className="flex justify-between">
                            <span className="text-neutral-500 font-medium">Vehicle:</span>
                            <span className="font-bold text-neutral-900">
                              {activeVeh.vehicle?.make} {activeVeh.vehicle?.model} ({activeVeh.vehicle?.year || 'N/A'})
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-500 font-medium">License Plate:</span>
                            <span className="font-mono font-bold text-emerald-700">{activeVeh.vehicle?.licensePlate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-500 font-medium">Assigned Since:</span>
                            <span className="font-semibold text-neutral-800">
                              {activeVeh.startDate ? new Date(activeVeh.startDate).toLocaleDateString() : '-'}
                            </span>
                          </div>
                          {activeVeh.vehicle?.vin && (
                            <div className="flex justify-between">
                              <span className="text-neutral-500 font-medium">VIN:</span>
                              <span className="font-mono text-neutral-600">{activeVeh.vehicle?.vin}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-500 italic py-2">
                          No company vehicle currently assigned to this employee.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Summary Tables Preview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Accommodation Stays History Snippet */}
                    <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-100">
                        <h4 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                          <Home className="w-4 h-4 text-orange-500" /> Accommodation History ({accHistory.length})
                        </h4>
                        <button
                          onClick={() => setActiveTab('accommodation')}
                          className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-0.5"
                        >
                          View All <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {accHistory.length > 0 ? (
                        <div className="space-y-2">
                          {accHistory.slice(0, 3).map((h: any) => (
                            <div key={h.id} className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 text-xs flex items-center justify-between">
                              <div>
                                <span className="font-bold text-neutral-900 block">{h.accommodation?.name}</span>
                                <span className="text-[11px] text-neutral-500">
                                  Room {h.room?.roomNumber} • Check-in: {h.startDate ? new Date(h.startDate).toLocaleDateString() : '-'}
                                </span>
                              </div>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  h.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-700'
                                }`}
                              >
                                {h.status === 'active' ? 'Checked-In' : 'Checked-Out'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-400 py-3 text-center">No accommodation history recorded.</p>
                      )}
                    </div>

                    {/* Deployments Snippet */}
                    <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-100">
                        <h4 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                          <Briefcase className="w-4 h-4 text-blue-500" /> Deployment History ({assignHistory.length})
                        </h4>
                        <button
                          onClick={() => setActiveTab('assignments')}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                        >
                          View All <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {assignHistory.length > 0 ? (
                        <div className="space-y-2">
                          {assignHistory.slice(0, 3).map((a: any) => (
                            <div key={a.id} className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 text-xs flex items-center justify-between">
                              <div>
                                <span className="font-bold text-neutral-900 block">{a.role || 'Personnel'}</span>
                                <span className="text-[11px] text-neutral-500">
                                  {a.site?.name || a.project?.name || 'General Operations'} • {a.startDate ? new Date(a.startDate).toLocaleDateString() : '-'}
                                </span>
                              </div>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  a.status?.toLowerCase() === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-neutral-200 text-neutral-700'
                                }`}
                              >
                                {a.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-400 py-3 text-center">No deployment history recorded.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: ACCOMMODATION & FULL STAY HISTORY */}
              {activeTab === 'accommodation' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-orange-50/70 border border-orange-200/80 p-4 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0">
                        <Home className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-neutral-900">
                          Complete Accommodation & Housing Stays History
                        </h4>
                        <p className="text-xs text-neutral-500">
                          Every room admission, campus stay, and check-out recorded since employee joined the organization.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-orange-900 bg-orange-100 border border-orange-200 px-3 py-1 rounded-xl">
                      {accHistory.length} Total Stays
                    </span>
                  </div>

                  {/* Table of all stays */}
                  <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[11px] font-semibold">
                          <tr>
                            <th className="px-5 py-3.5">Property & Compound</th>
                            <th className="px-5 py-3.5">Room & Bed Info</th>
                            <th className="px-5 py-3.5">Check-In Date</th>
                            <th className="px-5 py-3.5">Check-Out Date</th>
                            <th className="px-5 py-3.5">Duration</th>
                            <th className="px-5 py-3.5">Stay Status</th>
                            <th className="px-5 py-3.5">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {accHistory.map((adm: any) => {
                            const isActive = adm.status?.toLowerCase() === 'active';
                            const start = adm.startDate ? new Date(adm.startDate) : null;
                            const end = adm.endDate ? new Date(adm.endDate) : (isActive ? new Date() : null);
                            const durationDays = start && end ? Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24))) : null;

                            return (
                              <tr key={adm.id} className="hover:bg-neutral-50/60 transition-colors">
                                <td className="px-5 py-3.5">
                                  <span className="font-bold text-neutral-900 block">{adm.accommodation?.name || 'Housing Campus'}</span>
                                  <span className="text-[11px] text-neutral-400 block">
                                    {adm.accommodation?.location || adm.accommodation?.address || 'Staff compound'}
                                  </span>
                                </td>

                                <td className="px-5 py-3.5">
                                  <span className="font-bold text-neutral-800 flex items-center gap-1">
                                    <Bed className="w-3.5 h-3.5 text-neutral-400" /> Room {adm.room?.roomNumber}
                                  </span>
                                  <span className="text-[11px] text-neutral-500">
                                    {adm.room?.building || 'Main'} {adm.room?.floor ? `• Floor ${adm.room.floor}` : ''} ({adm.room?.roomType || 'Standard'})
                                  </span>
                                </td>

                                <td className="px-5 py-3.5 text-neutral-800 font-medium">
                                  {adm.startDate ? new Date(adm.startDate).toLocaleDateString() : '-'}
                                </td>

                                <td className="px-5 py-3.5 text-neutral-600">
                                  {adm.endDate ? new Date(adm.endDate).toLocaleDateString() : (isActive ? 'Active Resident' : '-')}
                                </td>

                                <td className="px-5 py-3.5 text-neutral-700 font-semibold">
                                  {durationDays ? `${durationDays} days` : '-'}
                                </td>

                                <td className="px-5 py-3.5">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                      isActive
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                        : 'bg-neutral-100 text-neutral-600'
                                    }`}
                                  >
                                    {isActive ? 'Active Stay' : 'Checked Out'}
                                  </span>
                                </td>

                                <td className="px-5 py-3.5 text-neutral-500 italic max-w-xs truncate">
                                  {adm.notes || '-'}
                                </td>
                              </tr>
                            );
                          })}
                          {accHistory.length === 0 && (
                            <tr>
                              <td colSpan={7} className="px-6 py-12 text-center text-neutral-400">
                                No accommodation history has been recorded for this employee yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: ASSIGNMENTS & DEPLOYMENT HISTORY */}
              {activeTab === 'assignments' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-blue-50/70 border border-blue-200/80 p-4 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-neutral-900">
                          Complete Site & Project Assignment History
                        </h4>
                        <p className="text-xs text-neutral-500">
                          Full chronological record of operational roles, site deployments, and project work.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-blue-900 bg-blue-100 border border-blue-200 px-3 py-1 rounded-xl">
                      {assignHistory.length} Total Assignments
                    </span>
                  </div>

                  <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[11px] font-semibold">
                          <tr>
                            <th className="px-5 py-3.5">Assigned Role</th>
                            <th className="px-5 py-3.5">Project</th>
                            <th className="px-5 py-3.5">Site Location</th>
                            <th className="px-5 py-3.5">Start Date</th>
                            <th className="px-5 py-3.5">End Date</th>
                            <th className="px-5 py-3.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {assignHistory.map((ass: any) => {
                            const isActive = ass.status?.toLowerCase() === 'active';
                            return (
                              <tr key={ass.id} className="hover:bg-neutral-50/60 transition-colors">
                                <td className="px-5 py-3.5 font-bold text-neutral-900">
                                  {ass.role || 'Technician'}
                                </td>
                                <td className="px-5 py-3.5 text-neutral-800 font-medium">
                                  {ass.project?.name || '-'}
                                  {ass.project?.code && (
                                    <span className="text-[10px] text-neutral-400 block font-mono">
                                      {ass.project.code}
                                    </span>
                                  )}
                                </td>
                                <td className="px-5 py-3.5 text-neutral-700">
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                                    <span>{ass.site?.name || '-'}</span>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5 text-neutral-700 font-medium">
                                  {ass.startDate ? new Date(ass.startDate).toLocaleDateString() : '-'}
                                </td>
                                <td className="px-5 py-3.5 text-neutral-600">
                                  {ass.endDate ? new Date(ass.endDate).toLocaleDateString() : (isActive ? 'Present / Active' : '-')}
                                </td>
                                <td className="px-5 py-3.5">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                      isActive
                                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                        : 'bg-neutral-100 text-neutral-600'
                                    }`}
                                  >
                                    {ass.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                          {assignHistory.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-6 py-12 text-center text-neutral-400">
                                No project or site assignments recorded.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: ASSETS & ASSET ALLOCATION HISTORY */}
              {activeTab === 'assets' && (
                <div className="space-y-6">
                  {/* Currently Held Assets */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-purple-500" /> Currently Assigned Physical Assets ({assetsList.length})
                    </h4>
                    {assetsList.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {assetsList.map((a: any) => (
                          <div key={a.id} className="p-3.5 rounded-2xl border border-neutral-200 bg-white shadow-2xs hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="font-bold text-neutral-900 block text-xs">{a.name}</span>
                                <span className="text-[11px] font-mono text-purple-700 font-semibold block mt-0.5">
                                  {a.assetTag}
                                </span>
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-800">
                                {a.type}
                              </span>
                            </div>
                            <div className="mt-2.5 pt-2 border-t border-neutral-100 text-[11px] text-neutral-500 flex justify-between">
                              <span>Status: <strong className="text-neutral-800">{a.status}</strong></span>
                              {a.purchaseDate && <span>Acquired: {new Date(a.purchaseDate).toLocaleDateString()}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200 text-center text-xs text-neutral-400">
                        No physical assets currently held by this employee.
                      </div>
                    )}
                  </div>

                  {/* Asset Allocation History */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-neutral-500" /> Full Asset Allocation & Handover History ({assetHist.length})
                    </h4>
                    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[11px] font-semibold">
                            <tr>
                              <th className="px-5 py-3.5">Asset & Tag</th>
                              <th className="px-5 py-3.5">Category</th>
                              <th className="px-5 py-3.5">Project / Site Context</th>
                              <th className="px-5 py-3.5">Start Date</th>
                              <th className="px-5 py-3.5">End / Return Date</th>
                              <th className="px-5 py-3.5">Status</th>
                              <th className="px-5 py-3.5">Notes</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100">
                            {assetHist.map((al: any) => (
                              <tr key={al.id} className="hover:bg-neutral-50/60 transition-colors">
                                <td className="px-5 py-3.5">
                                  <span className="font-bold text-neutral-900 block">{al.asset?.name || 'Asset'}</span>
                                  <span className="text-[11px] font-mono text-purple-700">{al.asset?.assetTag}</span>
                                </td>
                                <td className="px-5 py-3.5 text-neutral-700 font-medium">
                                  {al.asset?.type || 'Equipment'}
                                </td>
                                <td className="px-5 py-3.5 text-neutral-600">
                                  {al.project?.name || al.site?.name || 'General Inventory'}
                                </td>
                                <td className="px-5 py-3.5 text-neutral-700 font-medium">
                                  {al.startDate ? new Date(al.startDate).toLocaleDateString() : '-'}
                                </td>
                                <td className="px-5 py-3.5 text-neutral-600">
                                  {al.endDate ? new Date(al.endDate).toLocaleDateString() : (al.status === 'active' ? 'Currently In Use' : '-')}
                                </td>
                                <td className="px-5 py-3.5">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                      al.status === 'active'
                                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                        : 'bg-neutral-100 text-neutral-600'
                                    }`}
                                  >
                                    {al.status}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 text-neutral-500 italic max-w-xs truncate">
                                  {al.notes || '-'}
                                </td>
                              </tr>
                            ))}
                            {assetHist.length === 0 && (
                              <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-neutral-400">
                                  No asset allocation records found.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: CAR / VEHICLE & DRIVING HISTORY */}
              {activeTab === 'vehicles' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-neutral-900">
                          Complete Vehicle & Car Assignment History
                        </h4>
                        <p className="text-xs text-neutral-500">
                          All company fleet vehicles, pickup trucks, and cars assigned to this employee over time.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-900 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-xl">
                      {vehHistory.length} Total Vehicles Logged
                    </span>
                  </div>

                  <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[11px] font-semibold">
                          <tr>
                            <th className="px-5 py-3.5">Vehicle Details</th>
                            <th className="px-5 py-3.5">License Plate</th>
                            <th className="px-5 py-3.5">Deployment Context</th>
                            <th className="px-5 py-3.5">Assigned Date</th>
                            <th className="px-5 py-3.5">Returned Date</th>
                            <th className="px-5 py-3.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {vehHistory.map((vh: any) => {
                            const isActive = vh.status?.toLowerCase() === 'active';
                            return (
                              <tr key={vh.id} className="hover:bg-neutral-50/60 transition-colors">
                                <td className="px-5 py-3.5">
                                  <span className="font-bold text-neutral-900 block">
                                    {vh.vehicle?.make} {vh.vehicle?.model}
                                  </span>
                                  <span className="text-[11px] text-neutral-400">
                                    {vh.vehicle?.year ? `Year ${vh.vehicle.year} • ` : ''} {vh.vehicle?.type || 'Fleet Car'}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5">
                                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                                    {vh.vehicle?.licensePlate || '-'}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 text-neutral-700 font-medium">
                                  {vh.project?.name || vh.site?.name || 'General Operations'}
                                </td>
                                <td className="px-5 py-3.5 text-neutral-700 font-medium">
                                  {vh.startDate ? new Date(vh.startDate).toLocaleDateString() : '-'}
                                </td>
                                <td className="px-5 py-3.5 text-neutral-600">
                                  {vh.endDate ? new Date(vh.endDate).toLocaleDateString() : (isActive ? 'Currently Driving' : '-')}
                                </td>
                                <td className="px-5 py-3.5">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                      isActive
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                        : 'bg-neutral-100 text-neutral-600'
                                    }`}
                                  >
                                    {isActive ? 'Active Assignment' : 'Returned / Completed'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                          {vehHistory.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-6 py-12 text-center text-neutral-400">
                                No vehicle assignments recorded for this employee.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: DOCUMENTS, LEAVES & TIMESHEETS */}
              {activeTab === 'documents' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Documents */}
                  <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs">
                    <h4 className="text-xs font-bold text-neutral-900 mb-3 flex items-center gap-1.5 pb-2 border-b border-neutral-100">
                      <FileText className="w-4 h-4 text-neutral-500" /> Uploaded Documents ({docs.length})
                    </h4>
                    {docs.length > 0 ? (
                      <div className="space-y-2">
                        {docs.map((d: any) => (
                          <div key={d.id} className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 text-xs flex items-center justify-between">
                            <div>
                              <span className="font-bold text-neutral-900 block">{d.documentType}</span>
                              <span className="text-[11px] text-neutral-400">
                                Exp: {d.expiryDate ? new Date(d.expiryDate).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                            {d.documentUrl && (
                              <a
                                href={d.documentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:text-blue-800 p-1.5"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-400 py-6 text-center">No documents uploaded.</p>
                    )}
                  </div>

                  {/* Leaves & Timesheets Summary */}
                  <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs">
                      <h4 className="text-xs font-bold text-neutral-900 mb-3 flex items-center gap-1.5 pb-2 border-b border-neutral-100">
                        <Calendar className="w-4 h-4 text-neutral-500" /> Leave History ({leaves.length})
                      </h4>
                      {leaves.length > 0 ? (
                        <div className="space-y-2">
                          {leaves.slice(0, 4).map((l: any) => (
                            <div key={l.id} className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 text-xs flex items-center justify-between">
                              <div>
                                <span className="font-bold text-neutral-900 block">{l.leaveType}</span>
                                <span className="text-[11px] text-neutral-400">
                                  {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                                </span>
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-200 text-neutral-700">
                                {l.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-400 py-3 text-center">No leave requests logged.</p>
                      )}
                    </div>

                    <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs">
                      <h4 className="text-xs font-bold text-neutral-900 mb-3 flex items-center gap-1.5 pb-2 border-b border-neutral-100">
                        <Clock className="w-4 h-4 text-neutral-500" /> Recent Timesheets ({timesheets.length} logged)
                      </h4>
                      {timesheets.length > 0 ? (
                        <div className="space-y-1.5 text-xs">
                          {timesheets.slice(0, 3).map((ts: any) => (
                            <div key={ts.id} className="flex justify-between py-1.5 border-b border-neutral-100 last:border-none">
                              <span className="text-neutral-700 font-medium">{new Date(ts.date).toLocaleDateString()}</span>
                              <span className="font-bold text-neutral-900">{ts.hoursWorked} hrs ({ts.attendanceStatus})</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-400 py-3 text-center">No recent timesheet logs.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="bg-neutral-50 px-6 py-3.5 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500 shrink-0">
          <span>
            {emp ? `Viewing records for ${emp.firstName} ${emp.lastName} (${emp.employeeId})` : 'Employee Dossier'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
}
