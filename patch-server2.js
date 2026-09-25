import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(
  /const \{[\s\n]*name, assetTag, type, assignedToEmployeeId, assignedToSiteId, status,[\s\n]*purchasePrice, purchaseDate, salvageValue, usefulLifeYears, depreciationMethod, maintenanceIntervalDays,[\s\n]*lastMaintenanceDate[\s\n]*\} = req\.body;/,
  "const { name, assetTag, type, assignedToEmployeeId, assignedToSiteId, status, purchasePrice, purchaseDate, salvageValue, usefulLifeYears, depreciationMethod, maintenanceIntervalDays, lastMaintenanceDate, make, model, licensePlate, year, vin, warrantyExpiry } = req.body;"
);

code = code.replace(
  /lastMaintenanceDate: lastMaintenanceDate \? new Date\(lastMaintenanceDate\)\.toISOString\(\) : null,/,
  `lastMaintenanceDate: lastMaintenanceDate ? new Date(lastMaintenanceDate).toISOString() : null,
        make, model, licensePlate, year: year ? parseInt(year) : null, vin, warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry).toISOString() : null,`
);

fs.writeFileSync('server.ts', code);
