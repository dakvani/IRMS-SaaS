import { db } from './src/db/index.js';
import { organizations, users, sites, projects, employees, timesheets, auditLogs } from './src/db/schema.js';
import { eq } from 'drizzle-orm';

async function seed() {
  try {
    // 1. Get first organization
    const orgs = await db.select().from(organizations).limit(1);
    if (!orgs.length) return console.log("No org found");
    const orgId = orgs[0].id;
    
    // Get first user (to act as the auditor)
    const allUsers = await db.select().from(users).where(eq(users.organizationId, orgId)).limit(1);
    const userId = allUsers.length > 0 ? allUsers[0].id : 1;

    // 2. Insert dummy site & project if needed, or use existing
    let siteId;
    const existingSites = await db.select().from(sites).where(eq(sites.organizationId, orgId)).limit(1);
    if (existingSites.length) {
      siteId = existingSites[0].id;
    } else {
      const [newSite] = await db.insert(sites).values({ organizationId: orgId, name: 'Downtown Highrise', address: '123 Main St' }).returning();
      siteId = newSite.id;
    }

    let projectId;
    const existingProjects = await db.select().from(projects).where(eq(projects.organizationId, orgId)).limit(1);
    if (existingProjects.length) {
      projectId = existingProjects[0].id;
    } else {
      const [newProj] = await db.insert(projects).values({ organizationId: orgId, name: 'Phase 1 Structural', description: 'Foundation work' }).returning();
      projectId = newProj.id;
    }

    // 3. Insert a dummy employee
    const [emp] = await db.insert(employees).values({
      organizationId: orgId,
      firstName: 'Jane',
      lastName: 'Smith',
      employeeId: 'EMP-999',
      jobTitle: 'Engineer'
    }).returning();

    // 4. Insert some timesheet records for a specific past month (e.g., 2026-07)
    const month = '2026-07';
    const records = [];
    for(let i=1; i<=15; i++) {
       records.push({
         organizationId: orgId,
         employeeId: emp.id,
         siteId: siteId,
         projectId: projectId,
         date: `2026-07-${i.toString().padStart(2, '0')}`,
         hoursWorked: 8,
         attendanceStatus: 'Present',
         status: 'on-hold',
         notes: 'Shift: Day, Working Time: 8'
       });
    }
    await db.insert(timesheets).values(records);

    // 5. Insert audit logs for this batch to simulate history
    await db.insert(auditLogs).values([
      {
        organizationId: orgId,
        userId: userId,
        action: 'SUBMIT',
        entity: 'TIMESHEET_BATCH',
        entityId: month,
        details: 'Timesheet batch submitted for 2026-07',
        createdAt: new Date('2026-08-01T10:00:00Z')
      },
      {
        organizationId: orgId,
        userId: userId,
        action: 'REJECT',
        entity: 'TIMESHEET_BATCH',
        entityId: month,
        details: 'Rejected timesheet batch for 2026-07 - Reason: Missing overtime justification for weekend shifts',
        createdAt: new Date('2026-08-02T14:30:00Z')
      },
      {
        organizationId: orgId,
        userId: userId,
        action: 'ON_HOLD',
        entity: 'TIMESHEET_BATCH',
        entityId: month,
        details: 'On-hold timesheet batch for 2026-07 - Reason: Pending client approval for extra hours',
        createdAt: new Date('2026-08-04T09:15:00Z')
      }
    ]);

    console.log("Successfully seeded dummy data!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
