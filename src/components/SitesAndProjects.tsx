import React, { useEffect, useState, useMemo } from 'react';
import { 
  MapPin, Plus, X, Edit, Briefcase, Search, Building2, Home, Navigation,
  LayoutGrid, List, Globe, Calendar, CheckCircle2, Clock, MapPinned, ExternalLink
} from 'lucide-react';
import { Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';

export default function SitesAndProjects() {
  const [activeTab, setActiveTab] = useState<'sites' | 'projects' | 'map'>('sites');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  const [sites, setSites] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [accommodations, setAccommodations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationClientFilter, setLocationClientFilter] = useState('');
  
  const [isSiteFormOpen, setIsSiteFormOpen] = useState(false);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  
  const [siteForm, setSiteForm] = useState({ id: null, code: '', name: '', location: '', address: '', cityRegion: '', gpsCoordinates: '', latitude: '', longitude: '', description: '', status: 'active' });
  const [projectForm, setProjectForm] = useState({ id: null, code: '', name: '', client: '', description: '', location: '', address: '', gpsCoordinates: '', latitude: '', longitude: '', startDate: '', endDate: '', status: 'active' });

  // Map state
  const [activeMapMarker, setActiveMapMarker] = useState<{ type: 'site' | 'project' | 'acc'; data: any } | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = (window as any)._token;
      const headers = { Authorization: `Bearer ${token}` };
      const [siteRes, projRes, accRes] = await Promise.all([
        fetch('/api/sites', { headers }),
        fetch('/api/projects', { headers }),
        fetch('/api/accommodations', { headers }),
      ]);
      if (siteRes.ok) setSites(await siteRes.json());
      if (projRes.ok) setProjects(await projRes.json());
      if (accRes.ok) setAccommodations(await accRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSiteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = (window as any)._token;
      const method = siteForm.id ? 'PUT' : 'POST';
      const url = siteForm.id ? `/api/sites/${siteForm.id}` : '/api/sites';
      
      const payload: any = { ...siteForm };
      if (!payload.latitude && payload.gpsCoordinates?.includes(',')) {
        payload.latitude = payload.gpsCoordinates.split(',')[0].trim();
        payload.longitude = payload.gpsCoordinates.split(',')[1].trim();
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsSiteFormOpen(false);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = (window as any)._token;
      const method = projectForm.id ? 'PUT' : 'POST';
      const url = projectForm.id ? `/api/projects/${projectForm.id}` : '/api/projects';
      
      const payload = { ...projectForm };
      if (!payload.startDate) payload.startDate = null as any;
      if (!payload.endDate) payload.endDate = null as any;
      if (!payload.latitude && payload.gpsCoordinates?.includes(',')) {
        payload.latitude = payload.gpsCoordinates.split(',')[0].trim();
        payload.longitude = payload.gpsCoordinates.split(',')[1].trim();
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsProjectFormOpen(false);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };
  
  const openEditSite = (site: any) => {
    setSiteForm({
      ...site,
      latitude: site.latitude || (site.gpsCoordinates ? site.gpsCoordinates.split(',')[0].trim() : ''),
      longitude: site.longitude || (site.gpsCoordinates ? site.gpsCoordinates.split(',')[1]?.trim() : ''),
    });
    setIsSiteFormOpen(true);
  };
  
  const openEditProject = (proj: any) => {
    setProjectForm({ 
      ...proj, 
      latitude: proj.latitude || (proj.gpsCoordinates ? proj.gpsCoordinates.split(',')[0].trim() : ''),
      longitude: proj.longitude || (proj.gpsCoordinates ? proj.gpsCoordinates.split(',')[1]?.trim() : ''),
      startDate: proj.startDate ? new Date(proj.startDate).toISOString().split('T')[0] : '',
      endDate: proj.endDate ? new Date(proj.endDate).toISOString().split('T')[0] : ''
    });
    setIsProjectFormOpen(true);
  };

  const filteredSites = sites.filter((item: any) => {
    const term = searchTerm.toLowerCase();
    const matchSearch = (item.name && String(item.name).toLowerCase().includes(term)) || 
                        (item.location && String(item.location).toLowerCase().includes(term)) ||
                        (item.code && String(item.code).toLowerCase().includes(term));
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    const matchLoc = locationClientFilter ? item.location === locationClientFilter : true;
    return matchSearch && matchStatus && matchLoc;
  });
  
  const uniqueLocations = Array.from(new Set(sites.map(s => s.location).filter(Boolean)));
  const uniqueClients = Array.from(new Set(projects.map(p => p.client).filter(Boolean)));
  
  const filteredProjects = projects.filter((item: any) => {
    const term = searchTerm.toLowerCase();
    const matchSearch = (item.name && String(item.name).toLowerCase().includes(term)) ||
                        (item.code && String(item.code).toLowerCase().includes(term)) ||
                        (item.client && String(item.client).toLowerCase().includes(term));
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    const matchClient = locationClientFilter ? item.client === locationClientFilter : true;
    return matchSearch && matchStatus && matchClient;
  });

  // Parsed coordinates for Google Map
  const mapSites = useMemo(() => {
    return sites.map(s => {
      const lat = parseFloat(String(s.latitude || s.gpsCoordinates?.split(',')[0] || ''));
      const lng = parseFloat(String(s.longitude || s.gpsCoordinates?.split(',')[1] || ''));
      if (!isNaN(lat) && !isNaN(lng)) {
        return { ...s, parsedLat: lat, parsedLng: lng };
      }
      return null;
    }).filter(Boolean) as any[];
  }, [sites]);

  const mapProjects = useMemo(() => {
    return projects.map(p => {
      const lat = parseFloat(String(p.latitude || p.gpsCoordinates?.split(',')[0] || ''));
      const lng = parseFloat(String(p.longitude || p.gpsCoordinates?.split(',')[1] || ''));
      if (!isNaN(lat) && !isNaN(lng)) {
        return { ...p, parsedLat: lat, parsedLng: lng };
      }
      return null;
    }).filter(Boolean) as any[];
  }, [projects]);

  const mapAccommodations = useMemo(() => {
    return accommodations.map(a => {
      const lat = parseFloat(String(a.latitude || a.gpsCoordinates?.split(',')[0] || ''));
      const lng = parseFloat(String(a.longitude || a.gpsCoordinates?.split(',')[1] || ''));
      if (!isNaN(lat) && !isNaN(lng)) {
        return { ...a, parsedLat: lat, parsedLng: lng };
      }
      return null;
    }).filter(Boolean) as any[];
  }, [accommodations]);

  const mapCenter = useMemo(() => {
    if (mapSites.length > 0) return { lat: mapSites[0].parsedLat, lng: mapSites[0].parsedLng };
    if (mapProjects.length > 0) return { lat: mapProjects[0].parsedLat, lng: mapProjects[0].parsedLng };
    return { lat: 24.6877, lng: 46.7219 };
  }, [mapSites, mapProjects]);

  const tabClass = (tabId: string) => `
    flex items-center gap-2 px-5 py-3 font-semibold text-xs tracking-tight transition-all shrink-0 cursor-pointer ${
      activeTab === tabId 
        ? 'border-b-2 border-neutral-900 text-neutral-900 font-bold bg-neutral-50/60' 
        : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50/30'
    }`;

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6 relative">
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Sites & Projects</h1>
          <p className="text-neutral-500 font-medium text-xs mt-1">Manage physical job sites, regional project developments, and geotagged operational zones.</p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'sites' && !isSiteFormOpen && (
            <button 
              onClick={() => { 
                setSiteForm({ id: null, code: '', name: '', location: '', address: '', cityRegion: '', gpsCoordinates: '', latitude: '', longitude: '', description: '', status: 'active' }); 
                setIsSiteFormOpen(true); 
              }} 
              className="bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Site
            </button>
          )}
          {activeTab === 'projects' && !isProjectFormOpen && (
            <button 
              onClick={() => { 
                setProjectForm({ id: null, code: '', name: '', client: '', description: '', location: '', address: '', gpsCoordinates: '', latitude: '', longitude: '', startDate: '', endDate: '', status: 'active' }); 
                setIsProjectFormOpen(true); 
              }} 
              className="bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Project
            </button>
          )}
        </div>
      </div>

      {/* Executive KPI Summary Stat Cards Banner (Matching Accommodations Styling) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
              Operational Sites
            </span>
            <span className="text-2xl font-black text-neutral-900 mt-1 block">
              {sites.length}
            </span>
            <span className="text-[11px] text-neutral-500 mt-0.5 block">
              {sites.filter(s => s.status === 'active').length} Active Field Locations
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <MapPin className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
              Contract Projects
            </span>
            <span className="text-2xl font-black text-indigo-600 mt-1 block">
              {projects.length}
            </span>
            <span className="text-[11px] text-neutral-500 mt-0.5 block">
              {projects.filter(p => p.status === 'active').length} Active Developments
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
              Active Regions
            </span>
            <span className="text-2xl font-black text-blue-600 mt-1 block">
              {uniqueLocations.length || 1}
            </span>
            <span className="text-[11px] text-neutral-500 mt-0.5 block">
              GCC Regional Coverage
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
              Geotagged Pinned
            </span>
            <span className="text-2xl font-black text-orange-600 mt-1 block">
              {mapSites.length + mapProjects.length}
            </span>
            <span className="text-[11px] text-neutral-500 mt-0.5 block">
              Google Maps Verified
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <Navigation className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Primary Navigation & Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-2.5 rounded-2xl border border-neutral-200/90 shadow-2xs">
        <div className="flex items-center gap-1 border-b md:border-b-0 border-neutral-200 w-full md:w-auto">
          <button onClick={() => setActiveTab('sites')} className={tabClass('sites')}>
            <MapPin className="w-4 h-4 text-emerald-600" />
            Sites ({sites.length})
          </button>
          <button onClick={() => setActiveTab('projects')} className={tabClass('projects')}>
            <Briefcase className="w-4 h-4 text-indigo-600" />
            Projects ({projects.length})
          </button>
          <button onClick={() => setActiveTab('map')} className={tabClass('map')}>
            <Navigation className="w-4 h-4 text-orange-600" />
            Google Map ({mapSites.length + mapProjects.length} Pinned)
          </button>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input 
              type="text" 
              placeholder={activeTab === 'sites' ? "Search sites, codes, regions..." : "Search projects, clients..."}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-neutral-50/60 text-xs text-neutral-900 placeholder:text-neutral-400"
            />
          </div>

          {activeTab !== 'map' && (
            <>
              <select 
                value={locationClientFilter} 
                onChange={e => setLocationClientFilter(e.target.value)}
                className="px-3 py-1.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white text-xs font-medium text-neutral-700"
              >
                <option value="">{activeTab === 'sites' ? 'All Locations' : 'All Clients'}</option>
                {activeTab === 'sites' 
                  ? uniqueLocations.map((loc: any) => <option key={loc} value={loc}>{loc}</option>)
                  : uniqueClients.map((client: any) => <option key={client} value={client}>{client}</option>)
                }
              </select>

              <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white text-xs font-medium text-neutral-700"
              >
                <option value="">All Statuses</option>
                {activeTab === 'sites' ? (
                  <>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="completed">Completed</option>
                  </>
                ) : (
                  <>
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </>
                )}
              </select>

              {/* View Switcher: Grid vs Table (Matching Accommodations standard) */}
              <div className="flex items-center bg-neutral-100 p-0.5 rounded-xl border border-neutral-200/60">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                  title="Card Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    viewMode === 'table'
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                  title="Table List View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-[400px] md:min-h-0 overflow-y-auto custom-scrollbar bg-white rounded-2xl border border-neutral-200 shadow-sm">
        
        {/* SITES TAB */}
        {activeTab === 'sites' && !isSiteFormOpen && (
          viewMode === 'grid' ? (
            <div className="p-5">
              {filteredSites.length === 0 ? (
                <div className="text-center py-16 text-neutral-500">
                  <MapPin className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                  <p className="font-semibold text-sm">No construction sites match your filter</p>
                  <p className="text-xs text-neutral-400 mt-1">Try resetting search keywords or create a new site.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredSites.map(site => (
                    <div
                      key={site.id}
                      className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between"
                    >
                      <div>
                        {/* Top Row: Code Badge and Status */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {site.code || 'SITE'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              site.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-neutral-100 text-neutral-600'
                            }`}
                          >
                            {site.status}
                          </span>
                        </div>

                        {/* Site Name */}
                        <h3 className="font-bold text-neutral-900 text-base tracking-tight mb-1">
                          {site.name}
                        </h3>

                        {/* Location Details */}
                        <div className="flex items-start gap-1.5 text-xs text-neutral-500 mb-3">
                          <MapPin className="w-3.5 h-3.5 text-neutral-400 mt-0.5 shrink-0" />
                          <div>
                            <span className="font-semibold text-neutral-700">
                              {site.location || 'Saudi Arabia'}
                            </span>
                            {site.cityRegion && (
                              <span className="text-[11px] text-neutral-500 ml-1">
                                • {site.cityRegion}
                              </span>
                            )}
                            {site.address && (
                              <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">{site.address}</p>
                            )}
                          </div>
                        </div>

                        {/* Specs Box (Matching Accommodation Capacity specs) */}
                        <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 space-y-2 mb-3">
                          <div className="grid grid-cols-3 gap-2 text-center text-xs">
                            <div className="border-r border-neutral-200 pr-1">
                              <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Code</span>
                              <span className="font-bold text-neutral-800 text-xs font-mono">{site.code || '-'}</span>
                            </div>
                            <div className="border-r border-neutral-200 pr-1">
                              <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Region</span>
                              <span className="font-bold text-neutral-800 text-xs truncate block">{site.cityRegion || site.location || 'KSA'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase text-neutral-400 block font-semibold">GPS</span>
                              <span className={`font-bold text-xs ${site.gpsCoordinates || site.latitude ? 'text-emerald-600' : 'text-neutral-400'}`}>
                                {site.gpsCoordinates || site.latitude ? 'Geotagged' : 'Pending'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {site.description && (
                          <p className="text-xs text-neutral-500 line-clamp-2 mb-3 bg-neutral-50/50 p-2 rounded-lg border border-neutral-100">
                            {site.description}
                          </p>
                        )}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('map');
                            const sMatch = mapSites.find(ms => ms.id === site.id);
                            if (sMatch) setActiveMapMarker({ type: 'site', data: sMatch });
                          }}
                          className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5 text-orange-500" />
                          View on Map
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditSite(site)}
                          className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Edit Site
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 sticky top-0 z-10 border-b border-neutral-200 text-neutral-500 font-semibold uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Site Name</th>
                  <th className="px-6 py-3">Location / City</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredSites.map(site => (
                  <tr key={site.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-neutral-600 font-mono text-xs">{site.code || 'N/A'}</td>
                    <td className="px-6 py-4 font-bold text-neutral-900">{site.name}</td>
                    <td className="px-6 py-4 text-neutral-500">{site.location} {site.cityRegion && `(${site.cityRegion})`}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${site.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-neutral-100 text-neutral-700'}`}>{site.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openEditSite(site)} className="text-neutral-400 hover:text-neutral-900 transition-colors p-1 cursor-pointer"><Edit className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {/* PROJECTS TAB */}
        {activeTab === 'projects' && !isProjectFormOpen && (
          viewMode === 'grid' ? (
            <div className="p-5">
              {filteredProjects.length === 0 ? (
                <div className="text-center py-16 text-neutral-500">
                  <Briefcase className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                  <p className="font-semibold text-sm">No projects match your filter</p>
                  <p className="text-xs text-neutral-400 mt-1">Try resetting search keywords or create a new project.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredProjects.map(proj => (
                    <div
                      key={proj.id}
                      className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between"
                    >
                      <div>
                        {/* Top Row: Code Badge and Status */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {proj.code || 'PRJ'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              proj.status === 'active'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-neutral-100 text-neutral-600'
                            }`}
                          >
                            {proj.status}
                          </span>
                        </div>

                        {/* Project Name */}
                        <h3 className="font-bold text-neutral-900 text-base tracking-tight mb-1">
                          {proj.name}
                        </h3>

                        {/* Client & Location Details */}
                        <div className="flex items-start gap-1.5 text-xs text-neutral-500 mb-3">
                          <Building2 className="w-3.5 h-3.5 text-neutral-400 mt-0.5 shrink-0" />
                          <div>
                            <span className="font-semibold text-neutral-700">
                              Client: {proj.client || 'Direct Contract'}
                            </span>
                            {proj.location && (
                              <p className="text-[11px] text-neutral-400 mt-0.5">{proj.location}</p>
                            )}
                          </div>
                        </div>

                        {/* Specs Box (Matching Accommodation Capacity specs) */}
                        <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 space-y-2 mb-3">
                          <div className="grid grid-cols-3 gap-2 text-center text-xs">
                            <div className="border-r border-neutral-200 pr-1">
                              <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Client</span>
                              <span className="font-bold text-neutral-800 text-xs truncate block">{proj.client || 'N/A'}</span>
                            </div>
                            <div className="border-r border-neutral-200 pr-1">
                              <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Start Date</span>
                              <span className="font-bold text-neutral-800 text-xs truncate block">
                                {proj.startDate ? new Date(proj.startDate).toLocaleDateString() : 'TBD'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Timeline</span>
                              <span className="font-bold text-indigo-700 text-xs truncate block">
                                {proj.endDate ? new Date(proj.endDate).toLocaleDateString() : 'Ongoing'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {proj.description && (
                          <p className="text-xs text-neutral-500 line-clamp-2 mb-3 bg-neutral-50/50 p-2 rounded-lg border border-neutral-100">
                            {proj.description}
                          </p>
                        )}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('map');
                            const pMatch = mapProjects.find(mp => mp.id === proj.id);
                            if (pMatch) setActiveMapMarker({ type: 'project', data: pMatch });
                          }}
                          className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5 text-indigo-500" />
                          View on Map
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditProject(proj)}
                          className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Edit Project
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 sticky top-0 z-10 border-b border-neutral-200 text-neutral-500 font-semibold uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Project Name</th>
                  <th className="px-6 py-3">Client</th>
                  <th className="px-6 py-3">Dates</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredProjects.map(proj => (
                  <tr key={proj.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-neutral-600 font-mono text-xs">{proj.code || 'N/A'}</td>
                    <td className="px-6 py-4 font-bold text-neutral-900">{proj.name}</td>
                    <td className="px-6 py-4 text-neutral-500">{proj.client || 'N/A'}</td>
                    <td className="px-6 py-4 text-neutral-500 text-xs">
                      {proj.startDate ? new Date(proj.startDate).toLocaleDateString() : 'TBD'} - {proj.endDate ? new Date(proj.endDate).toLocaleDateString() : 'Ongoing'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${proj.status === 'active' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-neutral-100 text-neutral-700'}`}>{proj.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openEditProject(proj)} className="text-neutral-400 hover:text-neutral-900 transition-colors p-1 cursor-pointer"><Edit className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {/* GOOGLE MAP VIEW TAB */}
        {activeTab === 'map' && !isSiteFormOpen && !isProjectFormOpen && (
          <div className="h-[600px] w-full relative">
            <Map
              mapId="DEMO_MAP_ID"
              defaultCenter={mapCenter}
              defaultZoom={6}
              gestureHandling="greedy"
              className="w-full h-full rounded-2xl"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            >
              {/* Construction Sites */}
              {mapSites.map(s => (
                <AdvancedMarker
                  key={`site-${s.id}`}
                  position={{ lat: s.parsedLat, lng: s.parsedLng }}
                  onClick={() => setActiveMapMarker({ type: 'site', data: s })}
                  title={`Site: ${s.name}`}
                >
                  <div className="cursor-pointer transform hover:scale-110 transition-transform">
                    <div className="p-2 rounded-xl bg-blue-600 text-white shadow-lg border-2 border-white flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                  </div>
                </AdvancedMarker>
              ))}

              {/* Projects */}
              {mapProjects.map(p => (
                <AdvancedMarker
                  key={`proj-${p.id}`}
                  position={{ lat: p.parsedLat, lng: p.parsedLng }}
                  onClick={() => setActiveMapMarker({ type: 'project', data: p })}
                  title={`Project: ${p.name}`}
                >
                  <div className="cursor-pointer transform hover:scale-110 transition-transform">
                    <div className="p-2 rounded-xl bg-purple-600 text-white shadow-lg border-2 border-white flex items-center justify-center">
                      <Briefcase className="w-4 h-4" />
                    </div>
                  </div>
                </AdvancedMarker>
              ))}

              {/* Nearby Accommodations */}
              {mapAccommodations.map(a => (
                <AdvancedMarker
                  key={`acc-${a.id}`}
                  position={{ lat: a.parsedLat, lng: a.parsedLng }}
                  onClick={() => setActiveMapMarker({ type: 'acc', data: a })}
                  title={`Accommodation: ${a.name}`}
                >
                  <div className="cursor-pointer transform hover:scale-110 transition-transform">
                    <div className="p-2 rounded-xl bg-orange-500 text-white shadow-md border-2 border-white flex items-center justify-center">
                      <Home className="w-4 h-4" />
                    </div>
                  </div>
                </AdvancedMarker>
              ))}

              {/* Marker InfoWindow */}
              {activeMapMarker && (
                <InfoWindow
                  position={{ lat: activeMapMarker.data.parsedLat, lng: activeMapMarker.data.parsedLng }}
                  onCloseClick={() => setActiveMapMarker(null)}
                >
                  <div className="p-2 max-w-xs text-xs text-neutral-900">
                    {activeMapMarker.type === 'site' && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" /> Construction Site
                        </span>
                        <h4 className="font-bold text-sm">{activeMapMarker.data.name}</h4>
                        <p className="text-neutral-500">{activeMapMarker.data.location || activeMapMarker.data.cityRegion || 'Regional Site'}</p>
                        <p className="text-[11px] text-neutral-400 font-mono">GPS: {activeMapMarker.data.parsedLat}, {activeMapMarker.data.parsedLng}</p>
                        <button
                          onClick={() => {
                            openEditSite(activeMapMarker.data);
                            setActiveMapMarker(null);
                          }}
                          className="mt-2 w-full py-1 px-2 bg-neutral-900 text-white rounded-lg text-xs font-semibold"
                        >
                          Edit Site Details
                        </button>
                      </div>
                    )}

                    {activeMapMarker.type === 'project' && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5" /> Project
                        </span>
                        <h4 className="font-bold text-sm">{activeMapMarker.data.name}</h4>
                        <p className="text-neutral-500">Client: {activeMapMarker.data.client || 'Internal Project'}</p>
                        <button
                          onClick={() => {
                            openEditProject(activeMapMarker.data);
                            setActiveMapMarker(null);
                          }}
                          className="mt-2 w-full py-1 px-2 bg-neutral-900 text-white rounded-lg text-xs font-semibold"
                        >
                          Edit Project Details
                        </button>
                      </div>
                    )}

                    {activeMapMarker.type === 'acc' && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 flex items-center gap-1">
                          <Home className="w-3.5 h-3.5" /> Staff Housing
                        </span>
                        <h4 className="font-bold text-sm">{activeMapMarker.data.name}</h4>
                        <p className="text-neutral-500">{activeMapMarker.data.location || activeMapMarker.data.address || 'Housing Facility'}</p>
                        <div className="bg-orange-50 text-orange-800 p-1.5 rounded text-[11px] font-medium">
                          Admit Capacity: {activeMapMarker.data.totalCapacity || activeMapMarker.data.totalAdmitCapacity || 0} Beds
                        </div>
                      </div>
                    )}
                  </div>
                </InfoWindow>
              )}
            </Map>
          </div>
        )}

        {/* ADD / EDIT SITE FORM */}
        {isSiteFormOpen && (
           <div className="p-8">
             <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-xl text-neutral-900">{siteForm.id ? 'Edit Site' : 'Add New Site'}</h3>
               <button type="button" onClick={() => setIsSiteFormOpen(false)} className="text-neutral-400 hover:text-neutral-600"><X className="w-5 h-5" /></button>
             </div>
             <form onSubmit={handleSiteSubmit} className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="text-sm font-semibold text-neutral-700 block mb-1">Site Code</label>
                   <input className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none" value={siteForm.code || ''} onChange={e=>setSiteForm({...siteForm, code: e.target.value})} placeholder="e.g. SITE-001" />
                 </div>
                 <div>
                   <label className="text-sm font-semibold text-neutral-700 block mb-1">Site Name <span className="text-red-500">*</span></label>
                   <input required className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none" value={siteForm.name || ''} onChange={e=>setSiteForm({...siteForm, name: e.target.value})} />
                 </div>
                 <div>
                   <label className="text-sm font-semibold text-neutral-700 block mb-1">Status</label>
                   <select className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none" value={siteForm.status || ''} onChange={e=>setSiteForm({...siteForm, status: e.target.value})}>
                     <option value="active">Active</option>
                     <option value="inactive">Inactive</option>
                     <option value="completed">Completed</option>
                   </select>
                 </div>
                 <div>
                   <label className="text-sm font-semibold text-neutral-700 block mb-1">Location (General Area)</label>
                   <input className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none" value={siteForm.location || ''} onChange={e=>setSiteForm({...siteForm, location: e.target.value})} placeholder="e.g. North Zone" />
                 </div>
                 <div className="md:col-span-2">
                   <label className="text-sm font-semibold text-neutral-700 block mb-1">Full Address</label>
                   <input className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none" value={siteForm.address || ''} onChange={e=>setSiteForm({...siteForm, address: e.target.value})} placeholder="123 Example St" />
                 </div>
                 <div>
                   <label className="text-sm font-semibold text-neutral-700 block mb-1">City / Region</label>
                   <input className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none" value={siteForm.cityRegion || ''} onChange={e=>setSiteForm({...siteForm, cityRegion: e.target.value})} />
                 </div>
                 <div>
                   <label className="text-sm font-semibold text-neutral-700 block mb-1">GPS Coordinates (Google Maps)</label>
                   <input className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none font-mono" value={siteForm.gpsCoordinates || ''} onChange={e=>setSiteForm({...siteForm, gpsCoordinates: e.target.value})} placeholder="e.g. 24.6318, 46.7725" />
                 </div>
                 <div>
                   <label className="text-sm font-semibold text-neutral-700 block mb-1">Latitude</label>
                   <input className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none font-mono" value={siteForm.latitude || ''} onChange={e=>setSiteForm({...siteForm, latitude: e.target.value})} placeholder="24.6318" />
                 </div>
                 <div>
                   <label className="text-sm font-semibold text-neutral-700 block mb-1">Longitude</label>
                   <input className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none font-mono" value={siteForm.longitude || ''} onChange={e=>setSiteForm({...siteForm, longitude: e.target.value})} placeholder="46.7725" />
                 </div>
                 <div className="md:col-span-2">
                   <label className="text-sm font-semibold text-neutral-700 block mb-1">Description / Notes</label>
                   <textarea className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none" rows={3} value={siteForm.description || ''} onChange={e=>setSiteForm({...siteForm, description: e.target.value})}></textarea>
                 </div>
               </div>
               <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                 <button type="button" onClick={() => setIsSiteFormOpen(false)} className="px-6 py-2 rounded-lg font-medium text-neutral-600 hover:bg-neutral-100">Cancel</button>
                 <button type="submit" className="bg-neutral-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-neutral-800">{siteForm.id ? 'Save Changes' : 'Create Site'}</button>
               </div>
             </form>
           </div>
        )}

        {/* ADD / EDIT PROJECT FORM */}
        {isProjectFormOpen && (
           <div className="p-8">
             <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-xl text-neutral-900">{projectForm.id ? 'Edit Project' : 'Add New Project'}</h3>
               <button type="button" onClick={() => setIsProjectFormOpen(false)} className="text-neutral-400 hover:text-neutral-600"><X className="w-5 h-5" /></button>
             </div>
             <form onSubmit={handleProjectSubmit} className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="text-sm font-semibold text-neutral-700 block mb-1">Project Code</label>
                   <input className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none" value={projectForm.code || ''} onChange={e=>setProjectForm({...projectForm, code: e.target.value})} placeholder="e.g. PRJ-001" />
                 </div>
                 <div>
                   <label className="text-sm font-semibold text-neutral-700 block mb-1">Project Name <span className="text-red-500">*</span></label>
                   <input required className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none" value={projectForm.name || ''} onChange={e=>setProjectForm({...projectForm, name: e.target.value})} />
                 </div>
                 <div>
                   <label className="text-sm font-semibold text-neutral-700 block mb-1">Client</label>
                   <input className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none" value={projectForm.client || ''} onChange={e=>setProjectForm({...projectForm, client: e.target.value})} placeholder="Client Name" />
                 </div>
                 <div>
                   <label className="text-sm font-semibold text-neutral-700 block mb-1">Status</label>
                   <select className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none" value={projectForm.status || ''} onChange={e=>setProjectForm({...projectForm, status: e.target.value})}>
                     <option value="planning">Planning</option>
                     <option value="active">Active</option>
                     <option value="on-hold">On Hold</option>
                     <option value="completed">Completed</option>
                     <option value="cancelled">Cancelled</option>
                   </select>
                 </div>
                 <div>
                   <label className="text-sm font-semibold text-neutral-700 block mb-1">Location / Area</label>
                   <input className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none" value={projectForm.location || ''} onChange={e=>setProjectForm({...projectForm, location: e.target.value})} placeholder="Project Location" />
                 </div>
                 <div>
                   <label className="text-sm font-semibold text-neutral-700 block mb-1">GPS Coordinates (Google Maps)</label>
                   <input className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none font-mono" value={projectForm.gpsCoordinates || ''} onChange={e=>setProjectForm({...projectForm, gpsCoordinates: e.target.value})} placeholder="e.g. 24.7136, 46.6753" />
                 </div>
                 <div>
                   <label className="text-sm font-semibold text-neutral-700 block mb-1">Latitude</label>
                   <input className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none font-mono" value={projectForm.latitude || ''} onChange={e=>setProjectForm({...projectForm, latitude: e.target.value})} placeholder="24.7136" />
                 </div>
                 <div>
                   <label className="text-sm font-semibold text-neutral-700 block mb-1">Longitude</label>
                   <input className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none font-mono" value={projectForm.longitude || ''} onChange={e=>setProjectForm({...projectForm, longitude: e.target.value})} placeholder="46.6753" />
                 </div>
                 <div>
                   <label className="text-sm font-semibold text-neutral-700 block mb-1">Start Date</label>
                   <input type="date" className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none" value={projectForm.startDate || ''} onChange={e=>setProjectForm({...projectForm, startDate: e.target.value})} />
                 </div>
                 <div>
                   <label className="text-sm font-semibold text-neutral-700 block mb-1">End Date</label>
                   <input type="date" className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none" value={projectForm.endDate || ''} onChange={e=>setProjectForm({...projectForm, endDate: e.target.value})} />
                 </div>
                 <div className="md:col-span-2">
                   <label className="text-sm font-semibold text-neutral-700 block mb-1">Description / Scope</label>
                   <textarea className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none" rows={3} value={projectForm.description || ''} onChange={e=>setProjectForm({...projectForm, description: e.target.value})}></textarea>
                 </div>
               </div>
               <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                 <button type="button" onClick={() => setIsProjectFormOpen(false)} className="px-6 py-2 rounded-lg font-medium text-neutral-600 hover:bg-neutral-100">Cancel</button>
                 <button type="submit" className="bg-neutral-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-neutral-800">{projectForm.id ? 'Save Changes' : 'Create Project'}</button>
               </div>
             </form>
           </div>
        )}
      </div>
    </div>
  );
}
