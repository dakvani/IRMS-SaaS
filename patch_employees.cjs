const fs = require('fs');
let code = fs.readFileSync('src/components/Employees.tsx', 'utf8');

const additionalState = `
  const [activeTab, setActiveTab] = useState('list');
  const [editRequests, setEditRequests] = useState<any[]>([]);
  
  const fetchEditRequests = async () => {
    try {
      const token = (window as any)._token;
      const res = await fetch('/api/edit-requests', { headers: { Authorization: \`Bearer \${token}\` }});
      if (res.ok) setEditRequests(await res.json());
    } catch (e) {
      console.error(e);
    }
  };
  
  useEffect(() => {
    if (activeTab === 'requests') fetchEditRequests();
  }, [activeTab]);

  const handleApproveEdit = async (id: number) => {
    try {
      const token = (window as any)._token;
      const res = await fetch(\`/api/edit-requests/\${id}/approve\`, { method: 'PUT', headers: { Authorization: \`Bearer \${token}\` }});
      if (res.ok) {
        fetchEditRequests();
        fetchEmployees();
      }
    } catch (e) {
      console.error(e);
    }
  };
`;

code = code.replace("const [editReason, setEditReason] = useState('');", "const [editReason, setEditReason] = useState('');\n" + additionalState);

const navTabs = `
      <div className="flex border-b border-neutral-200 mb-6">
        <button 
          onClick={() => setActiveTab('list')}
          className={\`px-4 py-2 font-medium text-sm \${activeTab === 'list' ? 'border-b-2 border-neutral-900 text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}\`}
        >
          Employee Directory
        </button>
        <button 
          onClick={() => setActiveTab('requests')}
          className={\`px-4 py-2 font-medium text-sm flex items-center gap-2 \${activeTab === 'requests' ? 'border-b-2 border-neutral-900 text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}\`}
        >
          Edit Requests
          {editRequests.filter(r => r.status === 'pending').length > 0 && (
            <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">{editRequests.filter(r => r.status === 'pending').length}</span>
          )}
        </button>
      </div>
`;

code = code.replace("{!isFormOpen && (", navTabs + "\n      {activeTab === 'list' && !isFormOpen && (");

const editRequestsView = `
      {activeTab === 'requests' && !isFormOpen && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Entity</th>
                <th className="px-6 py-3">Changes</th>
                <th className="px-6 py-3">Reason</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {editRequests.map(req => (
                <tr key={req.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 font-medium text-neutral-900">{req.entity} #{req.entityId}</td>
                  <td className="px-6 py-4 font-mono text-xs text-neutral-600 max-w-xs truncate">{req.requestedChanges}</td>
                  <td className="px-6 py-4 text-neutral-600">{req.reason}</td>
                  <td className="px-6 py-4">
                    <span className={\`px-2 py-1 rounded-full text-xs font-semibold \${req.status === 'approved' ? 'bg-green-100 text-green-700' : req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}\`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {req.status === 'pending' && (
                       <button onClick={() => handleApproveEdit(req.id)} className="text-blue-600 hover:text-blue-800 p-1 bg-blue-50 rounded" title="Approve">
                         <Check className="w-4 h-4" /> Approve
                       </button>
                    )}
                  </td>
                </tr>
              ))}
              {editRequests.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-neutral-500">No edit requests.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
`;

code = code.replace("</div>\n  );\n}", editRequestsView + "\n    </div>\n  );\n}");
fs.writeFileSync('src/components/Employees.tsx', code);
