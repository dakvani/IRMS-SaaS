import { db } from './src/db/index.js';
import { sql } from 'drizzle-orm';
async function run() {
  const res = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name='leaves';`);
  console.log(res.rows);
  process.exit(0);
}
run();
