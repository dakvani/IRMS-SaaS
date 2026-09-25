import fs from 'fs';
let code = fs.readFileSync('src/components/Assets.tsx', 'utf-8');

code = code.replace(/asset\.employee\.name/g, "(asset.employee.name || `${asset.employee.firstName} ${asset.employee.lastName}`)");
code = code.replace(/a\.employee\.name/g, "(a.employee.name || `${a.employee.firstName} ${a.employee.lastName}`)");

fs.writeFileSync('src/components/Assets.tsx', code);
