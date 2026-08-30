const fs = require('fs');
let code = fs.readFileSync('src/server/auth.ts', 'utf8');

code = code.replace(
  "const authHeader = req.headers.authorization;",
  "const authHeader = req.headers.authorization || (req.query.auth ? `Bearer ${req.query.auth}` : undefined);"
);

fs.writeFileSync('src/server/auth.ts', code);
