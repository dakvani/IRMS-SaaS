import 'dotenv/config';
import { db } from './src/db/index.ts';
import { sql } from 'drizzle-orm';
async function run() {
  const res = await db.execute(sql`SELECT 1 as num`);
  console.log(res);
  process.exit(0);
}
run();
