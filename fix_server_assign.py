with open("server.ts", "r") as f:
    content = f.read()

import re

routes = """
  app.put('/api/assignments/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      
      const { siteId, projectId, role, startDate, endDate, status } = req.body;
      const payload: any = { role, startDate, status };
      if (siteId) payload.siteId = parseInt(siteId);
      if (projectId) payload.projectId = parseInt(projectId);
      payload.endDate = endDate || null;

      const [updated] = await db.update(employeeAssignments).set(payload).where(and(eq(employeeAssignments.id, parseInt(req.params.id)), eq(employeeAssignments.organizationId, orgId))).returning();
      res.json(updated);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/assignments/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      await db.delete(employeeAssignments).where(and(eq(employeeAssignments.id, parseInt(req.params.id)), eq(employeeAssignments.organizationId, orgId)));
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
"""

content = content.replace("  app.post('/api/assignments', requireAuth, async (req: AuthRequest, res) => {", routes + "\n  app.post('/api/assignments', requireAuth, async (req: AuthRequest, res) => {")

with open("server.ts", "w") as f:
    f.write(content)
print("done")
