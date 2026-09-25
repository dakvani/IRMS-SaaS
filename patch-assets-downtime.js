import fs from 'fs';
let code = fs.readFileSync('src/components/Assets.tsx', 'utf-8');

code = code.replace(
  /const \[maintenanceForm, setMaintenanceForm\] = useState\(\{ serviceDate: '', technicianNotes: '', status: 'completed' \}\);/,
  "const [maintenanceForm, setMaintenanceForm] = useState({ serviceDate: '', technicianNotes: '', status: 'completed', downtimeDays: 0 });"
);

// Add to fetch payload
code = code.replace(
  /body: JSON\.stringify\(\{ \.\.\.maintenanceForm \}\)/,
  "body: JSON.stringify({ ...maintenanceForm, downtimeDays: Number(maintenanceForm.downtimeDays) || 0 })"
);

// Add to the form UI
const downtimeField = `
                          <div className="grid grid-cols-2 gap-3 mt-3">
                            <div><label className="block text-xs font-semibold text-neutral-700 mb-1">Downtime (Days)</label><input type="number" min="0" value={maintenanceForm.downtimeDays} onChange={e => setMaintenanceForm({...maintenanceForm, downtimeDays: parseInt(e.target.value) || 0})} className="w-full text-sm p-2 border border-neutral-300 rounded" /></div>
                          </div>
`;

code = code.replace(
  /<div><label className="block text-xs font-semibold text-neutral-700 mb-1">Technician Notes<\/label>/,
  downtimeField + '\n                          <div><label className="block text-xs font-semibold text-neutral-700 mb-1">Technician Notes</label>'
);

fs.writeFileSync('src/components/Assets.tsx', code);
