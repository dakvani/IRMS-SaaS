import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf-8');

// 1. Update POST /api/assets to include audit log
code = code.replace(
  /const \[newAsset\] = await db\.insert\(assets\)\.values\(\{([\s\S]*?)\}\)\.returning\(\);/,
  `const [newAsset] = await db.insert(assets).values({$1}).returning();
      
      await db.insert(auditLogs).values({
        organizationId: orgId,
        userId: req.dbUser.id,
        action: 'CREATE',
        entity: 'ASSET',
        entityId: newAsset.id.toString(),
        details: \`Created asset \${newAsset.name} (\${newAsset.assetTag})\`
      });`
);

// 2. Add PUT /api/assets/:id
const putAssetCode = `
  app.put('/api/assets/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      
      const assetId = parseInt(req.params.id);
      const { name, assetTag, type, assignedToEmployeeId, assignedToSiteId, status } = req.body;
      
      const [oldAsset] = await db.select().from(assets).where(and(eq(assets.id, assetId), eq(assets.organizationId, orgId)));
      if (!oldAsset) return res.status(404).json({ error: 'Asset not found' });

      const [updatedAsset] = await db.update(assets).set({
        name, assetTag, type, assignedToEmployeeId, assignedToSiteId, status
      }).where(and(eq(assets.id, assetId), eq(assets.organizationId, orgId))).returning();
      
      let details = \`Updated asset \${updatedAsset.name}\`;
      if (oldAsset.assignedToEmployeeId !== updatedAsset.assignedToEmployeeId) {
        details += \` (Assignment changed)\`;
      }
      
      await db.insert(auditLogs).values({
        organizationId: orgId,
        userId: req.dbUser.id,
        action: 'UPDATE',
        entity: 'ASSET',
        entityId: updatedAsset.id.toString(),
        details
      });
      
      res.json(updatedAsset);
    } catch(e: any) { res.status(500).json({ error: e.message }); }
  });
`;

// 3. Add GET /api/assets/:id/history
const getAssetHistoryCode = `
  app.get('/api/assets/:id/history', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const assetId = req.params.id;
      
      const logs = await db.select({
        id: auditLogs.id,
        action: auditLogs.action,
        details: auditLogs.details,
        createdAt: auditLogs.createdAt,
        user: { name: users.name }
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(and(eq(auditLogs.organizationId, orgId), eq(auditLogs.entity, 'ASSET'), eq(auditLogs.entityId, assetId)))
      .orderBy(desc(auditLogs.createdAt));
      
      res.json(logs);
    } catch(e: any) { res.status(500).json({ error: e.message }); }
  });
`;

// 4. Add GET /api/employees/:id/assets
const getEmployeeAssetsCode = `
  app.get('/api/employees/:id/assets', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const empId = parseInt(req.params.id);
      
      const results = await db.select().from(assets).where(and(eq(assets.organizationId, orgId), eq(assets.assignedToEmployeeId, empId)));
      res.json(results);
    } catch(e: any) { res.status(500).json({ error: e.message }); }
  });
`;

code = code.replace(/app\.get\('\/api\/vehicles'/, putAssetCode + "\n" + getAssetHistoryCode + "\n" + getEmployeeAssetsCode + "\n  app.get('/api/vehicles'");

fs.writeFileSync('server.ts', code);
