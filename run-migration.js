import { db } from './src/db/index.js';
import { sql } from 'drizzle-orm';

async function migrate() {
  try {
    await db.execute(sql`ALTER TABLE leaves ADD COLUMN site_id integer REFERENCES sites(id);`);
    await db.execute(sql`ALTER TABLE leaves ADD COLUMN project_id integer REFERENCES projects(id);`);
    await db.execute(sql`ALTER TABLE leaves ADD COLUMN reason text;`);
    console.log("Migration successful");
  } catch (e) {
    console.log("Migration skipped or failed: ", e.message);
  }
  process.exit(0);
}
migrate();
