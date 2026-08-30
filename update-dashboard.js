import fs from 'fs';
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

// I need to add state for auditLogs
code = code.replace(
  "const [expiringDocs, setExpiringDocs] = useState<any[]>([]);",
  "const [expiringDocs, setExpiringDocs] = useState<any[]>([]);\n  const [recentLogs, setRecentLogs] = useState<any[]>([]);"
);

// Add the fetch
code = code.replace(
  "fetch('/api/employee-documents', { headers: { Authorization: \\`Bearer ${token}\\` } })",
  "fetch('/api/employee-documents', { headers: { Authorization: \\`Bearer ${token}\\` } }),\n          fetch('/api/audit-logs?limit=5', { headers: { Authorization: \\`Bearer ${token}\\` } })"
);

// Update destructuring
code = code.replace(
  "const [statsRes, docsRes] = await Promise.all([",
  "const [statsRes, docsRes, logsRes] = await Promise.all(["
);

// Add state setting
code = code.replace(
  "setExpiringDocs(expiring);\n        }",
  "setExpiringDocs(expiring);\n        }\n        if (logsRes && logsRes.ok) {\n          const logs = await logsRes.json();\n          setRecentLogs(logs.slice(0, 5));\n        }"
);

fs.writeFileSync('src/components/Dashboard.tsx', code);
