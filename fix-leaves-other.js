import fs from 'fs';

let code = fs.readFileSync('src/components/Leaves.tsx', 'utf-8');

// 1. Add otherLeaveType to formData
code = code.replace(
  /const \[formData, setFormData\] = useState\(\{([\s\S]*?)leaveType: 'Annual',([\s\S]*?)\}\);/,
  `const [formData, setFormData] = useState({$1leaveType: 'Annual',\n    otherLeaveType: '',$2});`
);

// 2. Reset otherLeaveType in handleSubmit
code = code.replace(
  /leaveType: 'Annual', startDate: '', endDate: '', reason: '' \}\);/,
  `leaveType: 'Annual', otherLeaveType: '', startDate: '', endDate: '', reason: '' });`
);

// 3. Update handleSubmit payload
code = code.replace(
  /body: JSON\.stringify\(formData\)/,
  `body: JSON.stringify({
          ...formData,
          leaveType: formData.leaveType === 'Other' ? (formData.otherLeaveType || 'Other') : formData.leaveType
        })`
);

// 4. Replace the entire Leave Type field
const leaveTypeFieldRegex = /<div className="space-y-1">\s*<label className="text-sm font-medium text-neutral-700">Leave Type \*\<\/label>[\s\S]*?<\/select>\s*<\/div>/;

const newLeaveTypeField = `<div className="space-y-1">
                <label className="text-sm font-medium text-neutral-700">Leave Type *</label>
                <select 
                  required
                  value={formData.leaveType}
                  onChange={e => setFormData({...formData, leaveType: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-sm bg-white"
                >
                  <option value="Annual">Annual Leave</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Unpaid">Unpaid Leave</option>
                  <option value="Maternity">Maternity Leave</option>
                  <option value="Paternity">Paternity Leave</option>
                  <option value="Other">Other</option>
                </select>
                {formData.leaveType === 'Other' && (
                  <input 
                    type="text"
                    required
                    placeholder="Specify other leave type"
                    value={formData.otherLeaveType}
                    onChange={e => setFormData({...formData, otherLeaveType: e.target.value})}
                    className="w-full mt-2 px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm"
                  />
                )}
              </div>`;

code = code.replace(leaveTypeFieldRegex, newLeaveTypeField);

// 6. Update search filtering
code = code.replace(
  /const filteredLeaves = leaves\.filter\(l =>[\s\S]*?\);/,
  `const searchLower = searchTerm.toLowerCase();
  const filteredLeaves = leaves.filter(l => 
    (l.employee?.firstName || '').toLowerCase().includes(searchLower) || 
    (l.employee?.lastName || '').toLowerCase().includes(searchLower) ||
    (l.requester?.firstName || '').toLowerCase().includes(searchLower) || 
    (l.requester?.lastName || '').toLowerCase().includes(searchLower) ||
    (l.site?.name || '').toLowerCase().includes(searchLower) ||
    (l.project?.name || '').toLowerCase().includes(searchLower) ||
    (l.leaveType || '').toLowerCase().includes(searchLower) ||
    (l.status || '').toLowerCase().includes(searchLower)
  );`
);

fs.writeFileSync('src/components/Leaves.tsx', code);
