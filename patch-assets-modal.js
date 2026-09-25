import fs from 'fs';
let code = fs.readFileSync('src/components/Assets.tsx', 'utf-8');

// Bulk Transfer Modal
const bulkTransferModal = `
      <AnimatePresence>
        {showBulkTransfer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
                <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2"><ArrowRightLeft className="w-5 h-5" /> Bulk Transfer ({selectedAssets.size})</h3>
                <button onClick={() => setShowBulkTransfer(false)} className="text-neutral-400 hover:text-neutral-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 bg-neutral-50">
                <p className="text-sm text-neutral-600 mb-4">Select a destination site to transfer {selectedAssets.size} assets.</p>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Destination Site</label>
                <select className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20" value={bulkTransferSite} onChange={e => setBulkTransferSite(e.target.value)}>
                  <option value="">-- Select Site --</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="px-6 py-4 border-t border-neutral-100 bg-white flex justify-end gap-3">
                <button onClick={() => setShowBulkTransfer(false)} className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg text-sm font-medium">Cancel</button>
                <button onClick={handleBulkTransfer} disabled={!bulkTransferSite} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium shadow-sm hover:bg-indigo-700 disabled:opacity-50">Transfer Assets</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
`;

code = code.replace(/\{showBulkPrint && \(/, bulkTransferModal + '\n        {showBulkPrint && (');

// Print History panel for Smart Label Design
// We need to fetch print history when printAsset changes. It can just filter assetHistory, but wait, printAsset is set without fetching history. We need to fetch history if not already fetched. Actually we can just fetch it when opening the print modal.
// Wait, I can just use a useEffect to fetch history if printAsset is set.
code = code.replace(
  /const \[printAsset, setPrintAsset\] = useState<any \| null>\(null\);/,
  `const [printAsset, setPrintAsset] = useState<any | null>(null);
  const [printHistory, setPrintHistory] = useState<any[]>([]);
  useEffect(() => {
    if (printAsset) {
      const token = (window as any)._token;
      fetch(\`/api/assets/\${printAsset.id}/history\`, { headers: { Authorization: \`Bearer \${token}\` } })
        .then(res => res.json())
        .then(data => setPrintHistory(data.filter((d: any) => d.action === 'PRINT_LABEL')));
    }
  }, [printAsset]);`
);

// Add the Print History to the printAsset modal
const printHistoryUI = `
              <div className="px-6 py-4 bg-white border-t border-neutral-100 max-h-48 overflow-y-auto">
                <h4 className="text-xs font-bold text-neutral-900 mb-2 uppercase tracking-wider">Print History</h4>
                {printHistory.length > 0 ? printHistory.map((log: any) => (
                  <div key={log.id} className="text-xs flex justify-between items-center py-1.5 border-b border-neutral-50 last:border-0">
                    <span className="text-neutral-600">{log.details}</span>
                    <span className="text-neutral-400">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                )) : <p className="text-xs text-neutral-400">No previous print records found.</p>}
              </div>
`;

code = code.replace(
  /<div className="px-6 py-4 border-t border-neutral-100 bg-white flex justify-end gap-3"><button onClick=\{\(\) => setPrintAsset\(null\)\}/,
  printHistoryUI + '\n              <div className="px-6 py-4 border-t border-neutral-100 bg-white flex justify-end gap-3"><button onClick={() => setPrintAsset(null)}'
);

// Walkthrough overlay
const walkthroughUI = `
      <AnimatePresence>
        {showWalkthrough && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white p-5 rounded-2xl shadow-2xl max-w-sm">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><ScanLine className="w-5 h-5" /> Quick Scan Walkthrough</h3>
            <p className="text-sm text-indigo-100 mb-4 leading-relaxed">You can instantly locate any asset by tapping the "Scan QR / Barcode" button in the top right. Simply point your device's camera at the sticker to pull up the full asset profile!</p>
            <div className="flex justify-end">
              <button onClick={() => { setShowWalkthrough(false); localStorage.setItem('hideScanWalkthrough', 'true'); }} className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-50 transition-colors">Got it, thanks!</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
`;

code = code.replace(/\{isScanning && \(/, walkthroughUI + '\n        {isScanning && (');

fs.writeFileSync('src/components/Assets.tsx', code);
