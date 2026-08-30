import fs from 'fs';
let code = fs.readFileSync('src/components/Timesheets.tsx', 'utf-8');

// The issue is I have literal backslashes before backticks and dollar signs.
// Because node parsed \\\` as \` in the resulting string, but inside a JS template literal,
// it should just be regular backticks.
code = code.replace(/\\`([^`]+)\\`/g, '`$1`'); // this fixes \`Bearer ${token}\`
code = code.replace(/\\\${/g, '${'); // this fixes \${token}
fs.writeFileSync('src/components/Timesheets.tsx', code);
