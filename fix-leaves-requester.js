import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf-8');

const importRegex = /import \{ eq, and, ilike, or, desc, sql, inArray \} from 'drizzle-orm';/;
if (!code.includes("alias } from 'drizzle-orm/pg-core'")) {
    code = code.replace(importRegex, "import { eq, and, ilike, or, desc, sql, inArray } from 'drizzle-orm';\nimport { alias } from 'drizzle-orm/pg-core';");
}

const getRegex = /app\.get\('\/api\/leaves', requireAuth, async \(req: AuthRequest, res\) => \{[\s\S]*?\}\);/m;
const postRegex = /app\.post\('\/api\/leaves', requireAuth, async \(req: AuthRequest, res\) => \{[\s\S]*?\}\);/m;

const newGet = `app.get('/api/leaves', requireAuth, async (req: AuthRequest, res) => {
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

      const requesters = alias(employees, 'requesters');

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
        requester: {
          id: requesters.id,
          firstName: requesters.firstName,
          lastName: requesters.lastName,
          employeeId: requesters.employeeId,
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
      .leftJoin(requesters, eq(leaves.requesterId, requesters.id))
      .leftJoin(sites, eq(leaves.siteId, sites.id))
      .leftJoin(projects, eq(leaves.projectId, projects.id))
      .where(and(...conditions))
      .orderBy(desc(leaves.createdAt));
      
      res.json(results);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });`;

const newPost = `app.post('/api/leaves', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No organization assigned' });
      
      const { employeeId, requesterId, siteId, projectId, leaveType, startDate, endDate, status, reason } = req.body;
      const [newLeave] = await db.insert(leaves).values({
        organizationId: orgId,
        employeeId: parseInt(employeeId),
        requesterId: requesterId ? parseInt(requesterId) : null,
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
  });`;

code = code.replace(getRegex, newGet);
code = code.replace(postRegex, newPost);

fs.writeFileSync('server.ts', code);
