with open("src/components/Employees.tsx", "r") as f:
    content = f.read()

import re

# We need to add state for assign/transfer
if "const [showAssetForm, setShowAssetForm]" not in content:
    content = content.replace("const [showAssignForm, setShowAssignForm] = useState(false);", "const [showAssignForm, setShowAssignForm] = useState(false);\n  const [showAssetForm, setShowAssetForm] = useState(false);\n  const [assetFormAction, setAssetFormAction] = useState<'assign' | 'transfer' | null>(null);\n  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);\n  const [transferTargetId, setTransferTargetId] = useState('');\n  const [availableAssets, setAvailableAssets] = useState<any[]>([]);")

# Function to fetch available assets when assign is clicked
fetch_assets_fn = """
  const handleOpenAssignAsset = async () => {
     setAssetFormAction('assign');
     setShowAssetForm(true);
     try {
       const token = (window as any)._token;
       const res = await fetch('/api/assets', { headers: { Authorization: `Bearer ${token}` } });
       if (res.ok) {
         const allAssets = await res.json();
         setAvailableAssets(allAssets.filter((a: any) => a.status === 'available' || !a.assignedToEmployeeId));
       }
     } catch(e) {}
  };

  const handleAssetAction = async (e: React.FormEvent) => {
     e.preventDefault();
     try {
       const token = (window as any)._token;
       if (assetFormAction === 'assign' && selectedAssetId) {
          const res = await fetch(`/api/assets/${selectedAssetId}`, {
             method: 'PUT',
             headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
             body: JSON.stringify({ assignedToEmployeeId: selectedEmployee.id, status: 'assigned' })
          });
          if (res.ok) {
             setShowAssetForm(false);
             fetchProfileData(selectedEmployee.id);
          }
       } else if (assetFormAction === 'transfer' && selectedAssetId && transferTargetId) {
          const res = await fetch(`/api/assets/${selectedAssetId}`, {
             method: 'PUT',
             headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
             body: JSON.stringify({ assignedToEmployeeId: parseInt(transferTargetId), status: 'assigned' })
          });
          if (res.ok) {
             setShowAssetForm(false);
             fetchProfileData(selectedEmployee.id);
          }
       }
     } catch (e) {}
  };

  const handleUnassignAsset = async (assetId: number) => {
     try {
       const token = (window as any)._token;
       const res = await fetch(`/api/assets/${assetId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ assignedToEmployeeId: null, status: 'available' })
       });
       if (res.ok) {
          fetchProfileData(selectedEmployee.id);
       }
     } catch (e) {}
  };
"""

# Insert functions near handleDocSubmit
if "handleOpenAssignAsset" not in content:
    content = content.replace("const handleDocSubmit = async (e: React.FormEvent) => {", fetch_assets_fn + "\n  const handleDocSubmit = async (e: React.FormEvent) => {")

# Replace Asset Section UI
asset_section_start = content.find('<h3 className="font-bold text-neutral-900 mb-4 pb-2 border-b border-neutral-100 flex items-center gap-2">')
asset_section_start = content.find('Asset & Equipment', asset_section_start)
if asset_section_start != -1:
    h3_start = content.rfind('<h3', 0, asset_section_start)
    h3_end = content.find('</h3>', h3_start) + 5
    
    new_h3 = """<h3 className="font-bold text-neutral-900 mb-4 pb-2 border-b border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-neutral-400" /> Asset & Equipment</div>
                  {!showAssetForm && (
                    <button onClick={handleOpenAssignAsset} className="text-sm bg-neutral-100 hover:bg-neutral-200 text-neutral-900 px-3 py-1.5 rounded-lg font-medium transition-colors">
                      + Assign
                    </button>
                  )}
                </h3>"""
    
    content = content[:h3_start] + new_h3 + content[h3_end:]
    
    # insert form below h3
    form_jsx = """
                {showAssetForm && (
                  <form onSubmit={handleAssetAction} className="mb-4 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                    <h4 className="text-sm font-bold mb-3">{assetFormAction === 'assign' ? 'Assign Asset' : 'Transfer Asset'}</h4>
                    <div className="space-y-3 mb-3">
                      {assetFormAction === 'assign' ? (
                        <div>
                          <label className="text-xs font-semibold text-neutral-700 block mb-1">Select Available Asset</label>
                          <select required className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded" value={selectedAssetId || ''} onChange={e=>setSelectedAssetId(parseInt(e.target.value))}>
                            <option value="">-- Choose Asset --</option>
                            {availableAssets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.assetTag})</option>)}
                          </select>
                        </div>
                      ) : (
                        <div>
                          <label className="text-xs font-semibold text-neutral-700 block mb-1">Transfer to Employee</label>
                          <select required className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded" value={transferTargetId} onChange={e=>setTransferTargetId(e.target.value)}>
                            <option value="">-- Choose Employee --</option>
                            {employees.filter(e => e.id !== selectedEmployee.id).map(e => <option key={e.id} value={e.id}>{e.name || `${e.firstName} ${e.lastName}`}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setShowAssetForm(false)} className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-200 rounded">Cancel</button>
                      <button type="submit" className="px-3 py-1.5 text-xs font-medium bg-neutral-900 text-white rounded hover:bg-neutral-800">Save</button>
                    </div>
                  </form>
                )}
"""
    # Insert form jsx right after h3
    idx = content.find('</h3>', h3_start) + 5
    content = content[:idx] + form_jsx + content[idx:]

    # Now modify the map loop to include unassign/transfer buttons
    loop_start = content.find('{employeeAssets.map((asset: any) => (')
    if loop_start != -1:
        loop_end = content.find('</div>\n                    ))} ', loop_start) # find end of loop block
        # Actually it's easier to just replace the whole map block
        new_loop = """{employeeAssets.map((asset: any) => (
                      <div key={asset.id} className="border border-neutral-100 rounded-xl p-4 hover:border-neutral-200 bg-neutral-50/50 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-neutral-900">{asset.name}</p>
                            <p className="text-sm text-neutral-500 mt-1 font-mono">{asset.assetTag}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${asset.status === 'assigned' ? 'bg-blue-100 text-blue-700' : 'bg-neutral-100 text-neutral-600'}`}>
                            {asset.type}
                          </span>
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                          <button onClick={() => { setAssetFormAction('transfer'); setSelectedAssetId(asset.id); setShowAssetForm(true); }} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Transfer</button>
                          <button onClick={() => handleUnassignAsset(asset.id)} className="text-xs font-medium text-red-600 hover:text-red-800">Unassign</button>
                        </div>
                      </div>
                    ))}"""
        
        # Regex replace the loop block
        content = re.sub(r"\{employeeAssets\.map\(\(asset: any\) => \([\s\S]*?</div>\s*\)\)\}", new_loop, content)

with open("src/components/Employees.tsx", "w") as f:
    f.write(content)
print("done")
