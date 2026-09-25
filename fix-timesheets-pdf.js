import fs from 'fs';
let code = fs.readFileSync('src/components/Timesheets.tsx', 'utf-8');

// Import Printer
code = code.replace(
  /import \{ (.*) \} from 'lucide-react';/,
  `import { $1, Printer } from 'lucide-react';`
);

// Add export function
const exportCode = `
  const handleExportPDF = () => {
    const originalContents = document.body.innerHTML;
    const printContent = document.getElementById('timesheets-table-container');
    if (printContent) {
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    }
  };
`;

code = code.replace(/const filteredTimesheets = /m, exportCode + '\n  const filteredTimesheets = ');

// Add Export PDF button
code = code.replace(
  /<button\s*onClick=\{fetchData\}\s*className="px-4 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-xl text-sm font-medium transition-all shadow-sm">/,
  `<button onClick={handleExportPDF} className="px-4 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-xl text-sm font-medium transition-all shadow-sm flex items-center gap-2"><Printer className="w-4 h-4" /> Export PDF</button>\n          <button onClick={fetchData} className="px-4 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-xl text-sm font-medium transition-all shadow-sm">`
);

// Add id to table container and print-area classes
code = code.replace(
  /<div className="bg-white rounded-2xl border border-neutral-200 shadow-sm flex-1 min-h-\[400px\] md:min-h-0 overflow-y-auto custom-scrollbar">/,
  `<div id="timesheets-table-container" className="bg-white rounded-2xl border border-neutral-200 shadow-sm flex-1 min-h-[400px] md:min-h-0 overflow-y-auto custom-scrollbar print-area">`
);

fs.writeFileSync('src/components/Timesheets.tsx', code);
