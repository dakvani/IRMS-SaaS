with open("server.ts", "r") as f:
    content = f.read()

import re

new_bulk = """
      const site = await db.select().from(sites).where(and(eq(sites.id, parseInt(siteId)), eq(sites.organizationId, orgId)));
      if (site.length === 0) return res.status(404).json({ error: 'Site not found' });
      
      for (const id of assetIds) {
        const oldAssetList = await db.select().from(assets).where(and(eq(assets.id, id), eq(assets.organizationId, orgId)));
        if (!oldAssetList.length) continue;
        const oldAsset = oldAssetList[0];
        
        await db.update(assets).set({ assignedToSiteId: parseInt(siteId), assignedToEmployeeId: null, status: 'assigned' }).where(and(eq(assets.id, id), eq(assets.organizationId, orgId)));
        
        const prevSite = oldAsset.assignedToSiteId ? await db.select().from(sites).where(eq(sites.id, oldAsset.assignedToSiteId)).then(r => r[0]?.name) : 'Unassigned';
        const newSite = site[0].name;

        await db.insert(auditLogs).values({
          organizationId: orgId,
          userId: req.dbUser!.id,
          action: 'TRANSFER_SITE',
          entity: 'ASSET',
          entityId: String(id),
          details: JSON.stringify({ previousSite: prevSite, newSite: newSite })
        });
      }
      res.json({ success: true });
"""

content = re.sub(r"const site = await db\.select\(\)\.from\(sites\)[\s\S]*?res\.json\(\{ success: true \}\);", new_bulk.strip(), content)

with open("server.ts", "w") as f:
    f.write(content)
print("done")
