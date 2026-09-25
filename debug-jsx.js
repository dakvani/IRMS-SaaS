import fs from 'fs';
const code = fs.readFileSync('src/components/Assets.tsx', 'utf-8');
console.log(code.substring(code.length - 200));
