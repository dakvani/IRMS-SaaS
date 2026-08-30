import fs from 'fs';
const files = ['src/components/Timesheets.tsx'];

for (const file of files) {
  let code = fs.readFileSync(file, 'utf-8');
  code = code.replace(/\\`([^`]+)\\`/g, '`$1`'); 
  code = code.replace(/\\\${/g, '${'); 
  fs.writeFileSync(file, code);
}
