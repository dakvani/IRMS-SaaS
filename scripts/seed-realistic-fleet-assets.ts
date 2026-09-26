import { db } from '../src/db/index.js';
import { assets, assetMaintenance, assetAllocations, vehicles, vehicleAssignments, employees, sites, projects, organizations } from '../src/db/schema.js';
import { eq, or, and } from 'drizzle-orm';

async function seedFleetAndAssets() {
  console.log('Seeding realistic vehicles, pickups, heavy equipment, custody & maintenance history...');

  const orgs = await db.select().from(organizations);
  for (const org of orgs) {
    const orgId = org.id;
    console.log(`Processing Org ${orgId}: ${org.name}`);

    const orgEmployees = await db.select().from(employees).where(eq(employees.organizationId, orgId));
    if (orgEmployees.length === 0) continue;

    const orgSites = await db.select().from(sites).where(eq(sites.organizationId, orgId));
    const orgProjects = await db.select().from(projects).where(eq(projects.organizationId, orgId));

    const site1Id = orgSites[0]?.id || null;
    const site2Id = orgSites[1]?.id || site1Id;
    const proj1Id = orgProjects[0]?.id || null;
    const proj2Id = orgProjects[1]?.id || proj1Id;

    const emp1 = orgEmployees[0];
    const emp2 = orgEmployees[1] || emp1;
    const emp3 = orgEmployees[2] || emp1;
    const emp4 = orgEmployees[3] || emp2;
    const emp5 = orgEmployees[4] || emp3;

    // Remove old faker vehicles and generic assets for this org if they have weird names like Tuna, Chips, Mouse
    const weirdAssets = await db.select().from(assets).where(
      and(
        eq(assets.organizationId, orgId),
        or(
          eq(assets.name, 'Modern Silk Tuna'),
          eq(assets.name, 'Fantastic Steel Chips'),
          eq(assets.name, 'Generic Aluminum Table'),
          eq(assets.name, 'Unbranded Plastic Pizza'),
          eq(assets.name, 'Gorgeous Silk Pants'),
          eq(assets.name, 'Incredible Bronze Mouse'),
          eq(assets.name, 'Fantastic Rubber Shirt'),
          eq(assets.name, 'Fresh Ceramic Car')
        )
      )
    );
    for (const wa of weirdAssets) {
      await db.delete(assetMaintenance).where(eq(assetMaintenance.assetId, wa.id));
      await db.delete(assetAllocations).where(eq(assetAllocations.assetId, wa.id));
      await db.delete(assets).where(eq(assets.id, wa.id));
    }

    // Realistic Vehicles List
    const fleetVehicles = [
      {
        name: 'Toyota Hilux Double Cab 4x4 Service Pickup',
        assetTag: 'AST-VH-101',
        type: 'Vehicle',
        make: 'Toyota',
        model: 'Hilux Double Cab 4x4 2.8L Diesel',
        licensePlate: '4812 BXD',
        year: 2024,
        vin: 'AHTBA3CD409182371',
        status: 'assigned',
        purchasePrice: 138000,
        purchaseDate: '2024-03-15',
        salvageValue: 45000,
        usefulLifeYears: 7,
        maintenanceIntervalDays: 60,
        lastMaintenanceDate: '2026-08-15',
        assignedToEmployeeId: emp2.id,
        assignedToSiteId: site1Id,
        photoUrl: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=600&auto=format&fit=crop&q=80',
        custodyHistory: [
          {
            empId: emp2.id,
            startDate: '2026-06-01',
            endDate: null,
            status: 'active',
            notes: 'Current Primary Custody: Senior Site Engineering & Emergency Response Unit (Neom Sector B)',
          },
          {
            empId: emp3.id,
            startDate: '2026-01-15',
            endDate: '2026-05-30',
            status: 'completed',
            notes: 'Past Custody: Coastal Works Field Supervision - Handed over with 14,200 km, clean condition',
          },
          {
            empId: emp4.id,
            startDate: '2025-08-10',
            endDate: '2025-12-28',
            status: 'completed',
            notes: 'Initial Deployment: Tabuk Pioneer Base Logistics - Service check performed upon return (8,500 km)',
          }
        ],
        maintenanceLogs: [
          {
            serviceDate: '2026-08-15',
            technicianNotes: '25,000 km Scheduled Overhaul: Engine synthetic oil & OEM filter, brake pads inspection, fuel filter flush (Abdul Latif Jameel Authorized Workshop)',
            downtimeDays: 0,
            status: 'completed'
          },
          {
            serviceDate: '2026-04-20',
            technicianNotes: 'Air conditioning system compressor tune-up, cabin pollen filter change, and tire rotation & balancing (Petromin Express Jeddah)',
            downtimeDays: 1,
            status: 'completed'
          },
          {
            serviceDate: '2026-01-05',
            technicianNotes: '10,000 km Periodic Safety Audit & Moroor Roadworthiness Registration Inspection (Passed with A rating)',
            downtimeDays: 0,
            status: 'completed'
          }
        ]
      },
      {
        name: 'Isuzu D-Max 3.0L Turbo Diesel Crew Pickup',
        assetTag: 'AST-VH-103',
        type: 'Vehicle',
        make: 'Isuzu',
        model: 'D-Max LS 3.0L 4WD Crew Cab',
        licensePlate: '3920 LKD',
        year: 2023,
        vin: 'MP1TFR85JNT819203',
        status: 'assigned',
        purchasePrice: 115000,
        purchaseDate: '2023-11-10',
        salvageValue: 35000,
        usefulLifeYears: 6,
        maintenanceIntervalDays: 45,
        lastMaintenanceDate: '2026-09-02',
        assignedToEmployeeId: emp4.id,
        assignedToSiteId: site2Id,
        photoUrl: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600&auto=format&fit=crop&q=80',
        custodyHistory: [
          {
            empId: emp4.id,
            startDate: '2026-04-01',
            endDate: null,
            status: 'active',
            notes: 'Current Custodian: Fleet Maintenance & Mobile Tool Dispatch Unit',
          },
          {
            empId: emp5.id,
            startDate: '2025-10-01',
            endDate: '2026-03-25',
            status: 'completed',
            notes: 'Field Operations & Tool Transport - Returned for scheduled 30,000 km overhaul',
          }
        ],
        maintenanceLogs: [
          {
            serviceDate: '2026-09-02',
            technicianNotes: '35,000 km Regular Maintenance: Heavy-duty diesel motor oil, fuel-water separator replacement, suspension greasing (Al-Babtain Service Center)',
            downtimeDays: 1,
            status: 'completed'
          },
          {
            serviceDate: '2026-05-18',
            technicianNotes: 'Rear shock absorbers replacement and high-pressure hose check (Downtime 2 days)',
            downtimeDays: 2,
            status: 'completed'
          }
        ]
      },
      {
        name: 'Toyota Land Cruiser GXR V6 Field Command SUV',
        assetTag: 'AST-VH-102',
        type: 'Vehicle',
        make: 'Toyota',
        model: 'Land Cruiser GXR 3.5L Twin Turbo V6',
        licensePlate: '7731 RHA',
        year: 2024,
        vin: 'JTMHY01J704829104',
        status: 'assigned',
        purchasePrice: 320000,
        purchaseDate: '2024-01-20',
        salvageValue: 120000,
        usefulLifeYears: 8,
        maintenanceIntervalDays: 90,
        lastMaintenanceDate: '2026-07-28',
        assignedToEmployeeId: emp1.id,
        assignedToSiteId: site1Id,
        photoUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&auto=format&fit=crop&q=80',
        custodyHistory: [
          {
            empId: emp1.id,
            startDate: '2026-01-01',
            endDate: null,
            status: 'active',
            notes: 'Executive Management & Client VIP Site Inspection Vehicle',
          }
        ],
        maintenanceLogs: [
          {
            serviceDate: '2026-07-28',
            technicianNotes: '20,000 km Premier Service: Synthetic fluids change, all-wheel electronic differential diagnostic, tire alignment (Abdul Latif Jameel VIP Center)',
            downtimeDays: 0,
            status: 'completed'
          }
        ]
      },
      {
        name: 'Hyundai H-1 12-Seater Staff Transit Van',
        assetTag: 'AST-VH-104',
        type: 'Vehicle',
        make: 'Hyundai',
        model: 'H-1 Commuter 2.5 CRDi 12 Passenger',
        licensePlate: '9182 JED',
        year: 2023,
        vin: 'KMJWB37KBP1928471',
        status: 'assigned',
        purchasePrice: 145000,
        purchaseDate: '2023-09-10',
        salvageValue: 40000,
        usefulLifeYears: 6,
        maintenanceIntervalDays: 45,
        lastMaintenanceDate: '2026-08-30',
        assignedToEmployeeId: emp5.id,
        assignedToSiteId: site1Id,
        photoUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
        custodyHistory: [
          {
            empId: emp5.id,
            startDate: '2026-02-15',
            endDate: null,
            status: 'active',
            notes: 'Camp to Project Site Daily Personnel Transit Route (Neom Coastal & Tabuk Camp)',
          }
        ],
        maintenanceLogs: [
          {
            serviceDate: '2026-08-30',
            technicianNotes: 'Dual AC climate control recharging, brake pads renewed, new front Michelin tires (Al-Wallan Hyundai)',
            downtimeDays: 1,
            status: 'completed'
          }
        ]
      },
      {
        name: 'Ford F-150 SuperCab Heavy Duty Utility Pickup',
        assetTag: 'AST-VH-105',
        type: 'Vehicle',
        make: 'Ford',
        model: 'F-150 XLT 5.0L V8 SuperCab',
        licensePlate: '5204 KSA',
        year: 2023,
        vin: '1FTFX1E59PKD19823',
        status: 'assigned',
        purchasePrice: 175000,
        purchaseDate: '2023-12-05',
        salvageValue: 55000,
        usefulLifeYears: 7,
        maintenanceIntervalDays: 60,
        lastMaintenanceDate: '2026-08-01',
        assignedToEmployeeId: emp3.id,
        assignedToSiteId: site2Id,
        photoUrl: 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?w=600&auto=format&fit=crop&q=80',
        custodyHistory: [
          {
            empId: emp3.id,
            startDate: '2026-03-01',
            endDate: null,
            status: 'active',
            notes: 'Electrical Grid Installation & Transformer Hauling Support',
          }
        ],
        maintenanceLogs: [
          {
            serviceDate: '2026-08-01',
            technicianNotes: 'Heavy payload suspension audit, transmission oil replacement, battery check (Al-Jazirah Ford)',
            downtimeDays: 0,
            status: 'completed'
          }
        ]
      }
    ];

    // Realistic Heavy Machinery & Equipment List
    const industrialEquipment = [
      {
        name: 'CAT 500 kVA Sound-Attenuated Diesel Generator',
        assetTag: 'AST-EQ-201',
        type: 'Heavy Machinery',
        make: 'Caterpillar',
        model: 'C15 500kVA Standby Power Plant',
        licensePlate: null,
        year: 2023,
        vin: 'CAT00C15Z0981726',
        status: 'maintenance',
        purchasePrice: 285000,
        purchaseDate: '2023-06-15',
        salvageValue: 90000,
        usefulLifeYears: 10,
        maintenanceIntervalDays: 30,
        lastMaintenanceDate: '2026-08-20',
        assignedToEmployeeId: emp4.id,
        assignedToSiteId: site1Id,
        photoUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
        custodyHistory: [
          {
            empId: emp4.id,
            startDate: '2026-01-10',
            endDate: null,
            status: 'active',
            notes: 'Dedicated Base Power Generation: Neom Main Operations Hub',
          }
        ],
        maintenanceLogs: [
          {
            serviceDate: '2026-08-20',
            technicianNotes: 'Preventative 500-hour service: Fuel injectors calibration, radiator coolant flushing, alternator load bank testing (Zahid Tractor / CAT Dealer)',
            downtimeDays: 1,
            status: 'completed'
          },
          {
            serviceDate: '2026-09-24',
            technicianNotes: 'Scheduled Governor Controller Inspection in progress (Preventative)',
            downtimeDays: 0,
            status: 'in_progress'
          }
        ]
      },
      {
        name: 'Komatsu PC210-10M0 Hydraulic Excavator',
        assetTag: 'AST-EQ-202',
        type: 'Heavy Machinery',
        make: 'Komatsu',
        model: 'PC210-10M0 Heavy Duty Excavator',
        licensePlate: null,
        year: 2023,
        vin: 'KMTPC210A8912739',
        status: 'assigned',
        purchasePrice: 620000,
        purchaseDate: '2023-04-10',
        salvageValue: 200000,
        usefulLifeYears: 12,
        maintenanceIntervalDays: 45,
        lastMaintenanceDate: '2026-08-10',
        assignedToEmployeeId: emp2.id,
        assignedToSiteId: site1Id,
        photoUrl: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=600&auto=format&fit=crop&q=80',
        custodyHistory: [
          {
            empId: emp2.id,
            startDate: '2026-03-01',
            endDate: null,
            status: 'active',
            notes: 'Site Earthmoving & Trench Excavation - Neom Phase 2 Infrastructure',
          }
        ],
        maintenanceLogs: [
          {
            serviceDate: '2026-08-10',
            technicianNotes: '1,000-hour comprehensive hydraulic fluid & filter change, track tensioning, boom pin greasing (Abdul Latif Jameel Heavy Machinery)',
            downtimeDays: 1,
            status: 'completed'
          }
        ]
      },
      {
        name: 'Bobcat S570 Skid Steer Loader',
        assetTag: 'AST-EQ-203',
        type: 'Heavy Machinery',
        make: 'Bobcat',
        model: 'S570 T4 Vertical Lift Path Loader',
        licensePlate: null,
        year: 2024,
        vin: 'B570A918274619',
        status: 'available',
        purchasePrice: 195000,
        purchaseDate: '2024-02-18',
        salvageValue: 60000,
        usefulLifeYears: 8,
        maintenanceIntervalDays: 60,
        lastMaintenanceDate: '2026-07-15',
        assignedToEmployeeId: null,
        assignedToSiteId: site1Id,
        photoUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=600&auto=format&fit=crop&q=80',
        custodyHistory: [
          {
            empId: emp3.id,
            startDate: '2026-03-01',
            endDate: '2026-07-10',
            status: 'completed',
            notes: 'Material handling & concrete pouring support - Returned in clean operational order',
          }
        ],
        maintenanceLogs: [
          {
            serviceDate: '2026-07-15',
            technicianNotes: 'Routine 250-hr hydraulic check and quick-tach mechanism lubrication (Kanoo Machinery)',
            downtimeDays: 0,
            status: 'completed'
          }
        ]
      },
      {
        name: 'Atlas Copco XAS 188 Portable Air Compressor',
        assetTag: 'AST-EQ-204',
        type: 'Tools',
        make: 'Atlas Copco',
        model: 'XAS 188 Pace 400 CFM Heavy Duty',
        licensePlate: null,
        year: 2023,
        vin: 'ACXAS188-918237',
        status: 'assigned',
        purchasePrice: 120000,
        purchaseDate: '2023-08-12',
        salvageValue: 35000,
        usefulLifeYears: 8,
        maintenanceIntervalDays: 45,
        lastMaintenanceDate: '2026-08-05',
        assignedToEmployeeId: emp3.id,
        assignedToSiteId: site2Id,
        photoUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=600&auto=format&fit=crop&q=80',
        custodyHistory: [
          {
            empId: emp3.id,
            startDate: '2026-04-15',
            endDate: null,
            status: 'active',
            notes: 'Pneumatic Tools & Sandblasting Operations Support',
          }
        ],
        maintenanceLogs: [
          {
            serviceDate: '2026-08-05',
            technicianNotes: 'Compressor oil separator replacement and air filter dust cartridge cleanout (Atlas Copco KSA)',
            downtimeDays: 0,
            status: 'completed'
          }
        ]
      },
      {
        name: 'Trimble S7 Robotic Total Station Surveying Kit',
        assetTag: 'AST-EQ-205',
        type: 'Equipment',
        make: 'Trimble',
        model: 'S7 1" Robotic Total Station + TSC7 Controller',
        licensePlate: null,
        year: 2024,
        vin: 'TRMS7-9182048',
        status: 'assigned',
        purchasePrice: 95000,
        purchaseDate: '2024-04-01',
        salvageValue: 30000,
        usefulLifeYears: 5,
        maintenanceIntervalDays: 90,
        lastMaintenanceDate: '2026-07-20',
        assignedToEmployeeId: emp1.id,
        assignedToSiteId: site1Id,
        photoUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop&q=80',
        custodyHistory: [
          {
            empId: emp1.id,
            startDate: '2026-04-10',
            endDate: null,
            status: 'active',
            notes: 'Primary Topographical & Boundary Surveying - Red Sea & Neom Axis',
          }
        ],
        maintenanceLogs: [
          {
            serviceDate: '2026-07-20',
            technicianNotes: 'Laser collimation accuracy calibration and optical EDM EDM recalibration certificate issued (Trimble Geospatial Center)',
            downtimeDays: 0,
            status: 'completed'
          }
        ]
      }
    ];

    const allItemsToSeed = [...fleetVehicles, ...industrialEquipment];

    for (const item of allItemsToSeed) {
      // Check if already exists by assetTag
      const [existing] = await db.select().from(assets).where(and(eq(assets.organizationId, orgId), eq(assets.assetTag, item.assetTag)));
      let assetId: number;

      if (existing) {
        assetId = existing.id;
        await db.update(assets).set({
          name: item.name,
          type: item.type,
          make: item.make,
          model: item.model,
          licensePlate: item.licensePlate,
          year: item.year,
          vin: item.vin,
          status: item.status,
          purchasePrice: item.purchasePrice,
          purchaseDate: item.purchaseDate,
          salvageValue: item.salvageValue,
          usefulLifeYears: item.usefulLifeYears,
          maintenanceIntervalDays: item.maintenanceIntervalDays,
          lastMaintenanceDate: item.lastMaintenanceDate,
          assignedToEmployeeId: item.assignedToEmployeeId,
          assignedToSiteId: item.assignedToSiteId,
          photoUrl: item.photoUrl,
        }).where(eq(assets.id, existing.id));
      } else {
        const [inserted] = await db.insert(assets).values({
          organizationId: orgId,
          name: item.name,
          assetTag: item.assetTag,
          type: item.type,
          make: item.make,
          model: item.model,
          licensePlate: item.licensePlate,
          year: item.year,
          vin: item.vin,
          status: item.status,
          purchasePrice: item.purchasePrice,
          purchaseDate: item.purchaseDate,
          salvageValue: item.salvageValue,
          usefulLifeYears: item.usefulLifeYears,
          maintenanceIntervalDays: item.maintenanceIntervalDays,
          lastMaintenanceDate: item.lastMaintenanceDate,
          assignedToEmployeeId: item.assignedToEmployeeId,
          assignedToSiteId: item.assignedToSiteId,
          photoUrl: item.photoUrl,
        }).returning();
        assetId = inserted.id;
      }

      // Also ensure vehicle table has a matching entry if it's a vehicle
      if (item.type === 'Vehicle' && item.licensePlate) {
        const [existingVeh] = await db.select().from(vehicles).where(and(eq(vehicles.organizationId, orgId), eq(vehicles.licensePlate, item.licensePlate)));
        let vehId: number;
        if (existingVeh) {
          vehId = existingVeh.id;
          await db.update(vehicles).set({
            make: item.make || '',
            model: item.model || '',
            year: item.year || 2024,
            vin: item.vin || '',
            type: item.name.includes('Pickup') ? 'Service Pickup' : 'SUV',
            currentMileage: 28450,
            status: item.status === 'assigned' ? 'Assigned' : 'Available',
          }).where(eq(vehicles.id, existingVeh.id));
        } else {
          const [insertedVeh] = await db.insert(vehicles).values({
            organizationId: orgId,
            licensePlate: item.licensePlate,
            make: item.make || '',
            model: item.model || '',
            year: item.year || 2024,
            vin: item.vin || '',
            type: item.name.includes('Pickup') ? 'Service Pickup' : 'SUV',
            currentMileage: 28450,
            status: item.status === 'assigned' ? 'Assigned' : 'Available',
          }).returning();
          vehId = insertedVeh.id;
        }

        // Add vehicle assignment
        if (item.assignedToEmployeeId) {
          const [existingVA] = await db.select().from(vehicleAssignments).where(
            and(
              eq(vehicleAssignments.organizationId, orgId),
              eq(vehicleAssignments.vehicleId, vehId),
              eq(vehicleAssignments.employeeId, item.assignedToEmployeeId),
              eq(vehicleAssignments.status, 'active')
            )
          );
          if (!existingVA) {
            await db.insert(vehicleAssignments).values({
              organizationId: orgId,
              vehicleId: vehId,
              employeeId: item.assignedToEmployeeId,
              siteId: item.assignedToSiteId,
              projectId: proj1Id,
              startDate: '2026-06-01',
              endDate: null,
              status: 'active',
            });
          }
        }
      }

      // Clean existing allocations and re-insert rich custody history
      await db.delete(assetAllocations).where(and(eq(assetAllocations.organizationId, orgId), eq(assetAllocations.assetId, assetId)));
      for (const ch of item.custodyHistory) {
        await db.insert(assetAllocations).values({
          organizationId: orgId,
          assetId: assetId,
          employeeId: ch.empId,
          siteId: item.assignedToSiteId,
          projectId: proj1Id,
          startDate: ch.startDate,
          endDate: ch.endDate,
          status: ch.status,
          notes: ch.notes,
        });
      }

      // Clean existing maintenance and re-insert rich maintenance history
      await db.delete(assetMaintenance).where(and(eq(assetMaintenance.organizationId, orgId), eq(assetMaintenance.assetId, assetId)));
      for (const ml of item.maintenanceLogs) {
        await db.insert(assetMaintenance).values({
          organizationId: orgId,
          assetId: assetId,
          serviceDate: ml.serviceDate,
          technicianNotes: ml.technicianNotes,
          downtimeDays: ml.downtimeDays,
          status: ml.status,
        });
      }
    }
  }

  console.log('Seeding finished successfully!');
}

seedFleetAndAssets().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
