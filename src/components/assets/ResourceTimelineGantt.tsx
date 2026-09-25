import React, { useState, useMemo } from 'react';
import { 
  CalendarRange, ChevronLeft, ChevronRight, Plus, Filter, Search, 
  MapPin, User, Clock, Building2, CheckCircle2, AlertCircle, X, 
  Layers, SlidersHorizontal, Edit2, Trash2, Calendar as CalendarIcon,
  Package, Truck, Wrench, ShieldAlert, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ResourceTimelineGanttProps {
  assets: any[];
  projects: any[];
  sites: any[];
  employees: any[];
  allocations: any[];
  onRefresh: () => void;
  onAssetClick?: (asset: any) => void;
}

export default function ResourceTimelineGantt({
  assets,
  projects,
  sites,
  employees,
  allocations,
  onRefresh,
  onAssetClick,
}: ResourceTimelineGanttProps) {
  // Timeline view state - default to around Sep 1, 2026 (local time is Sep 24, 2026)
  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date(2026, 8, 1); // Sep 1, 2026
    return d;
  });
  const [daysCount, setDaysCount] = useState<number>(35); // 5 weeks view
  const [scaleMode, setScaleMode] = useState<'day' | 'week'>('day');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [allocationForm, setAllocationForm] = useState({
    id: null as number | null,
    assetId: '',
    projectId: '',
    siteId: '',
    employeeId: '',
    startDate: '2026-09-01',
    endDate: '2026-10-15',
    status: 'active',
    notes: '',
  });

  // Calculate days array for current timeline window
  const timelineDays = useMemo(() => {
    const days: Array<{
      date: Date;
      dateStr: string;
      dayNum: number;
      dayName: string;
      monthName: string;
      isWeekend: boolean;
      isToday: boolean;
    }> = [];

    const todayStr = '2026-09-24'; // Fixed relative to app's current date context

    for (let i = 0; i < daysCount; i++) {
      const cur = new Date(startDate);
      cur.setDate(cur.getDate() + i);

      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      const dayOfWeek = cur.getDay(); // 0 is Sun, 6 is Sat
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Fri & Sat for Saudi Arabia context

      days.push({
        date: cur,
        dateStr,
        dayNum: cur.getDate(),
        dayName: cur.toLocaleDateString('en-US', { weekday: 'narrow' }),
        monthName: cur.toLocaleDateString('en-US', { month: 'short' }),
        isWeekend,
        isToday: dateStr === todayStr,
      });
    }

    return days;
  }, [startDate, daysCount]);

  const timelineEndDate = useMemo(() => {
    const end = new Date(startDate);
    end.setDate(end.getDate() + daysCount - 1);
    return end;
  }, [startDate, daysCount]);

  // Unique project colors palette generator
  const getProjectColor = (projectId: number | null, index = 0) => {
    const palette = [
      { bg: 'bg-indigo-600', border: 'border-indigo-700', text: 'text-white', lightBg: 'bg-indigo-50', lightText: 'text-indigo-700' },
      { bg: 'bg-emerald-600', border: 'border-emerald-700', text: 'text-white', lightBg: 'bg-emerald-50', lightText: 'text-emerald-700' },
      { bg: 'bg-sky-600', border: 'border-sky-700', text: 'text-white', lightBg: 'bg-sky-50', lightText: 'text-sky-700' },
      { bg: 'bg-amber-600', border: 'border-amber-700', text: 'text-white', lightBg: 'bg-amber-50', lightText: 'text-amber-700' },
      { bg: 'bg-purple-600', border: 'border-purple-700', text: 'text-white', lightBg: 'bg-purple-50', lightText: 'text-purple-700' },
      { bg: 'bg-rose-600', border: 'border-rose-700', text: 'text-white', lightBg: 'bg-rose-50', lightText: 'text-rose-700' },
      { bg: 'bg-teal-600', border: 'border-teal-700', text: 'text-white', lightBg: 'bg-teal-50', lightText: 'text-teal-700' },
      { bg: 'bg-orange-600', border: 'border-orange-700', text: 'text-white', lightBg: 'bg-orange-50', lightText: 'text-orange-700' },
    ];
    if (!projectId) return { bg: 'bg-neutral-600', border: 'border-neutral-700', text: 'text-white', lightBg: 'bg-neutral-100', lightText: 'text-neutral-700' };
    return palette[projectId % palette.length];
  };

  // Filtered Assets list
  const displayAssets = useMemo(() => {
    return assets.filter(a => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchName = a.name?.toLowerCase().includes(term);
        const matchTag = a.assetTag?.toLowerCase().includes(term);
        const matchType = a.type?.toLowerCase().includes(term);
        if (!matchName && !matchTag && !matchType) return false;
      }

      if (selectedType !== 'all' && a.type?.toLowerCase() !== selectedType.toLowerCase()) {
        return false;
      }

      // Check allocations matching project/site/status if filtered
      if (selectedProject !== 'all' || selectedSite !== 'all' || selectedStatus !== 'all') {
        const assetAllocs = allocations.filter(al => al.assetId === a.id);
        const hasMatchingAlloc = assetAllocs.some(al => {
          const matchProj = selectedProject === 'all' || String(al.projectId) === selectedProject;
          const matchSite = selectedSite === 'all' || String(al.siteId) === selectedSite;
          const matchStat = selectedStatus === 'all' || al.status === selectedStatus;
          return matchProj && matchSite && matchStat;
        });
        if (!hasMatchingAlloc) return false;
      }

      return true;
    });
  }, [assets, allocations, searchTerm, selectedType, selectedProject, selectedSite, selectedStatus]);

  // Aggregate schedule statistics
  const stats = useMemo(() => {
    const activeAllocs = allocations.filter(a => a.status === 'active');
    const scheduledAllocs = allocations.filter(a => a.status === 'scheduled');
    const uniqueSites = new Set(allocations.map(a => a.siteId).filter(Boolean));
    const uniqueProjects = new Set(allocations.map(a => a.projectId).filter(Boolean));
    const allocatedAssetIds = new Set(allocations.filter(a => a.status === 'active').map(a => a.assetId));
    const utilization = assets.length > 0 ? Math.round((allocatedAssetIds.size / assets.length) * 100) : 0;

    return {
      totalAllocs: allocations.length,
      activeCount: activeAllocs.length,
      scheduledCount: scheduledAllocs.length,
      sitesCount: uniqueSites.size,
      projectsCount: uniqueProjects.size,
      utilizationRate: utilization,
    };
  }, [allocations, assets]);

  // Navigate timeline
  const handlePrev = () => {
    const d = new Date(startDate);
    d.setDate(d.getDate() - 14);
    setStartDate(d);
  };

  const handleNext = () => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + 14);
    setStartDate(d);
  };

  const handleToday = () => {
    const d = new Date(2026, 8, 10); // Centers around Sep 24, 2026
    setStartDate(d);
  };

  // Open modal to schedule allocation
  const handleOpenAddModal = (presetAssetId?: number, presetDate?: string) => {
    setIsEditing(false);
    setAllocationForm({
      id: null,
      assetId: presetAssetId ? String(presetAssetId) : (assets[0]?.id ? String(assets[0].id) : ''),
      projectId: projects[0]?.id ? String(projects[0].id) : '',
      siteId: sites[0]?.id ? String(sites[0].id) : '',
      employeeId: employees[0]?.id ? String(employees[0].id) : '',
      startDate: presetDate || '2026-09-24',
      endDate: '2026-10-24',
      status: 'active',
      notes: '',
    });
    setShowAddModal(true);
  };

  // Edit existing allocation
  const handleOpenEditModal = (alloc: any) => {
    setIsEditing(true);
    setAllocationForm({
      id: alloc.id,
      assetId: String(alloc.assetId),
      projectId: alloc.projectId ? String(alloc.projectId) : '',
      siteId: alloc.siteId ? String(alloc.siteId) : '',
      employeeId: alloc.employeeId ? String(alloc.employeeId) : '',
      startDate: alloc.startDate ? alloc.startDate.split('T')[0] : '2026-09-24',
      endDate: alloc.endDate ? alloc.endDate.split('T')[0] : '',
      status: alloc.status || 'active',
      notes: alloc.notes || '',
    });
    setSelectedAllocation(null);
    setShowAddModal(true);
  };

  // Save allocation (POST or PUT)
  const handleSaveAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = (window as any)._token;
      const url = isEditing && allocationForm.id 
        ? `/api/asset-allocations/${allocationForm.id}` 
        : '/api/asset-allocations';
      const method = isEditing && allocationForm.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(allocationForm)
      });

      if (res.ok) {
        setShowAddModal(false);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete allocation
  const handleDeleteAllocation = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this allocation schedule?')) return;
    try {
      const token = (window as any)._token;
      const res = await fetch(`/api/asset-allocations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSelectedAllocation(null);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to compute Gantt bar position & span
  const computeBarGeometry = (allocStartStr: string, allocEndStr: string | null) => {
    if (!allocStartStr) return null;
    const aStart = new Date(allocStartStr.split('T')[0]);
    const aEnd = allocEndStr ? new Date(allocEndStr.split('T')[0]) : new Date(aStart.getTime() + 30 * 24 * 60 * 60 * 1000);

    const vStart = new Date(startDate);
    vStart.setHours(0, 0, 0, 0);
    const vEnd = new Date(timelineEndDate);
    vEnd.setHours(23, 59, 59, 999);

    // If completely outside the visible timeline
    if (aEnd < vStart || aStart > vEnd) return null;

    const visibleStart = aStart < vStart ? vStart : aStart;
    const visibleEnd = aEnd > vEnd ? vEnd : aEnd;

    const msPerDay = 1000 * 60 * 60 * 24;
    const startOffsetDays = Math.max(0, (visibleStart.getTime() - vStart.getTime()) / msPerDay);
    const spanDays = Math.max(1, (visibleEnd.getTime() - visibleStart.getTime()) / msPerDay + 1);

    const leftPercent = (startOffsetDays / daysCount) * 100;
    const widthPercent = Math.min(100 - leftPercent, (spanDays / daysCount) * 100);

    const totalDays = Math.round((aEnd.getTime() - aStart.getTime()) / msPerDay) + 1;

    return {
      left: `${leftPercent}%`,
      width: `${Math.max(2, widthPercent)}%`,
      totalDays,
      startsBefore: aStart < vStart,
      endsAfter: aEnd > vEnd,
    };
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Active Deployments</p>
            <p className="text-2xl font-black text-neutral-900 mt-1">{stats.activeCount}</p>
            <span className="text-[11px] text-indigo-600 font-medium">{stats.scheduledCount} scheduled ahead</span>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
            <CalendarRange className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Engaged Projects</p>
            <p className="text-2xl font-black text-neutral-900 mt-1">{stats.projectsCount}</p>
            <span className="text-[11px] text-emerald-600 font-medium">Across operational sites</span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Active Sites</p>
            <p className="text-2xl font-black text-neutral-900 mt-1">{stats.sitesCount}</p>
            <span className="text-[11px] text-sky-600 font-medium">Geospatial field allocation</span>
          </div>
          <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center font-bold">
            <MapPin className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Fleet Utilization</p>
            <p className="text-2xl font-black text-neutral-900 mt-1">{stats.utilizationRate}%</p>
            <div className="w-24 bg-neutral-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${stats.utilizationRate}%` }}></div>
            </div>
          </div>
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-bold">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Timeline Controls & Filter Bar */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Date Navigation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-neutral-100 p-1 rounded-xl">
            <button 
              onClick={handlePrev} 
              title="Previous 14 days"
              className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-white rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={handleToday}
              className="px-3 py-1 text-xs font-bold text-neutral-700 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors"
            >
              Today
            </button>
            <button 
              onClick={handleNext}
              title="Next 14 days"
              className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-white rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-800 flex items-center gap-2">
            <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" />
            <span>
              {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              {' — '}
              {timelineEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <div className="flex bg-neutral-100 p-1 rounded-xl">
            <button 
              onClick={() => { setDaysCount(21); setScaleMode('day'); }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${daysCount === 21 ? 'bg-white text-indigo-700 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}
            >
              3W
            </button>
            <button 
              onClick={() => { setDaysCount(35); setScaleMode('day'); }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${daysCount === 35 ? 'bg-white text-indigo-700 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}
            >
              5W
            </button>
            <button 
              onClick={() => { setDaysCount(60); setScaleMode('day'); }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${daysCount === 60 ? 'bg-white text-indigo-700 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}
            >
              2M
            </button>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search assets..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="w-40 pl-8 pr-3 py-1.5 text-xs rounded-xl border border-neutral-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            />
          </div>

          <select 
            value={selectedProject} 
            onChange={e => setSelectedProject(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-xl border border-neutral-200 font-medium text-neutral-700 bg-white"
          >
            <option value="all">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <select 
            value={selectedSite} 
            onChange={e => setSelectedSite(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-xl border border-neutral-200 font-medium text-neutral-700 bg-white"
          >
            <option value="all">All Sites</option>
            {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <button 
            onClick={() => handleOpenAddModal()} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Schedule Allocation
          </button>
        </div>
      </div>

      {/* Main Gantt Canvas */}
      <div className="bg-white border border-neutral-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
        {/* Gantt Header & Rows Container */}
        <div className="overflow-x-auto custom-scrollbar">
          <div className="min-w-[1000px] flex flex-col">
            
            {/* Table Header: Left asset column title + Date Axis */}
            <div className="flex border-b border-neutral-200 bg-neutral-50/80 sticky top-0 z-20">
              {/* Asset Left Fixed Header */}
              <div className="w-72 shrink-0 px-5 py-3 border-r border-neutral-200 font-bold text-xs text-neutral-600 uppercase tracking-wider flex items-center justify-between">
                <span>Asset / Equipment ({displayAssets.length})</span>
                <span className="text-[10px] text-neutral-400 font-normal">Tag ID</span>
              </div>

              {/* Date Axis Columns */}
              <div className="flex-1 flex relative">
                {timelineDays.map((day, idx) => (
                  <div 
                    key={day.dateStr} 
                    style={{ width: `${100 / daysCount}%` }}
                    className={`shrink-0 flex flex-col items-center justify-center py-2 border-r border-neutral-100 text-[10px] ${
                      day.isToday ? 'bg-indigo-50/80 text-indigo-700 font-black' : 
                      day.isWeekend ? 'bg-neutral-100/50 text-neutral-400' : 'text-neutral-600'
                    }`}
                  >
                    <span className="font-bold">{day.dayNum}</span>
                    <span className="text-[9px] uppercase tracking-tighter opacity-75">{day.dayName}</span>
                  </div>
                ))}

                {/* Today Marker Label */}
                {timelineDays.some(d => d.isToday) && (
                  <div 
                    style={{
                      left: `${(timelineDays.findIndex(d => d.isToday) / daysCount) * 100}%`
                    }}
                    className="absolute -top-1 pointer-events-none z-30 transform -translate-x-1/2 flex flex-col items-center"
                  >
                    <span className="bg-indigo-600 text-white font-extrabold text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-full shadow-sm">
                      Today
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Asset Rows */}
            <div className="divide-y divide-neutral-100">
              {displayAssets.length === 0 ? (
                <div className="p-16 text-center text-neutral-400 text-sm">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  No assets match current timeline filters.
                </div>
              ) : (
                displayAssets.map(asset => {
                  // Find allocations for this asset
                  const assetAllocs = allocations.filter(al => al.assetId === asset.id);

                  // If an asset is assignedToSiteId and status=='assigned' but no allocations record, synthesize one
                  let renderAllocs = [...assetAllocs];
                  if (renderAllocs.length === 0 && asset.status === 'assigned' && asset.assignedToSiteId) {
                    const fallbackSite = sites.find(s => s.id === asset.assignedToSiteId);
                    renderAllocs.push({
                      id: -asset.id,
                      assetId: asset.id,
                      projectId: null,
                      siteId: asset.assignedToSiteId,
                      employeeId: asset.assignedToEmployeeId,
                      startDate: '2026-09-01',
                      endDate: '2026-10-31',
                      status: 'active',
                      notes: 'Direct site assignment',
                      asset: asset,
                      site: fallbackSite,
                      project: null,
                    });
                  }

                  const isVehicle = asset.type?.toLowerCase() === 'vehicle';

                  return (
                    <div key={asset.id} className="flex hover:bg-neutral-50/50 transition-colors group relative">
                      {/* Left Asset Card Column */}
                      <div 
                        onClick={() => onAssetClick && onAssetClick(asset)}
                        className="w-72 shrink-0 p-3 px-5 border-r border-neutral-200 flex items-center justify-between cursor-pointer hover:bg-neutral-100/50 transition-colors bg-white z-10"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {asset.photoUrl ? (
                            <img src={asset.photoUrl} alt="" className="w-8 h-8 rounded-lg object-cover border border-neutral-200 shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-500 flex items-center justify-center shrink-0">
                              {isVehicle ? <Truck className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-neutral-900 truncate" title={asset.name}>{asset.name}</h4>
                            <p className="text-[10px] font-mono text-neutral-400 mt-0.5">{asset.assetTag} • {asset.type}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`w-2 h-2 rounded-full ${
                            asset.status === 'available' ? 'bg-emerald-500' :
                            asset.status === 'assigned' ? 'bg-indigo-600' :
                            asset.status === 'maintenance' ? 'bg-amber-500' : 'bg-neutral-400'
                          }`}></span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenAddModal(asset.id); }}
                            title="Schedule allocation for this asset"
                            className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Right Timeline Canvas Row */}
                      <div className="flex-1 flex relative h-14 bg-white">
                        {/* Background day columns */}
                        {timelineDays.map(day => (
                          <div 
                            key={day.dateStr}
                            style={{ width: `${100 / daysCount}%` }}
                            onClick={() => handleOpenAddModal(asset.id, day.dateStr)}
                            className={`shrink-0 h-full border-r border-neutral-100 transition-colors cursor-pointer hover:bg-indigo-50/20 ${
                              day.isToday ? 'bg-indigo-50/20' : 
                              day.isWeekend ? 'bg-neutral-50/40' : ''
                            }`}
                          ></div>
                        ))}

                        {/* Today vertical marker line */}
                        {timelineDays.some(d => d.isToday) && (
                          <div 
                            style={{
                              left: `${(timelineDays.findIndex(d => d.isToday) / daysCount) * 100}%`
                            }}
                            className="absolute top-0 bottom-0 w-0.5 bg-indigo-500/40 pointer-events-none z-10"
                          ></div>
                        )}

                        {/* Allocation Bars */}
                        {renderAllocs.map(alloc => {
                          const geom = computeBarGeometry(alloc.startDate, alloc.endDate);
                          if (!geom) return null;

                          const projColor = getProjectColor(alloc.projectId);
                          const projName = alloc.project?.name || (alloc.projectId ? `Project #${alloc.projectId}` : 'Site Deployment');
                          const siteName = alloc.site?.name || 'Assigned Site';

                          return (
                            <div 
                              key={alloc.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAllocation(alloc);
                              }}
                              style={{
                                left: geom.left,
                                width: geom.width,
                              }}
                              className={`absolute top-2 bottom-2 rounded-xl px-2.5 flex items-center justify-between text-xs font-semibold text-white shadow-sm cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md z-20 overflow-hidden ${projColor.bg} ${geom.startsBefore ? 'rounded-l-none' : ''} ${geom.endsAfter ? 'rounded-r-none' : ''}`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0 truncate">
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${alloc.status === 'active' ? 'bg-white animate-pulse' : 'bg-white/60'}`}></span>
                                <span className="truncate font-bold tracking-tight">{projName}</span>
                                <span className="opacity-70 text-[10px] hidden sm:inline truncate">• {siteName}</span>
                              </div>

                              <span className="text-[10px] font-mono opacity-80 shrink-0 ml-1.5 px-1 bg-black/20 rounded">
                                {geom.totalDays}d
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Timeline Footer Legend */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50/50 flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-500">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold text-neutral-700">Project Legend:</span>
            {projects.slice(0, 5).map(p => {
              const c = getProjectColor(p.id);
              return (
                <div key={p.id} className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded ${c.bg}`}></span>
                  <span className="font-medium text-neutral-700 truncate max-w-[140px]">{p.name}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-600"></span> Active</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Maintenance</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-neutral-300"></span> Weekend</span>
          </div>
        </div>
      </div>

      {/* ALLOCATION DETAILS POPUP / MODAL */}
      <AnimatePresence>
        {selectedAllocation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarRange className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-neutral-900">Allocation Schedule Details</h3>
                </div>
                <button onClick={() => setSelectedAllocation(null)} className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex items-start gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 font-bold">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-neutral-900">{selectedAllocation.asset?.name || 'Asset'}</h4>
                    <p className="text-xs font-mono text-neutral-500 mt-0.5">{selectedAllocation.asset?.assetTag} • {selectedAllocation.asset?.type}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-100 text-indigo-700">
                      {selectedAllocation.status || 'Active'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                    <span className="text-[11px] font-semibold text-neutral-400 block uppercase">Project</span>
                    <span className="font-bold text-neutral-900 mt-0.5 block">{selectedAllocation.project?.name || 'General Deployment'}</span>
                    {selectedAllocation.project?.code && <span className="text-xs text-neutral-500 font-mono">{selectedAllocation.project.code}</span>}
                  </div>

                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                    <span className="text-[11px] font-semibold text-neutral-400 block uppercase">Site Location</span>
                    <span className="font-bold text-neutral-900 mt-0.5 block flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                      {selectedAllocation.site?.name || 'Unassigned Site'}
                    </span>
                  </div>

                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                    <span className="text-[11px] font-semibold text-neutral-400 block uppercase">Start Date</span>
                    <span className="font-bold text-neutral-900 mt-0.5 block">
                      {selectedAllocation.startDate ? new Date(selectedAllocation.startDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>

                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                    <span className="text-[11px] font-semibold text-neutral-400 block uppercase">End Date</span>
                    <span className="font-bold text-neutral-900 mt-0.5 block">
                      {selectedAllocation.endDate ? new Date(selectedAllocation.endDate).toLocaleDateString() : 'Ongoing'}
                    </span>
                  </div>
                </div>

                {selectedAllocation.employee && (
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      {selectedAllocation.employee.firstName?.[0] || 'U'}
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400 font-semibold block uppercase">Assigned Operator</span>
                      <span className="font-bold text-neutral-900 text-sm">
                        {selectedAllocation.employee.firstName} {selectedAllocation.employee.lastName}
                      </span>
                    </div>
                  </div>
                )}

                {selectedAllocation.notes && (
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                    <span className="text-[11px] font-semibold text-neutral-400 block uppercase">Notes / Instructions</span>
                    <p className="text-xs text-neutral-600 mt-1">{selectedAllocation.notes}</p>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
                {selectedAllocation.id > 0 && (
                  <button 
                    onClick={() => handleDeleteAllocation(selectedAllocation.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Allocation
                  </button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  {selectedAllocation.id > 0 && (
                    <button 
                      onClick={() => handleOpenEditModal(selectedAllocation)}
                      className="bg-white border border-neutral-300 hover:border-indigo-600 text-neutral-700 px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit Schedule
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedAllocation(null)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SCHEDULE ALLOCATION MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/80 flex items-center justify-between">
                <h3 className="font-bold text-neutral-900 text-base">
                  {isEditing ? 'Edit Asset Allocation Schedule' : 'Schedule Asset Allocation'}
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-neutral-400 hover:text-neutral-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAllocation} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-neutral-700 mb-1">Asset / Equipment *</label>
                    <select 
                      required
                      value={allocationForm.assetId} 
                      onChange={e => setAllocationForm({...allocationForm, assetId: e.target.value})}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-indigo-500/20 bg-white"
                    >
                      <option value="">-- Select Asset --</option>
                      {assets.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.assetTag}) - {a.type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">Target Project *</label>
                    <select 
                      required
                      value={allocationForm.projectId} 
                      onChange={e => setAllocationForm({...allocationForm, projectId: e.target.value})}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-indigo-500/20 bg-white"
                    >
                      <option value="">-- Select Project --</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.code || 'Project'})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">Target Site *</label>
                    <select 
                      required
                      value={allocationForm.siteId} 
                      onChange={e => setAllocationForm({...allocationForm, siteId: e.target.value})}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-indigo-500/20 bg-white"
                    >
                      <option value="">-- Select Site --</option>
                      {sites.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.location || 'Site'})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">Start Date *</label>
                    <input 
                      type="date" 
                      required
                      value={allocationForm.startDate} 
                      onChange={e => setAllocationForm({...allocationForm, startDate: e.target.value})}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">End Date (Optional)</label>
                    <input 
                      type="date" 
                      value={allocationForm.endDate} 
                      onChange={e => setAllocationForm({...allocationForm, endDate: e.target.value})}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">Assigned Operator (Optional)</label>
                    <select 
                      value={allocationForm.employeeId} 
                      onChange={e => setAllocationForm({...allocationForm, employeeId: e.target.value})}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-indigo-500/20 bg-white"
                    >
                      <option value="">-- None (Site pool) --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.jobTitle || 'Staff'})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">Schedule Status</label>
                    <select 
                      value={allocationForm.status} 
                      onChange={e => setAllocationForm({...allocationForm, status: e.target.value})}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-indigo-500/20 bg-white"
                    >
                      <option value="active">Active (Currently Deployed)</option>
                      <option value="scheduled">Scheduled (Upcoming)</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-neutral-700 mb-1">Operational Notes / Work Order</label>
                    <textarea 
                      rows={2}
                      placeholder="e.g., Required for foundation piling phase and civil inspection..." 
                      value={allocationForm.notes} 
                      onChange={e => setAllocationForm({...allocationForm, notes: e.target.value})}
                      className="w-full text-sm px-3.5 py-2 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-indigo-500/20"
                    ></textarea>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100 text-sm font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
                  >
                    {isSubmitting ? 'Saving...' : (isEditing ? 'Update Schedule' : 'Confirm Allocation')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
