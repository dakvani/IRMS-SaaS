import fs from 'fs';

let mainCode = fs.readFileSync('src/main.tsx', 'utf-8');
const regex = /\{\s*path:\s*'\/vehicles',\s*element:\s*<Vehicles \/>\s*\},?/;
mainCode = mainCode.replace(regex, '');
fs.writeFileSync('src/main.tsx', mainCode);
