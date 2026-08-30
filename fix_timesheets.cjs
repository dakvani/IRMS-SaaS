const fs = require('fs');
let code = fs.readFileSync('src/components/Timesheets.tsx', 'utf8');

code = code.replace(`const payload = Object.values(drafts).filter(d => !d.isExisting || d.status === 'draft').map(d => ({
        employeeId: d.employeeId || d.employee?.id,`, `const payload = Object.values(drafts).filter((d: any) => !d.isExisting || d.status === 'draft').map((d: any) => ({
        employeeId: d.employeeId || d.employee?.id,`);

fs.writeFileSync('src/components/Timesheets.tsx', code);
