import fs from 'fs';

let code = fs.readFileSync('src/components/SitesAndProjects.tsx', 'utf-8');

// Add states for filtering
const statePattern = /const \[searchTerm, setSearchTerm\] = useState\(''\);/;
code = code.replace(statePattern, 
  `const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationClientFilter, setLocationClientFilter] = useState('');`);

// Update filter logic
const oldSiteFilter = `const filteredSites = sites.filter((item: any) => 
    (item.name && String(item.name).toLowerCase().includes(searchTerm.toLowerCase())) || 
    (item.location && String(item.location).toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.code && String(item.code).toLowerCase().includes(searchTerm.toLowerCase()))
  );`;

const newSiteFilter = `const filteredSites = sites.filter((item: any) => {
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
  `;
code = code.replace(oldSiteFilter, newSiteFilter);

const oldProjFilter = `const filteredProjects = projects.filter((item: any) => 
    (item.name && String(item.name).toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.code && String(item.code).toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.client && String(item.client).toLowerCase().includes(searchTerm.toLowerCase()))
  );`;
  
const newProjFilter = `const filteredProjects = projects.filter((item: any) => {
    const term = searchTerm.toLowerCase();
    const matchSearch = (item.name && String(item.name).toLowerCase().includes(term)) ||
                        (item.code && String(item.code).toLowerCase().includes(term)) ||
                        (item.client && String(item.client).toLowerCase().includes(term));
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    const matchClient = locationClientFilter ? item.client === locationClientFilter : true;
    return matchSearch && matchStatus && matchClient;
  });`;
code = code.replace(oldProjFilter, newProjFilter);

const oldSearchBar = `<div className="relative w-64">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
            />
          </div>`;

const newSearchBar = `<div className="flex items-center gap-3 w-full max-w-2xl">
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
          </div>`;
          
code = code.replace(oldSearchBar, newSearchBar);

// Update colors and visual style
code = code.replace(/text-blue-600/g, 'text-indigo-600');
code = code.replace(/text-blue-700/g, 'text-indigo-700');
code = code.replace(/bg-blue-100/g, 'bg-indigo-100');
code = code.replace(/border-b-2 border-neutral-900 text-neutral-900/, 'border-b-2 border-indigo-600 text-indigo-700');

fs.writeFileSync('src/components/SitesAndProjects.tsx', code);
