import re

code = """
import React, { useState, useEffect, useMemo } from 'react';
import { Package, Truck, Plus, Clock, X, Search, Printer, ScanLine, Calculator, Wrench, Settings, ArrowRightLeft, LayoutGrid, List, Calendar as CalendarIcon, MapPin, User, FileText, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';

export default function Assets() {
  const [assets, setAssets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Tabs & Views
  const [activeTab, setActiveTab] = useState<'equipment' | 'vehicles' | 'calendar'>('equipment');
  const [viewMode, setViewMode] = useState<'list' | 'icon'>('icon');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'assigned' | 'maintenance'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isAdding, setIsAdding] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [assetDetailsTab, setAssetDetailsTab] = useState<'overview' | 'equipment' | 'financial'>('overview');
  const [assetHistory, setAssetHistory] = useState<any[]>([]);
  const [printAsset, setPrintAsset] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
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

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-neutral-900 tracking-tight">Asset Management</h2>
          <p className="text-sm text-neutral-500 mt-1">Manage vehicles, equipment, and tracking</p>
        </div>
        <div className="flex items-center gap-3">
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
        </div>

        {activeTab !== 'calendar' && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-48 pl-9 pr-4 py-2 rounded-xl border border-neutral-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
            </div>
            <select value={statusFilter} onChange={(e: any) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:ring-2 focus:ring-indigo-500/20 font-medium text-neutral-700">
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="assigned">Assigned/Occupied</option>
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
      ) : (
        <div className="flex-1">
          {filteredAssets.length === 0 ? (
            <div className="bg-white border border-neutral-200 rounded-3xl p-12 text-center shadow-sm">
              <Package className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-neutral-900">No assets found</h3>
              <p className="text-neutral-500">Try adjusting your filters or add a new asset.</p>
            </div>
          ) : viewMode === 'icon' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredAssets.map(asset => (
                <div key={asset.id} onClick={() => handleAssetClick(asset)} className="bg-white border border-neutral-200 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all flex flex-col group">
                  <div className="flex justify-between items-start mb-4">
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
                       <div className="text-xs text-neutral-400 font-medium">Unassigned</div>
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
                    <th className="px-6 py-4">Asset</th>
                    <th className="px-6 py-4">Tag / Type</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Assignment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredAssets.map(asset => (
                    <tr key={asset.id} onClick={() => handleAssetClick(asset)} className="hover:bg-neutral-50 cursor-pointer transition-colors">
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
                          <span className="text-neutral-400">Unassigned</span>
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
                        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 flex items-start gap-4">
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
                        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6">
                           <p className="font-bold text-neutral-900 text-lg flex items-center gap-2"><MapPin className="w-5 h-5 text-blue-600" /> {selectedAsset.site.name}</p>
                           <p className="text-sm text-neutral-600 mt-1">Direct Site Assignment</p>
                        </div>
                      ) : (
                        <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-6 text-center text-neutral-500">
                          <Package className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          <p>Not currently assigned</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900 mb-4 flex items-center gap-2"><Settings className="w-4 h-4 text-indigo-600" /> Quick Actions</h4>
                      <div className="space-y-3">
                         <button className="w-full bg-white border border-neutral-200 hover:border-indigo-600 hover:text-indigo-600 rounded-xl p-4 text-sm font-bold text-neutral-700 transition-colors flex items-center justify-between">
                            Reassign Asset <ArrowRightLeft className="w-4 h-4" />
                         </button>
                         <button className="w-full bg-white border border-neutral-200 hover:border-indigo-600 hover:text-indigo-600 rounded-xl p-4 text-sm font-bold text-neutral-700 transition-colors flex items-center justify-between">
                            Log Maintenance <Wrench className="w-4 h-4" />
                         </button>
                         <button className="w-full bg-white border border-neutral-200 hover:border-indigo-600 hover:text-indigo-600 rounded-xl p-4 text-sm font-bold text-neutral-700 transition-colors flex items-center justify-between">
                            Change Status <Activity className="w-4 h-4" />
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
