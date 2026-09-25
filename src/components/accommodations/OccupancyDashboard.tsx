import React, { useState, useMemo } from 'react';
import {
  Building2, Bed, Users, AlertTriangle, ShieldCheck, FileDown,
  Search, Filter, MapPin, ArrowRight, UserCheck, CheckCircle2,
  TrendingUp, AlertCircle, ArrowUpRight, ChevronRight, SlidersHorizontal
} from 'lucide-react';

interface OccupancyDashboardProps {
  accommodations: any[];
  rooms: any[];
  admissions: any[];
  sites: any[];
  projects: any[];
  onAdmitStaff: (acc?: any) => void;
  onViewRooms: (accId: number) => void;
  onOpenPdfReport: (location?: string) => void;
}

export default function OccupancyDashboard({
  accommodations,
  rooms,
  admissions,
  sites,
  projects,
  onAdmitStaff,
  onViewRooms,
  onOpenPdfReport,
}: OccupancyDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [occupancyThreshold, setOccupancyThreshold] = useState<'all' | 'near-capacity' | 'moderate' | 'healthy'>('all');
  const [sortBy, setSortBy] = useState<'occupancy-desc' | 'occupancy-asc' | 'capacity-desc' | 'available-desc'>('occupancy-desc');

  // Enrich accommodations with calculated occupancy percentages
  const enrichedAccommodations = useMemo(() => {
    return accommodations.map((acc) => {
      const capacity = acc.totalCapacity || acc.totalAdmitCapacity || 0;
      const occupied = acc.occupiedBeds || 0;
      const available = acc.availableBeds ?? Math.max(0, capacity - occupied);
      const rate = capacity > 0 ? Math.round((occupied / capacity) * 100) : 0;
      const isCritical = rate >= 90;
      const isNearCapacity = rate >= 80;

      return {
        ...acc,
        capacity,
        occupied,
        available,
        rate,
        isCritical,
        isNearCapacity,
      };
    });
  }, [accommodations]);

  // Near-capacity watchlist (facilities >= 80% occupancy or available beds <= 3 with capacity > 0)
  const nearCapacityFacilities = useMemo(() => {
    return enrichedAccommodations
      .filter((a) => a.capacity > 0 && (a.rate >= 80 || a.available <= 3))
      .sort((a, b) => b.rate - a.rate);
  }, [enrichedAccommodations]);

  // Unique locations for filter
  const locations = useMemo(() => {
    return Array.from(new Set(accommodations.map((a) => a.location).filter(Boolean))).sort();
  }, [accommodations]);

  // Overall metric totals
  const metrics = useMemo(() => {
    const totalProperties = enrichedAccommodations.length;
    const totalCapacity = enrichedAccommodations.reduce((sum, a) => sum + a.capacity, 0);
    const totalOccupied = enrichedAccommodations.reduce((sum, a) => sum + a.occupied, 0);
    const totalAvailable = Math.max(0, totalCapacity - totalOccupied);
    const globalRate = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;
    const criticalCount = enrichedAccommodations.filter((a) => a.isCritical).length;
    const nearCapacityCount = nearCapacityFacilities.length;

    return {
      totalProperties,
      totalCapacity,
      totalOccupied,
      totalAvailable,
      globalRate,
      criticalCount,
      nearCapacityCount,
    };
  }, [enrichedAccommodations, nearCapacityFacilities]);

  // Filtered & Sorted list for the main grid
  const filteredAndSortedAccommodations = useMemo(() => {
    return enrichedAccommodations
      .filter((acc) => {
        const term = searchTerm.toLowerCase();
        const matchSearch =
          !term ||
          acc.name.toLowerCase().includes(term) ||
          (acc.location && acc.location.toLowerCase().includes(term)) ||
          (acc.type && acc.type.toLowerCase().includes(term));
        const matchLoc = !selectedLocation || acc.location === selectedLocation;

        let matchThreshold = true;
        if (occupancyThreshold === 'near-capacity') matchThreshold = acc.rate >= 80;
        else if (occupancyThreshold === 'moderate') matchThreshold = acc.rate >= 50 && acc.rate < 80;
        else if (occupancyThreshold === 'healthy') matchThreshold = acc.rate < 50;

        return matchSearch && matchLoc && matchThreshold;
      })
      .sort((a, b) => {
        if (sortBy === 'occupancy-desc') return b.rate - a.rate;
        if (sortBy === 'occupancy-asc') return a.rate - b.rate;
        if (sortBy === 'capacity-desc') return b.capacity - a.capacity;
        if (sortBy === 'available-desc') return b.available - a.available;
        return 0;
      });
  }, [enrichedAccommodations, searchTerm, selectedLocation, occupancyThreshold, sortBy]);

  return (
    <div className="space-y-6">
      {/* Dashboard Top Header & PDF Export Action */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-orange-500/20 text-orange-300 border border-orange-500/30">
              Operations Intelligence
            </span>
            <span className="text-xs text-neutral-400">Real-Time Occupancy Analytics</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Housing Occupancy & Facility Watchlist
          </h2>
          <p className="text-xs text-neutral-300 max-w-xl mt-1">
            Monitor bed allocations across regional facilities, detect near-capacity camps, and generate location-filtered PDF audits.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onOpenPdfReport(selectedLocation)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md transition-all hover:scale-[1.02]"
          >
            <FileDown className="w-4 h-4" />
            Export Monthly PDF Report
          </button>
        </div>
      </div>

      {/* High-Level Global KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/90 shadow-sm">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
            Global Utilization
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-neutral-900">{metrics.globalRate}%</span>
            <span className="text-[11px] font-medium text-neutral-500">of total beds</span>
          </div>
          <div className="w-full bg-neutral-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                metrics.globalRate >= 85 ? 'bg-red-500' : metrics.globalRate >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${metrics.globalRate}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/90 shadow-sm">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
            Total Capacity
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-neutral-900">{metrics.totalCapacity}</span>
            <span className="text-xs text-neutral-400">Beds</span>
          </div>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            Across {metrics.totalProperties} properties
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/90 shadow-sm">
          <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
            Admitted Residents
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-emerald-700">{metrics.totalOccupied}</span>
            <span className="text-xs text-emerald-600">Occupied</span>
          </div>
          <span className="text-[11px] text-emerald-600 mt-1 block">
            Active staff check-ins
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/90 shadow-sm">
          <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">
            Available Vacancy
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-amber-700">{metrics.totalAvailable}</span>
            <span className="text-xs text-amber-600">Beds free</span>
          </div>
          <span className="text-[11px] text-amber-600 mt-1 block">
            Immediate admission reserve
          </span>
        </div>

        <div className="col-span-2 md:col-span-1 bg-red-50/70 p-4 rounded-2xl border border-red-200 shadow-sm">
          <span className="text-[11px] font-semibold text-red-800 uppercase tracking-wider block flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            Near Capacity
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-red-700">{metrics.nearCapacityCount}</span>
            <span className="text-xs text-red-600">Facilities</span>
          </div>
          <span className="text-[11px] text-red-600 mt-1 block font-medium">
            ≥ 80% Occupancy threshold
          </span>
        </div>
      </div>

      {/* CRITICAL WATCHLIST: LIST OF NEAR-CAPACITY FACILITIES */}
      {nearCapacityFacilities.length > 0 && (
        <div className="bg-white rounded-3xl border-2 border-red-200 shadow-md p-6 overflow-hidden relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-red-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-red-100 text-red-700 rounded-xl animate-pulse">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-neutral-900 text-base">
                    Near-Capacity Warning Watchlist
                  </h3>
                  <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                    {nearCapacityFacilities.length} Urgent
                  </span>
                </div>
                <p className="text-xs text-neutral-500">
                  Facilities reaching bed thresholds. Consider re-routing incoming personnel to nearby lower-occupancy campuses.
                </p>
              </div>
            </div>
            <span className="text-xs text-neutral-500 font-medium self-end sm:self-center">
              Alert Trigger: ≥ 80% Occupancy or ≤ 3 Vacant Beds
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nearCapacityFacilities.map((fac) => (
              <div
                key={fac.id}
                className="bg-red-50/40 hover:bg-red-50/70 rounded-2xl border border-red-200 p-4.5 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-100 text-red-800">
                      {fac.rate >= 90 ? 'Critical Pressure' : 'Near Capacity'}
                    </span>
                    <span className="text-xs font-black text-red-700 bg-white px-2 py-0.5 rounded-md border border-red-200">
                      {fac.rate}% Occupied
                    </span>
                  </div>

                  <h4 className="font-bold text-neutral-900 text-sm mb-1">{fac.name}</h4>
                  <p className="text-xs text-neutral-500 flex items-center gap-1 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                    {fac.location || fac.address || 'Location Area'}
                  </p>

                  {/* Progress Bar */}
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-neutral-700">{fac.occupied} of {fac.capacity} Beds Admitted</span>
                      <span className="text-red-700 font-bold">{fac.available} left</span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-red-600 rounded-full"
                        style={{ width: `${Math.min(100, fac.rate)}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-white p-2 rounded-xl border border-red-100 text-[11px] text-neutral-600 space-y-1 mb-3">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Housing Type:</span>
                      <span className="font-semibold text-neutral-800">{fac.type}</span>
                    </div>
                    {fac.nearSiteName && (
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Assigned Site:</span>
                        <span className="font-semibold text-blue-700 truncate max-w-[150px]">{fac.nearSiteName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-red-100">
                  <button
                    onClick={() => onViewRooms(fac.id)}
                    className="flex-1 py-1.5 px-2 bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 text-xs font-semibold rounded-lg transition-colors text-center"
                  >
                    View Rooms
                  </button>
                  <button
                    onClick={() => onAdmitStaff(fac)}
                    className="py-1.5 px-3 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Admit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FILTER & SORT CONTROLS BAR */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
          <input
            type="text"
            placeholder="Search facility name or location..."
            className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-xl bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {/* Location-based filtering for site administrators */}
          <select
            className="px-3 py-2 border border-neutral-200 rounded-xl bg-white text-neutral-700 font-medium"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            <option value="">All Locations ({locations.length} Areas)</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          {/* Occupancy Rate Filter */}
          <select
            className="px-3 py-2 border border-neutral-200 rounded-xl bg-white text-neutral-700 font-medium"
            value={occupancyThreshold}
            onChange={(e) => setOccupancyThreshold(e.target.value as any)}
          >
            <option value="all">All Occupancy Levels</option>
            <option value="near-capacity">Near Capacity (≥ 80%)</option>
            <option value="moderate">Moderate (50% - 79%)</option>
            <option value="healthy">Healthy Vacancy (&lt; 50%)</option>
          </select>

          {/* Sort By */}
          <select
            className="px-3 py-2 border border-neutral-200 rounded-xl bg-white text-neutral-700 font-medium"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="occupancy-desc">Sort: Highest Occupancy %</option>
            <option value="occupancy-asc">Sort: Lowest Occupancy %</option>
            <option value="capacity-desc">Sort: Largest Capacity</option>
            <option value="available-desc">Sort: Most Vacant Beds</option>
          </select>

          {(searchTerm || selectedLocation || occupancyThreshold !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedLocation('');
                setOccupancyThreshold('all');
              }}
              className="text-neutral-500 hover:text-neutral-900 underline px-2"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* PROPERTY OCCUPANCY PROGRESS BARS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAndSortedAccommodations.map((acc) => {
          return (
            <div
              key={acc.id}
              className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                acc.isCritical
                  ? 'border-red-300 ring-1 ring-red-200'
                  : acc.isNearCapacity
                  ? 'border-amber-300 ring-1 ring-amber-100'
                  : 'border-neutral-200'
              }`}
            >
              <div>
                {/* Header row: Type & Occupancy Badge */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-700">
                    {acc.type}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-full ${
                        acc.isCritical
                          ? 'bg-red-100 text-red-800'
                          : acc.isNearCapacity
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {acc.rate}% Occupancy
                    </span>
                  </div>
                </div>

                <h3 className="font-bold text-neutral-900 text-base tracking-tight mb-1">
                  {acc.name}
                </h3>

                <p className="text-xs text-neutral-500 flex items-center gap-1 mb-4">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span className="truncate">{acc.location || acc.address || 'Regional Facility'}</span>
                </p>

                {/* Visual Progress Bar Section */}
                <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-100 space-y-2 mb-4">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-neutral-700">
                      {acc.occupied} / {acc.capacity} Beds Allotted
                    </span>
                    <span
                      className={`font-bold ${
                        acc.isCritical
                          ? 'text-red-700'
                          : acc.isNearCapacity
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      {acc.available} Beds Vacant
                    </span>
                  </div>

                  {/* Multi-stage Progress Bar */}
                  <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        acc.isCritical
                          ? 'bg-gradient-to-r from-red-500 to-rose-600'
                          : acc.isNearCapacity
                          ? 'bg-gradient-to-r from-amber-400 to-amber-600'
                          : 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                      }`}
                      style={{ width: `${Math.min(100, acc.rate)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-neutral-400 pt-0.5">
                    <span>Rooms: {acc.roomsCount || acc.totalRooms || 0}</span>
                    <span>Beds/Room: {acc.perRoomCapacity || 4}</span>
                    <span className="font-medium text-neutral-600">Cap: {acc.capacity}</span>
                  </div>
                </div>

                {/* Linked Site Information */}
                {acc.nearSiteName && (
                  <div className="text-xs text-blue-700 bg-blue-50/70 border border-blue-100 px-2.5 py-1.5 rounded-lg mb-4 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">
                      Proximity to: <strong>{acc.nearSiteName}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onViewRooms(acc.id)}
                  className="text-xs font-semibold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Bed className="w-3.5 h-3.5 text-neutral-500" />
                  View Rooms
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onOpenPdfReport(acc.location)}
                    className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 p-1.5 rounded-lg transition-colors"
                    title="Export PDF Report for this Location"
                  >
                    <FileDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onAdmitStaff(acc)}
                    className="bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Admit
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredAndSortedAccommodations.length === 0 && (
          <div className="col-span-full p-12 text-center border-2 border-dashed border-neutral-200 rounded-3xl bg-white">
            <Building2 className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <h4 className="font-bold text-neutral-800 text-base">No Matching Facilities</h4>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
              Adjust your search keywords or location filter to inspect other properties.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
