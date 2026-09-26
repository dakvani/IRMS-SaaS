import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, X, Truck, Wrench, Calendar, User, Clock, 
  MapPin, ShieldCheck, ChevronRight, AlertTriangle, 
  Building2, Users, FileText, CheckCircle2, 
  ArrowRight, Phone, Car, Gauge, Fuel, Briefcase, 
  History, Sparkles, Filter, ExternalLink, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustodyRecord {
  id: number;
  startDate: string;
  endDate?: string | null;
  status: string;
  notes?: string | null;
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    employeeId: string;
    jobTitle?: string | null;
    mobile?: string | null;
    profilePhotoUrl?: string | null;
  } | null;
  site?: { id: number; name: string } | null;
  project?: { id: number; name: string } | null;
}

interface MaintenanceRecord {
  id: number;
  serviceDate: string;
  technicianNotes: string;
  downtimeDays?: number | null;
  status: string;
}

interface VehicleSearchResult {
  id: number;
  name: string;
  assetTag: string;
  type: string;
  status: string;
  make?: string | null;
  model?: string | null;
  licensePlate?: string | null;
  year?: number | null;
  vin?: string | null;
  purchasePrice?: number | null;
  purchaseDate?: string | null;
  lastMaintenanceDate?: string | null;
  maintenanceIntervalDays?: number | null;
  photoUrl?: string | null;
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    employeeId: string;
    jobTitle?: string | null;
    mobile?: string | null;
    profilePhotoUrl?: string | null;
  } | null;
  site?: { id: number; name: string } | null;
  custodyHistory?: CustodyRecord[];
  maintenanceHistory?: MaintenanceRecord[];
}

interface DashboardUniversalSearchProps {
  onOpenDossier: (employeeId: number) => void;
  onNavigateToAsset?: (assetId: number, type: string) => void;
}

export default function DashboardUniversalSearch({ onOpenDossier, onNavigateToAsset }: DashboardUniversalSearchProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'vehicles' | 'assets' | 'employees' | 'accommodations' | 'projects'>('all');
  const [expandedVehicleId, setExpandedVehicleId] = useState<number | null>(null);
  const [vehicleModalData, setVehicleModalData] = useState<VehicleSearchResult | null>(null);
  
  const [searchResults, setSearchResults] = useState<{
    vehicles: VehicleSearchResult[];
    assets: VehicleSearchResult[];
    employees: any[];
    accommodations: any[];
    rooms: any[];
    projects: any[];
    sites: any[];
  }>({
    vehicles: [],
    assets: [],
    employees: [],
    accommodations: [],
    rooms: [],
    projects: [],
    sites: []
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Suggested quick search chips
  const quickSearchPills = [
    { label: '4812 BXD', desc: 'Toyota Hilux Service Pickup', icon: Truck },
    { label: '3920 LKD', desc: 'Isuzu D-Max Crew Pickup', icon: Truck },
    { label: '7731 RHA', desc: 'Toyota Land Cruiser V6', icon: Car },
    { label: '9182 JED', desc: 'Hyundai Transit 12-Seater', icon: Car },
    { label: 'Al-Noor Staff Compound', desc: 'Accommodations', icon: Building2 },
    { label: 'Ahmed Al-Harbi', desc: 'Fleet Operations Custodian', icon: User },
  ];

  // Debounced API search execution
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSearchResults({
        vehicles: [],
        assets: [],
        employees: [],
        accommodations: [],
        rooms: [],
        projects: [],
        sites: []
      });
      setIsLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const token = (window as any)._token;
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults({
            vehicles: data.vehicles || [],
            assets: data.assets || [],
            employees: data.employees || [],
            accommodations: data.accommodations || [],
            rooms: data.rooms || [],
            projects: data.projects || [],
            sites: data.sites || []
          });

          // Auto-expand first vehicle if searching by plate or car name
          if (data.vehicles && data.vehicles.length > 0) {
            setExpandedVehicleId(data.vehicles[0].id);
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Search fetch error:', err);
        }
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const totalResultsCount = useMemo(() => {
    return (
      searchResults.vehicles.length +
      searchResults.assets.length +
      searchResults.employees.length +
      searchResults.accommodations.length +
      searchResults.rooms.length +
      searchResults.projects.length +
      searchResults.sites.length
    );
  }, [searchResults]);

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-sm overflow-hidden transition-all duration-300">
      {/* Search Header Banner */}
      <div className="p-5 md:p-6 border-b border-neutral-100 bg-linear-to-r from-neutral-50/80 via-white to-neutral-50/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Search className="w-4 h-4" />
              </span>
              <h2 className="text-lg md:text-xl font-bold text-neutral-900 tracking-tight">
                Universal Operations & Asset Search
              </h2>
            </div>
            <p className="text-xs md:text-sm text-neutral-500 mt-1 font-medium">
              Search any vehicle plate number, service pickup, asset tag, employee, site, or accommodation to view full 360° history.
            </p>
          </div>

          {query.trim().length >= 2 && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-neutral-600 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200">
                {isLoading ? 'Searching...' : `${totalResultsCount} Matches Found`}
              </span>
              <button
                onClick={() => setQuery('')}
                className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 px-2.5 py-1 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>

        {/* Primary Interactive Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type vehicle plate number (e.g. 4812 BXD), pickup, Hilux, asset tag, employee name, compound..."
            className="w-full pl-12 pr-12 py-3.5 text-sm md:text-base border border-neutral-200 rounded-xl bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 text-neutral-900 placeholder:text-neutral-400 font-medium transition-all"
          />
          {isLoading && (
            <div className="absolute right-12 top-3.5">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent"></div>
            </div>
          )}
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-3.5 text-neutral-400 hover:text-neutral-700 p-1 rounded-full hover:bg-neutral-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        {query.trim().length < 2 && (
          <div className="mt-3.5 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" /> Quick Query:
            </span>
            {quickSearchPills.map((pill, i) => {
              const Icon = pill.icon;
              return (
                <button
                  key={i}
                  onClick={() => setQuery(pill.label)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white hover:bg-indigo-50/80 text-neutral-700 hover:text-indigo-900 text-xs font-semibold border border-neutral-200/80 shadow-2xs hover:border-indigo-200 transition-all cursor-pointer group"
                >
                  <Icon className="w-3.5 h-3.5 text-neutral-400 group-hover:text-indigo-600 transition-colors" />
                  <span>{pill.label}</span>
                  <span className="text-[10px] text-neutral-400 group-hover:text-indigo-500 font-normal">
                    ({pill.desc})
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Filter Tabs when search query is active */}
      {query.trim().length >= 2 && (
        <div className="px-5 md:px-6 pt-3 pb-2 border-b border-neutral-100 bg-neutral-50/50 flex items-center gap-2 overflow-x-auto custom-scrollbar text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-neutral-900 text-white shadow-2xs'
                : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200/80'
            }`}
          >
            All Results ({totalResultsCount})
          </button>
          {searchResults.vehicles.length > 0 && (
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'vehicles'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200/80'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              Vehicles & Pickups ({searchResults.vehicles.length})
            </button>
          )}
          {searchResults.assets.length > 0 && (
            <button
              onClick={() => setActiveTab('assets')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'assets'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200/80'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              Equipment & Assets ({searchResults.assets.length})
            </button>
          )}
          {searchResults.employees.length > 0 && (
            <button
              onClick={() => setActiveTab('employees')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'employees'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200/80'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Employees & Drivers ({searchResults.employees.length})
            </button>
          )}
          {(searchResults.accommodations.length > 0 || searchResults.rooms.length > 0) && (
            <button
              onClick={() => setActiveTab('accommodations')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'accommodations'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200/80'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Accommodations ({searchResults.accommodations.length + searchResults.rooms.length})
            </button>
          )}
          {(searchResults.projects.length > 0 || searchResults.sites.length > 0) && (
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'projects'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200/80'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              Sites & Projects ({searchResults.projects.length + searchResults.sites.length})
            </button>
          )}
        </div>
      )}

      {/* Search Results Display Area */}
      {query.trim().length >= 2 && (
        <div className="p-5 md:p-6 space-y-6">
          {totalResultsCount === 0 && !isLoading && (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-neutral-900">No matching records found</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
                No vehicles, pickups, equipment, employees, accommodations, or sites match "{query}". Try checking plate number formatting or searching by make/model.
              </p>
            </div>
          )}

          {/* 1. VEHICLES & SERVICE PICKUPS 360° CARDS */}
          {(activeTab === 'all' || activeTab === 'vehicles') && searchResults.vehicles.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                      Fleet Vehicles & Service Pickups ({searchResults.vehicles.length})
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      Showing complete vehicle identity, assigned custodian, usage history, and maintenance logs
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {searchResults.vehicles.map((v) => (
                  <VehicleDetailedCard
                    key={v.id}
                    vehicle={v}
                    isExpanded={expandedVehicleId === v.id}
                    onToggleExpand={() => setExpandedVehicleId(expandedVehicleId === v.id ? null : v.id)}
                    onOpenDossier={onOpenDossier}
                    onViewFullModal={() => setVehicleModalData(v)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 2. EQUIPMENT & INDUSTRIAL ASSETS */}
          {(activeTab === 'all' || activeTab === 'assets') && searchResults.assets.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                    Equipment & Industrial Assets ({searchResults.assets.length})
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Heavy machinery, power tools, generators, and field apparatus
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <span className="font-mono text-xs font-bold text-neutral-700 bg-neutral-100 px-2.5 py-1 rounded-lg border border-neutral-200">
                          {asset.assetTag}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          asset.status?.toLowerCase() === 'available'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : asset.status?.toLowerCase() === 'assigned'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {asset.status || 'Available'}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-neutral-900 tracking-tight leading-snug">
                        {asset.name}
                      </h4>
                      <p className="text-xs text-neutral-500 mt-1">
                        {asset.type || 'Equipment'} {asset.make ? `• ${asset.make}` : ''} {asset.model ? `• ${asset.model}` : ''}
                      </p>

                      <div className="mt-4 pt-3 border-t border-neutral-100 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-neutral-400 block">Assigned Custodian</span>
                          <span className="font-semibold text-neutral-800 truncate block mt-0.5">
                            {asset.employee ? `${asset.employee.firstName} ${asset.employee.lastName}` : 'Unassigned (In Depot)'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-neutral-400 block">Site / Depot</span>
                          <span className="font-semibold text-neutral-800 truncate block mt-0.5">
                            {asset.site?.name || 'Central Warehouse'}
                          </span>
                        </div>
                      </div>

                      {/* Maintenance badge */}
                      <div className="mt-3 p-2 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between text-xs">
                        <span className="text-neutral-500 flex items-center gap-1">
                          <History className="w-3.5 h-3.5 text-neutral-400" />
                          Maintenance Records:
                        </span>
                        <span className="font-bold text-neutral-800">
                          {asset.maintenanceHistory?.length || 0} logged
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                      {asset.employee && (
                        <button
                          onClick={() => onOpenDossier(asset.employee!.id)}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                          <User className="w-3.5 h-3.5" /> View Custodian
                        </button>
                      )}
                      <button
                        onClick={() => setVehicleModalData(asset)}
                        className="ml-auto text-xs font-bold text-neutral-900 hover:text-neutral-700 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                      >
                        Inspect History <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. EMPLOYEES & WORKFORCE */}
          {(activeTab === 'all' || activeTab === 'employees') && searchResults.employees.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                    Workforce Personnel ({searchResults.employees.length})
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Staff profiles, driver credentials, and 360° assignment records
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.employees.map((emp) => (
                  <div
                    key={emp.id}
                    className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs hover:shadow-md transition-all p-4 flex flex-col justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-neutral-900 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-xs">
                        {emp.firstName?.[0] || 'E'}{emp.lastName?.[0] || ''}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-neutral-900 truncate">
                            {emp.firstName} {emp.lastName}
                          </h4>
                          <span className="font-mono text-[11px] font-semibold text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">
                            {emp.employeeId}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5 truncate">
                          {emp.jobTitle || 'Technician'} • {emp.department || 'Operations'}
                        </p>
                        {emp.mobile && (
                          <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-neutral-400" /> {emp.mobile}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        emp.status?.toLowerCase() === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}>
                        {emp.status || 'Active'}
                      </span>
                      <button
                        onClick={() => onOpenDossier(emp.id)}
                        className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>360° Master Dossier</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. ACCOMMODATIONS & HOUSING PROPERTIES */}
          {(activeTab === 'all' || activeTab === 'accommodations') && (searchResults.accommodations.length > 0 || searchResults.rooms.length > 0) && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                    Staff Accommodations & Rooms ({searchResults.accommodations.length + searchResults.rooms.length})
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Housing complexes, modular staff camps, and dormitory units
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.accommodations.map((acc) => (
                  <div
                    key={acc.id}
                    className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          {acc.type || 'Staff Compound'}
                        </span>
                        <span className="text-xs font-bold text-neutral-700">
                          Cap: {acc.totalCapacity || 0} Beds
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-neutral-900 tracking-tight">
                        {acc.name}
                      </h4>
                      <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        {acc.location || acc.address || 'Saudi Arabia'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                      <span className="text-neutral-500">
                        {acc.totalRooms || 0} Configured Rooms
                      </span>
                      <a
                        href="/staff-accommodation"
                        className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        Open Accommodation Tab <ChevronRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}

                {searchResults.rooms.map((room) => (
                  <div
                    key={room.id}
                    className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs font-bold text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded">
                          Room {room.roomNumber}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {room.status || 'Available'}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        {room.building ? `Building: ${room.building} • ` : ''}Capacity: {room.capacity} Beds ({room.roomType || 'Standard'})
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-neutral-100 flex justify-end">
                      <a
                        href="/staff-accommodation"
                        className="text-xs font-semibold text-neutral-700 hover:text-neutral-950 flex items-center gap-1"
                      >
                        Manage in Accommodation <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. SITES & PROJECTS */}
          {(activeTab === 'all' || activeTab === 'projects') && (searchResults.projects.length > 0 || searchResults.sites.length > 0) && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                    Sites & Construction Projects ({searchResults.projects.length + searchResults.sites.length})
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Active client projects, work packages, and operating sites
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          {proj.code}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                          {proj.status || 'Active'}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-neutral-900 tracking-tight">
                        {proj.name}
                      </h4>
                      <p className="text-xs text-neutral-500 mt-1">
                        Client: {proj.client || 'Enterprise'} {proj.location ? `• ${proj.location}` : ''}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-end">
                      <a href="/projects" className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1">
                        Open Project Details <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}

                {searchResults.sites.map((st) => (
                  <div
                    key={st.id}
                    className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-5 flex flex-col justify-between"
                  >
                    <div>
                      <span className="font-mono text-xs font-bold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded">
                        {st.code || 'SITE'}
                      </span>
                      <h4 className="text-base font-bold text-neutral-900 tracking-tight mt-2">
                        {st.name}
                      </h4>
                      <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                        {st.cityRegion || st.address || 'Saudi Arabia'}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-end">
                      <a href="/projects" className="text-xs font-semibold text-neutral-700 hover:text-neutral-900 flex items-center gap-1">
                        View Site <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FULL VEHICLE / ASSET 360° INSPECTION MODAL */}
      <AnimatePresence>
        {vehicleModalData && (
          <VehicleFullInspectionModal
            vehicle={vehicleModalData}
            onClose={() => setVehicleModalData(null)}
            onOpenDossier={onOpenDossier}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// -------------------------------------------------------------
// VEHICLE DETAILED CARD COMPONENT
// -------------------------------------------------------------
function VehicleDetailedCard({
  vehicle,
  isExpanded,
  onToggleExpand,
  onOpenDossier,
  onViewFullModal
}: {
  key?: any;
  vehicle: VehicleSearchResult;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onOpenDossier: (employeeId: number) => void;
  onViewFullModal: () => void;
}) {
  const isAssigned = !!vehicle.employee;
  const custodyHistory = vehicle.custodyHistory || [];
  const maintenanceHistory = vehicle.maintenanceHistory || [];

  return (
    <div className="bg-neutral-50/70 border border-indigo-100/90 rounded-2xl p-5 shadow-2xs hover:border-indigo-300 transition-all space-y-4">
      {/* Top Banner: Plate number, Make/Model, Status */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-neutral-200/80">
        <div className="flex items-start sm:items-center gap-3.5">
          {/* Saudi Style License Plate Badge */}
          <div className="bg-white border-2 border-neutral-900 rounded-xl px-3 py-1.5 shadow-xs flex flex-col items-center justify-center min-w-[110px] shrink-0">
            <span className="text-[9px] uppercase tracking-widest font-black text-neutral-400">
              KSA • السعودية
            </span>
            <span className="font-mono text-sm sm:text-base font-black text-neutral-950 tracking-wider">
              {vehicle.licensePlate || 'N/A'}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-base sm:text-lg font-bold text-neutral-950 tracking-tight">
                {vehicle.make} {vehicle.model || vehicle.name}
              </h4>
              <span className="font-mono text-xs font-semibold text-neutral-600 bg-white px-2 py-0.5 rounded-md border border-neutral-200">
                {vehicle.assetTag}
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                vehicle.status?.toLowerCase() === 'assigned' || isAssigned
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : vehicle.status?.toLowerCase() === 'maintenance'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-neutral-200 text-neutral-800'
              }`}>
                {isAssigned ? 'Active Assigned' : vehicle.status || 'Available'}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-1 text-xs text-neutral-600 flex-wrap">
              <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                {vehicle.type || 'Service Pickup'}
              </span>
              {vehicle.year && <span>Model Year: {vehicle.year}</span>}
              {vehicle.vin && <span className="font-mono text-[11px] text-neutral-500">VIN: {vehicle.vin}</span>}
              {vehicle.site && (
                <span className="flex items-center gap-1 text-neutral-500">
                  <MapPin className="w-3 h-3 text-neutral-400" />
                  {vehicle.site.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          <button
            onClick={onViewFullModal}
            className="px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-neutral-600" />
            <span>Full History Report</span>
          </button>
          <button
            onClick={onToggleExpand}
            className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
          >
            <span>{isExpanded ? 'Collapse 360° View' : 'Inspect 360° History'}</span>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </div>

      {/* Currently Assigned Driver Banner */}
      <div className="bg-white rounded-xl p-3.5 border border-neutral-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
            {vehicle.employee ? `${vehicle.employee.firstName?.[0] || ''}${vehicle.employee.lastName?.[0] || ''}` : <User className="w-5 h-5 text-white" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                Current Custodian / Driver:
              </span>
              {vehicle.employee ? (
                <span className="text-xs font-bold text-neutral-900">
                  {vehicle.employee.firstName} {vehicle.employee.lastName}
                </span>
              ) : (
                <span className="text-xs font-semibold text-neutral-500 italic">
                  No active driver assigned (In Fleet Pool)
                </span>
              )}
            </div>
            {vehicle.employee && (
              <p className="text-xs text-neutral-500 mt-0.5">
                Badge: <span className="font-mono font-semibold text-neutral-700">{vehicle.employee.employeeId}</span> • {vehicle.employee.jobTitle || 'Technician'} {vehicle.employee.mobile ? `• ${vehicle.employee.mobile}` : ''}
              </p>
            )}
          </div>
        </div>

        {vehicle.employee && (
          <button
            onClick={() => onOpenDossier(vehicle.employee!.id)}
            className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <User className="w-3.5 h-3.5" />
            <span>Driver Master Dossier</span>
          </button>
        )}
      </div>

      {/* Expandable 360° Section: Custody History & Maintenance History */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="pt-2 space-y-4"
        >
          {/* Two column layout: Past Drivers & Service History */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* COLUMN 1: USAGE & DRIVER CUSTODY HISTORY ("Who Used It") */}
            <div className="bg-white rounded-xl p-4 border border-neutral-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-indigo-600" />
                  Driver & Custody History (Who Used It)
                </h5>
                <span className="text-[11px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                  {custodyHistory.length} Recorded Stints
                </span>
              </div>

              {custodyHistory.length === 0 ? (
                <p className="text-xs text-neutral-400 py-3 text-center italic">
                  No previous assignment logs recorded for this vehicle.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                  {custodyHistory.map((rec, i) => (
                    <div
                      key={rec.id || i}
                      className="p-3 rounded-lg bg-neutral-50 border border-neutral-200/70 hover:bg-indigo-50/30 transition-colors flex flex-col gap-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-neutral-900">
                          {rec.employee ? `${rec.employee.firstName} ${rec.employee.lastName}` : 'Fleet Operations Team'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          rec.status?.toLowerCase() === 'active'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-neutral-200 text-neutral-700'
                        }`}>
                          {rec.status === 'active' ? 'Current Driver' : 'Completed / Returned'}
                        </span>
                      </div>

                      <div className="text-neutral-500 flex items-center gap-2 flex-wrap text-[11px]">
                        {rec.employee && (
                          <span className="font-mono text-neutral-600 bg-white px-1.5 py-0.2 rounded border border-neutral-200">
                            {rec.employee.employeeId}
                          </span>
                        )}
                        <span>
                          From: <strong className="text-neutral-700">{rec.startDate}</strong>
                        </span>
                        <span>
                          To: <strong className="text-neutral-700">{rec.endDate || 'Present (Active)'}</strong>
                        </span>
                      </div>

                      {(rec.site || rec.project || rec.notes) && (
                        <div className="text-[11px] text-neutral-600 pt-1 border-t border-neutral-200/50 flex items-center gap-2 flex-wrap">
                          {rec.site && <span>Site: {rec.site.name}</span>}
                          {rec.project && <span>• Proj: {rec.project.name}</span>}
                          {rec.notes && <span className="text-neutral-500 italic">• "{rec.notes}"</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* COLUMN 2: MAINTENANCE & SERVICE HISTORY */}
            <div className="bg-white rounded-xl p-4 border border-neutral-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-emerald-600" />
                  Maintenance & Service Records
                </h5>
                <span className="text-[11px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                  {maintenanceHistory.length} Service Logs
                </span>
              </div>

              {maintenanceHistory.length === 0 ? (
                <p className="text-xs text-neutral-400 py-3 text-center italic">
                  No maintenance records logged yet. Vehicle is operating on standard factory schedule.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                  {maintenanceHistory.map((m, i) => (
                    <div
                      key={m.id || i}
                      className="p-3 rounded-lg bg-neutral-50 border border-neutral-200/70 hover:bg-emerald-50/30 transition-colors flex flex-col gap-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-neutral-900">
                          {m.serviceDate}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          m.status?.toLowerCase() === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.status?.toLowerCase() === 'in_progress'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {m.status || 'Completed'}
                        </span>
                      </div>

                      <p className="text-neutral-700 font-medium">
                        {m.technicianNotes}
                      </p>

                      <div className="text-[11px] text-neutral-500 flex items-center justify-between pt-1 border-t border-neutral-200/50">
                        <span>
                          Downtime: <strong className="text-neutral-700">{m.downtimeDays || 0} days</strong>
                        </span>
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Certified Inspection
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// FULL VEHICLE 360° INSPECTION MODAL / DRAWER
// -------------------------------------------------------------
function VehicleFullInspectionModal({
  vehicle,
  onClose,
  onOpenDossier
}: {
  vehicle: VehicleSearchResult;
  onClose: () => void;
  onOpenDossier: (empId: number) => void;
}) {
  const custodyHistory = vehicle.custodyHistory || [];
  const maintenanceHistory = vehicle.maintenanceHistory || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="bg-white rounded-2xl border border-neutral-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-neutral-200 bg-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white">
              <Truck className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {vehicle.make} {vehicle.model || vehicle.name}
                </h3>
                <span className="bg-indigo-600 text-white text-xs font-mono font-bold px-2 py-0.5 rounded">
                  {vehicle.licensePlate || 'KSA'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Asset Tag: {vehicle.assetTag} • {vehicle.type || 'Fleet Vehicle'} • Official 360° History Record
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-center">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">Plate Number</span>
              <span className="text-sm font-black text-neutral-900 font-mono mt-0.5 block">{vehicle.licensePlate || 'N/A'}</span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-center">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">Model Year</span>
              <span className="text-sm font-black text-neutral-900 mt-0.5 block">{vehicle.year || 2024}</span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-center">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">Current Status</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                {vehicle.status || 'Active Assigned'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-center">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">Downtime Total</span>
              <span className="text-sm font-black text-neutral-900 mt-0.5 block">
                {maintenanceHistory.reduce((acc, m) => acc + (m.downtimeDays || 0), 0)} Days
              </span>
            </div>
          </div>

          {/* Current Custodian */}
          {vehicle.employee && (
            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-800 tracking-wider">
                  Active Driver / Assigned Custodian
                </span>
                <h4 className="text-sm font-bold text-indigo-950 mt-0.5">
                  {vehicle.employee.firstName} {vehicle.employee.lastName} ({vehicle.employee.employeeId})
                </h4>
                <p className="text-xs text-indigo-700 mt-0.5">
                  {vehicle.employee.jobTitle || 'Technician'} • {vehicle.employee.mobile || 'Contact via HR'}
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenDossier(vehicle.employee!.id);
                }}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                Open Dossier
              </button>
            </div>
          )}

          {/* Driver Usage History Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
              <User className="w-4 h-4 text-indigo-600" />
              Complete Driver Assignment Logs ({custodyHistory.length})
            </h4>
            <div className="border border-neutral-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-100 text-neutral-600 font-bold uppercase text-[10px] border-b border-neutral-200">
                  <tr>
                    <th className="py-2.5 px-3">Driver / Custodian</th>
                    <th className="py-2.5 px-3">Start Date</th>
                    <th className="py-2.5 px-3">End Date</th>
                    <th className="py-2.5 px-3">Site / Purpose</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {custodyHistory.map((rec, i) => (
                    <tr key={i} className="hover:bg-neutral-50">
                      <td className="py-2.5 px-3 font-semibold text-neutral-900">
                        {rec.employee ? `${rec.employee.firstName} ${rec.employee.lastName}` : 'Operations'}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-600">{rec.startDate}</td>
                      <td className="py-2.5 px-3 text-neutral-600">{rec.endDate || 'Active (Current)'}</td>
                      <td className="py-2.5 px-3 text-neutral-500">
                        {rec.site?.name || rec.notes || 'Field Operations'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          rec.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {custodyHistory.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-neutral-400">
                        No previous custody records logged.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Maintenance Logs Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-emerald-600" />
              Service & Inspection History ({maintenanceHistory.length})
            </h4>
            <div className="border border-neutral-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-100 text-neutral-600 font-bold uppercase text-[10px] border-b border-neutral-200">
                  <tr>
                    <th className="py-2.5 px-3">Service Date</th>
                    <th className="py-2.5 px-3">Technician Notes</th>
                    <th className="py-2.5 px-3">Downtime</th>
                    <th className="py-2.5 px-3">Inspection Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {maintenanceHistory.map((m, i) => (
                    <tr key={i} className="hover:bg-neutral-50">
                      <td className="py-2.5 px-3 font-semibold text-neutral-900">{m.serviceDate}</td>
                      <td className="py-2.5 px-3 text-neutral-700">{m.technicianNotes}</td>
                      <td className="py-2.5 px-3 text-neutral-600">{m.downtimeDays || 0} days</td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {maintenanceHistory.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-neutral-400">
                        No service logs recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <span className="text-xs text-neutral-500 font-medium">
            System Vehicle ID: #{vehicle.id} • Registered under Saudi Arabia Fleet Operations
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Close 360° Inspector
          </button>
        </div>
      </motion.div>
    </div>
  );
}
