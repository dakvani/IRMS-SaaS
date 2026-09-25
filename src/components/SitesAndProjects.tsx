import React, { useEffect, useState, useMemo } from 'react';
import { MapPin, Plus, X, Edit, Briefcase, Search, Building2, Home, Navigation } from 'lucide-react';
import { Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';

export default function SitesAndProjects() {
  const [activeTab, setActiveTab] = useState<'sites' | 'projects' | 'map'>('sites');
  
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

  const tabClass = (tabId: string) => 
    `px-4 py-3 font-medium text-sm flex items-center gap-2 transition-colors ${
      activeTab === tabId 
        ? 'border-b-2 border-indigo-600 text-indigo-700' 
        : 'text-neutral-500 hover:text-neutral-700'
    }`;

  if (isLoading) return <div className="p-8 text-neutral-500">Loading data...</div>;

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Sites & Projects</h1>
          <p className="text-neutral-500 font-medium mt-1">Manage physical locations and ongoing projects.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 w-full max-w-2xl">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input 
                type="text" 
                placeholder={activeTab === 'sites' ? "Search sites..." : "Search projects..."}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white shadow-sm transition-all"
              />
            </div>
            <select 
              value={locationClientFilter} 
              onChange={e => setLocationClientFilter(e.target.value)}
              className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white shadow-sm text-sm font-medium text-neutral-700"
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
              className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white shadow-sm text-sm font-medium text-neutral-700"
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
          </div>
          {activeTab === 'sites' && !isSiteFormOpen && (
            <button onClick={() => { setSiteForm({ id: null, code: '', name: '', location: '', address: '', cityRegion: '', gpsCoordinates: '', description: '', status: 'active' }); setIsSiteFormOpen(true); }} className="bg-neutral-900 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Site
            </button>
          )}
          {activeTab === 'projects' && !isProjectFormOpen && (
            <button onClick={() => { setProjectForm({ id: null, code: '', name: '', client: '', description: '', startDate: '', endDate: '', status: 'active' }); setIsProjectFormOpen(true); }} className="bg-neutral-900 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Project
            </button>
          )}
        </div>
      </div>
      
      <div className="flex border-b border-neutral-200">
        <button onClick={() => setActiveTab('sites')} className={tabClass('sites')}>
          <MapPin className="w-4 h-4" />
          Sites ({sites.length})
        </button>
        <button onClick={() => setActiveTab('projects')} className={tabClass('projects')}>
          <Briefcase className="w-4 h-4" />
          Projects ({projects.length})
        </button>
        <button onClick={() => setActiveTab('map')} className={tabClass('map')}>
          <Navigation className="w-4 h-4 text-orange-600" />
          Google Map View ({mapSites.length + mapProjects.length} Pinned)
        </button>
      </div>

      <div className="flex-1 min-h-[400px] md:min-h-0 overflow-y-auto custom-scrollbar bg-white rounded-2xl border border-neutral-200 shadow-sm">
        
        {/* SITES TAB */}
        {activeTab === 'sites' && !isSiteFormOpen && (
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
                  <td className="px-6 py-4 font-medium text-neutral-600">{site.code || 'N/A'}</td>
                  <td className="px-6 py-4 font-medium text-neutral-900">{site.name}</td>
                  <td className="px-6 py-4 text-neutral-500">{site.location} {site.cityRegion && `(${site.cityRegion})`}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${site.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-700'}`}>{site.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEditSite(site)} className="text-neutral-400 hover:text-indigo-600 transition-colors p-1"><Edit className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* PROJECTS TAB */}
        {activeTab === 'projects' && !isProjectFormOpen && (
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
                  <td className="px-6 py-4 font-medium text-neutral-600">{proj.code || 'N/A'}</td>
                  <td className="px-6 py-4 font-medium text-neutral-900">{proj.name}</td>
                  <td className="px-6 py-4 text-neutral-500">{proj.client || 'N/A'}</td>
                  <td className="px-6 py-4 text-neutral-500">
                    {proj.startDate ? new Date(proj.startDate).toLocaleDateString() : 'TBD'} - {proj.endDate ? new Date(proj.endDate).toLocaleDateString() : 'Ongoing'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${proj.status === 'active' ? 'bg-indigo-100 text-indigo-700' : 'bg-neutral-100 text-neutral-700'}`}>{proj.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEditProject(proj)} className="text-neutral-400 hover:text-indigo-600 transition-colors p-1"><Edit className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
