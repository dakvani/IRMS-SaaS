import fs from 'fs';
let code = fs.readFileSync('src/main.tsx', 'utf-8');
code = code.replace(/,\s*\{\s*\}/g, '');
fs.writeFileSync('src/main.tsx', code);
