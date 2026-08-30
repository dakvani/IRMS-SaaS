import fs from 'fs';
let code = fs.readFileSync('src/components/Layout.tsx', 'utf-8');
code = code.replace(/Authorization: \\`Bearer \\\$\{\(window as any\)\._token\}\\`/g, "Authorization: `Bearer ${(window as any)._token}`");
fs.writeFileSync('src/components/Layout.tsx', code);
