import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf-8');

// Add GET /api/notifications
const notifRoute = `
  app.get('/api/notifications', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      
      const results = await db.select()
        .from(notifications)
        .where(
          and(
            eq(notifications.organizationId, orgId),
            eq(notifications.userId, req.dbUser.id)
          )
        )
        .orderBy(desc(notifications.createdAt))
        .limit(10);
        
      res.json(results);
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/notifications/read', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      
      await db.update(notifications)
        .set({ isRead: 1 })
        .where(
          and(
            eq(notifications.organizationId, orgId),
            eq(notifications.userId, req.dbUser.id)
          )
        );
      res.json({ success: true });
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });
`;

code = code.replace(/app\.get\('\/api\/audit-logs'/, notifRoute + "\n  app.get('/api/audit-logs'");

fs.writeFileSync('server.ts', code);
