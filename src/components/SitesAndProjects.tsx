import React, { useEffect, useState } from 'react';
import { MapPin, Plus, X, Edit, Briefcase, Search } from 'lucide-react';

export default function SitesAndProjects() {
  const [activeTab, setActiveTab] = useState<'sites' | 'projects'>('sites');
  
  const [sites, setSites] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationClientFilter, setLocationClientFilter] = useState('');
  
  const [isSiteFormOpen, setIsSiteFormOpen] = useState(false);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  
  const [siteForm, setSiteForm] = useState({ id: null, code: '', name: '', location: '', address: '', cityRegion: '', gpsCoordinates: '', description: '', status: 'active' });
  const [projectForm, setProjectForm] = useState({ id: null, code: '', name: '', client: '', description: '', startDate: '', endDate: '', status: 'active' });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = (window as any)._token;
      const headers = { Authorization: `Bearer ${token}` };
      const [siteRes, projRes] = await Promise.all([
        fetch('/api/sites', { headers }),
        fetch('/api/projects', { headers })
      ]);
      if (siteRes.ok) setSites(await siteRes.json());
      if (projRes.ok) setProjects(await projRes.json());
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
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(siteForm)
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
    setSiteForm({ ...site });
    setIsSiteFormOpen(true);
  };
  
  const openEditProject = (proj: any) => {
    setProjectForm({ 
      ...proj, 
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
                   <label className="text-sm font-semibold text-neutral-700 block mb-1">Location (General)</label>
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
                   <label className="text-sm font-semibold text-neutral-700 block mb-1">GPS Coordinates</label>
                   <input className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none" value={siteForm.gpsCoordinates || ''} onChange={e=>setSiteForm({...siteForm, gpsCoordinates: e.target.value})} placeholder="Lat, Long" />
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
