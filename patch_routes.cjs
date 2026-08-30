const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newRoutes = `
  // Sites
  app.get('/api/sites', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const results = await db.select().from(sites).where(eq(sites.organizationId, orgId));
      res.json(results);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  
  app.post('/api/sites', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const [newRec] = await db.insert(sites).values({ organizationId: orgId, ...req.body }).returning();
      res.status(201).json(newRec);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Projects
  app.get('/api/projects', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const results = await db.select().from(projects).where(eq(projects.organizationId, orgId));
      res.json(results);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  
  app.post('/api/projects', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      
      const payload = { ...req.body };
      if (!payload.startDate) delete payload.startDate;
      if (!payload.endDate) delete payload.endDate;
      
      const [newRec] = await db.insert(projects).values({ organizationId: orgId, ...payload }).returning();
      res.status(201).json(newRec);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Assignments
  app.get('/api/assignments', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      
      const results = await db.select({
        id: employeeAssignments.id,
        role: employeeAssignments.role,
        startDate: employeeAssignments.startDate,
        endDate: employeeAssignments.endDate,
        status: employeeAssignments.status,
        employee: { firstName: employees.firstName, lastName: employees.lastName },
        site: { name: sites.name },
        project: { name: projects.name }
      })
      .from(employeeAssignments)
      .leftJoin(employees, eq(employeeAssignments.employeeId, employees.id))
      .leftJoin(sites, eq(employeeAssignments.siteId, sites.id))
      .leftJoin(projects, eq(employeeAssignments.projectId, projects.id))
      .where(eq(employeeAssignments.organizationId, orgId));
      
      res.json(results);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/assignments', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      
      const { employeeId, siteId, projectId, role, startDate, endDate, status } = req.body;
      const payload: any = { 
        organizationId: orgId, 
        employeeId: parseInt(employeeId), 
        role, startDate, status 
      };
      if (siteId) payload.siteId = parseInt(siteId);
      if (projectId) payload.projectId = parseInt(projectId);
      if (endDate) payload.endDate = endDate;

      const [newRec] = await db.insert(employeeAssignments).values(payload).returning();
      res.status(201).json(newRec);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
`;

code = code.replace(/app\.get\('\/api\/sites'[\s\S]*?(?=app\.get\('\/api\/timesheets'|app\.get\('\/api\/leaves')/, newRoutes + "\n  ");

fs.writeFileSync('server.ts', code);
