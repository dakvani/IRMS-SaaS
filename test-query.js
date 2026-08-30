import 'dotenv/config';
import { db } from './src/db/index.js';
import { sql } from 'drizzle-orm';
import { timesheets, sites, projects } from './src/db/schema.js';

async function run() {
  console.log("Testing grouping");
}
run();
