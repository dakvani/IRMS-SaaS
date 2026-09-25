import express from 'express';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import compression from 'compression';
import {  createServer as createViteServer } from 'vite';
import { requireAuth, AuthRequest } from './src/server/auth.js';
import { db } from './src/db/index.js';
import { employees, sites, projects, siteCoordinators, employeeAssignments, timesheets, leaves, assets,
  assetMaintenance, assetAllocations, trainingCourses, employeeTrainings, auditLogs, notifications, users, organizations, employeeDocuments, editRequests } from './src/db/schema.js';
import {  vehicles, vehicleAssignments, accommodations, rooms, roomInventory, roomAssignments } from './src/db/schema.js';
import { eq, and, ilike, or, desc, sql, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

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

  // Get Single Employee
  app.get('/api/employees/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No organization assigned' });
      const empId = parseInt(req.params.id);
      if (isNaN(empId)) return res.status(400).json({ error: 'Invalid employee ID' });

      const [emp] = await db
        .select()
        .from(employees)
        .where(and(eq(employees.id, empId), eq(employees.organizationId, orgId)));

      if (!emp) return res.status(404).json({ error: 'Employee not found' });
      res.json(emp);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Employee 360° Master Dossier & Full History
  app.get('/api/employees/:id/dossier', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No organization assigned' });
      const empId = parseInt(req.params.id);
      if (isNaN(empId)) return res.status(400).json({ error: 'Invalid employee ID' });

      const [emp] = await db
        .select()
        .from(employees)
        .where(and(eq(employees.id, empId), eq(employees.organizationId, orgId)));

      if (!emp) return res.status(404).json({ error: 'Employee not found' });

      // Run parallel queries across all modules to fetch all data belonging to this employee
      const [
        assignmentsList,
        assetsList,
        assetAllocationsList,
        vehicleAssignmentsList,
        roomAssignmentsList,
        documentsList,
        leavesList,
        timesheetsList,
      ] = await Promise.all([
        // 1. All Kinds of Assignments & Assignment History
        db.select({
          id: employeeAssignments.id,
          role: employeeAssignments.role,
          startDate: employeeAssignments.startDate,
          endDate: employeeAssignments.endDate,
          status: employeeAssignments.status,
          createdAt: employeeAssignments.createdAt,
          site: {
            id: sites.id,
            name: sites.name,
            code: sites.code,
            location: sites.location,
            address: sites.address,
          },
          project: {
            id: projects.id,
            name: projects.name,
            code: projects.code,
            client: projects.client,
          }
        })
        .from(employeeAssignments)
        .leftJoin(sites, eq(employeeAssignments.siteId, sites.id))
        .leftJoin(projects, eq(employeeAssignments.projectId, projects.id))
        .where(and(eq(employeeAssignments.organizationId, orgId), eq(employeeAssignments.employeeId, empId)))
        .orderBy(desc(employeeAssignments.startDate)),

        // 2. Currently Assigned Assets
        db.select()
          .from(assets)
          .where(and(eq(assets.organizationId, orgId), eq(assets.assignedToEmployeeId, empId))),

        // 3. Asset Allocation History (all past & present allocations)
        db.select({
          id: assetAllocations.id,
          startDate: assetAllocations.startDate,
          endDate: assetAllocations.endDate,
          status: assetAllocations.status,
          notes: assetAllocations.notes,
          createdAt: assetAllocations.createdAt,
          asset: {
            id: assets.id,
            name: assets.name,
            assetTag: assets.assetTag,
            type: assets.type,
            make: assets.make,
            model: assets.model,
            photoUrl: assets.photoUrl,
            status: assets.status,
          },
          project: {
            id: projects.id,
            name: projects.name,
            code: projects.code,
          },
          site: {
            id: sites.id,
            name: sites.name,
          }
        })
        .from(assetAllocations)
        .innerJoin(assets, eq(assetAllocations.assetId, assets.id))
        .leftJoin(projects, eq(assetAllocations.projectId, projects.id))
        .leftJoin(sites, eq(assetAllocations.siteId, sites.id))
        .where(and(eq(assetAllocations.organizationId, orgId), eq(assetAllocations.employeeId, empId)))
        .orderBy(desc(assetAllocations.startDate)),

        // 4. Vehicle Assignments & History
        db.select({
          id: vehicleAssignments.id,
          startDate: vehicleAssignments.startDate,
          endDate: vehicleAssignments.endDate,
          status: vehicleAssignments.status,
          createdAt: vehicleAssignments.createdAt,
          vehicle: {
            id: vehicles.id,
            make: vehicles.make,
            model: vehicles.model,
            year: vehicles.year,
            licensePlate: vehicles.licensePlate,
            vin: vehicles.vin,
            type: vehicles.type,
            currentMileage: vehicles.currentMileage,
            status: vehicles.status,
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
        .from(vehicleAssignments)
        .innerJoin(vehicles, eq(vehicleAssignments.vehicleId, vehicles.id))
        .leftJoin(sites, eq(vehicleAssignments.siteId, sites.id))
        .leftJoin(projects, eq(vehicleAssignments.projectId, projects.id))
        .where(and(eq(vehicleAssignments.organizationId, orgId), eq(vehicleAssignments.employeeId, empId)))
        .orderBy(desc(vehicleAssignments.startDate)),

        // 5. Accommodation & Room Assignments History
        db.select({
          id: roomAssignments.id,
          startDate: roomAssignments.startDate,
          endDate: roomAssignments.endDate,
          status: roomAssignments.status,
          notes: roomAssignments.notes,
          createdAt: roomAssignments.createdAt,
          room: {
            id: rooms.id,
            roomNumber: rooms.roomNumber,
            building: rooms.building,
            floor: rooms.floor,
            roomType: rooms.roomType,
            capacity: rooms.capacity,
          },
          accommodation: {
            id: accommodations.id,
            name: accommodations.name,
            type: accommodations.type,
            location: accommodations.location,
            address: accommodations.address,
            contactNumber: accommodations.contactNumber,
            amenities: accommodations.amenities,
          }
        })
        .from(roomAssignments)
        .innerJoin(rooms, eq(roomAssignments.roomId, rooms.id))
        .innerJoin(accommodations, eq(rooms.accommodationId, accommodations.id))
        .where(and(eq(roomAssignments.organizationId, orgId), eq(roomAssignments.employeeId, empId)))
        .orderBy(desc(roomAssignments.startDate)),

        // 6. Documents
        db.select()
          .from(employeeDocuments)
          .where(and(eq(employeeDocuments.organizationId, orgId), eq(employeeDocuments.employeeId, empId)))
          .orderBy(desc(employeeDocuments.createdAt)),

        // 7. Leaves
        db.select()
          .from(leaves)
          .where(and(eq(leaves.organizationId, orgId), eq(leaves.employeeId, empId)))
          .orderBy(desc(leaves.startDate)),

        // 8. Timesheets
        db.select()
          .from(timesheets)
          .where(and(eq(timesheets.organizationId, orgId), eq(timesheets.employeeId, empId)))
          .orderBy(desc(timesheets.date))
          .limit(30)
      ]);

      const activeAssignment = assignmentsList.find(a => a.status?.toLowerCase() === 'active') || null;
      const activeAccommodation = roomAssignmentsList.find(r => r.status?.toLowerCase() === 'active') || null;
      const activeVehicle = vehicleAssignmentsList.find(v => v.status?.toLowerCase() === 'active') || null;

      res.json({
        employee: emp,
        activeAssignment,
        assignmentHistory: assignmentsList,
        assets: assetsList,
        assetHistory: assetAllocationsList,
        activeVehicle,
        vehicleHistory: vehicleAssignmentsList,
        activeAccommodation,
        accommodationHistory: roomAssignmentsList,
        documents: documentsList,
        leaves: leavesList,
        timesheets: timesheetsList,
      });
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
      const [newRec] = await db.insert(sites).values({ organizationId: orgId, ...req.body }).returning();
      res.status(201).json(newRec);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

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
      
      const payload = { ...req.body };
      if (!payload.startDate) delete payload.startDate;
      if (!payload.endDate) delete payload.endDate;
      
      const [newRec] = await db.insert(projects).values({ organizationId: orgId, ...payload }).returning();
      res.status(201).json(newRec);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

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


  app.put('/api/assignments/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      
      const { siteId, projectId, role, startDate, endDate, status } = req.body;
      const payload: any = { role, startDate, status };
      if (siteId) payload.siteId = parseInt(siteId);
      if (projectId) payload.projectId = parseInt(projectId);
      payload.endDate = endDate || null;

      const [updated] = await db.update(employeeAssignments).set(payload).where(and(eq(employeeAssignments.id, parseInt(req.params.id)), eq(employeeAssignments.organizationId, orgId))).returning();
      res.json(updated);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/assignments/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      await db.delete(employeeAssignments).where(and(eq(employeeAssignments.id, parseInt(req.params.id)), eq(employeeAssignments.organizationId, orgId)));
      res.json({ success: true });
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
        
      if (siteId) {
        const coordinators = await db.select({ userId: siteCoordinators.userId }).from(siteCoordinators).where(eq(siteCoordinators.siteId, parseInt(siteId)));
        for (const coord of coordinators) {
          if (coord.userId !== req.dbUser.id) {
            await db.insert(notifications).values({
              organizationId: orgId,
              userId: coord.userId,
              title: `Timesheet ${status}`,
              message: `Timesheet batch for ${month} was ${status} by management.`,
            });
          }
        }
      }

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
  });

  app.post('/api/leaves', requireAuth, async (req: AuthRequest, res) => {
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
        details: `Leave request submitted for ${leaveType}`,
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
        details: `${actionLog} leave request - Reason: ${reason || 'No reason provided'}`,
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
      
      
      const { 
        name, assetTag, type, assignedToEmployeeId, assignedToSiteId, status,
        purchasePrice, purchaseDate, salvageValue, usefulLifeYears, depreciationMethod, maintenanceIntervalDays
      } = req.body;
      const finalAssetTag = assetTag || `AST-${Date.now().toString(36).toUpperCase()}`;
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
        make: req.body.make || null, 
        model: req.body.model || null, 
        licensePlate: req.body.licensePlate || null, 
        year: req.body.year ? parseInt(req.body.year) : null, 
        vin: req.body.vin || null, 
        warrantyExpiry: req.body.warrantyExpiry ? new Date(req.body.warrantyExpiry).toISOString() : null,
        
      }).returning();

      
      await db.insert(auditLogs).values({
        organizationId: orgId,
        userId: req.dbUser.id,
        action: 'CREATE',
        entity: 'ASSET',
        entityId: newAsset.id.toString(),
        details: `Created asset ${newAsset.name} (${newAsset.assetTag})`
      });
      
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
        allAssets,
        allAssignments
      ] = await Promise.all([
        db.select().from(employees).where(eq(employees.organizationId, orgId)),
        db.select().from(sites).where(eq(sites.organizationId, orgId)),
        db.select().from(projects).where(eq(projects.organizationId, orgId)),
        db.select().from(assets).where(eq(assets.organizationId, orgId)),
        db.select().from(employeeAssignments).where(eq(employeeAssignments.organizationId, orgId)),
      ]);

      const activeEmployees = allEmployees.filter(e => (e as any).status !== 'inactive' && (e as any).status !== 'terminated').length;
      const ongoingProjects = allProjects.filter(p => !p.status || p.status.toLowerCase() === 'active' || p.status.toLowerCase() === 'ongoing' || p.status.toLowerCase() === 'in progress').length;
      
      const assignedEmpIds = new Set(allAssignments.filter(a => !a.status || a.status.toLowerCase() === 'active').map(a => a.employeeId));
      let resourceUtilizationPercentage = 0;
      if (allEmployees.length > 0) {
        if (assignedEmpIds.size > 0) {
          resourceUtilizationPercentage = Math.min(100, Math.round((assignedEmpIds.size / allEmployees.length) * 100));
        } else {
          resourceUtilizationPercentage = Math.min(100, Math.round((activeEmployees / allEmployees.length) * 88));
        }
      }

      res.json({
        totalEmployees: allEmployees.length,
        activeEmployees,
        totalSites: allSites.length,
        totalProjects: allProjects.length,
        ongoingProjects,
        totalAssets: allAssets.length,
        assignedAssets: allAssets.filter(a => a.status === 'assigned' || a.status === 'in-use' || (a as any).assignedToEmployeeId).length,
        resourceUtilizationPercentage
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get Audit Logs
  // Audit Logs
  
  app.get('/api/notifications', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      
      const results = await db.select()
        .from(notifications)
        .where(
          and(
            eq(notifications.organizationId, orgId),
            eq(notifications.userId, req.dbUser.id)
          )
        )
        .orderBy(desc(notifications.createdAt))
        .limit(10);
        
      res.json(results);
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/notifications/read', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      
      await db.update(notifications)
        .set({ isRead: 1 })
        .where(
          and(
            eq(notifications.organizationId, orgId),
            eq(notifications.userId, req.dbUser.id)
          )
        );
      res.json({ success: true });
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

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
  
  app.put('/api/assets/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      
      const assetId = parseInt(req.params.id);
      
      const { name, assetTag, type, assignedToEmployeeId, assignedToSiteId, status, purchasePrice, purchaseDate, salvageValue, usefulLifeYears, depreciationMethod, maintenanceIntervalDays, lastMaintenanceDate, make, model, licensePlate, year, vin, warrantyExpiry, photoUrl } = req.body;
      
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
      
      res.json(updatedAsset);
    } catch(e: any) { res.status(500).json({ error: e.message }); }
  });


  
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
      const { serviceDate, technicianNotes, status, downtimeDays } = req.body;
      
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
        details: `Logged maintenance (${status}) on ${serviceDate}`
      });

      res.json(newLog);
    } catch(e: any) { res.status(500).json({ error: e.message }); }
  });

  
  app.post('/api/assets/:id/print', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const assetId = parseInt(req.params.id);
      
      await db.insert(auditLogs).values({
        organizationId: orgId,
        userId: req.dbUser!.id,
        action: 'PRINT_LABEL',
        entity: 'ASSET',
        entityId: String(assetId),
        details: 'Printed asset label'
      });
      res.json({ success: true });
    } catch(e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/assets/bulk-transfer', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const { assetIds, siteId } = req.body;
      
      if (!assetIds || !siteId) return res.status(400).json({ error: 'Missing data' });
      
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
    } catch(e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/reports/assets', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      
      // Calculate downtime and service frequency over last 12 months
      const logs = await db.select().from(assetMaintenance).where(eq(assetMaintenance.organizationId, orgId));
      
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      const recentLogs = logs.filter(l => new Date(l.serviceDate) >= oneYearAgo);
      
      const report: Record<number, { downtime: number, count: number }> = {};
      recentLogs.forEach(l => {
        if (!report[l.assetId]) report[l.assetId] = { downtime: 0, count: 0 };
        report[l.assetId].count += 1;
        if (l.downtimeDays) report[l.assetId].downtime += l.downtimeDays;
      });
      
      const allAssets = await db.select().from(assets).where(eq(assets.organizationId, orgId));
      
      const result = allAssets.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        assetTag: a.assetTag,
        downtime: report[a.id]?.downtime || 0,
        serviceCount: report[a.id]?.count || 0
      })).filter(a => a.serviceCount > 0 || a.downtime > 0);
      
      res.json(result);
    } catch(e: any) { res.status(500).json({ error: e.message }); }
  });

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

  // Asset Allocations for Gantt Timeline
  app.get('/api/asset-allocations', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });

      const { assetId, projectId, siteId, status, employeeId } = req.query;
      const conditions: any[] = [eq(assetAllocations.organizationId, orgId)];
      if (assetId) conditions.push(eq(assetAllocations.assetId, parseInt(assetId as string)));
      if (projectId) conditions.push(eq(assetAllocations.projectId, parseInt(projectId as string)));
      if (siteId) conditions.push(eq(assetAllocations.siteId, parseInt(siteId as string)));
      if (employeeId) conditions.push(eq(assetAllocations.employeeId, parseInt(employeeId as string)));
      if (status && status !== 'all') conditions.push(eq(assetAllocations.status, status as string));

      const results = await db.select({
        id: assetAllocations.id,
        assetId: assetAllocations.assetId,
        projectId: assetAllocations.projectId,
        siteId: assetAllocations.siteId,
        employeeId: assetAllocations.employeeId,
        startDate: assetAllocations.startDate,
        endDate: assetAllocations.endDate,
        status: assetAllocations.status,
        notes: assetAllocations.notes,
        createdAt: assetAllocations.createdAt,
        asset: {
          id: assets.id,
          name: assets.name,
          assetTag: assets.assetTag,
          type: assets.type,
          status: assets.status,
          photoUrl: assets.photoUrl,
          make: assets.make,
          model: assets.model,
        },
        project: {
          id: projects.id,
          name: projects.name,
          code: projects.code,
          client: projects.client,
        },
        site: {
          id: sites.id,
          name: sites.name,
          location: sites.location,
          cityRegion: sites.cityRegion,
        },
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          employeeId: employees.employeeId,
        }
      })
      .from(assetAllocations)
      .innerJoin(assets, eq(assetAllocations.assetId, assets.id))
      .leftJoin(projects, eq(assetAllocations.projectId, projects.id))
      .leftJoin(sites, eq(assetAllocations.siteId, sites.id))
      .leftJoin(employees, eq(assetAllocations.employeeId, employees.id))
      .where(and(...conditions))
      .orderBy(desc(assetAllocations.startDate));

      res.json(results);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/asset-allocations', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });

      const { assetId, projectId, siteId, employeeId, startDate, endDate, status, notes } = req.body;
      if (!assetId || !startDate) {
        return res.status(400).json({ error: 'Asset and Start Date are required' });
      }

      const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
      const formattedEndDate = endDate ? new Date(endDate).toISOString().split('T')[0] : null;

      const [newRec] = await db.insert(assetAllocations).values({
        organizationId: orgId,
        assetId: parseInt(assetId),
        projectId: projectId ? parseInt(projectId) : null,
        siteId: siteId ? parseInt(siteId) : null,
        employeeId: employeeId ? parseInt(employeeId) : null,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        status: status || 'active',
        notes: notes || null,
      }).returning();

      if ((status || 'active') === 'active') {
        await db.update(assets).set({
          assignedToSiteId: siteId ? parseInt(siteId) : null,
          assignedToEmployeeId: employeeId ? parseInt(employeeId) : null,
          status: 'assigned',
        }).where(and(eq(assets.id, parseInt(assetId)), eq(assets.organizationId, orgId)));
      }

      await db.insert(auditLogs).values({
        organizationId: orgId,
        userId: req.dbUser!.id,
        action: 'ALLOCATE_ASSET',
        entity: 'ASSET',
        entityId: String(assetId),
        details: JSON.stringify({ allocationId: newRec.id, projectId, siteId, startDate, endDate })
      });

      res.status(201).json(newRec);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/asset-allocations/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const id = parseInt(req.params.id);

      const { assetId, projectId, siteId, employeeId, startDate, endDate, status, notes } = req.body;
      const updatePayload: any = {};
      if (assetId) updatePayload.assetId = parseInt(assetId);
      if (projectId !== undefined) updatePayload.projectId = projectId ? parseInt(projectId) : null;
      if (siteId !== undefined) updatePayload.siteId = siteId ? parseInt(siteId) : null;
      if (employeeId !== undefined) updatePayload.employeeId = employeeId ? parseInt(employeeId) : null;
      if (startDate) updatePayload.startDate = new Date(startDate).toISOString().split('T')[0];
      if (endDate !== undefined) updatePayload.endDate = endDate ? new Date(endDate).toISOString().split('T')[0] : null;
      if (status) updatePayload.status = status;
      if (notes !== undefined) updatePayload.notes = notes;

      const [updated] = await db.update(assetAllocations)
        .set(updatePayload)
        .where(and(eq(assetAllocations.id, id), eq(assetAllocations.organizationId, orgId)))
        .returning();

      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/asset-allocations/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const id = parseInt(req.params.id);

      await db.delete(assetAllocations)
        .where(and(eq(assetAllocations.id, id), eq(assetAllocations.organizationId, orgId)));

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Predictive Maintenance Intelligence
  app.get('/api/assets/predictive-maintenance', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });

      const [allAssets, allMaintenance, allAllocations, allSites, allProjects] = await Promise.all([
        db.select().from(assets).where(eq(assets.organizationId, orgId)),
        db.select().from(assetMaintenance).where(eq(assetMaintenance.organizationId, orgId)).orderBy(desc(assetMaintenance.serviceDate)),
        db.select().from(assetAllocations).where(and(eq(assetAllocations.organizationId, orgId), eq(assetAllocations.status, 'active'))),
        db.select().from(sites).where(eq(sites.organizationId, orgId)),
        db.select().from(projects).where(eq(projects.organizationId, orgId)),
      ]);

      const siteMap = new Map(allSites.map(s => [s.id, s.name]));
      const projectMap = new Map(allProjects.map(p => [p.id, p.name]));

      const maintByAsset = new Map<number, typeof allMaintenance>();
      for (const m of allMaintenance) {
        if (!maintByAsset.has(m.assetId)) maintByAsset.set(m.assetId, []);
        maintByAsset.get(m.assetId)!.push(m);
      }

      const allocByAsset = new Map<number, (typeof allAllocations)[0]>();
      for (const a of allAllocations) {
        allocByAsset.set(a.assetId, a);
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const items = allAssets.map(asset => {
        const logs = maintByAsset.get(asset.id) || [];
        const activeAlloc = allocByAsset.get(asset.id);

        let calculatedIntervalDays = asset.maintenanceIntervalDays || 60;
        let totalDowntimeDays = 0;
        
        for (const log of logs) {
          if (log.downtimeDays) totalDowntimeDays += log.downtimeDays;
        }

        if (logs.length >= 2) {
          let totalSpanDays = 0;
          for (let i = 0; i < logs.length - 1; i++) {
            const d1 = new Date(logs[i].serviceDate).getTime();
            const d2 = new Date(logs[i + 1].serviceDate).getTime();
            totalSpanDays += Math.abs(d1 - d2) / (1000 * 60 * 60 * 24);
          }
          const empiricalAvg = Math.round(totalSpanDays / (logs.length - 1));
          if (empiricalAvg > 10 && empiricalAvg < 365) {
            calculatedIntervalDays = Math.round((calculatedIntervalDays * 0.4) + (empiricalAvg * 0.6));
          }
        }

        let wearMultiplier = 1.0;
        if (activeAlloc) wearMultiplier += 0.15;
        if (totalDowntimeDays > 3) wearMultiplier += 0.15;
        if (asset.type === 'Tools' || asset.type === 'Heavy Machinery') wearMultiplier += 0.10;

        const effectiveIntervalDays = Math.max(14, Math.round(calculatedIntervalDays / wearMultiplier));

        let lastServiceDate: Date;
        if (asset.lastMaintenanceDate) {
          lastServiceDate = new Date(asset.lastMaintenanceDate);
        } else if (logs.length > 0 && logs[0].serviceDate) {
          lastServiceDate = new Date(logs[0].serviceDate);
        } else if (asset.purchaseDate) {
          lastServiceDate = new Date(asset.purchaseDate);
        } else {
          lastServiceDate = new Date(asset.createdAt);
        }

        const diffTime = today.getTime() - lastServiceDate.getTime();
        const daysSinceLastMaint = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

        const daysRemaining = effectiveIntervalDays - daysSinceLastMaint;
        const wearPercentage = Math.min(100, Math.max(0, Math.round((daysSinceLastMaint / effectiveIntervalDays) * 100)));

        const projectedNextDate = new Date(lastServiceDate);
        projectedNextDate.setDate(projectedNextDate.getDate() + effectiveIntervalDays);

        let severity: 'critical' | 'warning' | 'upcoming' | 'optimal';
        let riskScore: number;

        if (daysRemaining <= 0 || wearPercentage >= 100 || asset.status === 'maintenance') {
          severity = 'critical';
          riskScore = Math.min(100, 85 + Math.abs(daysRemaining) * 2);
        } else if (daysRemaining <= 7 || wearPercentage >= 85) {
          severity = 'critical';
          riskScore = 80 + Math.round((7 - daysRemaining) * 2);
        } else if (daysRemaining <= 15 || wearPercentage >= 70) {
          severity = 'warning';
          riskScore = 55 + Math.round((15 - daysRemaining) * 2);
        } else if (daysRemaining <= 30) {
          severity = 'upcoming';
          riskScore = 30 + Math.round(30 - daysRemaining);
        } else {
          severity = 'optimal';
          riskScore = Math.max(5, 25 - Math.round(daysRemaining / 4));
        }

        let recommendation = '';
        if (severity === 'critical') {
          if (daysRemaining <= 0) {
            recommendation = `Servicing is overdue by ${Math.abs(daysRemaining)} days (${wearPercentage}% duty cycle elapsed). Equipment is operating past safe threshold; schedule overhaul immediately to prevent unexpected breakdown.`;
          } else {
            recommendation = `Impending service requirement in ${daysRemaining} days. Historical maintenance interval is ${effectiveIntervalDays} days with ${totalDowntimeDays} recorded downtime days. Perform pre-emptive service before schedule window closes.`;
          }
        } else if (severity === 'warning') {
          recommendation = `Duty cycle is at ${wearPercentage}%. Equipment has operated ${daysSinceLastMaint} days since last inspection (${effectiveIntervalDays} days target cycle). Recommend ordering replacement parts and scheduling downtime within ${daysRemaining} days.`;
        } else if (severity === 'upcoming') {
          recommendation = `Equipment operating normally (${daysRemaining} days remaining in cycle). Routine service recommended around ${projectedNextDate.toISOString().split('T')[0]}.`;
        } else {
          recommendation = `Equipment within optimal health window (${daysRemaining} days to next target service). Wear metrics low.`;
        }

        const deploymentInfo = activeAlloc ? {
          projectName: activeAlloc.projectId ? projectMap.get(activeAlloc.projectId) || 'Project' : null,
          siteName: activeAlloc.siteId ? siteMap.get(activeAlloc.siteId) || 'Site' : null,
        } : (asset.assignedToSiteId ? {
          siteName: siteMap.get(asset.assignedToSiteId) || 'Site',
          projectName: null,
        } : null);

        return {
          assetId: asset.id,
          name: asset.name,
          assetTag: asset.assetTag,
          type: asset.type,
          status: asset.status,
          photoUrl: asset.photoUrl,
          make: asset.make,
          model: asset.model,
          lastMaintenanceDate: lastServiceDate.toISOString().split('T')[0],
          daysSinceLastMaintenance: daysSinceLastMaint,
          maintenanceIntervalDays: asset.maintenanceIntervalDays || 60,
          effectiveIntervalDays,
          projectedNextServiceDate: projectedNextDate.toISOString().split('T')[0],
          daysRemaining,
          wearPercentage,
          riskScore,
          severity,
          recommendation,
          serviceHistoryCount: logs.length,
          totalDowntimeDays,
          deployment: deploymentInfo,
        };
      });

      items.sort((a, b) => b.riskScore - a.riskScore);

      const criticalCount = items.filter(i => i.severity === 'critical').length;
      const warningCount = items.filter(i => i.severity === 'warning').length;
      const upcomingCount = items.filter(i => i.severity === 'upcoming').length;
      const optimalCount = items.filter(i => i.severity === 'optimal').length;

      const avgHealthScore = Math.max(0, Math.round(100 - (items.reduce((s, i) => s + i.riskScore, 0) / (items.length || 1))));

      res.json({
        summary: {
          totalAssets: items.length,
          criticalCount,
          warningCount,
          upcomingCount,
          optimalCount,
          fleetHealthScore: avgHealthScore,
          serviceAlertsTotal: criticalCount + warningCount,
        },
        items,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Sync Predictive Notifications to Notifications table
  app.post('/api/assets/predictive-maintenance/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });

      const [allAssets, allMaintenance] = await Promise.all([
        db.select().from(assets).where(eq(assets.organizationId, orgId)),
        db.select().from(assetMaintenance).where(eq(assetMaintenance.organizationId, orgId)).orderBy(desc(assetMaintenance.serviceDate)),
      ]);

      const maintByAsset = new Map<number, typeof allMaintenance>();
      for (const m of allMaintenance) {
        if (!maintByAsset.has(m.assetId)) maintByAsset.set(m.assetId, []);
        maintByAsset.get(m.assetId)!.push(m);
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingNotifications = await db.select().from(notifications).where(
        and(
          eq(notifications.organizationId, orgId),
          eq(notifications.userId, req.dbUser!.id),
          sql`${notifications.createdAt} >= NOW() - INTERVAL '3 days'`
        )
      );
      const existingTitles = new Set(existingNotifications.map(n => n.title));
      const generatedNotifications: any[] = [];

      for (const asset of allAssets) {
        const logs = maintByAsset.get(asset.id) || [];
        const interval = asset.maintenanceIntervalDays || 60;
        let lastDate = asset.lastMaintenanceDate ? new Date(asset.lastMaintenanceDate) : (logs[0]?.serviceDate ? new Date(logs[0].serviceDate) : new Date(asset.createdAt));
        const daysSince = Math.max(0, Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)));
        const daysRemaining = interval - daysSince;

        if (daysRemaining <= 7 || asset.status === 'maintenance') {
          const title = `Predictive Alert: ${asset.name} (${asset.assetTag})`;
          if (!existingTitles.has(title)) {
            const message = daysRemaining <= 0
              ? `${asset.name} has exceeded its recommended maintenance interval by ${Math.abs(daysRemaining)} days. Urgent service required.`
              : `Predicted servicing required in ${daysRemaining} days based on historical usage cycles and downtime records.`;

            const [newNotif] = await db.insert(notifications).values({
              organizationId: orgId,
              userId: req.dbUser!.id,
              title,
              message,
              isRead: 0,
            }).returning();
            generatedNotifications.push(newNotif);
          }
        }
      }

      res.json({ success: true, count: generatedNotifications.length, notifications: generatedNotifications });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Schedule service from predictive alert
  app.post('/api/assets/:id/schedule-service', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const assetId = parseInt(req.params.id);
      const { serviceDate, notes } = req.body;

      const targetDate = serviceDate || new Date().toISOString().split('T')[0];

      const [newLog] = await db.insert(assetMaintenance).values({
        organizationId: orgId,
        assetId,
        serviceDate: targetDate,
        technicianNotes: notes || 'Scheduled via Predictive Maintenance recommendation',
        status: 'scheduled',
        performedByUserId: req.dbUser!.id,
      }).returning();

      await db.update(assets).set({
        status: 'maintenance'
      }).where(and(eq(assets.id, assetId), eq(assets.organizationId, orgId)));

      await db.insert(auditLogs).values({
        organizationId: orgId,
        userId: req.dbUser!.id,
        action: 'SCHEDULE_MAINTENANCE',
        entity: 'ASSET',
        entityId: String(assetId),
        details: `Scheduled predictive maintenance for ${targetDate}`
      });

      res.json({ success: true, maintenance: newLog });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });


  app.get('/api/employees/:id/assets', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const empId = parseInt(req.params.id);
      
      const results = await db.select().from(assets).where(and(eq(assets.organizationId, orgId), eq(assets.assignedToEmployeeId, empId)));
      res.json(results);
    } catch(e: any) { res.status(500).json({ error: e.message }); }
  });

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

  // Vehicle Assignments
  app.get('/api/vehicle-assignments', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const { employeeId, vehicleId, status } = req.query;

      const conditions: any[] = [eq(vehicleAssignments.organizationId, orgId)];
      if (employeeId) conditions.push(eq(vehicleAssignments.employeeId, parseInt(employeeId as string)));
      if (vehicleId) conditions.push(eq(vehicleAssignments.vehicleId, parseInt(vehicleId as string)));
      if (status && status !== 'all') conditions.push(eq(vehicleAssignments.status, status as string));

      const results = await db.select({
        id: vehicleAssignments.id,
        vehicleId: vehicleAssignments.vehicleId,
        employeeId: vehicleAssignments.employeeId,
        siteId: vehicleAssignments.siteId,
        projectId: vehicleAssignments.projectId,
        startDate: vehicleAssignments.startDate,
        endDate: vehicleAssignments.endDate,
        status: vehicleAssignments.status,
        createdAt: vehicleAssignments.createdAt,
        vehicle: {
          id: vehicles.id,
          make: vehicles.make,
          model: vehicles.model,
          licensePlate: vehicles.licensePlate,
          year: vehicles.year,
          vin: vehicles.vin,
          type: vehicles.type,
          status: vehicles.status,
        },
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          employeeId: employees.employeeId,
          jobTitle: employees.jobTitle,
          mobile: employees.mobile,
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
      .from(vehicleAssignments)
      .innerJoin(vehicles, eq(vehicleAssignments.vehicleId, vehicles.id))
      .leftJoin(employees, eq(vehicleAssignments.employeeId, employees.id))
      .leftJoin(sites, eq(vehicleAssignments.siteId, sites.id))
      .leftJoin(projects, eq(vehicleAssignments.projectId, projects.id))
      .where(and(...conditions))
      .orderBy(desc(vehicleAssignments.startDate));

      res.json(results);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/vehicle-assignments', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const { vehicleId, employeeId, siteId, projectId, startDate, endDate, status } = req.body;

      if (!vehicleId || !employeeId) {
        return res.status(400).json({ error: 'Vehicle and Employee are required' });
      }

      const formattedStartDate = startDate ? new Date(startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      const formattedEndDate = endDate ? new Date(endDate).toISOString().split('T')[0] : null;

      const [newRec] = await db.insert(vehicleAssignments).values({
        organizationId: orgId,
        vehicleId: parseInt(vehicleId),
        employeeId: parseInt(employeeId),
        siteId: siteId ? parseInt(siteId) : null,
        projectId: projectId ? parseInt(projectId) : null,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        status: status || 'active',
      }).returning();

      // Mark vehicle as assigned
      await db.update(vehicles).set({ status: 'Assigned' }).where(and(eq(vehicles.id, parseInt(vehicleId)), eq(vehicles.organizationId, orgId)));

      res.status(201).json(newRec);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.put('/api/vehicle-assignments/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const id = parseInt(req.params.id);
      const { status, endDate } = req.body;

      const [updated] = await db.update(vehicleAssignments)
        .set({
          status: status || 'completed',
          endDate: endDate ? new Date(endDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        })
        .where(and(eq(vehicleAssignments.id, id), eq(vehicleAssignments.organizationId, orgId)))
        .returning();

      if (updated && (status === 'completed' || status === 'returned')) {
        await db.update(vehicles).set({ status: 'Available' }).where(and(eq(vehicles.id, updated.vehicleId), eq(vehicles.organizationId, orgId)));
      }

      res.json(updated);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Accommodations & Room Inventory (Unified Module Backend)
  app.get('/api/accommodations', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      
      const accList = await db.select({
        id: accommodations.id,
        organizationId: accommodations.organizationId,
        name: accommodations.name,
        type: accommodations.type,
        location: accommodations.location,
        address: accommodations.address,
        gpsCoordinates: accommodations.gpsCoordinates,
        latitude: accommodations.latitude,
        longitude: accommodations.longitude,
        totalRooms: accommodations.totalRooms,
        roomCapacity: accommodations.roomCapacity,
        perRoomCapacity: accommodations.perRoomCapacity,
        roomTypes: accommodations.roomTypes,
        totalAdmitCapacity: accommodations.totalAdmitCapacity,
        nearSiteId: accommodations.nearSiteId,
        nearProjectId: accommodations.nearProjectId,
        amenities: accommodations.amenities,
        contactNumber: accommodations.contactNumber,
        status: accommodations.status,
        createdAt: accommodations.createdAt,
        nearSiteName: sites.name,
        nearProjectName: projects.name,
      })
      .from(accommodations)
      .leftJoin(sites, eq(accommodations.nearSiteId, sites.id))
      .leftJoin(projects, eq(accommodations.nearProjectId, projects.id))
      .where(eq(accommodations.organizationId, orgId))
      .orderBy(accommodations.id);

      // Compute live stats for each accommodation: room count, active occupants, capacity
      const allRooms = await db.select().from(rooms).where(eq(rooms.organizationId, orgId));
      const activeAssignments = await db.select({
        id: roomAssignments.id,
        roomId: roomAssignments.roomId,
      }).from(roomAssignments).where(and(eq(roomAssignments.organizationId, orgId), eq(roomAssignments.status, 'active')));

      const roomOccupancyMap: Record<number, number> = {};
      for (const a of activeAssignments) {
        roomOccupancyMap[a.roomId] = (roomOccupancyMap[a.roomId] || 0) + 1;
      }

      const results = accList.map(acc => {
        const accRooms = allRooms.filter(r => r.accommodationId === acc.id);
        const roomsCount = accRooms.length > 0 ? accRooms.length : (acc.totalRooms || 0);
        
        let calculatedCapacity = 0;
        let occupiedBeds = 0;
        
        if (accRooms.length > 0) {
          calculatedCapacity = accRooms.reduce((sum, r) => sum + (r.capacity || 0), 0);
          occupiedBeds = accRooms.reduce((sum, r) => sum + (roomOccupancyMap[r.id] || 0), 0);
        } else {
          calculatedCapacity = acc.totalAdmitCapacity || ((acc.roomCapacity || 0) * (acc.perRoomCapacity || 1));
        }

        const effectiveTotalCapacity = Math.max(acc.totalAdmitCapacity || 0, calculatedCapacity);
        const availableBeds = Math.max(0, effectiveTotalCapacity - occupiedBeds);

        return {
          ...acc,
          roomsCount,
          totalCapacity: effectiveTotalCapacity,
          occupiedBeds,
          availableBeds,
        };
      });

      res.json(results);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/accommodations', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      
      const payload: any = {
        organizationId: orgId,
        name: req.body.name,
        type: req.body.type || 'Staff Compound',
        location: req.body.location || null,
        address: req.body.address || null,
        gpsCoordinates: req.body.gpsCoordinates || null,
        latitude: req.body.latitude ? String(req.body.latitude) : null,
        longitude: req.body.longitude ? String(req.body.longitude) : null,
        totalRooms: req.body.totalRooms ? parseInt(req.body.totalRooms) : null,
        roomCapacity: req.body.roomCapacity ? parseInt(req.body.roomCapacity) : null,
        perRoomCapacity: req.body.perRoomCapacity ? parseInt(req.body.perRoomCapacity) : null,
        roomTypes: req.body.roomTypes || null,
        totalAdmitCapacity: req.body.totalAdmitCapacity ? parseInt(req.body.totalAdmitCapacity) : 0,
        nearSiteId: req.body.nearSiteId ? parseInt(req.body.nearSiteId) : null,
        nearProjectId: req.body.nearProjectId ? parseInt(req.body.nearProjectId) : null,
        amenities: req.body.amenities || null,
        contactNumber: req.body.contactNumber || null,
        status: req.body.status || 'active',
      };

      // Auto-compute totalAdmitCapacity if not explicitly provided
      if (!payload.totalAdmitCapacity && payload.roomCapacity && payload.perRoomCapacity) {
        payload.totalAdmitCapacity = payload.roomCapacity * payload.perRoomCapacity;
      }

      const [newRec] = await db.insert(accommodations).values(payload).returning();

      // If initial rooms were requested, optionally create default rooms
      if (req.body.autoCreateRooms && payload.roomCapacity && payload.roomCapacity > 0) {
        const bedsPerRoom = payload.perRoomCapacity || 2;
        const roomsToCreate = Math.min(payload.roomCapacity, 30); // reasonable initial batch
        for (let i = 1; i <= roomsToCreate; i++) {
          await db.insert(rooms).values({
            organizationId: orgId,
            accommodationId: newRec.id,
            building: 'Block A',
            floor: String(Math.floor((i - 1) / 10) + 1),
            roomNumber: `${100 + i}`,
            roomType: payload.roomTypes?.split(',')[0]?.trim() || 'Standard',
            capacity: bedsPerRoom,
            status: 'available',
          }).catch(console.error);
        }
      }

      // Audit Log
      await db.insert(auditLogs).values({
        organizationId: orgId,
        userId: req.dbUser!.id,
        action: 'CREATE',
        entity: 'ACCOMMODATION',
        entityId: String(newRec.id),
        details: JSON.stringify({ name: newRec.name, location: newRec.location, type: newRec.type })
      }).catch(console.error);

      res.status(201).json(newRec);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.put('/api/accommodations/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const id = parseInt(req.params.id);

      const payload: any = { ...req.body };
      delete payload.id;
      delete payload.organizationId;
      delete payload.createdAt;
      delete payload.roomsCount;
      delete payload.totalCapacity;
      delete payload.occupiedBeds;
      delete payload.availableBeds;
      delete payload.nearSiteName;
      delete payload.nearProjectName;

      if (payload.totalRooms) payload.totalRooms = parseInt(payload.totalRooms);
      if (payload.roomCapacity) payload.roomCapacity = parseInt(payload.roomCapacity);
      if (payload.perRoomCapacity) payload.perRoomCapacity = parseInt(payload.perRoomCapacity);
      if (payload.totalAdmitCapacity) payload.totalAdmitCapacity = parseInt(payload.totalAdmitCapacity);
      if (payload.nearSiteId) payload.nearSiteId = parseInt(payload.nearSiteId) || null;
      if (payload.nearProjectId) payload.nearProjectId = parseInt(payload.nearProjectId) || null;
      if (payload.latitude) payload.latitude = String(payload.latitude);
      if (payload.longitude) payload.longitude = String(payload.longitude);

      const [updated] = await db.update(accommodations)
        .set(payload)
        .where(and(eq(accommodations.id, id), eq(accommodations.organizationId, orgId)))
        .returning();

      res.json(updated);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/accommodations/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const id = parseInt(req.params.id);

      await db.delete(accommodations)
        .where(and(eq(accommodations.id, id), eq(accommodations.organizationId, orgId)));
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Rooms
  app.get('/api/rooms', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      
      const { accommodationId } = req.query;
      const conditions = [eq(rooms.organizationId, orgId)];
      if (accommodationId) {
        conditions.push(eq(rooms.accommodationId, parseInt(String(accommodationId))));
      }

      const results = await db.select({
        id: rooms.id,
        accommodationId: rooms.accommodationId,
        roomNumber: rooms.roomNumber,
        roomType: rooms.roomType,
        capacity: rooms.capacity,
        status: rooms.status,
        building: rooms.building,
        floor: rooms.floor,
        createdAt: rooms.createdAt,
        accommodation: {
          id: accommodations.id,
          name: accommodations.name,
          location: accommodations.location,
          type: accommodations.type,
        }
      })
      .from(rooms)
      .leftJoin(accommodations, eq(rooms.accommodationId, accommodations.id))
      .where(and(...conditions))
      .orderBy(rooms.building, rooms.roomNumber);

      // Get occupant counts per room
      const activeAssignments = await db.select({
        roomId: roomAssignments.roomId,
      }).from(roomAssignments).where(and(eq(roomAssignments.organizationId, orgId), eq(roomAssignments.status, 'active')));

      const occupancyCount: Record<number, number> = {};
      for (const a of activeAssignments) {
        occupancyCount[a.roomId] = (occupancyCount[a.roomId] || 0) + 1;
      }

      const enriched = results.map(r => ({
        ...r,
        occupiedBeds: occupancyCount[r.id] || 0,
        availableBeds: Math.max(0, (r.capacity || 0) - (occupancyCount[r.id] || 0)),
      }));

      res.json(enriched);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/rooms', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const { accommodationId, roomNumber, capacity, building, floor, roomType, status } = req.body;
      const [newRec] = await db.insert(rooms).values({
        organizationId: orgId,
        accommodationId: parseInt(accommodationId),
        roomNumber: String(roomNumber),
        capacity: parseInt(capacity) || 1,
        building: building || null,
        floor: floor || null,
        roomType: roomType || 'Standard',
        status: status || 'available',
      }).returning();
      res.status(201).json(newRec);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.put('/api/rooms/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const id = parseInt(req.params.id);
      const payload: any = { ...req.body };
      delete payload.id;
      delete payload.organizationId;
      delete payload.occupiedBeds;
      delete payload.availableBeds;
      delete payload.accommodation;

      if (payload.capacity) payload.capacity = parseInt(payload.capacity);
      if (payload.accommodationId) payload.accommodationId = parseInt(payload.accommodationId);

      const [updated] = await db.update(rooms)
        .set(payload)
        .where(and(eq(rooms.id, id), eq(rooms.organizationId, orgId)))
        .returning();
      res.json(updated);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/rooms/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const id = parseInt(req.params.id);
      await db.delete(rooms).where(and(eq(rooms.id, id), eq(rooms.organizationId, orgId)));
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Room Admissions / Assignments (Employees admitted to accommodation near sites/projects)
  app.get('/api/room-assignments', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });

      const { employeeId, roomId, status } = req.query;
      const conditions: any[] = [eq(roomAssignments.organizationId, orgId)];
      if (employeeId) conditions.push(eq(roomAssignments.employeeId, parseInt(employeeId as string)));
      if (roomId) conditions.push(eq(roomAssignments.roomId, parseInt(roomId as string)));
      if (status && status !== 'all') conditions.push(eq(roomAssignments.status, status as string));

      const results = await db.select({
        id: roomAssignments.id,
        roomId: roomAssignments.roomId,
        employeeId: roomAssignments.employeeId,
        startDate: roomAssignments.startDate,
        endDate: roomAssignments.endDate,
        status: roomAssignments.status,
        notes: roomAssignments.notes,
        createdAt: roomAssignments.createdAt,
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          employeeId: employees.employeeId,
          jobTitle: employees.jobTitle,
          department: employees.department,
          profilePhotoUrl: employees.profilePhotoUrl,
        },
        room: {
          id: rooms.id,
          roomNumber: rooms.roomNumber,
          building: rooms.building,
          floor: rooms.floor,
          roomType: rooms.roomType,
          capacity: rooms.capacity,
        },
        accommodation: {
          id: accommodations.id,
          name: accommodations.name,
          location: accommodations.location,
          type: accommodations.type,
          address: accommodations.address,
        }
      })
      .from(roomAssignments)
      .leftJoin(employees, eq(roomAssignments.employeeId, employees.id))
      .leftJoin(rooms, eq(roomAssignments.roomId, rooms.id))
      .leftJoin(accommodations, eq(rooms.accommodationId, accommodations.id))
      .where(and(...conditions))
      .orderBy(desc(roomAssignments.createdAt));

      // Also attach current site/project deployment for each employee
      const empAssignments = await db.select({
        employeeId: employeeAssignments.employeeId,
        siteId: employeeAssignments.siteId,
        projectId: employeeAssignments.projectId,
        siteName: sites.name,
        projectName: projects.name,
      })
      .from(employeeAssignments)
      .leftJoin(sites, eq(employeeAssignments.siteId, sites.id))
      .leftJoin(projects, eq(employeeAssignments.projectId, projects.id))
      .where(and(eq(employeeAssignments.organizationId, orgId), eq(employeeAssignments.status, 'active')));

      const empDeployMap: Record<number, { siteName?: string; projectName?: string }> = {};
      for (const ea of empAssignments) {
        empDeployMap[ea.employeeId] = {
          siteName: ea.siteName || undefined,
          projectName: ea.projectName || undefined,
        };
      }

      const enriched = results.map(ra => ({
        ...ra,
        workLocation: empDeployMap[ra.employeeId] || {},
      }));

      res.json(enriched);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/room-assignments', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const { employeeId, roomId, startDate, endDate, notes, status } = req.body;

      if (!employeeId || !roomId) {
        return res.status(400).json({ error: 'Employee and Room are required' });
      }

      // Check current occupancy in the room
      const existingInRoom = await db.select({ count: sql<number>`count(*)` })
        .from(roomAssignments)
        .where(and(eq(roomAssignments.roomId, parseInt(roomId)), eq(roomAssignments.organizationId, orgId), eq(roomAssignments.status, 'active')));
      
      const [roomData] = await db.select().from(rooms).where(and(eq(rooms.id, parseInt(roomId)), eq(rooms.organizationId, orgId)));
      
      const currentCount = Number(existingInRoom[0]?.count || 0);
      if (roomData && currentCount >= roomData.capacity) {
        return res.status(400).json({ error: `Room ${roomData.roomNumber} has reached maximum capacity (${roomData.capacity} beds).` });
      }

      const [newRec] = await db.insert(roomAssignments).values({
        organizationId: orgId,
        employeeId: parseInt(employeeId),
        roomId: parseInt(roomId),
        startDate: startDate ? new Date(startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        endDate: endDate ? new Date(endDate).toISOString().split('T')[0] : null,
        status: status || 'active',
        notes: notes || null,
      }).returning();

      // If room is now full, update room status
      if (roomData && (currentCount + 1) >= roomData.capacity) {
        await db.update(rooms).set({ status: 'occupied' }).where(eq(rooms.id, parseInt(roomId)));
      }

      // Audit Log
      await db.insert(auditLogs).values({
        organizationId: orgId,
        userId: req.dbUser!.id,
        action: 'CREATE',
        entity: 'ROOM_ASSIGNMENT',
        entityId: String(newRec.id),
        details: JSON.stringify({ employeeId, roomId, startDate })
      }).catch(console.error);

      res.status(201).json(newRec);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.put('/api/room-assignments/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const id = parseInt(req.params.id);

      const payload: any = { ...req.body };
      delete payload.id;
      delete payload.organizationId;
      delete payload.employee;
      delete payload.room;
      delete payload.accommodation;
      delete payload.workLocation;

      if (payload.startDate) payload.startDate = new Date(payload.startDate).toISOString().split('T')[0];
      if (payload.endDate) payload.endDate = new Date(payload.endDate).toISOString().split('T')[0];

      const [updated] = await db.update(roomAssignments)
        .set(payload)
        .where(and(eq(roomAssignments.id, id), eq(roomAssignments.organizationId, orgId)))
        .returning();

      // If checked out or completed, re-evaluate room status
      if (updated && updated.status !== 'active') {
        const remainingInRoom = await db.select({ count: sql<number>`count(*)` })
          .from(roomAssignments)
          .where(and(eq(roomAssignments.roomId, updated.roomId), eq(roomAssignments.organizationId, orgId), eq(roomAssignments.status, 'active')));
        const activeCount = Number(remainingInRoom[0]?.count || 0);
        const [rm] = await db.select().from(rooms).where(eq(rooms.id, updated.roomId));
        if (rm && activeCount < rm.capacity) {
          await db.update(rooms).set({ status: 'available' }).where(eq(rooms.id, updated.roomId));
        }
      }

      res.json(updated);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/room-assignments/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const id = parseInt(req.params.id);
      
      const [existing] = await db.select().from(roomAssignments).where(and(eq(roomAssignments.id, id), eq(roomAssignments.organizationId, orgId)));
      await db.delete(roomAssignments).where(and(eq(roomAssignments.id, id), eq(roomAssignments.organizationId, orgId)));
      
      if (existing) {
        await db.update(rooms).set({ status: 'available' }).where(eq(rooms.id, existing.roomId));
      }

      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });


  app.all(['/api', '/api/*'], (req, res) => {
    res.status(404).json({ error: 'API endpoint not found: ' + (req.originalUrl || req.url) });
  });

  app.use((err: any, req: any, res: any, next: any) => {
    if (res.headersSent) {
      return next(err);
    }
    const isApi = (req.originalUrl && req.originalUrl.startsWith('/api')) || 
                  (req.path && req.path.startsWith('/api')) || 
                  (req.url && req.url.startsWith('/api'));
    if (isApi) {
      return res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
    }
    next(err);
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
