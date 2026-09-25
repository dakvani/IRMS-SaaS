import fs from 'fs';

const code = `import React, { useState, useEffect, useMemo } from 'react';
import { Package, Plus, X, Search, Printer, ScanLine, Calculator, Wrench, Settings, ArrowRightLeft, LayoutGrid, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function Assets() {
  const [assets, setAssets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [assetHistory, setAssetHistory] = useState<any[]>([]);
  
  const [printAsset, setPrintAsset] = useState<any | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<Set<number>>(new Set());
  const [showBulkPrint, setShowBulkPrint] = useState(false);

  const [formData, setFormData] = useState({
    name: '', assetTag: '', type: 'Laptop', assignedToEmployeeId: '', assignedToSiteId: '', status: 'available',
    purchasePrice: '', purchaseDate: '', salvageValue: '', usefulLifeYears: '', depreciationMethod: 'straight_line', maintenanceIntervalDays: ''
  });
  
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [isScanning, setIsScanning] = useState(false);
  const [maintenanceLogs, setMaintenanceLogs] = useState<any[]>([]);
  const [maintenanceForm, setMaintenanceForm] = useState({ serviceDate: new Date().toISOString().split('T')[0], technicianNotes: '', status: 'completed' });
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = (window as any)._token;
      const [assetRes, empRes, siteRes] = await Promise.all([
        fetch('/api/assets', { headers: { Authorization: \`Bearer \${token}\` } }),
        fetch('/api/employees', { headers: { Authorization: \`Bearer \${token}\` } }),
        fetch('/api/sites', { headers: { Authorization: \`Bearer \${token}\` } }),
      ]);
      setAssets(await assetRes.json());
      setEmployees(await empRes.json());
      setSites(await siteRes.json());
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    let html5QrcodeScanner: Html5QrcodeScanner | null = null;
    if (isScanning) {
      html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: {width: 250, height: 250} }, false);
      html5QrcodeScanner.render(
        (decodedText) => {
          setSearchTerm(decodedText);
          setIsScanning(false);
          html5QrcodeScanner?.clear();
          const found = assets.find(a => a.assetTag === decodedText);
          if (found) handleAssetClick(found);
        },
        (error) => {}
      );
    }
    return () => {
      if (html5QrcodeScanner) html5QrcodeScanner.clear().catch(e => console.error(e));
    };
  }, [isScanning, assets]);

  const calculateDepreciation = (asset: any) => {
    if (!asset.purchasePrice || !asset.purchaseDate || !asset.salvageValue || !asset.usefulLifeYears) return null;
    const price = asset.purchasePrice;
    const salvage = asset.salvageValue;
    const life = asset.usefulLifeYears;
    const yearsElapsed = (new Date().getTime() - new Date(asset.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    
    if (yearsElapsed < 0) return price;
    if (asset.depreciationMethod === 'straight_line') {
      const yearlyDepreciation = (price - salvage) / life;
      const totalDepreciation = yearlyDepreciation * Math.min(yearsElapsed, life);
      return Math.max(salvage, price - totalDepreciation);
    } else if (asset.depreciationMethod === 'double_declining') {
      const rate = (1 / life) * 2;
      let bookValue = price;
      for (let i = 0; i < Math.floor(yearsElapsed); i++) { bookValue -= bookValue * rate; }
      const fraction = yearsElapsed - Math.floor(yearsElapsed);
      bookValue -= (bookValue * rate * fraction);
      return Math.max(salvage, bookValue);
    }
    return price;
  };

  const getNextMaintenance = (asset: any) => {
    if (!asset.maintenanceIntervalDays) return null;
    const baseDate = asset.lastMaintenanceDate || asset.purchaseDate;
    if (!baseDate) return null;
    const next = new Date(baseDate);
    next.setDate(next.getDate() + asset.maintenanceIntervalDays);
    return next;
  };

  const fetchAssetHistory = async (id: number) => {
    try {
      const token = (window as any)._token;
      const res = await fetch(\`/api/assets/\${id}/history\`, { headers: { Authorization: \`Bearer \${token}\` } });
      if (res.ok) setAssetHistory(await res.json());
    } catch(e) { console.error(e); }
  };

  const fetchMaintenanceLogs = async (id: number) => {
    try {
      const token = (window as any)._token;
      const res = await fetch(\`/api/assets/\${id}/maintenance\`, { headers: { Authorization: \`Bearer \${token}\` } });
      if (res.ok) setMaintenanceLogs(await res.json());
    } catch(e) { console.error(e); }
  };

  const handleDragStart = (e: React.DragEvent, asset: any) => {
    e.dataTransfer.setData('assetId', asset.id.toString());
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = async (e: React.DragEvent, targetSiteId: string) => {
    e.preventDefault();
    const assetId = e.dataTransfer.getData('assetId');
    if (!assetId) return;
    const asset = assets.find(a => a.id.toString() === assetId);
    if (!asset) return;
    const currentSiteId = asset.site ? asset.site.id.toString() : '';
    if (currentSiteId === targetSiteId) return;
    try {
      const token = (window as any)._token;
      const res = await fetch(\`/api/assets/\${assetId}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
        body: JSON.stringify({ ...asset, assignedToSiteId: targetSiteId || null, assignedToEmployeeId: null, status: 'assigned' })
      });
      if (res.ok) fetchData();
    } catch(err) { console.error(err); }
  };

  const handleAssetClick = (asset: any) => {
    setSelectedAsset(asset);
    fetchAssetHistory(asset.id);
    fetchMaintenanceLogs(asset.id);
  };

  const toggleSelection = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelection = new Set(selectedAssets);
    if (newSelection.has(id)) newSelection.delete(id); else newSelection.add(id);
    setSelectedAssets(newSelection);
  };

  const toggleAll = () => {
    if (selectedAssets.size === filtered.length) setSelectedAssets(new Set());
    else setSelectedAssets(new Set(filtered.map(a => a.id)));
  };

  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = (window as any)._token;
      const res = await fetch(\`/api/assets/\${selectedAsset.id}/maintenance\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
        body: JSON.stringify(maintenanceForm)
      });
      if (res.ok) {
        setShowMaintenanceForm(false);
        fetchMaintenanceLogs(selectedAsset.id);
        fetchData();
        setMaintenanceForm({ serviceDate: new Date().toISOString().split('T')[0], technicianNotes: '', status: 'completed' });
      }
    } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = (window as any)._token;
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsAdding(false);
        fetchData();
      }
    } catch (err) { console.error(err); }
  };

  const filtered = useMemo(() => {
    if (!searchTerm) return assets;
    const term = searchTerm.toLowerCase();
    return assets.filter(a => 
      a.name.toLowerCase().includes(term) || 
      a.assetTag.toLowerCase().includes(term) ||
      a.type.toLowerCase().includes(term) ||
      a.status.toLowerCase().includes(term) ||
      (a.employee && a.employee.name.toLowerCase().includes(term)) ||
      (a.site && a.site.name.toLowerCase().includes(term))
    );
  }, [assets, searchTerm]);

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50/50">
        <h2 className="text-lg font-semibold">Equipment & Assets</h2>
        {!isAdding && (
          <div className="flex gap-2">
            <div className="flex bg-neutral-100 rounded-lg p-1 mr-2 border border-neutral-200">
              <button onClick={() => setViewMode('list')} className={\`p-1.5 rounded-md \${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}\`}><List className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('board')} className={\`p-1.5 rounded-md \${viewMode === 'board' ? 'bg-white shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}\`}><LayoutGrid className="w-4 h-4" /></button>
            </div>
            <button onClick={() => setIsScanning(true)} className="bg-white text-neutral-700 border border-neutral-200 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-neutral-50 shadow-sm"><ScanLine className="w-4 h-4" /> Scan QR</button>
            {selectedAssets.size > 0 && <button onClick={() => setShowBulkPrint(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-700 shadow-sm"><Printer className="w-4 h-4" /> Bulk Print ({selectedAssets.size})</button>}
            <button onClick={() => setIsAdding(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 shadow-sm transition-colors"><Plus className="w-4 h-4" /> Add Asset</button>
          </div>
        )}
      </div>
      
      {isAdding ? (
        <div className="p-6">
          <form onSubmit={handleSubmit} className="max-w-2xl bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold mb-4">Add New Asset</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-neutral-700 mb-1">Asset Name</label><input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-neutral-700 mb-1">Asset Tag (Auto if blank)</label><input type="text" value={formData.assetTag} onChange={e => setFormData({...formData, assetTag: e.target.value})} className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-blue-500" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Type</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-blue-500">
                    <option value="Laptop">Laptop</option><option value="Vehicle">Vehicle</option><option value="Heavy Machinery">Heavy Machinery</option><option value="Tools">Tools</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-blue-500">
                    <option value="available">Available</option><option value="assigned">Assigned</option><option value="maintenance">Maintenance</option><option value="retired">Retired</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-neutral-200 pt-4">
                <div><label className="block text-sm font-medium text-neutral-700 mb-1">Purchase Price ($)</label><input type="number" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: e.target.value})} className="w-full px-3 py-2 border border-neutral-300 rounded-md" /></div>
                <div><label className="block text-sm font-medium text-neutral-700 mb-1">Purchase Date</label><input type="date" value={formData.purchaseDate} onChange={e => setFormData({...formData, purchaseDate: e.target.value})} className="w-full px-3 py-2 border border-neutral-300 rounded-md" /></div>
                <div><label className="block text-sm font-medium text-neutral-700 mb-1">Salvage Value ($)</label><input type="number" value={formData.salvageValue} onChange={e => setFormData({...formData, salvageValue: e.target.value})} className="w-full px-3 py-2 border border-neutral-300 rounded-md" /></div>
                <div><label className="block text-sm font-medium text-neutral-700 mb-1">Useful Life (Years)</label><input type="number" value={formData.usefulLifeYears} onChange={e => setFormData({...formData, usefulLifeYears: e.target.value})} className="w-full px-3 py-2 border border-neutral-300 rounded-md" /></div>
                <div><label className="block text-sm font-medium text-neutral-700 mb-1">Depreciation Method</label><select value={formData.depreciationMethod} onChange={e => setFormData({...formData, depreciationMethod: e.target.value})} className="w-full px-3 py-2 border border-neutral-300 rounded-md"><option value="straight_line">Straight Line</option><option value="double_declining">Double Declining</option></select></div>
                <div><label className="block text-sm font-medium text-neutral-700 mb-1">Maintenance Interval (Days)</label><input type="number" value={formData.maintenanceIntervalDays} onChange={e => setFormData({...formData, maintenanceIntervalDays: e.target.value})} className="w-full px-3 py-2 border border-neutral-300 rounded-md" /></div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 border rounded-md">Cancel</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Save Asset</button></div>
            </div>
          </form>
        </div>
      ) : isLoading ? (
        <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
      ) : (
        <>
          {viewMode === 'list' && (
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50 sticky top-0 z-10 text-neutral-500 border-b border-neutral-200 uppercase text-xs font-semibold">
                  <tr>
                    <th className="px-6 py-3 w-12"><input type="checkbox" checked={selectedAssets.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="rounded border-neutral-300" /></th>
                    <th className="px-6 py-3">Asset</th><th className="px-6 py-3">Type</th><th className="px-6 py-3">Assignment</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filtered.map(asset => (
                    <tr key={asset.id} onClick={() => handleAssetClick(asset)} className="hover:bg-neutral-50 cursor-pointer transition-colors group">
                      <td className="px-6 py-4" onClick={e => e.stopPropagation()}><input type="checkbox" checked={selectedAssets.has(asset.id)} onChange={(e) => toggleSelection(asset.id, e as any)} className="rounded border-neutral-300" /></td>
                      <td className="px-6 py-4"><div className="font-medium text-neutral-900">{asset.name}</div><div className="text-xs text-neutral-500 font-mono mt-0.5">{asset.assetTag}</div></td>
                      <td className="px-6 py-4"><span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-neutral-100 text-neutral-700">{asset.type}</span></td>
                      <td className="px-6 py-4">{asset.employee ? (<div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">{asset.employee.name.charAt(0)}</div><span className="text-sm font-medium">{asset.employee.name}</span></div>) : asset.site ? (<span className="text-sm font-medium text-indigo-700">📍 {asset.site.name}</span>) : (<span className="text-sm text-neutral-400">Unassigned</span>)}</td>
                      <td className="px-6 py-4"><span className={\`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium \${asset.status === 'available' ? 'bg-green-100 text-green-700' : asset.status === 'assigned' ? 'bg-blue-100 text-blue-700' : asset.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' : 'bg-neutral-100 text-neutral-700'}\`}>{asset.status}</span></td>
                      <td className="px-6 py-4 text-right"><button onClick={(e) => { e.stopPropagation(); setPrintAsset(asset); }} className="text-neutral-400 hover:text-indigo-600 transition-colors p-2" title="Print Label"><Printer className="w-4 h-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {viewMode === 'board' && (
            <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar flex gap-4 p-4 bg-neutral-100/50 min-h-[500px]">
              <div className="w-80 shrink-0 flex flex-col bg-neutral-100 rounded-2xl border border-neutral-200" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, '')}>
                <div className="p-3 border-b border-neutral-200 bg-white rounded-t-2xl flex justify-between items-center shadow-sm"><h3 className="font-bold text-neutral-700 text-sm">Unassigned</h3><span className="bg-neutral-200 text-neutral-600 text-xs font-bold px-2 py-0.5 rounded-full">{filtered.filter(a => !a.site).length}</span></div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                  {filtered.filter(a => !a.site).map(asset => (
                    <div key={asset.id} draggable onDragStart={(e) => handleDragStart(e, asset)} onClick={() => handleAssetClick(asset)} className="bg-white p-3 rounded-xl shadow-sm border border-neutral-200 cursor-grab hover:border-indigo-300">
                      <p className="font-bold text-sm text-neutral-900">{asset.name}</p>
                      <p className="text-xs text-neutral-500 font-mono mt-1">{asset.assetTag}</p>
                      <div className="flex justify-between items-center mt-3"><span className="text-[10px] font-bold uppercase text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">{asset.type}</span><span className={\`w-2 h-2 rounded-full \${asset.status === 'available' ? 'bg-green-500' : asset.status === 'maintenance' ? 'bg-yellow-500' : 'bg-neutral-400'}\`}></span></div>
                    </div>
                  ))}
                </div>
              </div>
              {sites.map(site => (
                <div key={site.id} className="w-80 shrink-0 flex flex-col bg-blue-50/30 rounded-2xl border border-blue-100" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, site.id.toString())}>
                  <div className="p-3 border-b border-blue-100 bg-white rounded-t-2xl flex justify-between items-center shadow-sm"><h3 className="font-bold text-blue-900 text-sm truncate pr-2">{site.name}</h3><span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{filtered.filter(a => a.site?.id === site.id).length}</span></div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                    {filtered.filter(a => a.site?.id === site.id).map(asset => (
                      <div key={asset.id} draggable onDragStart={(e) => handleDragStart(e, asset)} onClick={() => handleAssetClick(asset)} className="bg-white p-3 rounded-xl shadow-sm border border-blue-100 cursor-grab hover:border-indigo-300">
                        <p className="font-bold text-sm text-neutral-900">{asset.name}</p>
                        <p className="text-xs text-neutral-500 font-mono mt-1">{asset.assetTag}</p>
                        <div className="flex justify-between items-center mt-3"><span className="text-[10px] font-bold uppercase text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">{asset.type}</span><span className={\`w-2 h-2 rounded-full \${asset.status === 'assigned' ? 'bg-blue-500' : asset.status === 'maintenance' ? 'bg-yellow-500' : 'bg-neutral-400'}\`}></span></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <AnimatePresence>
        {isScanning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100"><h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2"><ScanLine className="w-5 h-5" /> Scan Asset</h3><button onClick={() => setIsScanning(false)} className="text-neutral-400 hover:text-neutral-600"><X className="w-5 h-5" /></button></div>
              <div className="p-6"><div id="reader" className="w-full overflow-hidden rounded-xl border border-neutral-200"></div><p className="text-sm text-center text-neutral-500 mt-4">Point your camera at an asset QR code or barcode to instantly pull up its details.</p></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedAsset && !printAsset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50"><h3 className="text-lg font-bold text-neutral-900">Asset Details</h3><button onClick={() => setSelectedAsset(null)} className="text-neutral-400 hover:text-neutral-600"><X className="w-5 h-5" /></button></div>
              <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-8">
                <div className="flex-1 space-y-6">
                  <div><h2 className="text-2xl font-bold text-neutral-900">{selectedAsset.name}</h2><p className="text-neutral-500 font-mono mt-1">{selectedAsset.assetTag} • {selectedAsset.type}</p></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                      <h4 className="text-sm font-bold text-neutral-900 mb-3 flex items-center gap-2"><Calculator className="w-4 h-4 text-emerald-600" /> Financial & Depreciation</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-neutral-500">Purchase Price:</span> <span className="font-medium">\${selectedAsset.purchasePrice || 0}</span></div>
                        <div className="flex justify-between"><span className="text-neutral-500">Salvage Value:</span> <span className="font-medium">\${selectedAsset.salvageValue || 0}</span></div>
                        <div className="flex justify-between"><span className="text-neutral-500">Useful Life:</span> <span className="font-medium">{selectedAsset.usefulLifeYears || 0} yrs</span></div>
                        <div className="flex justify-between border-t border-neutral-200 pt-2 mt-2"><span className="font-bold text-neutral-700">Current Book Value:</span> <span className="font-bold text-emerald-600">\${calculateDepreciation(selectedAsset)?.toFixed(2) || 'N/A'}</span></div>
                      </div>
                    </div>
                    <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                      <h4 className="text-sm font-bold text-neutral-900 mb-3 flex items-center gap-2"><Wrench className="w-4 h-4 text-amber-600" /> Maintenance Schedule</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-neutral-500">Interval:</span> <span className="font-medium">{selectedAsset.maintenanceIntervalDays || 0} Days</span></div>
                        <div className="flex justify-between"><span className="text-neutral-500">Last Serviced:</span> <span className="font-medium">{selectedAsset.lastMaintenanceDate ? new Date(selectedAsset.lastMaintenanceDate).toLocaleDateString() : 'Never'}</span></div>
                        <div className="flex justify-between border-t border-neutral-200 pt-2 mt-2"><span className="font-bold text-neutral-700">Next Service Due:</span> <span className={\`font-bold \${getNextMaintenance(selectedAsset) && getNextMaintenance(selectedAsset)! < new Date() ? 'text-red-600' : 'text-blue-600'}\`}>{getNextMaintenance(selectedAsset) ? getNextMaintenance(selectedAsset)!.toLocaleDateString() : 'N/A'}</span></div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-3"><h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2"><Settings className="w-4 h-4 text-neutral-600" /> Maintenance Logs</h4><button onClick={() => setShowMaintenanceForm(!showMaintenanceForm)} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">+ Log Service</button></div>
                    <AnimatePresence>
                      {showMaintenanceForm && (
                        <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} onSubmit={handleAddMaintenance} className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 mb-4 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div><label className="block text-xs font-semibold text-neutral-700 mb-1">Service Date</label><input required type="date" value={maintenanceForm.serviceDate} onChange={e => setMaintenanceForm({...maintenanceForm, serviceDate: e.target.value})} className="w-full text-sm p-2 border border-neutral-300 rounded" /></div>
                            <div><label className="block text-xs font-semibold text-neutral-700 mb-1">Status</label><select value={maintenanceForm.status} onChange={e => setMaintenanceForm({...maintenanceForm, status: e.target.value})} className="w-full text-sm p-2 border border-neutral-300 rounded"><option value="completed">Completed</option><option value="in_progress">In Progress</option></select></div>
                          </div>
                          <div><label className="block text-xs font-semibold text-neutral-700 mb-1">Technician Notes</label><textarea required value={maintenanceForm.technicianNotes} onChange={e => setMaintenanceForm({...maintenanceForm, technicianNotes: e.target.value})} className="w-full text-sm p-2 border border-neutral-300 rounded" rows={2} /></div>
                          <div className="flex justify-end gap-2 pt-1"><button type="button" onClick={() => setShowMaintenanceForm(false)} className="text-xs px-3 py-1.5 text-neutral-600 hover:bg-neutral-200 rounded">Cancel</button><button type="submit" className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700">Save Log</button></div>
                        </motion.form>
                      )}
                    </AnimatePresence>
                    <div className="space-y-3">
                      {maintenanceLogs.length > 0 ? maintenanceLogs.map((log: any, i: number) => (
                        <div key={i} className="flex gap-3 text-sm p-3 bg-white border border-neutral-100 rounded-lg shadow-sm"><Wrench className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" /><div className="flex-1"><div className="flex justify-between items-start mb-1"><p className="font-bold text-neutral-900">{new Date(log.serviceDate).toLocaleDateString()}</p><span className={\`text-[10px] font-bold uppercase px-2 py-0.5 rounded \${log.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}\`}>{log.status}</span></div><p className="text-neutral-600 text-xs">{log.technicianNotes}</p><p className="text-neutral-400 text-[10px] mt-2">Logged by {log.performedBy?.name} on {new Date(log.createdAt).toLocaleString()}</p></div></div>
                      )) : <p className="text-sm text-neutral-500 italic">No maintenance records logged.</p>}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 mb-3 mt-6 border-t border-neutral-200 pt-4 flex items-center gap-2"><ArrowRightLeft className="w-4 h-4 text-blue-600" /> Transfer & Audit History</h4>
                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-200 before:to-transparent">
                      {assetHistory.length > 0 ? assetHistory.map((log: any, i: number) => (
                        <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"><div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-neutral-100 text-neutral-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"><div className="w-2 h-2 bg-neutral-400 rounded-full"></div></div><div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-neutral-100 shadow-sm"><div className="flex items-center justify-between space-x-2 mb-1"><div className="font-bold text-neutral-900 text-sm">{log.action}</div><time className="font-mono text-xs text-indigo-600">{new Date(log.createdAt).toLocaleDateString()}</time></div><div className="text-neutral-600 text-sm">{log.details}</div><div className="text-neutral-400 text-xs mt-2 font-medium">By {log.user?.name}</div></div></div>
                      )) : <p className="text-sm text-neutral-500 italic">No history available for this asset.</p>}
                    </div>
                  </div>
                </div>
                <div className="w-full md:w-64 shrink-0 flex flex-col items-center gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col items-center w-full"><h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4">QR Tag</h4><div className="bg-white p-2 rounded-xl shadow-sm border border-neutral-100 cursor-pointer hover:scale-105 transition-transform" onClick={() => setPrintAsset(selectedAsset)} title="Click to print"><QRCodeSVG value={selectedAsset.assetTag} size={140} level="H" /></div></div>
                  <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col items-center w-full"><h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4">Barcode</h4><div className="w-full overflow-hidden flex justify-center cursor-pointer hover:scale-105 transition-transform" onClick={() => setPrintAsset(selectedAsset)} title="Click to print"><Barcode value={selectedAsset.assetTag} width={1.5} height={50} fontSize={12} background="#ffffff" margin={0} /></div></div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {printAsset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100"><h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2"><Printer className="w-5 h-5" /> Print Label</h3><button onClick={() => setPrintAsset(null)} className="text-neutral-400 hover:text-neutral-600"><X className="w-5 h-5" /></button></div>
              <div className="p-8 flex flex-col items-center bg-neutral-50" id="print-area">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 text-center flex flex-col items-center gap-4 w-64">
                  <h4 className="font-bold text-lg text-neutral-900 leading-tight">{printAsset.name}</h4>
                  <QRCodeSVG value={printAsset.assetTag} size={120} level="H" />
                  <div className="w-full flex justify-center overflow-hidden"><Barcode value={printAsset.assetTag} width={1.2} height={40} fontSize={11} background="#ffffff" margin={0} /></div>
                  <p className="text-xs font-bold text-neutral-400 uppercase mt-2 tracking-widest">{printAsset.type}</p>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-neutral-100 bg-white flex justify-end gap-3"><button onClick={() => setPrintAsset(null)} className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg text-sm font-medium transition-colors">Cancel</button><button onClick={() => { const content = document.getElementById('print-area'); if (content) { const orig = document.body.innerHTML; document.body.innerHTML = \`<div class="print-area p-8">\${content.innerHTML}</div>\`; window.print(); document.body.innerHTML = orig; window.location.reload(); } }} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium shadow-sm hover:bg-indigo-700 transition-colors flex items-center gap-2"><Printer className="w-4 h-4" /> Print Label</button></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBulkPrint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100"><h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2"><Printer className="w-5 h-5" /> Bulk Print Labels ({selectedAssets.size})</h3><button onClick={() => setShowBulkPrint(false)} className="text-neutral-400 hover:text-neutral-600"><X className="w-5 h-5" /></button></div>
              <div className="flex-1 overflow-y-auto p-6 bg-neutral-50 custom-scrollbar" id="bulk-print-area">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {assets.filter(a => selectedAssets.has(a.id)).map(asset => (
                    <div key={asset.id} className="bg-white p-4 rounded-xl shadow-sm border border-neutral-200 text-center flex flex-col items-center gap-3"><h4 className="font-bold text-sm text-neutral-900 truncate w-full">{asset.name}</h4><QRCodeSVG value={asset.assetTag} size={100} level="H" /><div className="w-full flex justify-center overflow-hidden"><Barcode value={asset.assetTag} width={1} height={30} fontSize={10} background="#ffffff" margin={0} /></div></div>
                  ))}
                </div>
              </div>
              <div className="px-6 py-4 border-t border-neutral-100 bg-white flex justify-end gap-3"><button onClick={() => setShowBulkPrint(false)} className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg text-sm font-medium transition-colors">Cancel</button><button onClick={() => { const content = document.getElementById('bulk-print-area'); if (content) { const orig = document.body.innerHTML; document.body.innerHTML = \`<div class="print-area p-6">\${content.innerHTML}</div>\`; window.print(); document.body.innerHTML = orig; window.location.reload(); } }} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium shadow-sm hover:bg-indigo-700 transition-colors flex items-center gap-2"><Printer className="w-4 h-4" /> Print All Labels</button></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
`

fs.writeFileSync('src/components/Assets.tsx', code);
