import fs from 'fs';
let code = fs.readFileSync('src/components/Assets.tsx', 'utf-8');

// Update Form fields
const extraFormFields = `
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Purchase Price ($)</label>
                <input type="number" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: e.target.value})} className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Purchase Date</label>
                <input type="date" value={formData.purchaseDate} onChange={e => setFormData({...formData, purchaseDate: e.target.value})} className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Salvage Value ($)</label>
                <input type="number" value={formData.salvageValue} onChange={e => setFormData({...formData, salvageValue: e.target.value})} className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Useful Life (Years)</label>
                <input type="number" value={formData.usefulLifeYears} onChange={e => setFormData({...formData, usefulLifeYears: e.target.value})} className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Depreciation Method</label>
                <select value={formData.depreciationMethod} onChange={e => setFormData({...formData, depreciationMethod: e.target.value})} className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                  <option value="straight_line">Straight Line</option>
                  <option value="double_declining">Double Declining Balance</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Maintenance Interval (Days)</label>
                <input type="number" value={formData.maintenanceIntervalDays} onChange={e => setFormData({...formData, maintenanceIntervalDays: e.target.value})} className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm" />
              </div>
            </div>
`;
code = code.replace(/<\/div>\s*<div className="pt-2 flex justify-end gap-3">/, `</div>\n${extraFormFields}\n            <div className="pt-2 flex justify-end gap-3">`);

// Edit Asset mapping
code = code.replace(
  /const openEditForm = \(asset: any\) => \{/,
  `const openEditForm = (asset: any) => {
    setFormData({
      name: asset.name, assetTag: asset.assetTag, type: asset.type, 
      assignedToEmployeeId: asset.employee ? asset.employee.id.toString() : '',
      assignedToSiteId: asset.site ? asset.site.id.toString() : '',
      status: asset.status,
      purchasePrice: asset.purchasePrice?.toString() || '',
      purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : '',
      salvageValue: asset.salvageValue?.toString() || '',
      usefulLifeYears: asset.usefulLifeYears?.toString() || '',
      depreciationMethod: asset.depreciationMethod || 'straight_line',
      maintenanceIntervalDays: asset.maintenanceIntervalDays?.toString() || ''
    });`
);
code = code.replace(/setFormData\(\{[\s\S]*?status: asset\.status\s*\}\);/, '');

// Update Details Modal with Maintenance and Depreciation
const detailsCode = `
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
                        <div className="flex justify-between border-t border-neutral-200 pt-2 mt-2">
                          <span className="font-bold text-neutral-700">Next Service Due:</span> 
                          <span className={\`font-bold \${getNextMaintenance(selectedAsset) && getNextMaintenance(selectedAsset)! < new Date() ? 'text-red-600' : 'text-blue-600'}\`}>
                            {getNextMaintenance(selectedAsset) ? getNextMaintenance(selectedAsset)!.toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2"><Settings className="w-4 h-4 text-neutral-600" /> Maintenance Logs</h4>
                      <button onClick={() => setShowMaintenanceForm(!showMaintenanceForm)} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">+ Log Service</button>
                    </div>
                    
                    <AnimatePresence>
                      {showMaintenanceForm && (
                        <motion.form 
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          onSubmit={handleAddMaintenance}
                          className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 mb-4 space-y-3"
                        >
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-neutral-700 mb-1">Service Date</label>
                              <input required type="date" value={maintenanceForm.serviceDate} onChange={e => setMaintenanceForm({...maintenanceForm, serviceDate: e.target.value})} className="w-full text-sm p-2 border border-neutral-300 rounded" />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-neutral-700 mb-1">Status</label>
                              <select value={maintenanceForm.status} onChange={e => setMaintenanceForm({...maintenanceForm, status: e.target.value})} className="w-full text-sm p-2 border border-neutral-300 rounded">
                                <option value="completed">Completed</option>
                                <option value="in_progress">In Progress</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">Technician Notes</label>
                            <textarea required value={maintenanceForm.technicianNotes} onChange={e => setMaintenanceForm({...maintenanceForm, technicianNotes: e.target.value})} className="w-full text-sm p-2 border border-neutral-300 rounded" rows={2} />
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button type="button" onClick={() => setShowMaintenanceForm(false)} className="text-xs px-3 py-1.5 text-neutral-600 hover:bg-neutral-200 rounded">Cancel</button>
                            <button type="submit" className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700">Save Log</button>
                          </div>
                        </motion.form>
                      )}
                    </AnimatePresence>

                    <div className="space-y-3">
                      {maintenanceLogs.length > 0 ? maintenanceLogs.map((log: any, i: number) => (
                        <div key={i} className="flex gap-3 text-sm p-3 bg-white border border-neutral-100 rounded-lg shadow-sm">
                          <Wrench className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                              <p className="font-bold text-neutral-900">{new Date(log.serviceDate).toLocaleDateString()}</p>
                              <span className={\`text-[10px] font-bold uppercase px-2 py-0.5 rounded \${log.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}\`}>{log.status}</span>
                            </div>
                            <p className="text-neutral-600 text-xs">{log.technicianNotes}</p>
                            <p className="text-neutral-400 text-[10px] mt-2">Logged by {log.performedBy?.name} on {new Date(log.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      )) : (
                        <p className="text-sm text-neutral-500 italic">No maintenance records logged.</p>
                      )}
                    </div>
                  </div>
`;
code = code.replace(/<div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">\s*<h4 className="text-sm font-bold text-neutral-900 mb-3">Assignment<\/h4>[\s\S]*?<\/div>\s*<div>\s*<h4 className="text-sm font-bold text-neutral-900 mb-3">History<\/h4>/, detailsCode + '\n                  <div>\n                    <h4 className="text-sm font-bold text-neutral-900 mb-3 mt-6 border-t border-neutral-200 pt-4 flex items-center gap-2"><ArrowRightLeft className="w-4 h-4 text-blue-600" /> Transfer & Audit History</h4>');

fs.writeFileSync('src/components/Assets.tsx', code);
