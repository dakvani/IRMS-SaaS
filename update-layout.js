import fs from 'fs';

let code = fs.readFileSync('src/components/Layout.tsx', 'utf-8');

const oldNav = "bg-neutral-900 text-white shadow-md";
const newNav = "bg-indigo-600 text-white shadow-md shadow-indigo-600/20";
code = code.replace(oldNav, newNav);

const oldHover = "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900";
const newHover = "text-neutral-500 hover:bg-indigo-50 hover:text-indigo-600";
code = code.replace(oldHover, newHover);

fs.writeFileSync('src/components/Layout.tsx', code);
