with open("src/components/Employees.tsx", "r") as f:
    content = f.read()

handle_assign_fn = """
  const handleOpenAssignAsset = async () => {
     setAssetFormAction('assign');
     setShowAssetForm(true);
     try {
       const token = (window as any)._token;
       const res = await fetch(`/api/assets?status=available`, { headers: { Authorization: `Bearer ${token}` }});
       if (res.ok) setAvailableAssets(await res.json());
     } catch(e){}
  };

  const handleAssignAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = (window as any)._token;
      if (assetFormAction === 'assign' && assignAssetForm.assetId) {
         const res = await fetch(`/api/assets/${assignAssetForm.assetId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ assignedToEmployeeId: selectedEmployee.id, assignedToSiteId: null, status: 'assigned' })
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
"""

content = content.replace("  const handleUnassignAsset = async (assetId: number) => {", handle_assign_fn + "\n  const handleUnassignAsset = async (assetId: number) => {")

with open("src/components/Employees.tsx", "w") as f:
    f.write(content)
print("done")
