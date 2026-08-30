import fs from 'fs';
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

code = code.replace(
  "fetch('/api/employee-documents', { headers: { Authorization: \\`Bearer \\${token}\\` } })\n        ]);",
  "fetch('/api/employee-documents', { headers: { Authorization: \\`Bearer \\${token}\\` } }),\n          fetch('/api/audit-logs?limit=5', { headers: { Authorization: \\`Bearer \\${token}\\` } })\n        ]);"
);

// Fallback if formatting was different
if (!code.includes("fetch('/api/audit-logs?limit=5'")) {
  code = code.replace(
    "fetch('/api/employee-documents', { headers: { Authorization: `Bearer ${token}` } })",
    "fetch('/api/employee-documents', { headers: { Authorization: `Bearer ${token}` } }),\n          fetch('/api/audit-logs?limit=5', { headers: { Authorization: `Bearer ${token}` } })"
  );
}

fs.writeFileSync('src/components/Dashboard.tsx', code);
