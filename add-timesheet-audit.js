import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf-8');

const approveReplacement = `
      const updated = await db.update(timesheets)
        .set({ status })
        .where(and(...conditions))
        .returning();

      // Audit Log
      if (updated.length > 0) {
        await db.insert(auditLogs).values({
          organizationId: orgId,
          userId: req.dbUser!.id,
          action: status === 'approved' ? 'APPROVE' : 'REJECT',
          entity: 'TIMESHEET_BATCH',
          entityId: month,
          details: \`\${status === 'approved' ? 'Approved' : 'Rejected'} timesheet batch for \${month}\`
        });
      }

      res.json({ success: true, count: updated.length });
`;

code = code.replace(/const updated = await db\.update\(timesheets\)\s*\.set\(\{ status \}\)\s*\.where\(and\(\.\.\.conditions\)\)\s*\.returning\(\);\s*res\.json\(\{ success: true, count: updated\.length \}\);/g, approveReplacement.trim());

fs.writeFileSync('server.ts', code);
