import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf-8');

const historyApi = `
  app.get('/api/timesheet-batches/history', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      
      const { month } = req.query;
      if (!month) return res.status(400).json({ error: 'Month is required' });

      const logs = await db.select({
        id: auditLogs.id,
        action: auditLogs.action,
        details: auditLogs.details,
        createdAt: auditLogs.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email
        }
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(and(
        eq(auditLogs.organizationId, orgId),
        eq(auditLogs.entity, 'TIMESHEET_BATCH'),
        eq(auditLogs.entityId, month as string)
      ))
      .orderBy(desc(auditLogs.createdAt));

      res.json(logs);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
`;

const insertPoint = code.indexOf("app.get('/api/timesheet-batches',");
code = code.slice(0, insertPoint) + historyApi + "\n  " + code.slice(insertPoint);

fs.writeFileSync('server.ts', code);
