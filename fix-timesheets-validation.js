import fs from 'fs';
let code = fs.readFileSync('src/components/Timesheets.tsx', 'utf-8');

// Prevent future month selection
code = code.replace(
  /const \[selectedMonth, setSelectedMonth\] = useState\(new Date\(\)\.toISOString\(\)\.slice\(0, 7\)\);/,
  `const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));\n  const maxMonth = new Date().toISOString().slice(0, 7);`
);

code = code.replace(
  /<input\s*type="month"\s*value=\{selectedMonth\}\s*onChange=\{\(e\) => setSelectedMonth\(e\.target\.value\)\}/,
  `<input type="month" value={selectedMonth} max={maxMonth} onChange={(e) => setSelectedMonth(e.target.value)}`
);

// Add basic date validation to Leaves.tsx as well for max start date
fs.writeFileSync('src/components/Timesheets.tsx', code);
