import fs from 'fs';
let code = fs.readFileSync('src/components/Employees.tsx', 'utf-8');

// replace value={formData.xyz} with value={formData.xyz || ''}
code = code.replace(/value=\{formData\.([a-zA-Z0-9]+)\}/g, "value={formData.$1 || ''}");

// assignForm
code = code.replace(/value=\{assignForm\.([a-zA-Z0-9]+)\}/g, "value={assignForm.$1 || ''}");

// docForm
code = code.replace(/value=\{docForm\.([a-zA-Z0-9]+)\}/g, "value={docForm.$1 || ''}");

fs.writeFileSync('src/components/Employees.tsx', code);
