import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf-8');

const regex = /const updated = await db\.update\(timesheets\)\s*\.set\(\{ status \}\)\s*\.where\(and\(\.\.\.conditions\)\)\s*\.returning\(\);/;

const replacement = `const updated = await db.update(timesheets)
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
              title: \`Timesheet \${status}\`,
              message: \`Timesheet batch for \${month} was \${status} by management.\`,
            });
          }
        }
      }`;

code = code.replace(regex, replacement);
fs.writeFileSync('server.ts', code);
