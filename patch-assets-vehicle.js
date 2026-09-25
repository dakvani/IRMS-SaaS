import fs from 'fs';
let code = fs.readFileSync('src/components/Assets.tsx', 'utf-8');

code = code.replace(
  /const \[formData, setFormData\] = useState\(\{[\s\n]*name: '', assetTag: '', type: 'Laptop', assignedToEmployeeId: '', assignedToSiteId: '', status: 'available',[\s\n]*purchasePrice: '', purchaseDate: '', salvageValue: '', usefulLifeYears: '', depreciationMethod: 'straight_line', maintenanceIntervalDays: ''[\s\n]*\}\);/,
  "const [formData, setFormData] = useState({ name: '', assetTag: '', type: 'Laptop', assignedToEmployeeId: '', assignedToSiteId: '', status: 'available', purchasePrice: '', purchaseDate: '', salvageValue: '', usefulLifeYears: '', depreciationMethod: 'straight_line', maintenanceIntervalDays: '', make: '', model: '', licensePlate: '', year: '', vin: '', warrantyExpiry: '' });"
);

// Add 'Vehicle' to type options
code = code.replace(/<option>Tools<\/option>/, '<option>Tools</option><option>Vehicle</option>');

// Add vehicle fields in the Add/Edit form
const vehicleFields = `
                      {formData.type === 'Vehicle' && (
                        <>
                          <div className="col-span-2"><h4 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2 mt-2">Vehicle Details</h4></div>
                          <div><label className="text-xs font-semibold text-neutral-700 block mb-1">Make</label><input className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded" value={formData.make} onChange={e=>setFormData({...formData, make: e.target.value})} placeholder="e.g. Toyota" /></div>
                          <div><label className="text-xs font-semibold text-neutral-700 block mb-1">Model</label><input className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded" value={formData.model} onChange={e=>setFormData({...formData, model: e.target.value})} placeholder="e.g. Hilux" /></div>
                          <div><label className="text-xs font-semibold text-neutral-700 block mb-1">Year</label><input type="number" className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded" value={formData.year} onChange={e=>setFormData({...formData, year: e.target.value})} placeholder="e.g. 2024" /></div>
                          <div><label className="text-xs font-semibold text-neutral-700 block mb-1">License Plate</label><input className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded" value={formData.licensePlate} onChange={e=>setFormData({...formData, licensePlate: e.target.value})} /></div>
                          <div><label className="text-xs font-semibold text-neutral-700 block mb-1">VIN Number</label><input className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded" value={formData.vin} onChange={e=>setFormData({...formData, vin: e.target.value})} /></div>
                          <div><label className="text-xs font-semibold text-neutral-700 block mb-1">Warranty Expiry</label><input type="date" className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded" value={formData.warrantyExpiry} onChange={e=>setFormData({...formData, warrantyExpiry: e.target.value})} /></div>
                        </>
                      )}
`;

code = code.replace(/<div className="col-span-2"><h4 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2 mt-2">Financial \& Depreciation<\/h4><\/div>/, vehicleFields + '\n                      <div className="col-span-2"><h4 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2 mt-2">Financial & Depreciation</h4></div>');

// Add vehicle details to the view mode
const viewVehicleDetails = `
                  {selectedAsset.type === 'Vehicle' && (
                    <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 mt-4">
                      <h4 className="text-sm font-bold text-neutral-900 mb-3 flex items-center gap-2"><Truck className="w-4 h-4 text-neutral-600" /> Vehicle Specs</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div><span className="block text-xs text-neutral-500 uppercase font-semibold">Make/Model</span><span className="font-medium">{selectedAsset.year} {selectedAsset.make} {selectedAsset.model}</span></div>
                        <div><span className="block text-xs text-neutral-500 uppercase font-semibold">License Plate</span><span className="font-medium bg-neutral-200 px-2 py-0.5 rounded text-neutral-800 tracking-wider font-mono">{selectedAsset.licensePlate || 'N/A'}</span></div>
                        <div><span className="block text-xs text-neutral-500 uppercase font-semibold">VIN</span><span className="font-medium text-xs font-mono">{selectedAsset.vin || 'N/A'}</span></div>
                        <div><span className="block text-xs text-neutral-500 uppercase font-semibold">Warranty Expiry</span><span className="font-medium">{selectedAsset.warrantyExpiry ? new Date(selectedAsset.warrantyExpiry).toLocaleDateString() : 'N/A'}</span></div>
                      </div>
                    </div>
                  )}
`;
code = code.replace(/<div className="grid grid-cols-1 md:grid-cols-2 gap-4">/, viewVehicleDetails + '\n                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">');

if (!code.includes('Truck')) {
  code = code.replace('import { Package', 'import { Package, Truck');
}

fs.writeFileSync('src/components/Assets.tsx', code);
