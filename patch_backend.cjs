const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace specific blocks or just append the new routes for 
// sites, projects, vehicle, accommodations, etc.
// But wait, what if some of these routes already exist? Let's check.
