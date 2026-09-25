code = """
import React, { useState, useEffect, useMemo } from 'react';
import { Package, Truck, Plus, Clock, X, Search, Printer, ScanLine, Calculator, Wrench, Settings, ArrowRightLeft, LayoutGrid, List, Calendar as CalendarIcon, MapPin, User, FileText, Activity, AlertCircle, FileDown, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

export default function Assets() {
  const [assets, setAssets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Tabs & Views
  const [activeTab, setActiveTab] = useState<'equipment' | 'vehicles' | 'calendar' | 'financial'>('equipment');
  const [viewMode, setViewMode] = useState<'list' | 'icon'>('icon');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'assigned' | 'maintenance'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Bulk selection
  const [selectedAssets, setSelectedAssets] = useState<Set<number>>(new Set());
  const [showBulkPrint, setShowBulkPrint] = useState(false);
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [bulkSiteId, setBulkSiteId] = useState('');

  // Modals
  const [isAdding, setIsAdding] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [assetDetailsTab, setAssetDetailsTab] = useState<'overview' | 'equipment' | 'financial'>('overview');
  const [assetHistory, setAssetHistory] = useState<any[]>([]);
  const [printAsset, setPrintAsset] = useState<any | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ employeeId: '', siteId: '' });

  // Add Asset Form state
  const [assetForm, setAssetForm] = useState<any>({
    name: '', assetTag: '', type: 'Equipment', status: 'available', make: '', model: '', purchasePrice: '', salvageValue: '', usefulLifeYears: 5
  });

  const [categories, setCategories] = useState<string[]>(['Equipment', 'Vehicle', 'Tools', 'IT', 'Heavy Machinery']);

  useEffect(() => {
    fetchData();
    const storedCats = localStorage.getItem('assetCategories');
    if (storedCats) {
      try {
        setCategories(JSON.parse(storedCats));
      } catch (e) {}
    }
  }, []);

  const fetchData = async () => {
    try {
      const token = (window as any)._token;
      const [assetsRes, empRes, sitesRes] = await Promise.all([
        fetch('/api/assets', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/employees', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/sites', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (assetsRes.ok) setAssets(await assetsRes.json());
      if (empRes.ok) setEmployees(await empRes.json());
      if (sitesRes.ok) setSites(await sitesRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssetClick = async (asset: any) => {
    setSelectedAsset(asset);
    setAssetDetailsTab('overview');
    try {
      const token = (window as any)._token;
      const [histRes, maintRes] = await Promise.all([
        fetch(`/api/assets/${asset.id}/history`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/assets/${asset.id}/maintenance`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      let combined = [];
      if (histRes.ok) combined.push(...(await histRes.json()));
      if (maintRes.ok) combined.push(...(await maintRes.json()));
      
      combined.sort((a: any, b: any) => new Date(b.createdAt || b.serviceDate).getTime() - new Date(a.createdAt || a.serviceDate).getTime());
      setAssetHistory(combined);
    } catch (e) {}
  };

  const filteredAssets = useMemo(() => {
    return assets.filter((a: any) => {
      // 1. Tab Filter
      const isVehicle = a.type?.toLowerCase() === 'vehicle';
      if (activeTab === 'equipment' && isVehicle) return false;
      if (activeTab === 'vehicles' && !isVehicle) return false;
      
      // 2. Status Filter
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      
      // 3. Search Filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          a.name?.toLowerCase().includes(term) ||
          a.assetTag?.toLowerCase().includes(term) ||
          a.type?.toLowerCase().includes(term) ||
          a.model?.toLowerCase().includes(term) ||
          a.make?.toLowerCase().includes(term) ||
          (a.employee?.name && a.employee.name.toLowerCase().includes(term)) ||
          (a.site?.name && a.site.name.toLowerCase().includes(term))
        );
      }
      return true;
    });
  }, [assets, activeTab, statusFilter, searchTerm]);

  // Alerts logic
  const alerts = useMemo(() => {
    let list: any[] = [];
    assets.forEach(a => {
       if (a.status === 'maintenance') {
         list.push(`Asset ${a.assetTag} (${a.name}) is currently in maintenance.`);
       }
       if (a.usefulLifeYears && a.purchaseDate) {
          const age = (new Date().getTime() - new Date(a.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
          if (age > a.usefulLifeYears) {
            list.push(`Asset ${a.assetTag} (${a.name}) has exceeded its useful life of ${a.usefulLifeYears} years.`);
          }
       }
    });
    return list;
  }, [assets]);

  const toggleSelect = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(selectedAssets);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedAssets(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedAssets.size === filteredAssets.length) setSelectedAssets(new Set());
    else setSelectedAssets(new Set(filteredAssets.map(a => a.id)));
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = (window as any)._token;
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(assetForm)
      });
      if (res.ok) {
        setIsAdding(false);
        fetchData();
        setAssetForm({name: '', assetTag: '', type: 'Equipment', status: 'available', make: '', model: '', purchasePrice: '', salvageValue: '', usefulLifeYears: 5});
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = (window as any)._token;
      const res = await fetch(`/api/assets/${selectedAsset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          assignedToEmployeeId: assignForm.employeeId ? parseInt(assignForm.employeeId) : null,
          assignedToSiteId: assignForm.siteId ? parseInt(assignForm.siteId) : null,
          status: 'assigned'
        })
      });
      if (res.ok) {
        setShowAssignModal(false);
        fetchData();
        setSelectedAsset(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReturnAsset = async () => {
    try {
      const token = (window as any)._token;
      const res = await fetch(`/api/assets/${selectedAsset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          assignedToEmployeeId: null,
          assignedToSiteId: null,
          status: 'available'
        })
      });
      if (res.ok) {
        fetchData();
        setSelectedAsset(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkAssign = async () => {
    if (!bulkSiteId) return;
    try {
      const token = (window as any)._token;
      const res = await fetch('/api/assets/bulk-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
           assetIds: Array.from(selectedAssets),
           destinationSiteId: parseInt(bulkSiteId)
        })
      });
      if (res.ok) {
        setSelectedAssets(new Set());
        setShowBulkAssign(false);
        fetchData();
      }
    } catch (e) { console.error(e); }
  };

  const generateAuditReport = () => {
    const orig = document.body.innerHTML;
    let reportHtml = `
      <div style="font-family: sans-serif; padding: 40px; color: #111;">
        <h1 style="border-bottom: 2px solid #000; padding-bottom: 10px;">Asset & Maintenance Audit Report</h1>
        <p><strong>Generated On:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Total Assets:</strong> ${assets.length}</p>
        <h2 style="margin-top: 40px;">Assets Inventory</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background: #f4f4f4;">
              <th style="padding: 10px; border: 1px solid #ccc; text-align: left;">ID / Tag</th>
              <th style="padding: 10px; border: 1px solid #ccc; text-align: left;">Name & Type</th>
              <th style="padding: 10px; border: 1px solid #ccc; text-align: left;">Status</th>
              <th style="padding: 10px; border: 1px solid #ccc; text-align: left;">Assignment</th>
            </tr>
          </thead>
          <tbody>
            ${assets.map(a => `
              <tr>
                <td style="padding: 10px; border: 1px solid #ccc;">${a.assetTag}</td>
                <td style="padding: 10px; border: 1px solid #ccc;">${a.name} (${a.type})</td>
                <td style="padding: 10px; border: 1px solid #ccc;">${a.status}</td>
                <td style="padding: 10px; border: 1px solid #ccc;">${a.employee ? a.employee.name : (a.site ? a.site.name : 'Unassigned')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    document.body.innerHTML = reportHtml;
    window.print();
    document.body.innerHTML = orig;
    window.location.reload();
  };

  // CALENDAR MOCK DATA/LOGIC (for demo purposes)
  const calendarEvents = useMemo(() => {
     let events: any[] = [];
     assets.forEach(a => {
        if (a.nextMaintenance) events.push({ date: new Date(a.nextMaintenance), type: 'maintenance', asset: a });
        if (a.expectedReturnDate) events.push({ date: new Date(a.expectedReturnDate), type: 'return', asset: a });
        if (a.warrantyExpiration) events.push({ date: new Date(a.warrantyExpiration), type: 'warranty', asset: a });
     });
     return events;
  }, [assets]);

  const siteData = useMemo(() => {
    const data: any = {};
    assets.forEach(a => {
      if (a.site) {
        if (!data[a.site.name]) data[a.site.name] = 0;
        data[a.site.name] += (a.purchasePrice || 0);
      }
    });
    return Object.keys(data).map(k => ({ name: k, value: data[k] }));
  }, [assets]);

  return (
    <div className="h-full flex flex-col gap-6 relative">
      {alerts.length > 0 && (
         <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-bold text-amber-800 text-sm">Low Stock / Maintenance Alerts ({alerts.length})</h4>
              <ul className="text-xs text-amber-700 mt-1 list-disc pl-4 space-y-1">
                 {alerts.slice(0, 3).map((a, i) => <li key={i}>{a}</li>)}
                 {alerts.length > 3 && <li>...and {alerts.length - 3} more.</li>}
              </ul>
            </div>
         </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-neutral-900 tracking-tight">Asset Management</h2>
          <p className="text-sm text-neutral-500 mt-1">Manage vehicles, equipment, and tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={generateAuditReport} className="bg-white border border-neutral-200 text-neutral-700 px-4 py-2.5 rounded-xl font-medium shadow-sm hover:bg-neutral-50 transition-colors flex items-center gap-2">
            <FileDown className="w-4 h-4" />
            Generate Audit Report
          </button>
          <button onClick={() => setIsAdding(true)} className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm hover:bg-indigo-700 transition-colors flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Asset
          </button>
        </div>
      </div>

      <div className="bg-white p-2 rounded-2xl border border-neutral-100 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar">
          <button onClick={() => setActiveTab('equipment')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === 'equipment' ? 'bg-indigo-50 text-indigo-700' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'}`}><Package className="w-4 h-4" /> Equip & Asset</button>
          <button onClick={() => setActiveTab('vehicles')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === 'vehicles' ? 'bg-indigo-50 text-indigo-700' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'}`}><Truck className="w-4 h-4" /> Vehicles</button>
          <div className="w-px h-6 bg-neutral-200 mx-1"></div>
          <button onClick={() => setActiveTab('calendar')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === 'calendar' ? 'bg-indigo-50 text-indigo-700' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'}`}><CalendarIcon className="w-4 h-4" /> Calendar</button>
          <button onClick={() => setActiveTab('financial')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === 'financial' ? 'bg-emerald-50 text-emerald-700' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'}`}><Calculator className="w-4 h-4" /> Financial Health</button>
        </div>

        {(activeTab === 'equipment' || activeTab === 'vehicles') && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-48 pl-9 pr-4 py-2 rounded-xl border border-neutral-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
            </div>
            <select value={statusFilter} onChange={(e: any) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:ring-2 focus:ring-indigo-500/20 font-medium text-neutral-700">
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="assigned">Assigned</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <div className="flex bg-neutral-100 p-1 rounded-lg">
              <button onClick={() => setViewMode('icon')} className={`p-1.5 rounded-md ${viewMode === 'icon' ? 'bg-white shadow-sm' : 'text-neutral-500'}`}><LayoutGrid className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-neutral-500'}`}><List className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-neutral-500">Loading assets...</div>
      ) : activeTab === 'calendar' ? (
        <div className="bg-white border border-neutral-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-sm h-96">
          <CalendarIcon className="w-16 h-16 text-indigo-100 mb-4" />
          <h3 className="text-xl font-bold text-neutral-900 mb-2">Resource Calendar</h3>
          <p className="text-neutral-500 max-w-md">The calendar view will display scheduled maintenance, expected return dates for transferred assets, and upcoming warranty expirations.</p>
        </div>
      ) : activeTab === 'financial' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
             <h3 className="font-bold text-lg text-neutral-900 mb-6">Asset Value Distribution by Site</h3>
             <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie data={siteData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#4f46e5" label>
                     {siteData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#4f46e5', '#10b981', '#f59e0b', '#3b82f6', '#ef4444'][index % 5]} />
                     ))}
                   </Pie>
                   <Tooltip formatter={(value: number) => `SAR ${value.toLocaleString()}`} />
                   <Legend />
                 </PieChart>
               </ResponsiveContainer>
             </div>
           </div>
           <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
             <h3 className="font-bold text-lg text-neutral-900 mb-6">Total Asset Valuation</h3>
             <div className="flex flex-col gap-6">
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <p className="text-sm font-medium text-indigo-600 mb-1">Total Purchase Value</p>
                  <p className="text-3xl font-black text-indigo-900">SAR {assets.reduce((sum, a) => sum + (a.purchasePrice || 0), 0).toLocaleString()}</p>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <p className="text-sm font-medium text-emerald-600 mb-1">Estimated Current Book Value</p>
                  <p className="text-3xl font-black text-emerald-900">SAR {assets.reduce((sum, a) => sum + ((a.purchasePrice || 0) * 0.8), 0).toLocaleString()}</p>
                </div>
             </div>
           </div>
        </div>
      ) : (
        <div className="flex-1 pb-16">
          {filteredAssets.length === 0 ? (
            <div className="bg-white border border-neutral-200 rounded-3xl p-12 text-center shadow-sm">
              <Package className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-neutral-900">No assets found</h3>
              <p className="text-neutral-500">Try adjusting your filters or add a new asset.</p>
            </div>
          ) : viewMode === 'icon' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredAssets.map(asset => (
                <div key={asset.id} onClick={() => handleAssetClick(asset)} className={`bg-white border ${selectedAssets.has(asset.id) ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-neutral-200'} rounded-2xl p-5 hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all flex flex-col group relative`}>
                  <div className="absolute top-3 right-3 z-10" onClick={(e) => toggleSelect(asset.id, e)}>
                     <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedAssets.has(asset.id) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-neutral-300'}`}>
                        {selectedAssets.has(asset.id) && <CheckCircle className="w-3 h-3 text-white" />}
                     </div>
                  </div>
                  <div className="flex justify-between items-start mb-4 mt-2">
                    <div className="w-12 h-12 rounded-xl bg-neutral-50 text-neutral-600 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      {activeTab === 'vehicles' ? <Truck className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      asset.status === 'available' ? 'bg-green-100 text-green-700' :
                      asset.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                      asset.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' : 'bg-neutral-100 text-neutral-700'
                    }`}>
                      {asset.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-neutral-900 truncate" title={asset.name}>{asset.name}</h3>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5 mb-4">{asset.assetTag}</p>
                  
                  <div className="mt-auto pt-4 border-t border-neutral-50 flex items-center gap-2">
                    {asset.employee ? (
                       <div className="flex items-center gap-2 w-full">
                         <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                           {asset.employee.name?.charAt(0) || asset.employee.firstName?.charAt(0) || 'U'}
                         </div>
                         <div className="text-xs truncate font-medium text-neutral-700">
                           {asset.employee.name || `${asset.employee.firstName} ${asset.employee.lastName}`}
                         </div>
                       </div>
                    ) : asset.site ? (
                       <div className="text-xs font-medium text-indigo-700 truncate w-full">📍 {asset.site.name}</div>
                    ) : (
                       <div className="text-xs text-neutral-400 font-medium">Unassigned (Available)</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50/50 border-b border-neutral-100 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    <th className="px-6 py-4 w-12 text-center">
                       <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" checked={selectedAssets.size === filteredAssets.length && filteredAssets.length > 0} onChange={toggleSelectAll} />
                    </th>
                    <th className="px-6 py-4">Asset</th>
                    <th className="px-6 py-4">Tag / Type</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Assignment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredAssets.map(asset => (
                    <tr key={asset.id} onClick={() => handleAssetClick(asset)} className={`hover:bg-neutral-50 cursor-pointer transition-colors ${selectedAssets.has(asset.id) ? 'bg-indigo-50/50' : ''}`}>
                      <td className="px-6 py-4 text-center" onClick={(e) => toggleSelect(asset.id, e)}>
                         <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" checked={selectedAssets.has(asset.id)} readOnly />
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-neutral-900">{asset.name}</p>
                        <p className="text-xs text-neutral-500">{asset.make} {asset.model}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-mono text-sm text-neutral-900">{asset.assetTag}</p>
                        <p className="text-xs text-neutral-500">{asset.type}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          asset.status === 'available' ? 'bg-green-100 text-green-700' :
                          asset.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                          asset.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' : 'bg-neutral-100 text-neutral-700'
                        }`}>{asset.status}</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {asset.employee ? (
                          <span>👤 {asset.employee.name || `${asset.employee.firstName} ${asset.employee.lastName}`}</span>
                        ) : asset.site ? (
                          <span className="text-indigo-700">📍 {asset.site.name}</span>
                        ) : (
                          <span className="text-neutral-400">Available / HQ</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Floating Bulk Action Toolbar */}
      <AnimatePresence>
        {selectedAssets.size > 0 && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white px-6 py-4 rounded-full shadow-2xl border border-neutral-200 flex items-center gap-6 z-40">
             <div className="flex items-center gap-2">
               <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">{selectedAssets.size}</span>
               <span className="font-bold text-neutral-700 text-sm">Selected</span>
             </div>
             <div className="w-px h-6 bg-neutral-200"></div>
             <div className="flex gap-2">
               <button onClick={() => setShowBulkAssign(true)} className="px-4 py-2 hover:bg-indigo-50 text-indigo-700 rounded-full font-medium text-sm transition-colors flex items-center gap-2"><ArrowRightLeft className="w-4 h-4" /> Bulk Assign</button>
               <button onClick={() => setShowBulkPrint(true)} className="px-4 py-2 hover:bg-neutral-100 text-neutral-700 rounded-full font-medium text-sm transition-colors flex items-center gap-2"><Printer className="w-4 h-4" /> Print Labels</button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ASSET DETAILS MODAL */}
      <AnimatePresence>
        {selectedAsset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="px-8 py-6 border-b border-neutral-100 flex items-start justify-between bg-neutral-50/50">
                <div className="flex gap-5 items-center">
                  <div className="w-16 h-16 bg-white rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-center text-indigo-600">
                    {activeTab === 'vehicles' ? <Truck className="w-8 h-8" /> : <Package className="w-8 h-8" />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-neutral-900">{selectedAsset.name}</h2>
                    <div className="flex items-center gap-3 mt-1 text-sm text-neutral-500 font-medium">
                      <span className="font-mono">{selectedAsset.assetTag}</span>
                      <span className="w-1 h-1 bg-neutral-300 rounded-full"></span>
                      <span>{selectedAsset.type}</span>
                      <span className="w-1 h-1 bg-neutral-300 rounded-full"></span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          selectedAsset.status === 'available' ? 'bg-green-100 text-green-700' :
                          selectedAsset.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                          selectedAsset.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' : 'bg-neutral-100 text-neutral-700'
                        }`}>
                        {selectedAsset.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setPrintAsset(selectedAsset)} className="p-2 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"><Printer className="w-5 h-5" /></button>
                  <button onClick={() => setSelectedAsset(null)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-neutral-100 px-8">
                <button onClick={() => setAssetDetailsTab('overview')} className={`py-4 px-2 font-bold text-sm border-b-2 transition-colors ${assetDetailsTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-neutral-500 hover:text-neutral-900'}`}>Overview & Assignment</button>
                <button onClick={() => setAssetDetailsTab('equipment')} className={`py-4 px-2 ml-8 font-bold text-sm border-b-2 transition-colors ${assetDetailsTab === 'equipment' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-neutral-500 hover:text-neutral-900'}`}>Data & History</button>
                <button onClick={() => setAssetDetailsTab('financial')} className={`py-4 px-2 ml-8 font-bold text-sm border-b-2 transition-colors ${assetDetailsTab === 'financial' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-neutral-500 hover:text-neutral-900'}`}>Financial</button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
                {assetDetailsTab === 'overview' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900 mb-4 flex items-center gap-2"><User className="w-4 h-4 text-indigo-600" /> Current Assignment</h4>
                      {selectedAsset.employee ? (
                        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 flex items-start gap-4 mb-4">
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold text-indigo-700 shadow-sm border border-indigo-100 text-lg">
                             {selectedAsset.employee.name?.charAt(0) || selectedAsset.employee.firstName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-neutral-900 text-lg">{selectedAsset.employee.name || `${selectedAsset.employee.firstName} ${selectedAsset.employee.lastName}`}</p>
                            <p className="text-sm text-neutral-600 mt-1 flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {selectedAsset.site?.name || 'Assigned to Project / Site'}</p>
                            <p className="text-xs text-neutral-400 mt-2">Assigned on: {selectedAsset.assignmentDate ? new Date(selectedAsset.assignmentDate).toLocaleDateString() : 'N/A'}</p>
                          </div>
                        </div>
                      ) : selectedAsset.site ? (
                        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 mb-4">
                           <p className="font-bold text-neutral-900 text-lg flex items-center gap-2"><MapPin className="w-5 h-5 text-blue-600" /> {selectedAsset.site.name}</p>
                           <p className="text-sm text-neutral-600 mt-1">Direct Site Assignment</p>
                        </div>
                      ) : (
                        <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-6 text-center text-neutral-500 mb-4">
                          <Package className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          <p>Available at HQ / Unassigned</p>
                        </div>
                      )}
                      
                      {/* ASSIGNMENT FORM */}
                      {showAssignModal && (
                        <div className="bg-white border border-indigo-200 rounded-xl p-4 shadow-sm mb-4">
                          <h5 className="text-sm font-bold text-neutral-900 mb-3">Assign Asset</h5>
                          <form onSubmit={handleAssign} className="space-y-3">
                             <div>
                               <label className="block text-xs font-semibold text-neutral-700 mb-1">Employee</label>
                               <select className="w-full text-sm px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-indigo-500/20" value={assignForm.employeeId} onChange={e=>setAssignForm({...assignForm, employeeId: e.target.value})}>
                                  <option value="">-- None (Site only) --</option>
                                  {employees.map(e => <option key={e.id} value={e.id}>{e.name || `${e.firstName} ${e.lastName}`}</option>)}
                               </select>
                             </div>
                             <div>
                               <label className="block text-xs font-semibold text-neutral-700 mb-1">Site</label>
                               <select className="w-full text-sm px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-indigo-500/20" value={assignForm.siteId} onChange={e=>setAssignForm({...assignForm, siteId: e.target.value})}>
                                  <option value="">-- None --</option>
                                  {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                               </select>
                             </div>
                             <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowAssignModal(false)} className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded">Cancel</button>
                                <button type="submit" className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700">Confirm Assignment</button>
                             </div>
                          </form>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900 mb-4 flex items-center gap-2"><Settings className="w-4 h-4 text-indigo-600" /> Quick Actions</h4>
                      <div className="space-y-3">
                         <button onClick={() => setShowAssignModal(true)} className="w-full bg-white border border-neutral-200 hover:border-indigo-600 hover:text-indigo-600 rounded-xl p-4 text-sm font-bold text-neutral-700 transition-colors flex items-center justify-between group">
                            {selectedAsset.status === 'assigned' ? 'Reassign Asset' : 'Assign Asset'} <ArrowRightLeft className="w-4 h-4 text-neutral-400 group-hover:text-indigo-600" />
                         </button>
                         {selectedAsset.status === 'assigned' && (
                           <button onClick={handleReturnAsset} className="w-full bg-white border border-neutral-200 hover:border-indigo-600 hover:text-indigo-600 rounded-xl p-4 text-sm font-bold text-neutral-700 transition-colors flex items-center justify-between group">
                              Return to Available / HQ <CheckCircle className="w-4 h-4 text-neutral-400 group-hover:text-indigo-600" />
                           </button>
                         )}
                         <button className="w-full bg-white border border-neutral-200 hover:border-indigo-600 hover:text-indigo-600 rounded-xl p-4 text-sm font-bold text-neutral-700 transition-colors flex items-center justify-between group">
                            Log Maintenance <Wrench className="w-4 h-4 text-neutral-400 group-hover:text-indigo-600" />
                         </button>
                      </div>
                    </div>
                  </div>
                )}

                {assetDetailsTab === 'equipment' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900 mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-600" /> Specifications</h4>
                      <div className="bg-white border border-neutral-200 rounded-2xl p-0 overflow-hidden shadow-sm">
                        <table className="w-full text-sm">
                          <tbody className="divide-y divide-neutral-100">
                            <tr><td className="px-4 py-3 text-neutral-500 font-medium w-1/3 bg-neutral-50/50">Make</td><td className="px-4 py-3 font-bold text-neutral-900">{selectedAsset.make || '-'}</td></tr>
                            <tr><td className="px-4 py-3 text-neutral-500 font-medium bg-neutral-50/50">Model</td><td className="px-4 py-3 font-bold text-neutral-900">{selectedAsset.model || '-'}</td></tr>
                            <tr><td className="px-4 py-3 text-neutral-500 font-medium bg-neutral-50/50">Serial No.</td><td className="px-4 py-3 font-mono font-bold text-neutral-900">{selectedAsset.serialNumber || '-'}</td></tr>
                            {activeTab === 'vehicles' && (
                              <>
                                <tr><td className="px-4 py-3 text-neutral-500 font-medium bg-neutral-50/50">License Plate</td><td className="px-4 py-3 font-bold text-neutral-900">{selectedAsset.licensePlate || '-'}</td></tr>
                                <tr><td className="px-4 py-3 text-neutral-500 font-medium bg-neutral-50/50">VIN</td><td className="px-4 py-3 font-mono text-neutral-900">{selectedAsset.vin || '-'}</td></tr>
                                <tr><td className="px-4 py-3 text-neutral-500 font-medium bg-neutral-50/50">Mileage</td><td className="px-4 py-3 text-neutral-900">{selectedAsset.mileage ? `${selectedAsset.mileage} km` : '-'}</td></tr>
                              </>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900 mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-indigo-600" /> Activity History</h4>
                      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-200 before:to-transparent">
                        {assetHistory.length > 0 ? assetHistory.map((log: any, i: number) => (
                          <div key={i} className="relative flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full border border-white bg-neutral-100 text-neutral-500 shadow shrink-0 flex items-center justify-center mt-0.5 z-10">
                              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                            </div>
                            <div className="flex-1 bg-white p-4 rounded-xl border border-neutral-100 shadow-sm hover:border-indigo-200 transition-colors">
                              <div className="flex items-center justify-between mb-1">
                                <div className="font-bold text-neutral-900 text-sm">{log.action || log.status || 'Activity'}</div>
                                <time className="font-mono text-[10px] text-neutral-400 font-bold uppercase">{new Date(log.createdAt || log.serviceDate).toLocaleDateString()}</time>
                              </div>
                              <div className="text-neutral-600 text-xs leading-relaxed">{log.details || log.technicianNotes}</div>
                            </div>
                          </div>
                        )) : <p className="text-sm text-neutral-500 italic ml-12">No history recorded.</p>}
                      </div>
                    </div>
                  </div>
                )}

                {assetDetailsTab === 'financial' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                       <h4 className="text-sm font-bold text-neutral-900 mb-4 flex items-center gap-2"><Calculator className="w-4 h-4 text-indigo-600" /> Financial Valuation</h4>
                       <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
                         <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                           <span className="text-neutral-500 font-medium text-sm">Purchase Price</span>
                           <span className="text-xl font-black text-neutral-900">SAR {selectedAsset.purchasePrice?.toLocaleString() || 0}</span>
                         </div>
                         <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
                           <span className="text-neutral-500 font-medium text-sm">Salvage Value</span>
                           <span className="text-lg font-bold text-neutral-700">SAR {selectedAsset.salvageValue?.toLocaleString() || 0}</span>
                         </div>
                         <div className="p-6 flex justify-between items-center bg-indigo-50/30">
                           <span className="text-indigo-900 font-bold text-sm">Current Book Value</span>
                           <span className="text-xl font-black text-indigo-700">SAR {selectedAsset.purchasePrice ? (selectedAsset.purchasePrice * 0.8).toLocaleString() : 0}</span>
                         </div>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD ASSET MODAL */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
                <h3 className="text-lg font-bold text-neutral-900">Add New Asset</h3>
                <button onClick={() => setIsAdding(false)} className="text-neutral-400 hover:text-neutral-600"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleAddAsset} className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Asset Name *</label>
                    <input required type="text" className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20" value={assetForm.name} onChange={e => setAssetForm({...assetForm, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Asset Tag/ID *</label>
                    <input required type="text" className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20" value={assetForm.assetTag} onChange={e => setAssetForm({...assetForm, assetTag: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Type *</label>
                    <select className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20" value={assetForm.type} onChange={e => setAssetForm({...assetForm, type: e.target.value})}>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Make / Brand</label>
                    <input type="text" className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20" value={assetForm.make} onChange={e => setAssetForm({...assetForm, make: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Model</label>
                    <input type="text" className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20" value={assetForm.model} onChange={e => setAssetForm({...assetForm, model: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Purchase Price (SAR)</label>
                    <input type="number" className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20" value={assetForm.purchasePrice} onChange={e => setAssetForm({...assetForm, purchasePrice: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Useful Life (Years)</label>
                    <input type="number" className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20" value={assetForm.usefulLifeYears} onChange={e => setAssetForm({...assetForm, usefulLifeYears: e.target.value})} />
                  </div>
                </div>
                <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-neutral-100">
                  <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg text-sm font-medium">Cancel</button>
                  <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold shadow-sm hover:bg-indigo-700">Save Asset</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BULK ASSIGN MODAL */}
      <AnimatePresence>
        {showBulkAssign && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
               <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50 flex justify-between items-center">
                 <h3 className="font-bold text-neutral-900">Bulk Assign ({selectedAssets.size} Assets)</h3>
                 <button onClick={() => setShowBulkAssign(false)} className="text-neutral-400 hover:text-neutral-700"><X className="w-5 h-5"/></button>
               </div>
               <div className="p-6">
                 <p className="text-sm text-neutral-600 mb-4">Select a destination site for the selected assets.</p>
                 <select className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20" value={bulkSiteId} onChange={e => setBulkSiteId(e.target.value)}>
                   <option value="">-- Select Site --</option>
                   {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                 </select>
               </div>
               <div className="px-6 py-4 border-t border-neutral-100 flex justify-end gap-3 bg-neutral-50/50">
                  <button onClick={() => setShowBulkAssign(false)} className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg text-sm font-medium">Cancel</button>
                  <button onClick={handleBulkAssign} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold shadow-sm hover:bg-indigo-700">Transfer Assets</button>
               </div>
             </motion.div>
           </div>
        )}
      </AnimatePresence>

      {/* PRINT MODAL */}
      <AnimatePresence>
        {printAsset && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden">
               <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
                 <h3 className="font-bold text-lg text-neutral-900">Print Label</h3>
                 <button onClick={() => setPrintAsset(null)} className="text-neutral-400 hover:text-neutral-700"><X className="w-5 h-5"/></button>
               </div>
               <div className="p-8 flex justify-center bg-neutral-50" id="print-area">
                 <div className="bg-white p-4 rounded-xl border border-neutral-200 text-center shadow-sm">
                    <QRCodeSVG value={printAsset.assetTag} size={120} level="H" />
                    <p className="mt-3 font-mono font-bold text-sm">{printAsset.assetTag}</p>
                    <p className="text-xs text-neutral-500 mt-1 truncate w-full max-w-[150px]">{printAsset.name}</p>
                 </div>
               </div>
               <div className="px-6 py-4 border-t border-neutral-100 bg-white flex justify-end">
                  <button onClick={() => { window.print(); setPrintAsset(null); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold w-full">Print Now</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BULK PRINT MODAL */}
      <AnimatePresence>
        {showBulkPrint && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
               <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
                 <h3 className="font-bold text-lg text-neutral-900">Print Labels ({selectedAssets.size})</h3>
                 <button onClick={() => setShowBulkPrint(false)} className="text-neutral-400 hover:text-neutral-700"><X className="w-5 h-5"/></button>
               </div>
               <div className="p-8 flex-1 overflow-y-auto custom-scrollbar bg-white grid grid-cols-2 md:grid-cols-4 gap-4" id="bulk-print-area">
                 {Array.from(selectedAssets).map(id => {
                    const a = assets.find(x => x.id === id);
                    if (!a) return null;
                    return (
                      <div key={id} className="bg-white p-4 rounded-xl border border-neutral-200 text-center shadow-sm flex flex-col items-center">
                         <QRCodeSVG value={a.assetTag} size={100} level="H" />
                         <p className="mt-3 font-mono font-bold text-sm">{a.assetTag}</p>
                         <p className="text-xs text-neutral-500 mt-1 truncate w-full">{a.name}</p>
                      </div>
                    )
                 })}
               </div>
               <div className="px-6 py-4 border-t border-neutral-100 bg-white flex justify-end">
                  <button onClick={() => { window.print(); setShowBulkPrint(false); }} className="bg-indigo-600 text-white px-8 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Printer className="w-4 h-4" /> Print All</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
"""

with open('src/components/Assets.tsx', 'w') as f:
    f.write(code)
