import fs from 'fs';
let code = fs.readFileSync('src/components/Assets.tsx', 'utf-8');

const functionsToAdd = `
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
`;

code = code.replace(
  /const fetchAssets = async \(\) => \{/,
  functionsToAdd + '\n  const fetchAssets = async () => {'
);

fs.writeFileSync('src/components/Assets.tsx', code);
