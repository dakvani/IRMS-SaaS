import fs from 'fs';
let code = fs.readFileSync('src/db/schema.ts', 'utf-8');
const replacement = `export const leaves = pgTable('leaves', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  employeeId: integer('employee_id').references(() => employees.id).notNull(),
  siteId: integer('site_id').references(() => sites.id),
  projectId: integer('project_id').references(() => projects.id),
  leaveType: text('leave_type').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  reason: text('reason'),
  status: text('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});`;

code = code.replace(/export const leaves = pgTable\('leaves', \{[\s\S]*?\}\);/, replacement);
fs.writeFileSync('src/db/schema.ts', code);
