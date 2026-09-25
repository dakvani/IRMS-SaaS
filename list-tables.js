import { db } from './src/db/index.js';
import { sql } from 'drizzle-orm';
async function run() {
  const res = await db.execute(sql`SELECT tablename FROM pg_tables WHERE schemaname='public';`);
  console.log(res.rows);
  process.exit(0);
}
run();
