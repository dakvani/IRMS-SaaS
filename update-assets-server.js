import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf-8');

const regex = /app\.post\('\/api\/assets', requireAuth, async \(req: AuthRequest, res\) => \{[\s\S]*?const { name, assetTag, type, assignedToEmployeeId, assignedToSiteId, status } = req.body;[\s\S]*?const \[newAsset\] = await db\.insert\(assets\)\.values\(\{/;

const replacement = `app.post('/api/assets', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No organization assigned' });
      
      const { name, assetTag, type, assignedToEmployeeId, assignedToSiteId, status } = req.body;
      const finalAssetTag = assetTag || \`AST-\${Date.now().toString(36).toUpperCase()}\`;
      const [newAsset] = await db.insert(assets).values({`;

code = code.replace(regex, replacement);
fs.writeFileSync('server.ts', code);
