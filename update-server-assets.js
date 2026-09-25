import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf-8');

// 1. Update POST /api/assets
const postRegex = /const \{ name, assetTag, type, assignedToEmployeeId, assignedToSiteId, status \} = req\.body;[\s\S]*?const \[newAsset\] = await db\.insert\(assets\)\.values\(\{([\s\S]*?)\}\)\.returning\(\);/;

const postReplacement = `
      const { 
        name, assetTag, type, assignedToEmployeeId, assignedToSiteId, status,
        purchasePrice, purchaseDate, salvageValue, usefulLifeYears, depreciationMethod, maintenanceIntervalDays
      } = req.body;
      const finalAssetTag = assetTag || \`AST-\${Date.now().toString(36).toUpperCase()}\`;
      const [newAsset] = await db.insert(assets).values({
        organizationId: orgId,
        name,
        assetTag: finalAssetTag,
        type,
        assignedToEmployeeId: assignedToEmployeeId ? parseInt(assignedToEmployeeId) : null,
        assignedToSiteId: assignedToSiteId ? parseInt(assignedToSiteId) : null,
        status,
        purchasePrice: purchasePrice ? parseInt(purchasePrice) : null,
        purchaseDate: purchaseDate || null,
        salvageValue: salvageValue ? parseInt(salvageValue) : null,
        usefulLifeYears: usefulLifeYears ? parseInt(usefulLifeYears) : null,
        depreciationMethod: depreciationMethod || null,
        maintenanceIntervalDays: maintenanceIntervalDays ? parseInt(maintenanceIntervalDays) : null,
      }).returning();
`;
code = code.replace(postRegex, postReplacement);


// 2. Update PUT /api/assets/:id
const putRegex = /const \{ name, assetTag, type, assignedToEmployeeId, assignedToSiteId, status \} = req\.body;[\s\S]*?const \[updatedAsset\] = await db\.update\(assets\)\.set\(\{([\s\S]*?)\}\)\.where\(and\(eq\(assets\.id, assetId\), eq\(assets\.organizationId, orgId\)\)\)\.returning\(\);/;

const putReplacement = `
      const { 
        name, assetTag, type, assignedToEmployeeId, assignedToSiteId, status,
        purchasePrice, purchaseDate, salvageValue, usefulLifeYears, depreciationMethod, maintenanceIntervalDays,
        lastMaintenanceDate
      } = req.body;
      
      const [oldAsset] = await db.select().from(assets).where(and(eq(assets.id, assetId), eq(assets.organizationId, orgId)));
      if (!oldAsset) return res.status(404).json({ error: 'Asset not found' });

      const [updatedAsset] = await db.update(assets).set({
        name, 
        assetTag, 
        type, 
        assignedToEmployeeId: assignedToEmployeeId ? parseInt(assignedToEmployeeId) : null, 
        assignedToSiteId: assignedToSiteId ? parseInt(assignedToSiteId) : null, 
        status,
        purchasePrice: purchasePrice ? parseInt(purchasePrice) : null,
        purchaseDate: purchaseDate || null,
        salvageValue: salvageValue ? parseInt(salvageValue) : null,
        usefulLifeYears: usefulLifeYears ? parseInt(usefulLifeYears) : null,
        depreciationMethod: depreciationMethod || null,
        maintenanceIntervalDays: maintenanceIntervalDays ? parseInt(maintenanceIntervalDays) : null,
        lastMaintenanceDate: lastMaintenanceDate || null,
      }).where(and(eq(assets.id, assetId), eq(assets.organizationId, orgId))).returning();
`;
code = code.replace(putRegex, putReplacement);


// 3. Import assetMaintenance
code = code.replace(/assets,/, 'assets,\n  assetMaintenance,');

// 4. Add GET and POST for Maintenance
const maintenanceRoutes = `
  app.get('/api/assets/:id/maintenance', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const assetId = parseInt(req.params.id);
      
      const logs = await db.select({
        id: assetMaintenance.id,
        serviceDate: assetMaintenance.serviceDate,
        technicianNotes: assetMaintenance.technicianNotes,
        status: assetMaintenance.status,
        createdAt: assetMaintenance.createdAt,
        performedBy: { name: users.name }
      })
      .from(assetMaintenance)
      .leftJoin(users, eq(assetMaintenance.performedByUserId, users.id))
      .where(and(eq(assetMaintenance.organizationId, orgId), eq(assetMaintenance.assetId, assetId)))
      .orderBy(desc(assetMaintenance.serviceDate));
      
      res.json(logs);
    } catch(e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/assets/:id/maintenance', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const assetId = parseInt(req.params.id);
      const { serviceDate, technicianNotes, status } = req.body;
      
      const [newLog] = await db.insert(assetMaintenance).values({
        organizationId: orgId,
        assetId,
        serviceDate,
        technicianNotes,
        status,
        performedByUserId: req.dbUser.id
      }).returning();
      
      // Update last maintenance date on asset
      await db.update(assets).set({ lastMaintenanceDate: serviceDate }).where(eq(assets.id, assetId));
      
      await db.insert(auditLogs).values({
        organizationId: orgId,
        userId: req.dbUser.id,
        action: 'MAINTENANCE',
        entity: 'ASSET',
        entityId: assetId.toString(),
        details: \`Logged maintenance (\${status}) on \${serviceDate}\`
      });

      res.json(newLog);
    } catch(e: any) { res.status(500).json({ error: e.message }); }
  });
`;

code = code.replace(/app\.get\('\/api\/assets\/:id\/history'/, maintenanceRoutes + "\n  app.get('/api/assets/:id/history'");

fs.writeFileSync('server.ts', code);
