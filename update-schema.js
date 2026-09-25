import fs from 'fs';

let code = fs.readFileSync('src/db/schema.ts', 'utf-8');

// Add new fields to assets table
const assetFields = `  status: text('status').default('available').notNull(), // available, assigned, maintenance, retired
  purchasePrice: integer('purchase_price'),
  purchaseDate: date('purchase_date'),
  salvageValue: integer('salvage_value'),
  usefulLifeYears: integer('useful_life_years'),
  depreciationMethod: text('depreciation_method'), // 'straight_line', 'double_declining'
  maintenanceIntervalDays: integer('maintenance_interval_days'),
  lastMaintenanceDate: date('last_maintenance_date'),`;

code = code.replace(/status: text\('status'\)\.default\('available'\)\.notNull\(\), \/\/ available, assigned, maintenance, retired/, assetFields);

// Add assetMaintenance table
const maintenanceTable = `
export const assetMaintenance = pgTable('asset_maintenance', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  assetId: integer('asset_id').references(() => assets.id).notNull(),
  serviceDate: date('service_date').notNull(),
  technicianNotes: text('technician_notes').notNull(),
  status: text('status').notNull(), // 'completed', 'scheduled', 'in_progress'
  performedByUserId: integer('performed_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
`;

code = code.replace(/\/\/ --- PHASE 6 ---/, maintenanceTable + '\n// --- PHASE 6 ---');

fs.writeFileSync('src/db/schema.ts', code);
