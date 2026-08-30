import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf-8');

const batchesEndpoint = `
  // Get Timesheet Batches (Monthly summaries)
  app.get('/api/timesheet-batches', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      
      const query = sql\`
        SELECT 
          TO_CHAR(t.date, 'YYYY-MM') as month,
          s.name as site_name,
          p.name as project_name,
          t.site_id as site_id,
          t.project_id as project_id,
          COUNT(DISTINCT t.employee_id) as employee_count,
          SUM(t.hours_worked) as total_hours,
          t.status as status
        FROM timesheets t
        LEFT JOIN sites s ON t.site_id = s.id
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.organization_id = \${orgId}
        GROUP BY 
          TO_CHAR(t.date, 'YYYY-MM'),
          s.name,
          p.name,
          t.site_id,
          t.project_id,
          t.status
        ORDER BY month DESC;
      \`;
      
      const result = await db.execute(query);
      res.json(result.rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Bulk Upsert Monthly Timesheets
  app.post('/api/timesheets/bulk-upsert', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      
      const { records } = req.body;
      if (!records || !Array.isArray(records)) {
        return res.status(400).json({ error: 'Records array required' });
      }

      const toInsert = [];
      const toUpdate = [];

      // We will loop over each record. We need to check if it exists.
      // Doing this one by one is slow, but fine for prototype.
      for (const rec of records) {
        const existing = await db.select().from(timesheets).where(
          and(
            eq(timesheets.organizationId, orgId),
            eq(timesheets.employeeId, rec.employeeId),
            eq(timesheets.date, rec.date),
            eq(timesheets.siteId, rec.siteId)
          )
        ).limit(1);

        if (existing.length > 0) {
          const ex = existing[0];
          if (ex.status !== 'approved') {
            toUpdate.push({ id: ex.id, ...rec });
          }
        } else {
          toInsert.push({ organizationId: orgId, ...rec });
        }
      }

      if (toInsert.length > 0) {
        await db.insert(timesheets).values(toInsert);
      }

      for (const u of toUpdate) {
        await db.update(timesheets).set(u).where(eq(timesheets.id, u.id));
      }

      res.json({ success: true, inserted: toInsert.length, updated: toUpdate.length });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
  
  // Bulk Approve Batch
  app.put('/api/timesheet-batches/approve', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      
      const { month, siteId, projectId, status } = req.body;
      
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

      res.json({ success: true, count: updated.length });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
`;

// Insert the new endpoints just before app.get('/api/timesheets'
code = code.replace("app.get('/api/timesheets', requireAuth, async (req: AuthRequest, res) => {", batchesEndpoint + "\n  app.get('/api/timesheets', requireAuth, async (req: AuthRequest, res) => {");

fs.writeFileSync('server.ts', code);
