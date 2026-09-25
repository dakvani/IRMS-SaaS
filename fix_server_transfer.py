with open("server.ts", "r") as f:
    content = f.read()

import re

# We will replace the details logging block
logging_block = r"(let details = `Updated asset \$\{updatedAsset\.name\}`;[\s\S]*?details\s*\n\s*\};\s*await db\.insert\(auditLogs\)\.values\(\{[\s\S]*?details\s*\}\);)"

new_logging = """
      let details = `Updated asset ${updatedAsset.name}`;
      
      if (oldAsset.assignedToSiteId !== updatedAsset.assignedToSiteId) {
        // Find site names
        const prevSite = oldAsset.assignedToSiteId ? await db.select().from(sites).where(eq(sites.id, oldAsset.assignedToSiteId)).then(r => r[0]?.name) : 'Unassigned';
        const newSite = updatedAsset.assignedToSiteId ? await db.select().from(sites).where(eq(sites.id, updatedAsset.assignedToSiteId)).then(r => r[0]?.name) : 'Unassigned';
        
        await db.insert(auditLogs).values({
          organizationId: orgId,
          userId: req.dbUser.id,
          action: 'TRANSFER_SITE',
          entity: 'ASSET',
          entityId: updatedAsset.id.toString(),
          details: JSON.stringify({ previousSite: prevSite, newSite: newSite })
        });
      } else {
        if (oldAsset.assignedToEmployeeId !== updatedAsset.assignedToEmployeeId) {
          details += ` (Assignment changed)`;
        }
        await db.insert(auditLogs).values({
          organizationId: orgId,
          userId: req.dbUser.id,
          action: 'UPDATE',
          entity: 'ASSET',
          entityId: updatedAsset.id.toString(),
          details
        });
      }
"""

content = re.sub(r"let details = `Updated asset \$\{updatedAsset\.name\}`;[\s\S]*?details\s*\}\);", new_logging.strip(), content)

with open("server.ts", "w") as f:
    f.write(content)
print("done")
