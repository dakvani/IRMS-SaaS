import React, { useEffect, useState } from 'react';
import { Truck, Plus, X , Search} from 'lucide-react';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    licensePlate: '', make: '', model: '', year: '', vin: '', type: '', currentMileage: 0, 
    insuranceExpiry: '', registrationExpiry: '', inspectionExpiry: '', status: 'Available'
  });

  const fetchVehicles = async () => {
    setIsLoading(true);
    try {
      const token = (window as any)._token;
      const res = await fetch('/api/vehicles', { headers: { Authorization: `Bearer ${token}` }});
      if (res.ok) setVehicles(await res.json());
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchVehicles(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = (window as any)._token;
      const payload: any = { ...formData };
      if (!payload.insuranceExpiry) delete payload.insuranceExpiry;
      if (!payload.registrationExpiry) delete payload.registrationExpiry;
      if (!payload.inspectionExpiry) delete payload.inspectionExpiry;
      if (!payload.year) delete payload.year;
      else payload.year = parseInt(payload.year);

      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to add vehicle');
      setIsAdding(false);
      fetchVehicles();
    } catch (err: any) { alert(err.message); }
  };

  
  const filtered = vehicles.filter((item: any) => 
    (item.make && String(item.make).toLowerCase().includes(searchTerm.toLowerCase())) || (item.model && String(item.model).toLowerCase().includes(searchTerm.toLowerCase())) || (item.plateNumber && String(item.plateNumber).toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  if (isLoading) return <div className="p-8 text-neutral-500">Loading fleet...</div>;

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Fleet & Vehicles</h1>
          <p className="text-neutral-500 font-medium mt-1">Manage vehicles, assignments, and compliance dates.</p>
        </div>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="bg-neutral-900 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Vehicle
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-neutral-900 text-lg">New Vehicle</h3>
            <button onClick={() => setIsAdding(false)} className="text-neutral-400 hover:text-neutral-600"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Make *</label><input required type="text" className="w-full px-3 py-2 border rounded-lg" value={formData.make || ''} onChange={e=>setFormData({...formData, make: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-1">Model *</label><input required type="text" className="w-full px-3 py-2 border rounded-lg" value={formData.model || ''} onChange={e=>setFormData({...formData, model: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium mb-1">License Plate *</label><input required type="text" className="w-full px-3 py-2 border rounded-lg" value={formData.licensePlate || ''} onChange={e=>setFormData({...formData, licensePlate: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-1">Year</label><input type="number" className="w-full px-3 py-2 border rounded-lg" value={formData.year || ''} onChange={e=>setFormData({...formData, year: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-1">Type</label><select className="w-full px-3 py-2 border rounded-lg bg-white" value={formData.type || ''} onChange={e=>setFormData({...formData, type: e.target.value})}><option>Truck</option><option>Van</option><option>Car</option><option>Heavy Equipment</option></select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">VIN</label><input type="text" className="w-full px-3 py-2 border rounded-lg" value={formData.vin || ''} onChange={e=>setFormData({...formData, vin: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-1">Current Mileage</label><input type="number" className="w-full px-3 py-2 border rounded-lg" value={formData.currentMileage || ''} onChange={e=>setFormData({...formData, currentMileage: parseInt(e.target.value)})} /></div>
            </div>
            
            <h4 className="font-semibold text-neutral-900 border-b border-neutral-100 pb-2 mt-4">Compliance</h4>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium mb-1">Insurance Expiry</label><input type="date" className="w-full px-3 py-2 border rounded-lg" value={formData.insuranceExpiry || ''} onChange={e=>setFormData({...formData, insuranceExpiry: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-1">Reg. Expiry</label><input type="date" className="w-full px-3 py-2 border rounded-lg" value={formData.registrationExpiry || ''} onChange={e=>setFormData({...formData, registrationExpiry: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-1">Inspection Expiry</label><input type="date" className="w-full px-3 py-2 border rounded-lg" value={formData.inspectionExpiry || ''} onChange={e=>setFormData({...formData, inspectionExpiry: e.target.value})} /></div>
            </div>

            <div className="flex justify-end pt-4 gap-3">
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 font-medium bg-neutral-900 text-white hover:bg-neutral-800 rounded-lg">Save Vehicle</button>
            </div>
          </form>
        </div>
      )}

      {!isAdding && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(v => (
            <div key={v.id} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${v.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-700'}`}>
                  {v.status}
                </span>
              </div>
              <h3 className="font-bold text-neutral-900 text-lg mb-1">{v.make} {v.model} {v.year && `(${v.year})`}</h3>
              <p className="text-neutral-500 text-sm mb-4">Plate: <span className="font-mono font-medium text-neutral-900">{v.licensePlate}</span></p>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full p-8 text-center border-2 border-dashed border-neutral-200 rounded-2xl text-neutral-500">
              No vehicles in fleet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
