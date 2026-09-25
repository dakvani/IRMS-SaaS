import fs from 'fs';
let code = fs.readFileSync('src/components/Layout.tsx', 'utf-8');
code = code.replace(/<NavLink to="\/vehicles" className=\{navItemClass\}>[\s\S]*?<\/NavLink>/g, '');
fs.writeFileSync('src/components/Layout.tsx', code);
