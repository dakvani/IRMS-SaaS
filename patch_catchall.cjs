const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const catchAll = `
  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found: ' + req.url });
  });
`;

if (!code.includes('API endpoint not found')) {
  code = code.replace("  // Vite middleware for development", catchAll + "\n  // Vite middleware for development");
  fs.writeFileSync('server.ts', code);
}
