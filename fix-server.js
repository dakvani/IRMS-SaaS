import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf-8');

const oldSites = `  app.post('/api/sites', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
  app.put('/api/sites/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const siteId = parseInt(req.params.id);
      const updates = { ...req.body };
      const [updated] = await db.update(sites).set(updates).where(and(eq(sites.id, siteId), eq(sites.organizationId, orgId))).returning();
      res.json(updated);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
      const [newRec] = await db.insert(sites).values({ organizationId: orgId, ...req.body }).returning();
      res.status(201).json(newRec);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });`;

const newSites = `  app.post('/api/sites', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const [newRec] = await db.insert(sites).values({ organizationId: orgId, ...req.body }).returning();
      res.status(201).json(newRec);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.put('/api/sites/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const siteId = parseInt(req.params.id);
      const updates = { ...req.body };
      const [updated] = await db.update(sites).set(updates).where(and(eq(sites.id, siteId), eq(sites.organizationId, orgId))).returning();
      res.json(updated);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });`;

code = code.replace(oldSites, newSites);

const oldProjects = `  app.post('/api/projects', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
  app.put('/api/projects/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const projectId = parseInt(req.params.id);
      const payload = { ...req.body };
      if (!payload.startDate) payload.startDate = null;
      if (!payload.endDate) payload.endDate = null;
      if (payload.startDate) payload.startDate = new Date(payload.startDate).toISOString();
      if (payload.endDate) payload.endDate = new Date(payload.endDate).toISOString();
      const [updated] = await db.update(projects).set(payload).where(and(eq(projects.id, projectId), eq(projects.organizationId, orgId))).returning();
      res.json(updated);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
      
      const payload = { ...req.body };
      if (!payload.startDate) delete payload.startDate;
      if (!payload.endDate) delete payload.endDate;
      
      const [newRec] = await db.insert(projects).values({ organizationId: orgId, ...payload }).returning();
      res.status(201).json(newRec);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });`;

const newProjects = `  app.post('/api/projects', requireAuth, async (req: AuthRequest, res) => {
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

  app.put('/api/projects/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const projectId = parseInt(req.params.id);
      const payload = { ...req.body };
      if (!payload.startDate) payload.startDate = null;
      if (!payload.endDate) payload.endDate = null;
      if (payload.startDate) payload.startDate = new Date(payload.startDate).toISOString();
      if (payload.endDate) payload.endDate = new Date(payload.endDate).toISOString();
      const [updated] = await db.update(projects).set(payload).where(and(eq(projects.id, projectId), eq(projects.organizationId, orgId))).returning();
      res.json(updated);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });`;

code = code.replace(oldProjects, newProjects);

fs.writeFileSync('server.ts', code);
