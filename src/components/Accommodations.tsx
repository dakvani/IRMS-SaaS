import React, { useEffect, useState } from 'react';
import { Home, Plus, X , Search} from 'lucide-react';

export default function Accommodations() {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', address: '', status: 'active' });

  const fetchFacilities = async () => {
    setIsLoading(true);
    try {
      const token = (window as any)._token;
      const res = await fetch('/api/accommodations', { headers: { Authorization: `Bearer ${token}` }});
      if (res.ok) setFacilities(await res.json());
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchFacilities(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = (window as any)._token;
      const res = await fetch('/api/accommodations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Failed to add facility');
      setIsAdding(false);
      setFormData({ name: '', address: '', status: 'active' });
      fetchFacilities();
    } catch (err: any) { alert(err.message); }
  };

  
  const filtered = facilities.filter((item: any) => 
    (item.name && String(item.name).toLowerCase().includes(searchTerm.toLowerCase())) || (item.type && String(item.type).toLowerCase().includes(searchTerm.toLowerCase())) || (item.location && String(item.location).toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  if (isLoading) return <div className="p-8 text-neutral-500">Loading facilities...</div>;

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Accommodation Facilities</h1>
          <p className="text-neutral-500 font-medium mt-1">Manage staff housing locations.</p>
        </div>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="bg-neutral-900 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Facility
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm max-w-xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-neutral-900 text-lg">New Facility</h3>
            <button onClick={() => setIsAdding(false)} className="text-neutral-400 hover:text-neutral-600"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">Facility Name *</label><input required type="text" className="w-full px-3 py-2 border rounded-lg" value={formData.name || ''} onChange={e=>setFormData({...formData, name: e.target.value})} /></div>
            <div><label className="block text-sm font-medium mb-1">Address</label><input type="text" className="w-full px-3 py-2 border rounded-lg" value={formData.address || ''} onChange={e=>setFormData({...formData, address: e.target.value})} /></div>
            <div className="flex justify-end pt-4 gap-3">
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 font-medium bg-neutral-900 text-white hover:bg-neutral-800 rounded-lg">Save Facility</button>
            </div>
          </form>
        </div>
      )}

      {!isAdding && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {facilities.map(f => (
            <div key={f.id} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
              <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4">
                <Home className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-neutral-900 text-lg mb-1">{f.name}</h3>
              <p className="text-neutral-500 text-sm">{f.address || 'No address provided'}</p>
            </div>
          ))}
          {facilities.length === 0 && (
            <div className="col-span-full p-8 text-center border-2 border-dashed border-neutral-200 rounded-2xl text-neutral-500">
              No facilities added yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
