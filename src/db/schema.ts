import { pgTable, serial, text, timestamp, integer, date } from 'drizzle-orm/pg-core';

// --- PHASE 1 ---

export const rolePermissions = pgTable('role_permissions', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  role: text('role').notNull(),
  permissions: text('permissions').notNull(), // JSON string of permissions
});

export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase UID
  email: text('email').notNull().unique(),
  name: text('name'),
  role: text('role').default('employee').notNull(), // saas_super_admin, org_admin, it_manager, hr_admin, coordinator, site_supervisor, employee
  organizationId: integer('organization_id').references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- PHASE 2 ---
export const employees = pgTable('employees', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  employeeId: text('employee_id').notNull(), // Company's internal ID
  nationality: text('nationality'),
  gender: text('gender'),
  dateOfBirth: date('date_of_birth'),
  nationalId: text('national_id'), // National ID / Passport number
  profilePhotoUrl: text('profile_photo_url'),
  joiningDate: date('joining_date'),
  jobTitle: text('job_title'),
  department: text('department'),
  position: text('position'),
  employmentType: text('employment_type'),
  supervisorId: integer('supervisor_id'), // Self-referencing FK technically, integer for now
  coordinatorId: integer('coordinator_id'), // References users or employees
  mobile: text('mobile'),
  email: text('email'),
  emergencyContact: text('emergency_contact'),
  status: text('status').default('active').notNull(), // active, inactive, leave, transferred, terminated, suspended
  approvalStatus: text('approval_status').default('pending').notNull(), // pending, approved, rejected
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const employeeDocuments = pgTable('employee_documents', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  employeeId: integer('employee_id').references(() => employees.id).notNull(),
  documentType: text('document_type').notNull(), // ID, Passport, Certificate, etc.
  documentUrl: text('document_url').notNull(), // Path in storage
  issueDate: date('issue_date'),
  expiryDate: date('expiry_date'),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sites = pgTable('sites', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  code: text('code').notNull().default(''),
  name: text('name').notNull(),
  description: text('description'),
  address: text('address'),
  cityRegion: text('city_region'),
  gpsCoordinates: text('gps_coordinates'),
  latitude: text('latitude'),
  longitude: text('longitude'),
  location: text('location'),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  code: text('code').notNull().default(''),
  name: text('name').notNull(),
  client: text('client'),
  description: text('description'),
  location: text('location'),
  address: text('address'),
  gpsCoordinates: text('gps_coordinates'),
  latitude: text('latitude'),
  longitude: text('longitude'),
  startDate: date('start_date'),
  endDate: date('end_date'),
  managerId: integer('manager_id'), // References employee or user
  status: text('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const projectSites = pgTable('project_sites', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  projectId: integer('project_id').references(() => projects.id).notNull(),
  siteId: integer('site_id').references(() => sites.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const siteCoordinators = pgTable('site_coordinators', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  siteId: integer('site_id').references(() => sites.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- PHASE 3 ---
export const employeeAssignments = pgTable('employee_assignments', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  employeeId: integer('employee_id').references(() => employees.id).notNull(),
  siteId: integer('site_id').references(() => sites.id),
  projectId: integer('project_id').references(() => projects.id),
  role: text('role'),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- PHASE 4 ---
export const timesheets = pgTable('timesheets', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  employeeId: integer('employee_id').references(() => employees.id).notNull(),
  projectId: integer('project_id').references(() => projects.id),
  siteId: integer('site_id').references(() => sites.id),
  date: date('date').notNull(),
  attendanceStatus: text('attendance_status').notNull().default('Present'), // Present, Absent, Leave, Off
  checkIn: text('check_in'),
  checkOut: text('check_out'),
  hoursWorked: integer('hours_worked').notNull().default(0),
  overtimeHours: integer('overtime_hours').default(0),
  notes: text('notes'),
  attachmentUrl: text('attachment_url'),
  status: text('status').default('draft').notNull(), // draft, submitted, approved, rejected
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const leaves = pgTable('leaves', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  requesterId: integer('requester_id').references(() => employees.id),
  employeeId: integer('employee_id').references(() => employees.id).notNull(),
  siteId: integer('site_id').references(() => sites.id),
  projectId: integer('project_id').references(() => projects.id),
  leaveType: text('leave_type').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  reason: text('reason'),
  status: text('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- PHASE 4: Operations (Vehicles, Accommodation) ---
export const vehicles = pgTable('vehicles', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  licensePlate: text('license_plate').notNull(),
  make: text('make').notNull(),
  model: text('model').notNull(),
  year: integer('year'),
  vin: text('vin'),
  type: text('type'),
  currentMileage: integer('current_mileage'),
  insuranceExpiry: date('insurance_expiry'),
  registrationExpiry: date('registration_expiry'),
  inspectionExpiry: date('inspection_expiry'),
  status: text('status').default('Available').notNull(), // Available, Assigned, Maintenance, Out of Service, Sold
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const vehicleAssignments = pgTable('vehicle_assignments', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  vehicleId: integer('vehicle_id').references(() => vehicles.id).notNull(),
  employeeId: integer('employee_id').references(() => employees.id).notNull(),
  siteId: integer('site_id').references(() => sites.id),
  projectId: integer('project_id').references(() => projects.id),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const accommodations = pgTable('accommodations', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  name: text('name').notNull(),
  type: text('type').default('Staff Compound').notNull(), // Staff Compound, Apartment Complex, Villa / House, Modular Camp, Hotel / Guesthouse, Dormitory
  location: text('location'), // Specific neighborhood/area where created
  address: text('address'),
  gpsCoordinates: text('gps_coordinates'),
  latitude: text('latitude'),
  longitude: text('longitude'),
  totalRooms: integer('total_rooms'),
  roomCapacity: integer('room_capacity'), // General rooms capacity
  perRoomCapacity: integer('per_room_capacity'), // Avg beds per room
  roomTypes: text('room_types'), // Single, Double, Quad, Dormitory
  totalAdmitCapacity: integer('total_admit_capacity').default(0).notNull(), // Max beds/personnel
  nearSiteId: integer('near_site_id').references(() => sites.id),
  nearProjectId: integer('near_project_id').references(() => projects.id),
  amenities: text('amenities'), // WiFi, AC, Mess Hall, Laundry, Security
  contactNumber: text('contact_number'),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const rooms = pgTable('rooms', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  accommodationId: integer('accommodation_id').references(() => accommodations.id).notNull(),
  building: text('building'),
  floor: text('floor'),
  roomNumber: text('room_number').notNull(),
  roomType: text('room_type').default('Standard'),
  capacity: integer('capacity').notNull(),
  status: text('status').default('available').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const roomAssignments = pgTable('room_assignments', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  roomId: integer('room_id').references(() => rooms.id).notNull(),
  employeeId: integer('employee_id').references(() => employees.id).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  status: text('status').default('active').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const roomInventory = pgTable('room_inventory', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  roomId: integer('room_id').references(() => rooms.id).notNull(),
  itemName: text('item_name').notNull(),
  quantity: integer('quantity').notNull(),
  condition: text('condition').default('good').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- PHASE 5 ---
export const assets = pgTable('assets', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  name: text('name').notNull(),
  assetTag: text('asset_tag').notNull(),
  type: text('type').notNull(), // Laptop, Vehicle, Tools, etc.
  assignedToEmployeeId: integer('assigned_to_employee_id').references(() => employees.id),
  assignedToSiteId: integer('assigned_to_site_id').references(() => sites.id),
  make: text("make"),
  model: text("model"),
  licensePlate: text("license_plate"),
  year: integer("year"),
  vin: text("vin"),
warrantyExpiry: date("warranty_expiry"),
  insuranceExpiry: date("insurance_expiry"),
  registrationExpiry: date("registration_expiry"),
  inspectionExpiry: date("inspection_expiry"),
  status: text('status').default('available').notNull(), // available, assigned, maintenance, retired
  purchasePrice: integer('purchase_price'),
  purchaseDate: date('purchase_date'),
  salvageValue: integer('salvage_value'),
  usefulLifeYears: integer('useful_life_years'),
  depreciationMethod: text('depreciation_method'), // 'straight_line', 'double_declining'
  maintenanceIntervalDays: integer('maintenance_interval_days'),
  lastMaintenanceDate: date('last_maintenance_date'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});


export const assetMaintenance = pgTable('asset_maintenance', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  assetId: integer('asset_id').references(() => assets.id).notNull(),
  serviceDate: date('service_date').notNull(),
  technicianNotes: text('technician_notes').notNull(),
  status: text("status").notNull(),
  downtimeDays: integer("downtime_days"), // 'completed', 'scheduled', 'in_progress'
  performedByUserId: integer('performed_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const assetAllocations = pgTable('asset_allocations', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  assetId: integer('asset_id').references(() => assets.id).notNull(),
  projectId: integer('project_id').references(() => projects.id),
  siteId: integer('site_id').references(() => sites.id),
  employeeId: integer('employee_id').references(() => employees.id),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  status: text('status').default('active').notNull(), // 'active', 'scheduled', 'completed', 'maintenance'
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- PHASE 6 ---
export const trainingCourses = pgTable('training_courses', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  provider: text('provider'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const employeeTrainings = pgTable('employee_trainings', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  employeeId: integer('employee_id').references(() => employees.id).notNull(),
  courseId: integer('course_id').references(() => trainingCourses.id).notNull(),
  completionDate: date('completion_date'),
  expiryDate: date('expiry_date'),
  status: text('status').default('enrolled').notNull(), // enrolled, completed, failed, expired
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  isRead: integer('is_read').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- PHASE 5: Management (Reports, Audit Logs) ---

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  action: text('action').notNull(), // 'CREATE', 'UPDATE', 'DELETE', 'EXPORT'
  entity: text('entity').notNull(), // 'EMPLOYEE', 'TIMESHEET', etc.
  entityId: text('entity_id'), // Use text in case of string IDs, though mostly int
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});





export const editRequests = pgTable('edit_requests', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(), // User who requested
  entity: text('entity').notNull(), // EMPLOYEE, DOCUMENT, TIMESHEET
  entityId: integer('entity_id').notNull(),
  requestedChanges: text('requested_changes').notNull(), // JSON string of proposed changes
  reason: text('reason').notNull(),
  status: text('status').default('pending').notNull(), // pending, approved, rejected
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
