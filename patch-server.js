import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf-8');

const printLogRoute = `
  app.post('/api/assets/:id/print', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const assetId = parseInt(req.params.id);
      
      await db.insert(auditLogs).values({
        organizationId: orgId,
        userId: req.dbUser!.id,
        action: 'PRINT_LABEL',
        entity: 'ASSET',
        entityId: String(assetId),
        details: 'Printed asset label'
      });
      res.json({ success: true });
    } catch(e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/assets/bulk-transfer', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const { assetIds, siteId } = req.body;
      
      if (!assetIds || !siteId) return res.status(400).json({ error: 'Missing data' });
      
      const site = await db.select().from(sites).where(and(eq(sites.id, parseInt(siteId)), eq(sites.organizationId, orgId)));
      if (site.length === 0) return res.status(404).json({ error: 'Site not found' });
      
      for (const id of assetIds) {
        await db.update(assets).set({ assignedToSiteId: parseInt(siteId), assignedToEmployeeId: null, status: 'assigned' }).where(and(eq(assets.id, id), eq(assets.organizationId, orgId)));
        await db.insert(auditLogs).values({
          organizationId: orgId,
          userId: req.dbUser!.id,
          action: 'TRANSFER_ASSET',
          entity: 'ASSET',
          entityId: String(id),
          details: 'Transferred to site: ' + site[0].name
        });
      }
      res.json({ success: true });
    } catch(e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/reports/assets', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      
      // Calculate downtime and service frequency over last 12 months
      const logs = await db.select().from(assetMaintenance).where(eq(assetMaintenance.organizationId, orgId));
      
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      const recentLogs = logs.filter(l => new Date(l.serviceDate) >= oneYearAgo);
      
      const report: Record<number, { downtime: number, count: number }> = {};
      recentLogs.forEach(l => {
        if (!report[l.assetId]) report[l.assetId] = { downtime: 0, count: 0 };
        report[l.assetId].count += 1;
        if (l.downtimeDays) report[l.assetId].downtime += l.downtimeDays;
      });
      
      const allAssets = await db.select().from(assets).where(eq(assets.organizationId, orgId));
      
      const result = allAssets.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        assetTag: a.assetTag,
        downtime: report[a.id]?.downtime || 0,
        serviceCount: report[a.id]?.count || 0
      })).filter(a => a.serviceCount > 0 || a.downtime > 0);
      
      res.json(result);
    } catch(e: any) { res.status(500).json({ error: e.message }); }
  });
`;

code = code.replace(/app\.get\('\/api\/assets\/:id\/history',/, printLogRoute + '\n  app.get(\'/api/assets/:id/history\',');

// Also update asset insert/update to allow new vehicle fields
code = code.replace(
  /const \{ name, assetTag, type, assignedToEmployeeId, assignedToSiteId, status, purchasePrice, purchaseDate, salvageValue, usefulLifeYears, depreciationMethod, maintenanceIntervalDays \} = req\.body;/,
  "const { name, assetTag, type, assignedToEmployeeId, assignedToSiteId, status, purchasePrice, purchaseDate, salvageValue, usefulLifeYears, depreciationMethod, maintenanceIntervalDays, make, model, licensePlate, year, vin, warrantyExpiry } = req.body;"
);
code = code.replace(
  /maintenanceIntervalDays: maintenanceIntervalDays \? parseInt\(maintenanceIntervalDays\) : null,/,
  `maintenanceIntervalDays: maintenanceIntervalDays ? parseInt(maintenanceIntervalDays) : null,
        make, model, licensePlate, year: year ? parseInt(year) : null, vin, warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry).toISOString() : null,`
);

fs.writeFileSync('server.ts', code);
