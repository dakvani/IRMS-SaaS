import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf-8');

// 1. In server.ts, 'notifications' needs to be imported or removed if it wasn't defined in schema.
// Looks like `notifications` was used but never imported from src/db/schema.
code = code.replace(/import \{([\s\S]*?)auditLogs/g, 'import { $1auditLogs, notifications');
// wait, maybe notifications isn't in schema? Let's check schema.
let schemaCode = fs.readFileSync('src/db/schema.ts', 'utf-8');
if (!schemaCode.includes('export const notifications')) {
  // If notifications is missing from schema, I can't just import it.
  console.log('notifications not in schema!');
}

fs.writeFileSync('server.ts', code);
