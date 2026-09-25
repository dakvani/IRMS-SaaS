import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf-8');

const regex = /res\.status\(500\)\.json\(\{ error: e\.message \}\);\s*\/\/\s*Notify site coordinators[\s\S]*?(?=\s*\}\s*\n\s*\/\/ Update Employee)/;

code = code.replace(regex, 'res.status(500).json({ error: e.message });');

fs.writeFileSync('server.ts', code);
