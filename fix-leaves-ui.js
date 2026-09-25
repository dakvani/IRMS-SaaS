import fs from 'fs';

let code = fs.readFileSync('src/components/Leaves.tsx', 'utf-8');

// Update formData initialization
code = code.replace(
  /const \[formData, setFormData\] = useState\(\{[\s\S]*?employeeId: '',/,
  `const [formData, setFormData] = useState({\n    requesterId: '',\n    employeeId: '',`
);

// Reset form data in handleSubmit
code = code.replace(
  /setFormData\(\{ employeeId: '', siteId: '', projectId: '', leaveType: 'Annual', startDate: '', endDate: '', reason: '' \}\);/,
  `setFormData({ requesterId: '', employeeId: '', siteId: '', projectId: '', leaveType: 'Annual', startDate: '', endDate: '', reason: '' });`
);

// Inject requester field into the form before the employee field
const formRegex = /<div className="space-y-1">\s*<label className="text-sm font-medium text-neutral-700">Employee \*\<\/label>/;
const requesterField = `<div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Requested By (Site In-Charge) *</label>
                <select 
                  required
                  value={formData.requesterId}
                  onChange={e => setFormData({...formData, requesterId: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-sm bg-white"
                >
                  <option value="">Select Requester</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeId})</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Employee (For Whom) *</label>`;

code = code.replace(formRegex, requesterField);

// We need to update the grid cols for the first row to md:grid-cols-2 (it currently has md:grid-cols-3 and we have site, project, requester, employee -> 4 items. Let's make it md:grid-cols-2).
// Wait, the grid was: Site, Project, Employee (3 cols). Now it has 4. Let's change grid to md:grid-cols-2.
code = code.replace(
  /<div className="grid grid-cols-1 md:grid-cols-3 gap-5">\s*<div className="space-y-1">\s*<label className="text-sm font-medium text-neutral-700">Site<\/label>/,
  `<div className="grid grid-cols-1 md:grid-cols-2 gap-5">\n              <div className="space-y-1">\n                <label className="text-sm font-medium text-neutral-700">Site</label>`
);


// In the table and modal, let's display the requester.
// In the table headers
code = code.replace(
  /<th className="px-6 py-4">Employee<\/th>/,
  `<th className="px-6 py-4">Requested By</th>\n                  <th className="px-6 py-4">Employee</th>`
);

// In the table row
code = code.replace(
  /<td className="px-6 py-4 font-medium text-neutral-900">\s*\{leave\.employee \? `\$\{leave\.employee\.firstName\} \$\{leave\.employee\.lastName\}` : '-'\}/,
  `<td className="px-6 py-4 text-neutral-600">\n                      {leave.requester ? \`\${leave.requester.firstName} \${leave.requester.lastName}\` : '-'}\n                      <div className="text-xs text-neutral-400 font-normal">{leave.requester?.employeeId}</div>\n                    </td>\n                    <td className="px-6 py-4 font-medium text-neutral-900">\n                      {leave.employee ? \`\${leave.employee.firstName} \${leave.employee.lastName}\` : '-'}`
);

// In the Review Modal, update the grid cols or add a requester field
code = code.replace(
  /<div>\s*<p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">Employee<\/p>/,
  `<div>
                      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">Requested By</p>
                      <p className="font-medium text-neutral-900">{reviewingLeave.requester?.firstName} {reviewingLeave.requester?.lastName || 'N/A'}</p>
                      <p className="text-sm text-neutral-500">{reviewingLeave.requester?.employeeId}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">Employee</p>`
);

code = code.replace(
  /<div className="grid grid-cols-2 gap-y-6 gap-x-8 mb-6">/,
  `<div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-8 mb-6">`
);

// Update table colSpan for "No leave requests found"
code = code.replace(/colSpan=\{6\}/g, "colSpan={7}");

fs.writeFileSync('src/components/Leaves.tsx', code);
