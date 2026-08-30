import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf-8');

const updatedGetTimesheets = `
  app.get('/api/timesheets', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No organization assigned' });
      
      const { month, siteId, projectId } = req.query;

      const conditions = [eq(timesheets.organizationId, orgId)];
      if (month) conditions.push(sql\`TO_CHAR(timesheets.date, 'YYYY-MM') = \${month}\`);
      if (siteId) conditions.push(eq(timesheets.siteId, parseInt(siteId as string)));
      if (projectId) conditions.push(eq(timesheets.projectId, parseInt(projectId as string)));

      const results = await db.select({
        id: timesheets.id,
        date: timesheets.date,
        hoursWorked: timesheets.hoursWorked,
        overtimeHours: timesheets.overtimeHours,
        attendanceStatus: timesheets.attendanceStatus,
        notes: timesheets.notes,
        status: timesheets.status,
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          employeeId: employees.employeeId,
        },
        site: {
          id: sites.id,
          name: sites.name,
        },
        project: {
          id: projects.id,
          name: projects.name,
        }
      })
      .from(timesheets)
      .leftJoin(employees, eq(timesheets.employeeId, employees.id))
      .leftJoin(sites, eq(timesheets.siteId, sites.id))
      .leftJoin(projects, eq(timesheets.projectId, projects.id))
      .where(and(...conditions))
      .orderBy(desc(timesheets.date));
      
      res.json(results);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });`;

// Find the old route and replace it
const match = code.match(/app\.get\('\/api\/timesheets', requireAuth, async \(req: AuthRequest, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ error: e\.message \}\);\n    \}\n  \}\);/);

if (match) {
  code = code.replace(match[0], updatedGetTimesheets.trim());
  fs.writeFileSync('server.ts', code);
  console.log('Replaced');
} else {
  console.log('Not found');
}
