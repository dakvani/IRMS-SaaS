import React, { useEffect, useState } from 'react';
import { Package, Plus, X , Search} from 'lucide-react';

export default function Assets() {
  const [assets, setAssets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    assetTag: '',
    type: 'Laptop',
    assignedToEmployeeId: '',
    assignedToSiteId: '',
    status: 'available'
  });

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = (window as any)._token;
      if (!token) throw new Error("No auth token");

      const [assetRes, empRes, siteRes] = await Promise.all([
        fetch('/api/assets', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/employees', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/sites', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (!assetRes.ok || !empRes.ok || !siteRes.ok) {
        throw new Error(`Failed to fetch assets data`);
      }

      setAssets(await assetRes.json());
      setEmployees(await empRes.json());
      setSites(await siteRes.json());
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = (window as any)._token;
      if (!token) throw new Error("No auth token");

      const payload = { ...formData };

      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Failed to add asset: ${res.statusText}`);
      }

      await fetchData();
      setIsAdding(false);
      setFormData({ name: '', assetTag: '', type: 'Laptop', assignedToEmployeeId: '', assignedToSiteId: '', status: 'available' });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unknown error occurred');
    }
  };

  
  const filtered = assets.filter((item: any) => 
    (item.assetName && String(item.assetName).toLowerCase().includes(searchTerm.toLowerCase())) || (item.tagNumber && String(item.tagNumber).toLowerCase().includes(searchTerm.toLowerCase())) || (item.status && String(item.status).toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50/50">
        <h2 className="text-lg font-semibold">Equipment & Assets</h2>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Asset
          </button>
        )}
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 text-red-700 border-b border-red-100 text-sm">
          {error}
        </div>
      )}

      {isAdding && (
        <div className="p-6 border-b border-neutral-200 bg-neutral-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-neutral-900">Add New Asset</h3>
            <button onClick={() => setIsAdding(false)} className="text-neutral-400 hover:text-neutral-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Name *</label>
                <input 
                  type="text" 
                  required
                  value={formData.name || ''}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="e.g. MacBook Pro M3"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Asset Tag *</label>
                <input 
                  type="text" 
                  required
                  value={formData.assetTag || ''}
                  onChange={e => setFormData({...formData, assetTag: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="e.g. IT-1001"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Type *</label>
                <select 
                  required
                  value={formData.type || ''}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                >
                  <option value="Laptop">Laptop</option>
                  <option value="Phone">Phone</option>
                  <option value="Vehicle">Vehicle</option>
                  <option value="Tools">Tools</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Assign to Employee</label>
                <select 
                  value={formData.assignedToEmployeeId || ''}
                  onChange={e => setFormData({...formData, assignedToEmployeeId: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                >
                  <option value="">None / Unassigned</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeId})</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Assign to Site</label>
                <select 
                  value={formData.assignedToSiteId || ''}
                  onChange={e => setFormData({...formData, assignedToSiteId: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                >
                  <option value="">None / Unassigned</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Status</label>
                <select 
                  required
                  value={formData.status || ''}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                >
                  <option value="available">Available</option>
                  <option value="assigned">Assigned</option>
                  <option value="maintenance">In Maintenance</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
            </div>
            
            <div className="pt-2 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-neutral-600 hover:text-neutral-900 font-medium text-sm transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm"
              >
                Save Asset
              </button>
            </div>
          </form>
        </div>
      )}
      
      {isLoading ? (
        <div className="p-12 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-neutral-500">
          <Package className="w-12 h-12 mx-auto text-neutral-300 mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-1">No assets found</h3>
          <p>Add equipment to track across your organization.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm flex-1 min-h-[400px] md:min-h-0 overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 sticky top-0 z-10 text-neutral-500 border-b border-neutral-200 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-3">Asset</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Assignment</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((asset) => (
                <tr key={asset.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-neutral-900">{asset.name}</div>
                    <div className="text-xs text-neutral-500 font-mono mt-0.5">{asset.assetTag}</div>
                  </td>
                  <td className="px-6 py-4 text-neutral-600">{asset.type}</td>
                  <td className="px-6 py-4 text-neutral-600 text-xs">
                    {asset.employee && (
                      <div>User: {asset.employee.firstName} {asset.employee.lastName}</div>
                    )}
                    {asset.site && (
                      <div className="text-neutral-400">Site: {asset.site.name}</div>
                    )}
                    {!asset.employee && !asset.site && (
                      <span className="text-neutral-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      asset.status === 'available' 
                        ? 'bg-green-100 text-green-800' 
                        : asset.status === 'assigned'
                          ? 'bg-blue-100 text-blue-800'
                          : asset.status === 'maintenance'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-neutral-100 text-neutral-800'
                    }`}>
                      {asset.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
