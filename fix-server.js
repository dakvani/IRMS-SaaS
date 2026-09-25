import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf-8');

// Undo the destructive downtimeDays replacement
code = code.replace(/status, downtimeDays,/g, 'status,');

// Specifically fix the maintenance route
code = code.replace(
  /app\.post\('\/api\/assets\/:id\/maintenance', requireAuth, async \(req: AuthRequest, res\) => \{[\s\n]*try \{[\s\n]*const orgId = req\.dbUser\?\.organizationId;[\s\n]*if \(!orgId\) return res\.status\(403\)\.json\(\{ error: 'No org' \}\);[\s\n]*const assetId = parseInt\(req\.params\.id\);[\s\n]*const \{ serviceDate, technicianNotes, status \} = req\.body;/,
  `app.post('/api/assets/:id/maintenance', requireAuth, async (req: AuthRequest, res) => {
    try {
      const orgId = req.dbUser?.organizationId;
      if (!orgId) return res.status(403).json({ error: 'No org' });
      const assetId = parseInt(req.params.id);
      const { serviceDate, technicianNotes, status, downtimeDays } = req.body;`
);

code = code.replace(
  /technicianNotes,[\s\n]*status[\s\n]*\}\)\.returning\(\);/,
  `technicianNotes,
        status,
        downtimeDays: downtimeDays ? parseInt(downtimeDays) : null
      }).returning();`
);

// Fix make, model, licensePlate, year, vin, warrantyExpiry
code = code.replace(
  /make, model, licensePlate, year: year \? parseInt\(year\) : null, vin, warrantyExpiry: warrantyExpiry \? new Date\(warrantyExpiry\)\.toISOString\(\) : null,/g,
  ""
);

code = code.replace(
  /maintenanceIntervalDays: maintenanceIntervalDays \? parseInt\(maintenanceIntervalDays\) : null,/,
  `maintenanceIntervalDays: maintenanceIntervalDays ? parseInt(maintenanceIntervalDays) : null,
        make: req.body.make || null, 
        model: req.body.model || null, 
        licensePlate: req.body.licensePlate || null, 
        year: req.body.year ? parseInt(req.body.year) : null, 
        vin: req.body.vin || null, 
        warrantyExpiry: req.body.warrantyExpiry ? new Date(req.body.warrantyExpiry).toISOString() : null,`
);

code = code.replace(
  /lastMaintenanceDate: lastMaintenanceDate \? new Date\(lastMaintenanceDate\)\.toISOString\(\) : null,/,
  `lastMaintenanceDate: lastMaintenanceDate ? new Date(lastMaintenanceDate).toISOString() : null,
        make: req.body.make || null, 
        model: req.body.model || null, 
        licensePlate: req.body.licensePlate || null, 
        year: req.body.year ? parseInt(req.body.year) : null, 
        vin: req.body.vin || null, 
        warrantyExpiry: req.body.warrantyExpiry ? new Date(req.body.warrantyExpiry).toISOString() : null,`
);

fs.writeFileSync('server.ts', code);
