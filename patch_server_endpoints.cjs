const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newEndpoints = `
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
`;

if (!code.includes('/api/vehicles')) {
  code = code.replace("  // Vite middleware for development", newEndpoints + "\n  // Vite middleware for development");
}

fs.writeFileSync('server.ts', code);
