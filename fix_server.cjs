const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(`
        id: siteCoordinators.id,
        role: siteCoordinators.role,
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName
        }
      }).from(siteCoordinators).leftJoin(employees, eq(siteCoordinators.employeeId, employees.id)).where(eq(siteCoordinators.siteId, siteId));
`, `
        id: siteCoordinators.id,
        user: {
          id: users.id,
          name: users.name,
          email: users.email
        }
      }).from(siteCoordinators).leftJoin(users, eq(siteCoordinators.userId, users.id)).where(eq(siteCoordinators.siteId, siteId));
`);

code = code.replace(`
          lastName: employees.lastName,
          employeeNumber: employees.employeeNumber
        }
      }).from(employeeAssignments).leftJoin(employees, eq(employeeAssignments.employeeId, employees.id))
`, `
          lastName: employees.lastName,
          employeeId: employees.employeeId
        }
      }).from(employeeAssignments).leftJoin(employees, eq(employeeAssignments.employeeId, employees.id))
`);

fs.writeFileSync('server.ts', code);
