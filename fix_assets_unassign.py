with open("src/components/Assets.tsx", "r") as f:
    content = f.read()

import re

# Add unassign functionality
unassign_fn = """
  const handleUnassign = async (assetId: number) => {
    try {
      const token = (window as any)._token;
      const res = await fetch(`/api/assets/${assetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ assignedToEmployeeId: null, status: 'available' })
      });
      if (res.ok) {
        fetchAssets();
        setSelectedAsset(null);
      }
    } catch(e) {}
  };
"""

if "handleUnassign" not in content:
    content = content.replace("const handleAssetSubmit = async (e: React.FormEvent) => {", unassign_fn + "\n  const handleAssetSubmit = async (e: React.FormEvent) => {")

# Find the Current Assignment block
assignment_block = r"(<div className=\"bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 flex items-start gap-4 mb-4\">[\s\S]*?<p className=\"text-sm text-neutral-600 mt-1 flex items-center gap-1\.5\"><MapPin className=\"w-4 h-4\" /> \{selectedAsset\.site\?\.name \|\| 'Assigned to Project / Site'\}</p>\s*</div>\s*</div>)"

# insert the unassign button
replacement_block = r"""\1
                          <button onClick={() => handleUnassign(selectedAsset.id)} className="bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-lg text-sm font-bold w-full hover:bg-red-100 transition-colors">
                            Unassign / Return to Available
                          </button>"""

content = re.sub(assignment_block, replacement_block, content)

with open("src/components/Assets.tsx", "w") as f:
    f.write(content)
print("done")
