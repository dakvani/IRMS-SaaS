import fs from 'fs';
let code = fs.readFileSync('src/components/Timesheets.tsx', 'utf-8');
code = code.replace(
  /const dateStr = .*\n.*\n.*\n.*\n *dailyRecords.push\({/g,
  `const dateStr = \\\`\\\${selectedMonth}-\\\${day.toString().padStart(2, '0')}\\\`;
            // Basic valid day check
            const dateObj = new Date(dateStr);
            if (!isNaN(dateObj.getTime())) {
               dailyRecords.push({`
);
code = code.replace(
  /date: dateObj.toISOString\(\)/g,
  "date: dateStr"
);
fs.writeFileSync('src/components/Timesheets.tsx', code);
