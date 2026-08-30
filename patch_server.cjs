const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const endpoints = `
  // Edit Requests
  app.get('/api/edit-requests', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No organization assigned' });
      const results = await db.select().from(editRequests).where(eq(editRequests.organizationId, orgId));
      res.json(results);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/edit-requests', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No organization assigned' });
      const { entity, entityId, requestedChanges, reason } = req.body;
      const [newReq] = await db.insert(editRequests).values({
        organizationId: orgId,
        userId: req.dbUser!.id,
        entity,
        entityId: parseInt(entityId),
        requestedChanges: JSON.stringify(requestedChanges),
        reason
      }).returning();
      res.status(201).json(newReq);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/edit-requests/:id/approve', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No organization assigned' });
      
      const reqId = parseInt(req.params.id);
      const [request] = await db.select().from(editRequests).where(and(eq(editRequests.id, reqId), eq(editRequests.organizationId, orgId)));
      if (!request) return res.status(404).json({ error: 'Request not found' });
      
      const changes = JSON.parse(request.requestedChanges);
      
      // Apply changes based on entity
      if (request.entity === 'EMPLOYEE') {
        await db.update(employees).set(changes).where(eq(employees.id, request.entityId));
      } else if (request.entity === 'DOCUMENT') {
        await db.update(employeeDocuments).set(changes).where(eq(employeeDocuments.id, request.entityId));
      }
      
      await db.update(editRequests).set({ status: 'approved' }).where(eq(editRequests.id, reqId));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/employees/:id/approve', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No organization assigned' });
      const empId = parseInt(req.params.id);
      const { approvalStatus } = req.body;
      const [updatedEmp] = await db.update(employees).set({ approvalStatus }).where(and(eq(employees.id, empId), eq(employees.organizationId, orgId))).returning();
      res.json(updatedEmp);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
`;

code = code.replace("// Get Sites", endpoints + "\n  // Get Sites");
fs.writeFileSync('server.ts', code);
