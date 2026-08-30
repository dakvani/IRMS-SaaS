import fs from 'fs';
let code = fs.readFileSync('src/components/Employees.tsx', 'utf-8');

// Add state for sites and projects
code = code.replace(/const \[assignments, setAssignments\] = useState<any\[\]>\(\[\]\);/, `const [assignments, setAssignments] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignForm, setAssignForm] = useState({ role: '', siteId: '', projectId: '', startDate: '', endDate: '', status: 'Active' });

  const [showDocForm, setShowDocForm] = useState(false);
  const [docForm, setDocForm] = useState({ documentType: '', documentUrl: '', issueDate: '', expiryDate: '' });
`);

// Add fetching sites and projects to useEffect
code = code.replace(/fetchEmployees\(\);\n  \}, \[\]\);/, `fetchEmployees();
    fetchSitesAndProjects();
  }, []);

  const fetchSitesAndProjects = async () => {
    try {
      const token = (window as any)._token;
      const headers = { Authorization: \`Bearer \${token}\` };
      const [sRes, pRes] = await Promise.all([
        fetch('/api/sites', { headers }),
        fetch('/api/projects', { headers })
      ]);
      if (sRes.ok) setSites(await sRes.json());
      if (pRes.ok) setProjects(await pRes.json());
    } catch (e) {
      console.error(e);
    }
  };
`);

// Add submission handlers
const handlers = `
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = (window as any)._token;
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
        body: JSON.stringify({ ...assignForm, employeeId: selectedEmployee.id })
      });
      if (res.ok) {
        setShowAssignForm(false);
        fetchProfileData(selectedEmployee.id);
      } else throw new Error(await res.text());
    } catch (e: any) { alert(e.message); }
  };

  const handleDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = (window as any)._token;
      const res = await fetch('/api/employee-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
        body: JSON.stringify({ ...docForm, employeeId: selectedEmployee.id })
      });
      if (res.ok) {
        setShowDocForm(false);
        fetchProfileData(selectedEmployee.id);
      } else throw new Error(await res.text());
    } catch (e: any) { alert(e.message); }
  };
`;
code = code.replace(/const filtered = employees.filter/, handlers + '\n  const filtered = employees.filter');

// Fix assignments card header
code = code.replace(/<div className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-neutral-400" \/> Active Assignments<\/div>\n\s*<\/h3>/, `<div className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-neutral-400" /> Active Assignments</div>
                  {!showAssignForm && (
                    <button onClick={() => setShowAssignForm(true)} className="text-sm bg-neutral-100 hover:bg-neutral-200 text-neutral-900 px-3 py-1.5 rounded-lg font-medium transition-colors">
                      + Assign
                    </button>
                  )}
                </h3>`);

// Add Assignment Form JSX
const assignFormJSX = `
                {showAssignForm && (
                  <form onSubmit={handleAssignSubmit} className="mb-4 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div><label className="text-xs font-semibold text-neutral-700 block mb-1">Role</label><input required className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded" value={assignForm.role} onChange={e=>setAssignForm({...assignForm, role: e.target.value})} /></div>
                      <div><label className="text-xs font-semibold text-neutral-700 block mb-1">Status</label><select className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded" value={assignForm.status} onChange={e=>setAssignForm({...assignForm, status: e.target.value})}><option>Active</option><option>Completed</option></select></div>
                      <div>
                        <label className="text-xs font-semibold text-neutral-700 block mb-1">Site</label>
                        <select className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded" value={assignForm.siteId} onChange={e=>setAssignForm({...assignForm, siteId: e.target.value})}>
                          <option value="">--</option>{sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-neutral-700 block mb-1">Project</label>
                        <select className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded" value={assignForm.projectId} onChange={e=>setAssignForm({...assignForm, projectId: e.target.value})}>
                          <option value="">--</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <div><label className="text-xs font-semibold text-neutral-700 block mb-1">Start Date</label><input type="date" required className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded" value={assignForm.startDate} onChange={e=>setAssignForm({...assignForm, startDate: e.target.value})} /></div>
                      <div><label className="text-xs font-semibold text-neutral-700 block mb-1">End Date</label><input type="date" className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded" value={assignForm.endDate} onChange={e=>setAssignForm({...assignForm, endDate: e.target.value})} /></div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setShowAssignForm(false)} className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-200 rounded">Cancel</button>
                      <button type="submit" className="px-3 py-1.5 text-xs font-medium bg-neutral-900 text-white rounded hover:bg-neutral-800">Save Assignment</button>
                    </div>
                  </form>
                )}
`;
code = code.replace(/\{isLoadingProfile \? \(/, assignFormJSX + '\n                {isLoadingProfile ? (');


// Fix documents card header
code = code.replace(/<div className="flex items-center gap-2"><FileText className="w-5 h-5 text-neutral-400" \/> Documents<\/div>\n\s*<\/h3>/, `<div className="flex items-center gap-2"><FileText className="w-5 h-5 text-neutral-400" /> Documents</div>
                  {!showDocForm && (
                    <button onClick={() => setShowDocForm(true)} className="text-sm bg-neutral-100 hover:bg-neutral-200 text-neutral-900 px-3 py-1.5 rounded-lg font-medium transition-colors">
                      + Upload
                    </button>
                  )}
                </h3>`);

// Add Document Form JSX
const docFormJSX = `
                {showDocForm && (
                  <form onSubmit={handleDocSubmit} className="mb-4 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="col-span-2"><label className="text-xs font-semibold text-neutral-700 block mb-1">Document Title/Type</label><input required className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded" value={docForm.documentType} onChange={e=>setDocForm({...docForm, documentType: e.target.value})} placeholder="e.g., Passport, Certificate" /></div>
                      <div><label className="text-xs font-semibold text-neutral-700 block mb-1">Issue Date</label><input type="date" className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded" value={docForm.issueDate} onChange={e=>setDocForm({...docForm, issueDate: e.target.value})} /></div>
                      <div><label className="text-xs font-semibold text-neutral-700 block mb-1">Expiry Date</label><input type="date" className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded" value={docForm.expiryDate} onChange={e=>setDocForm({...docForm, expiryDate: e.target.value})} /></div>
                      <div className="col-span-2"><label className="text-xs font-semibold text-neutral-700 block mb-1">Document URL (Optional)</label><input type="url" className="w-full text-sm px-3 py-1.5 border border-neutral-300 rounded" value={docForm.documentUrl} onChange={e=>setDocForm({...docForm, documentUrl: e.target.value})} placeholder="https://..." /></div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setShowDocForm(false)} className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-200 rounded">Cancel</button>
                      <button type="submit" className="px-3 py-1.5 text-xs font-medium bg-neutral-900 text-white rounded hover:bg-neutral-800">Save Document</button>
                    </div>
                  </form>
                )}
`;
code = code.replace(/\{isLoadingProfile \? \(\n\s*<p className="text-neutral-400 text-sm">Loading documents\.\.\.<\/p>/, docFormJSX + '\n                {isLoadingProfile ? (\n                  <p className="text-neutral-400 text-sm">Loading documents...</p>');

fs.writeFileSync('src/components/Employees.tsx', code);
