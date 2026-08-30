const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Find the second occurrence of /api/timesheets and remove it
const parts = code.split("app.get('/api/timesheets'");
if (parts.length > 3) {
  // We have 3 parts, which means 2 occurrences.
  // parts[0] + first occurrence + parts[1] + second occurrence + parts[2]
  // Let's just remove everything from the second occurrence up to app.get('/api/leaves'
  const fixRegex = /app\.get\('\/api\/timesheets'[\s\S]*?(?=app\.get\('\/api\/leaves')/;
  
  // Actually, we want to replace the second one, so we can replace the last occurrence.
  const idx = code.lastIndexOf("app.get('/api/timesheets'");
  const leavesIdx = code.indexOf("app.get('/api/leaves'");
  
  if (idx > parts[0].length && idx < leavesIdx) {
     code = code.substring(0, idx) + code.substring(leavesIdx);
     fs.writeFileSync('server.ts', code);
  }
}
