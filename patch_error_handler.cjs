const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const errorHandler = `
  app.use((err: any, req: any, res: any, next: any) => {
    if (req.path && req.path.startsWith('/api')) {
      res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
    } else {
      next(err);
    }
  });
`;

if (!code.includes('Internal Server Error')) {
  code = code.replace("  // Vite middleware for development", errorHandler + "\n  // Vite middleware for development");
  fs.writeFileSync('server.ts', code);
}
