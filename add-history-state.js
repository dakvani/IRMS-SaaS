import fs from 'fs';
let code = fs.readFileSync('src/components/Timesheets.tsx', 'utf-8');

// Add state
const stateStr = `
  const [batchHistory, setBatchHistory] = useState<any[]>([]);
`;
code = code.replace("const [batchDetails, setBatchDetails] = useState<any[]>([]);", "const [batchDetails, setBatchDetails] = useState<any[]>([]);\n" + stateStr);

// Fetch history
const fetchStr = `
      const res = await fetch(\`/api/timesheets?\${params.toString()}\`, {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      const histRes = await fetch(\`/api/timesheet-batches/history?month=\${batch.month}\`, {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      
      if (res.ok) {
        setBatchDetails(await res.json());
      }
      if (histRes.ok) {
        setBatchHistory(await histRes.json());
      }
`;
code = code.replace(/const res = await fetch\(`\/api\/timesheets\?\$\{params\.toString\(\)\}`, \{[\s\S]*?\}\);[\s\S]*?if \(res\.ok\) \{[\s\S]*?setBatchDetails\(await res\.json\(\)\);[\s\S]*?\}/, fetchStr.trim());

fs.writeFileSync('src/components/Timesheets.tsx', code);
