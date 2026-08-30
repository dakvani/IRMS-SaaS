import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf-8');

// add inArray to imports
code = code.replace(/eq, and, ilike, or, desc, sql/, "eq, and, ilike, or, desc, sql, inArray");

const newApiSites = `
  app.get('/api/sites', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      
      let conditions = [eq(sites.organizationId, orgId)];
      if (req.dbUser?.role === 'coordinator' || req.dbUser?.role === 'site_supervisor') {
         const userSites = await db.select({ siteId: siteCoordinators.siteId }).from(siteCoordinators).where(eq(siteCoordinators.userId, req.dbUser.id));
         const siteIds = userSites.map(s => s.siteId);
         if (siteIds.length > 0) {
            conditions.push(inArray(sites.id, siteIds));
         } else {
            return res.json([]); // No sites allocated
         }
      }
      const results = await db.select().from(sites).where(and(...conditions));
      res.json(results);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
`;

code = code.replace(
  /app\.get\('\/api\/sites', requireAuth, async \(req: AuthRequest, res\) => {[\s\S]*?\}\);/,
  newApiSites.trim()
);

// We assume projects are linked to sites or we just return all projects for now because our DB doesn't have project_sites linked directly except maybe through assignments or projects are just global to org.
// Wait, projects don't have a direct link to siteCoordinators. So we'll leave projects as is.

fs.writeFileSync('server.ts', code);
