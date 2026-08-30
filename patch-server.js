import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf-8');

const putSite = `
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
`;

code = code.replace(/app\.post\('\/api\/sites'[^]*?\}\);\n/, match => match + putSite);

const putProject = `
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
`;

code = code.replace(/app\.post\('\/api\/projects'[^]*?\}\);\n/, match => match + putProject);

fs.writeFileSync('server.ts', code);
