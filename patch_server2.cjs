const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const endpoints = `
  // Timesheets
  app.get('/api/timesheets', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No organization assigned' });
      
      const results = await db.select({
        id: timesheets.id,
        date: timesheets.date,
        hoursWorked: timesheets.hoursWorked,
        status: timesheets.status,
        employee: {
          firstName: employees.firstName,
          lastName: employees.lastName
        },
        project: {
          name: projects.name
        },
        site: {
          name: sites.name
        }
      })
      .from(timesheets)
      .leftJoin(employees, eq(timesheets.employeeId, employees.id))
      .leftJoin(projects, eq(timesheets.projectId, projects.id))
      .leftJoin(sites, eq(timesheets.siteId, sites.id))
      .where(eq(timesheets.organizationId, orgId));
      
      res.json(results);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/timesheets', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No organization assigned' });
      
      const { employeeId, projectId, siteId, date, hoursWorked } = req.body;
      const [newTs] = await db.insert(timesheets).values({
        organizationId: orgId,
        employeeId: parseInt(employeeId),
        projectId: projectId ? parseInt(projectId) : null,
        siteId: siteId ? parseInt(siteId) : null,
        date: new Date(date).toISOString(),
        hoursWorked: parseInt(hoursWorked)
      }).returning();
      
      res.status(201).json(newTs);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/timesheets/:id/approve', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No organization assigned' });
      const tsId = parseInt(req.params.id);
      const { status } = req.body;
      const [updated] = await db.update(timesheets).set({ status }).where(and(eq(timesheets.id, tsId), eq(timesheets.organizationId, orgId))).returning();
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
`;

code = code.replace("// Get Sites", endpoints + "\n  // Get Sites");
fs.writeFileSync('server.ts', code);
