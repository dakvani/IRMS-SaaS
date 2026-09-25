import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf-8');

const regex = /app\.get\('\/api\/leaves'[\s\S]*?app\.post\('\/api\/leaves', requireAuth, async \(req: AuthRequest, res\) => \{[\s\S]*?\}\);/m;

const newApis = `
  app.get('/api/leaves', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No organization assigned' });
      
      let conditions = [eq(leaves.organizationId, orgId)];
      if (req.dbUser?.role === 'coordinator' || req.dbUser?.role === 'site_supervisor') {
         const userSites = await db.select({ siteId: siteCoordinators.siteId }).from(siteCoordinators).where(eq(siteCoordinators.userId, req.dbUser.id));
         const siteIds = userSites.map(s => s.siteId);
         if (siteIds.length > 0) {
            conditions.push(inArray(leaves.siteId, siteIds));
         } else {
            return res.json([]);
         }
      }

      const results = await db.select({
        id: leaves.id,
        leaveType: leaves.leaveType,
        startDate: leaves.startDate,
        endDate: leaves.endDate,
        status: leaves.status,
        reason: leaves.reason,
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          employeeId: employees.employeeId,
        },
        site: {
          id: sites.id,
          name: sites.name
        },
        project: {
          id: projects.id,
          name: projects.name
        }
      })
      .from(leaves)
      .leftJoin(employees, eq(leaves.employeeId, employees.id))
      .leftJoin(sites, eq(leaves.siteId, sites.id))
      .leftJoin(projects, eq(leaves.projectId, projects.id))
      .where(and(...conditions))
      .orderBy(desc(leaves.createdAt));
      
      res.json(results);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/leaves', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No organization assigned' });
      
      const { employeeId, siteId, projectId, leaveType, startDate, endDate, status, reason } = req.body;
      const [newLeave] = await db.insert(leaves).values({
        organizationId: orgId,
        employeeId: parseInt(employeeId),
        siteId: siteId ? parseInt(siteId) : null,
        projectId: projectId ? parseInt(projectId) : null,
        leaveType,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        status: status || 'pending',
        reason
      }).returning();
      
      await db.insert(auditLogs).values({
        organizationId: orgId,
        userId: req.dbUser.id,
        action: 'SUBMIT',
        entity: 'LEAVE_REQUEST',
        entityId: newLeave.id.toString(),
        details: \`Leave request submitted for \${leaveType}\`,
      });
      
      res.status(201).json(newLeave);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/leaves/:id/action', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const leaveId = parseInt(req.params.id);
      const { status, reason } = req.body;

      await db.update(leaves)
        .set({ status })
        .where(and(eq(leaves.id, leaveId), eq(leaves.organizationId, orgId)));
        
      let actionLog = 'APPROVE';
      if (status === 'rejected') actionLog = 'REJECT';
      else if (status === 'on-hold') actionLog = 'ON_HOLD';
      
      await db.insert(auditLogs).values({
        organizationId: orgId,
        userId: req.dbUser.id,
        action: actionLog,
        entity: 'LEAVE_REQUEST',
        entityId: leaveId.toString(),
        details: \`\${actionLog} leave request - Reason: \${reason || 'No reason provided'}\`,
      });

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/leaves/:id/history', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      const leaveId = req.params.id;
      
      const logs = await db.select({
        id: auditLogs.id,
        action: auditLogs.action,
        details: auditLogs.details,
        createdAt: auditLogs.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email
        }
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(and(
        eq(auditLogs.organizationId, orgId),
        eq(auditLogs.entity, 'LEAVE_REQUEST'),
        eq(auditLogs.entityId, leaveId)
      ))
      .orderBy(desc(auditLogs.createdAt));

      res.json(logs);
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });
`;

code = code.replace(regex, newApis.trim());

fs.writeFileSync('server.ts', code);
