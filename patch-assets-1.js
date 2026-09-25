import fs from 'fs';
let code = fs.readFileSync('src/components/Assets.tsx', 'utf-8');

// 1. Bulk Transfer state and method
code = code.replace(
  /const \[showBulkPrint, setShowBulkPrint\] = useState\(false\);/,
  "const [showBulkPrint, setShowBulkPrint] = useState(false);\n  const [showBulkTransfer, setShowBulkTransfer] = useState(false);\n  const [bulkTransferSite, setBulkTransferSite] = useState('');\n  const [showWalkthrough, setShowWalkthrough] = useState(!localStorage.getItem('hideScanWalkthrough'));"
);

code = code.replace(
  /const fetchAssets = async \(\) => \{/,
  `
  const handleBulkTransfer = async () => {
    if (!bulkTransferSite || selectedAssets.size === 0) return;
    try {
      const token = (window as any)._token;
      const res = await fetch('/api/assets/bulk-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
        body: JSON.stringify({ assetIds: Array.from(selectedAssets), siteId: bulkTransferSite })
      });
      if (res.ok) {
        setShowBulkTransfer(false);
        setSelectedAssets(new Set());
        fetchAssets();
      }
    } catch(e) { console.error(e); }
  };
  
  const handlePrintLabel = async (assetId: number) => {
    try {
      const token = (window as any)._token;
      await fetch(\`/api/assets/\${assetId}/print\`, { method: 'POST', headers: { Authorization: \`Bearer \${token}\` } });
    } catch(e) { console.error(e); }
  };

  const fetchAssets = async () => {`
);

// 2. Add Bulk Transfer button to header
code = code.replace(
  /<button onClick=\{\(\) => setShowBulkPrint\(true\)\} className="text-xs bg-white border border-neutral-200 text-neutral-700 px-3 py-1.5 rounded-lg hover:bg-neutral-50 shadow-sm font-medium flex items-center gap-1.5"><Printer className="w-3.5 h-3.5" \/> Bulk Print<\/button>/,
  `<button onClick={() => setShowBulkPrint(true)} className="text-xs bg-white border border-neutral-200 text-neutral-700 px-3 py-1.5 rounded-lg hover:bg-neutral-50 shadow-sm font-medium flex items-center gap-1.5"><Printer className="w-3.5 h-3.5" /> Bulk Print</button>
   <button onClick={() => setShowBulkTransfer(true)} className="text-xs bg-white border border-neutral-200 text-neutral-700 px-3 py-1.5 rounded-lg hover:bg-neutral-50 shadow-sm font-medium flex items-center gap-1.5"><ArrowRightLeft className="w-3.5 h-3.5" /> Bulk Transfer</button>`
);

// 3. Update the print buttons to call handlePrintLabel
code = code.replace(
  /const orig = document\.body\.innerHTML;/g,
  `const orig = document.body.innerHTML; if (printAsset) handlePrintLabel(printAsset.id); else selectedAssets.forEach(id => handlePrintLabel(id));`
);

fs.writeFileSync('src/components/Assets.tsx', code);
