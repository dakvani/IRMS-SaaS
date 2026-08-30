import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf-8');

const newApi = `
  app.get('/api/timesheets/template-data', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      
      const { siteId, projectId } = req.query;

      const conditions = [eq(employeeAssignments.organizationId, orgId)];
      if (siteId) conditions.push(eq(employeeAssignments.siteId, parseInt(siteId as string)));
      if (projectId) conditions.push(eq(employeeAssignments.projectId, parseInt(projectId as string)));
      conditions.push(eq(employeeAssignments.status, 'active'));

      const results = await db.select({
        employeeId: employees.employeeId,
        firstName: employees.firstName,
        lastName: employees.lastName,
        siteName: sites.name,
        projectName: projects.name,
      })
      .from(employeeAssignments)
      .innerJoin(employees, eq(employeeAssignments.employeeId, employees.id))
      .leftJoin(sites, eq(employeeAssignments.siteId, sites.id))
      .leftJoin(projects, eq(employeeAssignments.projectId, projects.id))
      .where(and(...conditions));
      
      res.json(results);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
`;

const insertPos = code.indexOf("app.get('/api/timesheets'");
if (insertPos !== -1) {
  code = code.slice(0, insertPos) + newApi + "\n  " + code.slice(insertPos);
  fs.writeFileSync('server.ts', code);
  console.log("Added template-data API");
} else {
  console.log("Could not find insertion point.");
}
