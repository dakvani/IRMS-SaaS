with open("src/components/Employees.tsx", "r") as f:
    content = f.read()

import re

asset_ui = r"(<div key=\{asset\.id\} className=\"border border-neutral-100 rounded-xl p-4 hover:border-neutral-200 bg-neutral-50/50\">\s*<div className=\"flex justify-between items-start\">\s*<div>\s*<p className=\"font-bold text-neutral-900\">\{asset\.name\}</p>\s*<p className=\"text-sm text-neutral-500 mt-1 font-mono\">\{asset\.assetTag\}</p>\s*</div>\s*<span className=\{\`px-2\.5 py-1 rounded-full text-\[10px\] font-bold uppercase \$\{asset\.status === 'assigned' \? 'bg-blue-100 text-blue-700' : 'bg-neutral-100 text-neutral-600'\}\`\}>\s*\{asset\.type\}\s*</span>\s*</div>\s*</div>)"

new_asset_ui = """<div key={asset.id} className="border border-neutral-100 rounded-xl p-4 hover:border-neutral-200 bg-neutral-50/50 flex flex-col gap-3">
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
                      </div>"""

content = re.sub(asset_ui, new_asset_ui, content)

with open("src/components/Employees.tsx", "w") as f:
    f.write(content)
print("done")
