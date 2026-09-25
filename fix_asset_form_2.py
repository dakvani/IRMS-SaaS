with open("src/components/Assets.tsx", "r") as f:
    content = f.read()

import re

form_input = """<div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Type *</label>"""
new_form_input = """<div className="col-span-2">
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Photo URL (Optional)</label>
                    <input type="url" placeholder="https://..." className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20" value={assetForm.photoUrl || ''} onChange={e => setAssetForm({...assetForm, photoUrl: e.target.value})} />
                  </div>\n                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Type *</label>"""
content = content.replace(form_input, new_form_input)

# Add image preview in details
details_header = """<div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-neutral-900">{selectedAsset.name}</h2>
                        <div className="flex items-center gap-3 mt-2">"""
new_details_header = """<div className="flex justify-between items-start mb-6">
                      <div className="flex gap-4">
                        {selectedAsset.photoUrl && (
                          <div className="w-24 h-24 rounded-xl border border-neutral-200 overflow-hidden bg-neutral-100 shrink-0">
                             <img src={selectedAsset.photoUrl} alt={selectedAsset.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div>
                        <h2 className="text-2xl font-bold text-neutral-900">{selectedAsset.name}</h2>
                        <div className="flex items-center gap-3 mt-2">"""

# Close the newly opened flex container
details_header_close = """<span className="font-mono text-sm text-neutral-500 bg-neutral-100 px-2 py-1 rounded">{selectedAsset.assetTag}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">"""

new_details_header_close = """<span className="font-mono text-sm text-neutral-500 bg-neutral-100 px-2 py-1 rounded">{selectedAsset.assetTag}</span>
                        </div>
                        </div>
                      </div>
                      <div className="flex gap-2">"""

content = content.replace(details_header, new_details_header)
content = content.replace(details_header_close, new_details_header_close)

with open("src/components/Assets.tsx", "w") as f:
    f.write(content)
print("done")
