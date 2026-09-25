with open("src/components/Assets.tsx", "r") as f:
    content = f.read()

import re

unassign_fn = """  const handleUnassign = async () => {
    try {
      const token = (window as any)._token;
      const res = await fetch(`/api/assets/${selectedAsset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          assignedToEmployeeId: null,
          assignedToSiteId: null,
          status: 'available'
        })
      });
      if (res.ok) {
        fetchData();
        setSelectedAsset(null);
      }
    } catch (err) {
      console.error(err);
    }
  };"""

if "const handleUnassign =" not in content:
    content = content.replace("  const handleAssign = async", unassign_fn + "\n\n  const handleAssign = async")

assignment_ui = r"(<p className=\"text-xs text-neutral-400 mt-2\">Assigned on: \{selectedAsset\.assignmentDate \? new Date\(selectedAsset\.assignmentDate\)\.toLocaleDateString\(\) : 'N/A'\}</p>\s*</div>\s*</div>)"
content = re.sub(assignment_ui, r"\1\n                        <button onClick={handleUnassign} className=\"bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-lg text-sm font-bold w-full hover:bg-red-100 transition-colors mb-4\">Unassign / Return to Available</button>", content)

site_assignment_ui = r"(<p className=\"text-sm text-neutral-600 mt-1\">Direct Site Assignment</p>\s*</div>)"
content = re.sub(site_assignment_ui, r"\1\n                        <button onClick={handleUnassign} className=\"bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-lg text-sm font-bold w-full hover:bg-red-100 transition-colors mb-4\">Unassign / Return to Available</button>", content)

with open("src/components/Assets.tsx", "w") as f:
    f.write(content)
print("done")
