import express from 'express';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import compression from 'compression';
import { createServer as createViteServer } from 'vite';
import { requireAuth, AuthRequest } from './src/server/auth.js';
import { db } from './src/db/index.js';
import { employees, sites, projects, siteCoordinators, employeeAssignments, timesheets, leaves, assets, trainingCourses, employeeTrainings, auditLogs, users, organizations, employeeDocuments, editRequests } from './src/db/schema.js';
import { vehicles, vehicleAssignments, accommodations, rooms, roomInventory } from './src/db/schema.js';
import { eq, and, ilike, or, desc, sql, inArray } from 'drizzle-orm';

async function startServer() {
  const app = express();
  app.set('trust proxy', 1); // Trust the reverse proxy to get correct IP
  const PORT = 3000;

  // Logging
  app.use(morgan('combined'));

  // Compression
  app.use(compression());

  // Security Headers
  app.use(helmet({
    contentSecurityPolicy: false, // Disabling for development/Vite HMR support, you'd configure this strictly in production
  }));

  // Rate Limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
  });
  app.use('/api/', apiLimiter);

  app.use(express.json());

  // API routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Global Search
  app.get('/api/search', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      
      const q = req.query.q as string;
      if (!q || q.length < 2) return res.json({ results: [] });

      const term = `%${q}%`;

      const [emps, projs, vehs, asts] = await Promise.all([
        db.select({ id: employees.id, firstName: employees.firstName, lastName: employees.lastName, employeeId: employees.employeeId, profilePhotoUrl: employees.profilePhotoUrl })
          .from(employees)
          .where(and(eq(employees.organizationId, orgId), or(ilike(employees.firstName, term), ilike(employees.lastName, term), ilike(employees.employeeId, term)))),
        db.select({ id: projects.id, name: projects.name, code: projects.code })
          .from(projects)
          .where(and(eq(projects.organizationId, orgId), or(ilike(projects.name, term), ilike(projects.code, term)))),
        db.select({ id: vehicles.id, make: vehicles.make, model: vehicles.model, licensePlate: vehicles.licensePlate })
          .from(vehicles)
          .where(and(eq(vehicles.organizationId, orgId), or(ilike(vehicles.make, term), ilike(vehicles.model, term), ilike(vehicles.licensePlate, term)))),
        db.select({ id: assets.id, name: assets.name, assetTag: assets.assetTag, type: assets.type })
          .from(assets)
          .where(and(eq(assets.organizationId, orgId), or(ilike(assets.name, term), ilike(assets.assetTag, term), ilike(assets.type, term))))
      ]);

      const results: any[] = [];
      emps.forEach(e => results.push({ type: 'Employee', title: `${e.firstName} ${e.lastName}`, subtitle: e.employeeId, id: e.id, photo: e.profilePhotoUrl, url: `/employees/${e.id}` }));
      projs.forEach(p => results.push({ type: 'Project', title: p.name, subtitle: p.code, id: p.id, url: '/projects' }));
      vehs.forEach(v => results.push({ type: 'Vehicle', title: `${v.make} ${v.model}`, subtitle: v.licensePlate, id: v.id, url: '/vehicles' }));
      asts.forEach(a => results.push({ type: 'Asset', title: a.name, subtitle: a.assetTag, id: a.id, url: '/assets' }));

      res.json({ results });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Example Protected Route: Get current user info
  app.get('/api/me', requireAuth, (req: AuthRequest, res) => {
    res.json({ user: req.dbUser });
  });

  // Get Employees for current tenant
  app.get('/api/employees', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No organization assigned' });
      
      const results = await db.select().from(employees).where(eq(employees.organizationId, orgId));
      res.json(results);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Add Employee
  app.post('/api/employees', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No organization assigned' });
      
      // Enforce unique employeeId check could be done via DB constraints, but we can do a quick check
      const { 
        firstName, lastName, employeeId, department, jobTitle,
        nationality, gender, dateOfBirth, nationalId, joiningDate,
        position, employmentType, mobile, email, emergencyContact,
        supervisorId, coordinatorId 
      } = req.body;

      const existing = await db.select().from(employees).where(and(eq(employees.employeeId, employeeId), eq(employees.organizationId, orgId)));
      if (existing.length > 0) {
        return res.status(400).json({ error: 'Employee ID must be unique within the organization' });
      }

      const [newEmp] = await db.insert(employees).values({
        organizationId: orgId,
        firstName,
        lastName,
        employeeId,
        department,
        jobTitle,
        nationality, 
        gender, 
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : null, 
        nationalId, 
        joiningDate: joiningDate ? new Date(joiningDate).toISOString() : null,
        position, 
        employmentType, 
        mobile, 
        email, 
        emergencyContact,
        supervisorId: supervisorId ? parseInt(supervisorId) : null, 
        coordinatorId: coordinatorId ? parseInt(coordinatorId) : null,
      }).returning();
      
      // Audit Log
      await db.insert(auditLogs).values({
        organizationId: orgId,
        userId: req.dbUser!.id,
        action: 'CREATE',
        entity: 'EMPLOYEE',
        entityId: String(newEmp.id),
        details: JSON.stringify({ name: `${firstName} ${lastName}` })
      }).catch(console.error);

      res.status(201).json(newEmp);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Update Employee
  app.put('/api/employees/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No organization assigned' });
      
      const empId = parseInt(req.params.id);
      const updates = req.body;

      // Note: for production, filter fields, validate auth limits
      if (updates.dateOfBirth) updates.dateOfBirth = new Date(updates.dateOfBirth).toISOString();
      if (updates.joiningDate) updates.joiningDate = new Date(updates.joiningDate).toISOString();
      updates.updatedAt = new Date();
      
      const [updatedEmp] = await db.update(employees).set(updates).where(and(eq(employees.id, empId), eq(employees.organizationId, orgId))).returning();
      
      // Audit Log
      await db.insert(auditLogs).values({
        organizationId: orgId,
        userId: req.dbUser!.id,
        action: 'UPDATE',
        entity: 'EMPLOYEE',
        entityId: String(updatedEmp.id),
        details: JSON.stringify({ updatedKeys: Object.keys(updates) })
      }).catch(console.error);

      res.json(updatedEmp);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get Employee Documents
  app.get('/api/employee-documents', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No organization assigned' });
      
      const { employeeId } = req.query;
      
      let query = db.select({
        id: employeeDocuments.id,
        documentType: employeeDocuments.documentType,
        documentUrl: employeeDocuments.documentUrl,
        issueDate: employeeDocuments.issueDate,
        expiryDate: employeeDocuments.expiryDate,
        status: employeeDocuments.status,
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          employeeId: employees.employeeId
        }
      })
      .from(employeeDocuments)
      .leftJoin(employees, eq(employeeDocuments.employeeId, employees.id))
      .where(eq(employeeDocuments.organizationId, orgId));

      if (employeeId) {
        query = db.select({
          id: employeeDocuments.id,
          documentType: employeeDocuments.documentType,
          documentUrl: employeeDocuments.documentUrl,
          issueDate: employeeDocuments.issueDate,
          expiryDate: employeeDocuments.expiryDate,
          status: employeeDocuments.status,
          employee: {
            id: employees.id,
            firstName: employees.firstName,
            lastName: employees.lastName,
            employeeId: employees.employeeId
          }
        })
        .from(employeeDocuments)
        .leftJoin(employees, eq(employeeDocuments.employeeId, employees.id))
        .where(and(eq(employeeDocuments.organizationId, orgId), eq(employeeDocuments.employeeId, parseInt(employeeId as string))));
      }

      const results = await query;
      res.json(results);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  
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

  // Add Employee Document
  app.post('/api/employee-documents', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No organization assigned' });
      
      const { employeeId, documentType, documentUrl, issueDate, expiryDate } = req.body;

      const [newDoc] = await db.insert(employeeDocuments).values({
        organizationId: orgId,
        employeeId: parseInt(employeeId),
        documentType,
        documentUrl,
        issueDate: issueDate ? new Date(issueDate).toISOString() : null,
        expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
      }).returning();
      
      // Audit Log
      await db.insert(auditLogs).values({
        organizationId: orgId,
        userId: req.dbUser!.id,
        action: 'CREATE',
        entity: 'DOCUMENT',
        entityId: String(newDoc.id),
        details: JSON.stringify({ documentType })
      }).catch(console.error);

      res.status(201).json(newDoc);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  
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


  // Get Sites
  
  // Sites
  app.get('/api/sites', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      
      let conditions = [eq(sites.organizationId, orgId)];
      if (req.dbUser?.role === 'coordinator' || req.dbUser?.role === 'site_supervisor') {
         const userSites = await db.select({ siteId: siteCoordinators.siteId }).from(siteCoordinators).where(eq(siteCoordinators.userId, req.dbUser.id));
         const siteIds = userSites.map(s => s.siteId);
         if (siteIds.length > 0) {
            conditions.push(inArray(sites.id, siteIds));
         } else {
            return res.json([]); // No sites allocated
         }
      }
      const results = await db.select().from(sites).where(and(...conditions));
      res.json(results);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  
  app.post('/api/sites', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });

  app.put('/api/sites/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const siteId = parseInt(req.params.id);
      const updates = { ...req.body };
      const [updated] = await db.update(sites).set(updates).where(and(eq(sites.id, siteId), eq(sites.organizationId, orgId))).returning();
      res.json(updated);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
      const [newRec] = await db.insert(sites).values({ organizationId: orgId, ...req.body }).returning();
      res.status(201).json(newRec);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Projects

  app.get('/api/sites/:id/details', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const siteId = parseInt(req.params.id);
      
      const [site] = await db.select().from(sites).where(and(eq(sites.id, siteId), eq(sites.organizationId, orgId)));
      if (!site) return res.status(404).json({ error: 'Site not found' });

      // Fetch coordinators
      const coords = await db.select({
        id: siteCoordinators.id,
        user: {
          id: users.id,
          name: users.name,
          email: users.email
        }
      }).from(siteCoordinators).leftJoin(users, eq(siteCoordinators.userId, users.id)).where(eq(siteCoordinators.siteId, siteId));

      // Fetch assignments
      const assigns = await db.select({
        id: employeeAssignments.id,
        role: employeeAssignments.role,
        status: employeeAssignments.status,
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          employeeId: employees.employeeId
        }
      }).from(employeeAssignments).leftJoin(employees, eq(employeeAssignments.employeeId, employees.id)).where(eq(employeeAssignments.siteId, siteId));

      // Fetch projects
      const siteProjects = await db.select().from(projects).where(eq(projects.organizationId, orgId));
      // In reality there's project_sites table, but let's just fetch all and UI can filter or we do simple.
      
      res.json({
        site,
        coordinators: coords,
        assignments: assigns
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/projects', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const results = await db.select().from(projects).where(eq(projects.organizationId, orgId));
      res.json(results);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  
  app.post('/api/projects', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });

  app.put('/api/projects/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const projectId = parseInt(req.params.id);
      const payload = { ...req.body };
      if (!payload.startDate) payload.startDate = null;
      if (!payload.endDate) payload.endDate = null;
      if (payload.startDate) payload.startDate = new Date(payload.startDate).toISOString();
      if (payload.endDate) payload.endDate = new Date(payload.endDate).toISOString();
      const [updated] = await db.update(projects).set(payload).where(and(eq(projects.id, projectId), eq(projects.organizationId, orgId))).returning();
      res.json(updated);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
      
      const payload = { ...req.body };
      if (!payload.startDate) delete payload.startDate;
      if (!payload.endDate) delete payload.endDate;
      
      const [newRec] = await db.insert(projects).values({ organizationId: orgId, ...payload }).returning();
      res.status(201).json(newRec);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Assignments
  app.get('/api/assignments', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      
      const results = await db.select({
        id: employeeAssignments.id,
        role: employeeAssignments.role,
        startDate: employeeAssignments.startDate,
        endDate: employeeAssignments.endDate,
        status: employeeAssignments.status,
        employee: { id: employees.id, firstName: employees.firstName, lastName: employees.lastName },
        site: { name: sites.name },
        project: { name: projects.name }
      })
      .from(employeeAssignments)
      .leftJoin(employees, eq(employeeAssignments.employeeId, employees.id))
      .leftJoin(sites, eq(employeeAssignments.siteId, sites.id))
      .leftJoin(projects, eq(employeeAssignments.projectId, projects.id))
      .where(eq(employeeAssignments.organizationId, orgId));
      
      res.json(results);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/assignments', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      
      const { employeeId, siteId, projectId, role, startDate, endDate, status } = req.body;
      const payload: any = { 
        organizationId: orgId, 
        employeeId: parseInt(employeeId), 
        role, startDate, status 
      };
      if (siteId) payload.siteId = parseInt(siteId);
      if (projectId) payload.projectId = parseInt(projectId);
      if (endDate) payload.endDate = endDate;

      const [newRec] = await db.insert(employeeAssignments).values(payload).returning();
      res.status(201).json(newRec);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  
  // Get Timesheet Batches (Monthly summaries)
  
  app.get('/api/timesheet-batches/history', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      
      const { month } = req.query;
      if (!month) return res.status(400).json({ error: 'Month is required' });

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
        eq(auditLogs.entity, 'TIMESHEET_BATCH'),
        eq(auditLogs.entityId, month as string)
      ))
      .orderBy(desc(auditLogs.createdAt));

      res.json(logs);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/timesheet-batches', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      
      const query = sql`
        SELECT 
          TO_CHAR(t.date, 'YYYY-MM') as month,
          s.name as site_name,
          p.name as project_name,
          t.site_id as site_id,
          t.project_id as project_id,
          COUNT(DISTINCT t.employee_id) as employee_count,
          SUM(t.hours_worked) as total_hours,
          t.status as status
        FROM timesheets t
        LEFT JOIN sites s ON t.site_id = s.id
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.organization_id = ${orgId}
        GROUP BY 
          TO_CHAR(t.date, 'YYYY-MM'),
          s.name,
          p.name,
          t.site_id,
          t.project_id,
          t.status
        ORDER BY month DESC;
      `;
      
      const result = await db.execute(query);
      res.json(result.rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Bulk Upsert Monthly Timesheets
  app.post('/api/timesheets/bulk-upsert', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      
      const { records } = req.body;
      if (!records || !Array.isArray(records)) {
        return res.status(400).json({ error: 'Records array required' });
      }

      const toInsert = [];
      const toUpdate = [];

      // We will loop over each record. We need to check if it exists.
      // Doing this one by one is slow, but fine for prototype.
      for (const rec of records) {
        const existing = await db.select().from(timesheets).where(
          and(
            eq(timesheets.organizationId, orgId),
            eq(timesheets.employeeId, rec.employeeId),
            eq(timesheets.date, rec.date),
            eq(timesheets.siteId, rec.siteId)
          )
        ).limit(1);

        if (existing.length > 0) {
          const ex = existing[0];
          if (ex.status !== 'approved') {
            toUpdate.push({ id: ex.id, ...rec });
          }
        } else {
          toInsert.push({ organizationId: orgId, ...rec });
        }
      }

      if (toInsert.length > 0) {
        await db.insert(timesheets).values(toInsert);
      }

      for (const u of toUpdate) {
        await db.update(timesheets).set(u).where(eq(timesheets.id, u.id));
      }

      res.json({ success: true, inserted: toInsert.length, updated: toUpdate.length });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
  
  // Bulk Approve Batch
  // Bulk Approve Batch
  app.put('/api/timesheet-batches/approve', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      
      const { month, siteId, projectId, status, reason } = req.body;
      
      // Update all timesheets matching these criteria
      const conditions = [
        eq(timesheets.organizationId, orgId),
        sql`TO_CHAR(date, 'YYYY-MM') = ${month}`
      ];
      if (siteId) conditions.push(eq(timesheets.siteId, siteId));
      if (projectId) conditions.push(eq(timesheets.projectId, projectId));

      const updated = await db.update(timesheets)
        .set({ status })
        .where(and(...conditions))
        .returning();

      // Audit Log
      if (updated.length > 0) {
        let actionStr = 'UPDATE';
        if (status === 'approved') actionStr = 'APPROVE';
        else if (status === 'rejected') actionStr = 'REJECT';
        else if (status === 'on-hold') actionStr = 'ON_HOLD';

        let detailStr = `${status.charAt(0).toUpperCase() + status.slice(1)} timesheet batch for ${month}`;
        if (reason) detailStr += ` - Reason: ${reason}`;

        await db.insert(auditLogs).values({
          organizationId: orgId,
          userId: req.dbUser!.id,
          action: actionStr,
          entity: 'TIMESHEET_BATCH',
          entityId: month,
          details: detailStr
        });
      }

      res.json({ success: true, count: updated.length });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  
  app.get('/api/timesheets/template-data', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      
      const { siteId, projectId } = req.query;

      const conditions = [eq(employeeAssignments.organizationId, orgId)];
      if (siteId) conditions.push(eq(employeeAssignments.siteId, parseInt(siteId as string)));
      if (projectId) conditions.push(eq(employeeAssignments.projectId, parseInt(projectId as string)));
      conditions.push(eq(employeeAssignments.status, 'active'));

      const results = await db.select({
        employeeId: employees.employeeId,
        firstName: employees.firstName,
        lastName: employees.lastName,
        siteName: sites.name,
        projectName: projects.name,
      })
      .from(employeeAssignments)
      .innerJoin(employees, eq(employeeAssignments.employeeId, employees.id))
      .leftJoin(sites, eq(employeeAssignments.siteId, sites.id))
      .leftJoin(projects, eq(employeeAssignments.projectId, projects.id))
      .where(and(...conditions));
      
      res.json(results);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/timesheets', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No organization assigned' });
      
      const { month, siteId, projectId } = req.query;

      const conditions = [eq(timesheets.organizationId, orgId)];
      if (month) conditions.push(sql`TO_CHAR(timesheets.date, 'YYYY-MM') = ${month}`);
      if (siteId) conditions.push(eq(timesheets.siteId, parseInt(siteId as string)));
      if (projectId) conditions.push(eq(timesheets.projectId, parseInt(projectId as string)));

      const results = await db.select({
        id: timesheets.id,
        date: timesheets.date,
        hoursWorked: timesheets.hoursWorked,
        overtimeHours: timesheets.overtimeHours,
        attendanceStatus: timesheets.attendanceStatus,
        notes: timesheets.notes,
        status: timesheets.status,
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          employeeId: employees.employeeId,
        },
        site: {
          id: sites.id,
          name: sites.name,
        },
        project: {
          id: projects.id,
          name: projects.name,
        }
      })
      .from(timesheets)
      .leftJoin(employees, eq(timesheets.employeeId, employees.id))
      .leftJoin(sites, eq(timesheets.siteId, sites.id))
      .leftJoin(projects, eq(timesheets.projectId, projects.id))
      .where(and(...conditions))
      .orderBy(desc(timesheets.date));
      
      res.json(results);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Add Timesheet
  app.post('/api/timesheets', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No organization assigned' });
      
      const { employeeId, projectId, siteId, date, hoursWorked, status } = req.body;
      const [newTimesheet] = await db.insert(timesheets).values({
        organizationId: orgId,
        employeeId: parseInt(employeeId),
        projectId: projectId ? parseInt(projectId) : null,
        siteId: siteId ? parseInt(siteId) : null,
        date: new Date(date).toISOString(),
        hoursWorked: parseInt(hoursWorked),
        status: status || 'pending'
      }).returning();
      
      // Audit Log
      await db.insert(auditLogs).values({
        organizationId: orgId,
        userId: req.dbUser!.id,
        action: 'CREATE',
        entity: 'TIMESHEET',
        entityId: String(newTimesheet.id),
        details: JSON.stringify({ hoursWorked, status })
      }).catch(console.error);

      res.status(201).json(newTimesheet);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get Leaves
  app.get('/api/leaves', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No organization assigned' });
      
      const results = await db.select({
        id: leaves.id,
        leaveType: leaves.leaveType,
        startDate: leaves.startDate,
        endDate: leaves.endDate,
        status: leaves.status,
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          employeeId: employees.employeeId,
        }
      })
      .from(leaves)
      .leftJoin(employees, eq(leaves.employeeId, employees.id))
      .where(eq(leaves.organizationId, orgId));
      
      res.json(results);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Add Leave
  app.post('/api/leaves', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No organization assigned' });
      
      const { employeeId, leaveType, startDate, endDate, status } = req.body;
      const [newLeave] = await db.insert(leaves).values({
        organizationId: orgId,
        employeeId: parseInt(employeeId),
        leaveType,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        status: status || 'pending'
      }).returning();
      
      res.status(201).json(newLeave);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get Assets
  app.get('/api/assets', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No organization assigned' });
      
      const results = await db.select({
        id: assets.id,
        name: assets.name,
        assetTag: assets.assetTag,
        type: assets.type,
        status: assets.status,
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          employeeId: employees.employeeId,
        },
        site: {
          id: sites.id,
          name: sites.name,
        }
      })
      .from(assets)
      .leftJoin(employees, eq(assets.assignedToEmployeeId, employees.id))
      .leftJoin(sites, eq(assets.assignedToSiteId, sites.id))
      .where(eq(assets.organizationId, orgId));
      
      res.json(results);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Add Asset
  app.post('/api/assets', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No organization assigned' });
      
      const { name, assetTag, type, assignedToEmployeeId, assignedToSiteId, status } = req.body;
      const [newAsset] = await db.insert(assets).values({
        organizationId: orgId,
        name,
        assetTag,
        type,
        assignedToEmployeeId: assignedToEmployeeId ? parseInt(assignedToEmployeeId) : null,
        assignedToSiteId: assignedToSiteId ? parseInt(assignedToSiteId) : null,
        status: status || 'available'
      }).returning();
      
      res.status(201).json(newAsset);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get Training Courses
  app.get('/api/trainings/courses', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No organization assigned' });
      
      const results = await db.select()
        .from(trainingCourses)
        .where(eq(trainingCourses.organizationId, orgId));
      
      res.json(results);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Add Training Course
  app.post('/api/trainings/courses', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No organization assigned' });
      
      const { title, description, provider } = req.body;
      const [newCourse] = await db.insert(trainingCourses).values({
        organizationId: orgId,
        title,
        description,
        provider
      }).returning();
      
      res.status(201).json(newCourse);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get Employee Trainings
  app.get('/api/trainings/employee', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No organization assigned' });
      
      const results = await db.select({
        id: employeeTrainings.id,
        completionDate: employeeTrainings.completionDate,
        expiryDate: employeeTrainings.expiryDate,
        status: employeeTrainings.status,
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          employeeId: employees.employeeId,
        },
        course: {
          id: trainingCourses.id,
          title: trainingCourses.title,
          provider: trainingCourses.provider,
        }
      })
      .from(employeeTrainings)
      .leftJoin(employees, eq(employeeTrainings.employeeId, employees.id))
      .leftJoin(trainingCourses, eq(employeeTrainings.courseId, trainingCourses.id))
      .where(eq(employeeTrainings.organizationId, orgId));
      
      res.json(results);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Add Employee Training
  app.post('/api/trainings/employee', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No organization assigned' });
      
      const { employeeId, courseId, completionDate, expiryDate, status } = req.body;
      const [newTraining] = await db.insert(employeeTrainings).values({
        organizationId: orgId,
        employeeId: parseInt(employeeId),
        courseId: parseInt(courseId),
        completionDate: completionDate ? new Date(completionDate).toISOString() : null,
        expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
        status: status || 'enrolled'
      }).returning();
      
      res.status(201).json(newTraining);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get Dashboard Stats
  app.get('/api/dashboard/stats', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No organization assigned' });
      
      const [
        allEmployees, 
        allSites, 
        allProjects, 
        allAssets
      ] = await Promise.all([
        db.select({ id: employees.id }).from(employees).where(eq(employees.organizationId, orgId)),
        db.select({ id: sites.id }).from(sites).where(eq(sites.organizationId, orgId)),
        db.select({ id: projects.id }).from(projects).where(eq(projects.organizationId, orgId)),
        db.select({ id: assets.id }).from(assets).where(eq(assets.organizationId, orgId)),
      ]);

      res.json({
        totalEmployees: allEmployees.length,
        totalSites: allSites.length,
        totalProjects: allProjects.length,
        totalAssets: allAssets.length
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get Audit Logs
  // Audit Logs
  app.get('/api/audit-logs', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No organization assigned' });
      
      const limitParam = parseInt(req.query.limit as string) || 50;

      const results = await db.select({
        id: auditLogs.id,
        action: auditLogs.action,
        entity: auditLogs.entity,
        entityId: auditLogs.entityId,
        details: auditLogs.details,
        createdAt: auditLogs.createdAt,
        user: {
          name: users.name,
          email: users.email,
        }
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(eq(auditLogs.organizationId, orgId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limitParam);
      
      res.json(results);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Add Audit Log
  app.post('/api/audit-logs', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      const userId = req.dbUser?.id;
      if (!orgId || !userId) return res.status(403).json({ error: 'Unauthorized' });
      
      const { action, entity, entityId, details } = req.body;
      const [newLog] = await db.insert(auditLogs).values({
        organizationId: orgId,
        userId: userId,
        action,
        entity,
        entityId: String(entityId),
        details: details ? JSON.stringify(details) : null
      }).returning();
      
      res.status(201).json(newLog);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get current organization
  app.get('/api/organization', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No organization assigned' });
      
      const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId));
      res.json(org);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Update current organization
  app.put('/api/organization', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No organization assigned' });
      
      const { name } = req.body;
      const [updated] = await db.update(organizations).set({ name }).where(eq(organizations.id, orgId)).returning();
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get all users for the organization
  app.get('/api/users', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No organization assigned' });
      
      const results = await db.select().from(users).where(eq(users.organizationId, orgId));
      res.json(results);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Update user role
  app.put('/api/users/:id/role', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      const myRole = req.dbUser?.role;
      if (!orgId) return res.status(403).json({ error: 'No organization assigned' });
      if (myRole !== 'saas_super_admin' && myRole !== 'org_admin') {
         return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
      }
      
      const { role } = req.body;
      const targetId = parseInt(req.params.id);
      const [updated] = await db.update(users).set({ role }).where(and(eq(users.id, targetId), eq(users.organizationId, orgId))).returning();
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });


  // Vehicles
  app.get('/api/vehicles', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const results = await db.select().from(vehicles).where(eq(vehicles.organizationId, orgId));
      res.json(results);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  
  app.post('/api/vehicles', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const data = req.body;
      const [newRec] = await db.insert(vehicles).values({
        organizationId: orgId,
        ...data
      }).returning();
      res.status(201).json(newRec);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.put('/api/vehicles/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const data = req.body;
      const [newRec] = await db.update(vehicles).set(data).where(and(eq(vehicles.id, parseInt(req.params.id)), eq(vehicles.organizationId, orgId))).returning();
      res.json(newRec);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Accommodations
  app.get('/api/accommodations', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const results = await db.select().from(accommodations).where(eq(accommodations.organizationId, orgId));
      res.json(results);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post('/api/accommodations', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const [newRec] = await db.insert(accommodations).values({ organizationId: orgId, ...req.body }).returning();
      res.status(201).json(newRec);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Rooms
  app.get('/api/rooms', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const results = await db.select({
        id: rooms.id, roomNumber: rooms.roomNumber, capacity: rooms.capacity, status: rooms.status, building: rooms.building, floor: rooms.floor,
        accommodation: { name: accommodations.name }
      }).from(rooms).leftJoin(accommodations, eq(rooms.accommodationId, accommodations.id)).where(eq(rooms.organizationId, orgId));
      res.json(results);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
  app.post('/api/rooms', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const { accommodationId, roomNumber, capacity, building, floor } = req.body;
      const [newRec] = await db.insert(rooms).values({ organizationId: orgId, accommodationId: parseInt(accommodationId), roomNumber, capacity: parseInt(capacity), building, floor }).returning();
      res.status(201).json(newRec);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });


  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found: ' + req.url });
  });


  app.use((err: any, req: any, res: any, next: any) => {
    if (req.path && req.path.startsWith('/api')) {
      res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
    } else {
      next(err);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
