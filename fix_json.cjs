const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/const (\w+) = await res\.json\(\);(\s*throw new Error)/g, 
    "let $1; try { $1 = await res.json(); } catch(e) { $1 = { error: 'Server error' }; }$2");
  content = content.replace(/const (\w+) = await res\.json\(\);(\s*alert)/g, 
    "let $1; try { $1 = await res.json(); } catch(e) { $1 = { error: 'Server error' }; }$2");
  fs.writeFileSync(filePath, content);
}

fixFile('src/components/Employees.tsx');
fixFile('src/components/Settings.tsx');
fixFile('src/components/BulkImport.tsx');
