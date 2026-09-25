with open("src/components/Employees.tsx", "r") as f:
    content = f.read()

import re

asset_header = r"(<h3 className=\"font-bold text-neutral-900 mb-4 pb-2 border-b border-neutral-100 flex items-center justify-between\">\s*<div className=\"flex items-center gap-2\"><Package className=\"w-5 h-5 text-neutral-400\" /> Assigned Assets</div>\s*</h3>)"
new_asset_header = """<h3 className="font-bold text-neutral-900 mb-4 pb-2 border-b border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center gap-2"><Package className="w-5 h-5 text-neutral-400" /> Assigned Assets</div>
                  {!showAssetForm && (
                    <button onClick={handleOpenAssignAsset} className="text-sm bg-neutral-100 hover:bg-neutral-200 text-neutral-900 px-3 py-1.5 rounded-lg font-medium transition-colors">
                      + Assign
                    </button>
                  )}
                </h3>
                
                {showAssetForm && (
                  <form onSubmit={handleAssignAssetSubmit} className="mb-4 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                     <h4 className="text-sm font-bold mb-3">{assetFormAction === 'assign' ? 'Assign New Asset' : 'Transfer Asset to Another Employee'}</h4>
                     <div className="mb-3">
                        {assetFormAction === 'assign' ? (
                           <>
                           <label className="text-xs font-semibold text-neutral-700 block mb-1">Select Available Asset</label>
                           <select required className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded" value={assignAssetForm.assetId} onChange={e=>setAssignAssetForm({assetId: e.target.value})}>
                             <option value="">-- Choose Asset --</option>
                             {availableAssets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.assetTag})</option>)}
                           </select>
                           </>
                        ) : (
                           <>
                           <label className="text-xs font-semibold text-neutral-700 block mb-1">Select Target Employee</label>
                           <select required className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded" value={transferTargetId} onChange={e=>setTransferTargetId(e.target.value)}>
                             <option value="">-- Choose Employee --</option>
                             {employees.filter(emp => emp.id !== selectedEmployee.id).map(e => <option key={e.id} value={e.id}>{e.name || `${e.firstName} ${e.lastName}`}</option>)}
                           </select>
                           </>
                        )}
                     </div>
                     <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowAssetForm(false)} className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-200 rounded">Cancel</button>
                        <button type="submit" className="px-3 py-1.5 text-xs font-medium bg-neutral-900 text-white rounded hover:bg-neutral-800">{assetFormAction === 'assign' ? 'Assign' : 'Transfer'}</button>
                     </div>
                  </form>
                )}"""

content = re.sub(asset_header, new_asset_header, content)

with open("src/components/Employees.tsx", "w") as f:
    f.write(content)
print("done")
