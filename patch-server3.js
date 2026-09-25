import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(
  /const \{ serviceDate, technicianNotes, status \} = req\.body;/,
  "const { serviceDate, technicianNotes, status, downtimeDays } = req.body;"
);

code = code.replace(
  /status,/g,
  "status, downtimeDays,"
);

fs.writeFileSync('server.ts', code);
