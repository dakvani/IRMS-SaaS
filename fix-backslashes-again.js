import fs from 'fs';
let code = fs.readFileSync('src/components/Timesheets.tsx', 'utf-8');
code = code.replace(/\\`([^`]+)\\`/g, '`$1`'); 
code = code.replace(/\\\${/g, '${'); 
fs.writeFileSync('src/components/Timesheets.tsx', code);
