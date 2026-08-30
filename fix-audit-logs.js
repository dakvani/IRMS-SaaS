import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf-8');

const auditLogRoute = `
  // Audit Logs
  app.get('/api/audit-logs', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No organization assigned' });
      
      const limitParam = parseInt(req.query.limit as string) || 50;

      const results = await db.select({
        id: auditLogs.id,
        action: auditLogs.action,
        entity: auditLogs.entity,
        entityId: auditLogs.entityId,
        details: auditLogs.details,
        createdAt: auditLogs.createdAt,
        user: {
          name: users.name,
          email: users.email,
        }
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(eq(auditLogs.organizationId, orgId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limitParam);
      
      res.json(results);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });`;

// We need to replace the existing audit log route.
// Find where it starts and ends
const match = code.match(/app\.get\('\/api\/audit-logs', requireAuth, async \(req: AuthRequest, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ error: e\.message \}\);\n    \}\n  \}\);/);

if (match) {
  code = code.replace(match[0], auditLogRoute.trim());
  fs.writeFileSync('server.ts', code);
  console.log('Replaced');
} else {
  console.log('Not found');
}
