import fs from 'fs';
let code = fs.readFileSync('src/components/Assets.tsx', 'utf-8');

code = code.replace(
  /\) : \(\s*\{viewMode === 'list' && \(/,
  `) : (\n        <>\n          {viewMode === 'list' && (`
);

code = code.replace(
  /\{viewMode === 'board'[\s\S]*?<\/div>\s*\)\}\s*\{\/\* Asset Details Modal \*\/\}/,
  (match) => {
    return match.replace(/<\/div>\s*\)\}$/, '</div>\n      )}\n        </>\n      )\}\n      {/* Asset Details Modal */}');
  }
);

fs.writeFileSync('src/components/Assets.tsx', code);
