import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf-8');

const updatedRoute = `
  // Bulk Approve Batch
  app.put('/api/timesheet-batches/approve', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      
      const { month, siteId, projectId, status, reason } = req.body;
      
      // Update all timesheets matching these criteria
      const conditions = [
        eq(timesheets.organizationId, orgId),
        sql\`TO_CHAR(date, 'YYYY-MM') = \${month}\`
      ];
      if (siteId) conditions.push(eq(timesheets.siteId, siteId));
      if (projectId) conditions.push(eq(timesheets.projectId, projectId));

      const updated = await db.update(timesheets)
        .set({ status })
        .where(and(...conditions))
        .returning();

      // Audit Log
      if (updated.length > 0) {
        let actionStr = 'UPDATE';
        if (status === 'approved') actionStr = 'APPROVE';
        else if (status === 'rejected') actionStr = 'REJECT';
        else if (status === 'on-hold') actionStr = 'ON_HOLD';

        let detailStr = \`\${status.charAt(0).toUpperCase() + status.slice(1)} timesheet batch for \${month}\`;
        if (reason) detailStr += \` - Reason: \${reason}\`;

        await db.insert(auditLogs).values({
          organizationId: orgId,
          userId: req.dbUser!.id,
          action: actionStr,
          entity: 'TIMESHEET_BATCH',
          entityId: month,
          details: detailStr
        });
      }

      res.json({ success: true, count: updated.length });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });`;

const match = code.match(/app\.put\('\/api\/timesheet-batches\/approve'[\s\S]*?res\.status\(500\)\.json\(\{ error: e\.message \}\);\n    \}\n  \}\);/);

if (match) {
  code = code.replace(match[0], updatedRoute.trim());
  fs.writeFileSync('server.ts', code);
  console.log('Replaced route in server.ts');
} else {
  console.log('Route not found in server.ts');
}
