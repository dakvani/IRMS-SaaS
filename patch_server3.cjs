const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const endpoints = `
  // Download Document with Auth Check
  app.get('/api/employee-documents/:id/download', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No organization assigned' });
      
      const docId = parseInt(req.params.id);
      const [doc] = await db.select().from(employeeDocuments).where(and(eq(employeeDocuments.id, docId), eq(employeeDocuments.organizationId, orgId)));
      
      if (!doc) return res.status(404).json({ error: 'Document not found' });
      
      // In a production environment with Service Account credentials configured, 
      // we would use firebase-admin/storage to generate a signed URL here.
      // For this MVP, we return the storage URL with the token that was generated on upload, 
      // but only after verifying the user's authorization to access the document metadata.
      res.redirect(doc.documentUrl);
      
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
`;

code = code.replace("// Add Employee Document", endpoints + "\n  // Add Employee Document");
fs.writeFileSync('server.ts', code);
