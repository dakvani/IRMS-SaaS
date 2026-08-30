import fs from 'fs';
let code = fs.readFileSync('src/components/SitesAndProjects.tsx', 'utf-8');

// replace value={siteForm.xyz} with value={siteForm.xyz || ''}
code = code.replace(/value=\{siteForm\.([a-zA-Z0-9]+)\}/g, "value={siteForm.$1 || ''}");

// replace value={projectForm.xyz} with value={projectForm.xyz || ''}
code = code.replace(/value=\{projectForm\.([a-zA-Z0-9]+)\}/g, "value={projectForm.$1 || ''}");

fs.writeFileSync('src/components/SitesAndProjects.tsx', code);
