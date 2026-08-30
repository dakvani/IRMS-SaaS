import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf-8');
code = code.replace("import { eq, and, ilike, or, desc } from 'drizzle-orm';", "import { eq, and, ilike, or, desc, sql } from 'drizzle-orm';");
fs.writeFileSync('server.ts', code);
