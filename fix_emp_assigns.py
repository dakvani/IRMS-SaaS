with open("src/components/Employees.tsx", "r") as f:
    content = f.read()

import re

# Add state
if "const [selectedAssignId" not in content:
    content = content.replace("const [showAssignForm, setShowAssignForm] = useState(false);", "const [showAssignForm, setShowAssignForm] = useState(false);\n  const [selectedAssignId, setSelectedAssignId] = useState<number | null>(null);")

# Update handleAssignSubmit
new_handle_assign = """
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = (window as any)._token;
      const url = selectedAssignId ? `/api/assignments/${selectedAssignId}` : '/api/assignments';
      const method = selectedAssignId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...assignForm, employeeId: selectedEmployee.id })
      });
      if (res.ok) {
        setShowAssignForm(false);
        setSelectedAssignId(null);
        fetchProfileData(selectedEmployee.id);
      } else throw new Error(await res.text());
    } catch (e: any) { alert(e.message); }
  };

  const handleUnassignAssignment = async (id: number) => {
    if (!confirm('Are you sure you want to remove this assignment?')) return;
    try {
      const token = (window as any)._token;
      const res = await fetch(`/api/assignments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchProfileData(selectedEmployee.id);
      }
    } catch (e: any) { alert(e.message); }
  };

  const handleEditAssignment = (ass: any) => {
    setSelectedAssignId(ass.id);
    setAssignForm({
       role: ass.role || '',
       status: ass.status || 'Active',
       siteId: ass.siteId?.toString() || '',
       projectId: ass.projectId?.toString() || '',
       startDate: ass.startDate ? ass.startDate.split('T')[0] : '',
       endDate: ass.endDate ? ass.endDate.split('T')[0] : ''
    });
    setShowAssignForm(true);
  };
"""

content = re.sub(r"const handleAssignSubmit = async \(\w: React\.FormEvent\) => \{[\s\S]*?catch \(e: any\) \{ alert\(e\.message\); \}\n  \};", new_handle_assign.strip(), content)

# Find "+ Assign" button block to reset state
assign_btn = r"(<button onClick=\{\(\) => setShowAssignForm\(true\)\} className=\"text-sm bg-neutral-100 hover:bg-neutral-200 text-neutral-900 px-3 py-1\.5 rounded-lg font-medium transition-colors\">\s*\+\s*Assign\s*</button>)"
content = re.sub(assign_btn, r"""<button onClick={() => { setSelectedAssignId(null); setAssignForm({ role: '', status: 'Active', siteId: '', projectId: '', startDate: '', endDate: '' }); setShowAssignForm(true); }} className="text-sm bg-neutral-100 hover:bg-neutral-200 text-neutral-900 px-3 py-1.5 rounded-lg font-medium transition-colors">
                      + Assign
                    </button>""", content)

# Change "Save Assignment" to update text
content = content.replace(">Save Assignment</button>", ">{selectedAssignId ? 'Update' : 'Save'} Assignment</button>")

# Add Edit/Unassign buttons in assignments.map
assignment_item = r"(<div key=\{ass\.id\} className=\"border border-neutral-100 rounded-xl p-4 hover:border-neutral-200 bg-neutral-50/50\">[\s\S]*?<div className=\"flex justify-between items-start\">[\s\S]*?</div>\s*</div>)"

new_assignment_item = r"""<div key={ass.id} className="border border-neutral-100 rounded-xl p-4 hover:border-neutral-200 bg-neutral-50/50 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-neutral-900">{ass.role}</p>
                            <p className="text-sm text-neutral-500 mt-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {ass.site?.name || 'N/A'} • {ass.project?.name || 'N/A'}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ass.status === 'Active' ? 'bg-blue-100 text-blue-700' : 'bg-neutral-100 text-neutral-600'}`}>
                            {ass.status}
                          </span>
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                          <button onClick={() => handleEditAssignment(ass)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Edit</button>
                          <button onClick={() => handleUnassignAssignment(ass.id)} className="text-xs font-medium text-red-600 hover:text-red-800">Unassign</button>
                        </div>
                      </div>"""

content = re.sub(assignment_item, new_assignment_item, content)

with open("src/components/Employees.tsx", "w") as f:
    f.write(content)
print("done")
