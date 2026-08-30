import fs from 'fs';
let code = fs.readFileSync('src/main.tsx', 'utf-8');

code = code.replace(/import Projects from '\.\/components\/Projects\.tsx';\n/, '');
code = code.replace(/import Assignments from '\.\/components\/Assignments\.tsx';\n/, '');
code = code.replace(/import Documents from '\.\/components\/Documents\.tsx';\n/, '');

// Remove the objects from the router array
code = code.replace(/\{\s*path: '_projects',\s*element: <Projects \/>\s*\},\s*/, '');
code = code.replace(/\{\s*path: '_documents',\s*element: <Documents \/>\s*\},\s*/, '');
code = code.replace(/\{\s*path: '_assignments',\s*element: <Assignments \/>\s*\},\s*/, '');

fs.writeFileSync('src/main.tsx', code);
