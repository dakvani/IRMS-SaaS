import React, { useEffect, useState } from 'react';
import { Bed, Plus, X , Search} from 'lucide-react';

export default function RoomInventory() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    accommodationId: '', building: '', floor: '', roomNumber: '', capacity: 1
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = (window as any)._token;
      const headers = { Authorization: `Bearer ${token}` };
      const [rRes, fRes] = await Promise.all([
        fetch('/api/rooms', { headers }),
        fetch('/api/accommodations', { headers })
      ]);
      if (rRes.ok) setRooms(await rRes.json());
      if (fRes.ok) setFacilities(await fRes.json());
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = (window as any)._token;
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Failed to add room');
      setIsAdding(false);
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  
  const filtered = rooms.filter((item: any) => 
    (item.itemName && String(item.itemName).toLowerCase().includes(searchTerm.toLowerCase())) || (item.status && String(item.status).toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  if (isLoading) return <div className="p-8 text-neutral-500">Loading rooms...</div>;

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Room Inventory</h1>
          <p className="text-neutral-500 font-medium mt-1">Manage rooms and capacities across facilities.</p>
        </div>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="bg-neutral-900 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Room
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm max-w-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-neutral-900 text-lg">New Room</h3>
            <button onClick={() => setIsAdding(false)} className="text-neutral-400 hover:text-neutral-600"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Facility *</label>
              <select required className="w-full px-3 py-2 border rounded-lg bg-white" value={formData.accommodationId || ''} onChange={e=>setFormData({...formData, accommodationId: e.target.value})}>
                <option value="">Select Facility</option>
                {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Building</label><input type="text" className="w-full px-3 py-2 border rounded-lg" value={formData.building || ''} onChange={e=>setFormData({...formData, building: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-1">Floor</label><input type="text" className="w-full px-3 py-2 border rounded-lg" value={formData.floor || ''} onChange={e=>setFormData({...formData, floor: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Room Number *</label><input required type="text" className="w-full px-3 py-2 border rounded-lg" value={formData.roomNumber || ''} onChange={e=>setFormData({...formData, roomNumber: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-1">Capacity (Beds) *</label><input required type="number" min="1" className="w-full px-3 py-2 border rounded-lg" value={formData.capacity || ''} onChange={e=>setFormData({...formData, capacity: parseInt(e.target.value)})} /></div>
            </div>
            <div className="flex justify-end pt-4 gap-3">
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 font-medium bg-neutral-900 text-white hover:bg-neutral-800 rounded-lg">Save Room</button>
            </div>
          </form>
        </div>
      )}

      {!isAdding && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm flex-1 min-h-[400px] md:min-h-0 overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 sticky top-0 z-10 border-b border-neutral-200 text-neutral-500 font-semibold uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Facility</th>
                <th className="px-6 py-3">Building/Floor</th>
                <th className="px-6 py-3">Room</th>
                <th className="px-6 py-3">Capacity</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {rooms.map(r => (
                <tr key={r.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 font-medium text-neutral-900">{r.accommodation?.name || '-'}</td>
                  <td className="px-6 py-4 text-neutral-600">{r.building || '-'} {r.floor ? `/ Fl ${r.floor}` : ''}</td>
                  <td className="px-6 py-4 font-bold text-neutral-900 flex items-center gap-2"><Bed className="w-4 h-4 text-neutral-400" /> {r.roomNumber}</td>
                  <td className="px-6 py-4 text-neutral-600">{r.capacity} Beds</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${r.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-700'}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
              {rooms.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-neutral-500">No rooms found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
