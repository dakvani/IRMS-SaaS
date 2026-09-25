import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf-8');

// Inject notifications logic in /api/leaves/:id/action
const leaveActionRegex = /await db\.insert\(auditLogs\)\.values\(\{([\s\S]*?)\}\);/m;
const leaveActionNotifCode = `
      await db.insert(auditLogs).values({$1});

      // Notify site coordinators
      const [leaveRec] = await db.select({ siteId: leaves.siteId, type: leaves.leaveType }).from(leaves).where(eq(leaves.id, leaveId));
      if (leaveRec && leaveRec.siteId) {
        const coordinators = await db.select({ userId: siteCoordinators.userId }).from(siteCoordinators).where(eq(siteCoordinators.siteId, leaveRec.siteId));
        for (const coord of coordinators) {
          if (coord.userId !== req.dbUser.id) { // Don't notify the person who approved it
            await db.insert(notifications).values({
              organizationId: orgId,
              userId: coord.userId,
              title: \`Leave Request \${status}\`,
              message: \`Leave request for \${leaveRec.type} was \${status} by management.\`,
            });
          }
        }
      }
`;

code = code.replace(leaveActionRegex, leaveActionNotifCode);

// Inject notifications logic in /api/timesheet-batches/approve
const timesheetActionRegex = /await db\.update\(timesheets\)[\s\S]*?\}\);/;
const timesheetActionNotifCode = `
      await db.update(timesheets)
        .set({ status: action })
        .where(
          and(
            eq(timesheets.organizationId, orgId),
            eq(timesheets.siteId, siteId ? parseInt(siteId) : null),
            eq(timesheets.projectId, projectId ? parseInt(projectId) : null),
            sql\`TO_CHAR(\${timesheets.date}, 'YYYY-MM') = \${month}\`
          )
        );
        
      if (siteId) {
        const coordinators = await db.select({ userId: siteCoordinators.userId }).from(siteCoordinators).where(eq(siteCoordinators.siteId, parseInt(siteId)));
        for (const coord of coordinators) {
          if (coord.userId !== req.dbUser.id) {
            await db.insert(notifications).values({
              organizationId: orgId,
              userId: coord.userId,
              title: \`Timesheet \${action}\`,
              message: \`Timesheet batch for \${month} was \${action} by management.\`,
            });
          }
        }
      }
`;

code = code.replace(/await db\.update\(timesheets\)[\s\S]*?sql\`TO_CHAR\(\$\{timesheets\.date\}, 'YYYY-MM'\) = \$\{month\}\`\s*\)\s*\);/, timesheetActionNotifCode);

fs.writeFileSync('server.ts', code);
