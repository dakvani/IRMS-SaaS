import fs from 'fs';
let code = fs.readFileSync('src/components/Assets.tsx', 'utf-8');

// Add states
code = code.replace(
  /const \[printAsset, setPrintAsset\] = useState<any>\(null\);/,
  `const [printAsset, setPrintAsset] = useState<any>(null);\n  const [selectedAsset, setSelectedAsset] = useState<any>(null);\n  const [assetHistory, setAssetHistory] = useState<any[]>([]);\n  const [selectedAssets, setSelectedAssets] = useState<Set<number>>(new Set());\n  const [showBulkPrint, setShowBulkPrint] = useState(false);`
);

// Add fetchHistory
const fetchHistoryCode = `
  const fetchAssetHistory = async (id: number) => {
    try {
      const token = (window as any)._token;
      const res = await fetch(\`/api/assets/\${id}/history\`, {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      if (res.ok) setAssetHistory(await res.json());
    } catch(e) { console.error(e); }
  };

  const handleAssetClick = (asset: any) => {
    setSelectedAsset(asset);
    fetchAssetHistory(asset.id);
  };
  
  const toggleSelection = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelection = new Set(selectedAssets);
    if (newSelection.has(id)) newSelection.delete(id);
    else newSelection.add(id);
    setSelectedAssets(newSelection);
  };
  
  const toggleAll = () => {
    if (selectedAssets.size === filtered.length) setSelectedAssets(new Set());
    else setSelectedAssets(new Set(filtered.map(a => a.id)));
  };
`;
code = code.replace(/const fetchData = async \(\) => \{/, fetchHistoryCode + '\n  const fetchData = async () => {');

// Fix search logic
code = code.replace(
  /const filtered = assets\.filter\(\(item: any\) =>[\s\S]*?\);/,
  `const filtered = assets.filter((item: any) => {
    const s = searchTerm.toLowerCase();
    return (
      (item.name && item.name.toLowerCase().includes(s)) ||
      (item.assetTag && item.assetTag.toLowerCase().includes(s)) ||
      (item.type && item.type.toLowerCase().includes(s)) ||
      (item.status && item.status.toLowerCase().includes(s)) ||
      (item.employee && (item.employee.firstName + ' ' + item.employee.lastName).toLowerCase().includes(s)) ||
      (item.site && item.site.name.toLowerCase().includes(s))
    );
  });`
);

// Add bulk print button to header
code = code.replace(
  /\{!isAdding && \(\s*<button\s*onClick=\{\(\) => setIsAdding\(true\)\}/,
  `{!isAdding && (
          <div className="flex gap-2">
            {selectedAssets.size > 0 && (
              <button 
                onClick={() => setShowBulkPrint(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-700 shadow-sm"
              >
                <Printer className="w-4 h-4" /> Bulk Print ({selectedAssets.size})
              </button>
            )}
            <button 
              onClick={() => setIsAdding(true)}`
);
code = code.replace(/<\/button>\s*\)\}\s*<\/div>/, `</button>\n          </div>\n        )}\n      </div>`); // fix wrapping

// Table columns
code = code.replace(
  /<th className="px-6 py-3">Asset<\/th>/,
  `<th className="px-6 py-3 w-12"><input type="checkbox" checked={selectedAssets.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="rounded border-neutral-300" /></th>
                <th className="px-6 py-3">Asset</th>`
);

// Table rows
code = code.replace(
  /<tr key=\{asset\.id\} className="hover:bg-neutral-50 transition-colors">/g,
  `<tr key={asset.id} onClick={() => handleAssetClick(asset)} className="hover:bg-neutral-50 transition-colors cursor-pointer">
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedAssets.has(asset.id)} onChange={(e) => toggleSelection(asset.id, e as any)} className="rounded border-neutral-300" />
                  </td>`
);

// Asset Details Modal & Bulk Print Modal
const modalsCode = `
      {/* Asset Details Modal */}
      <AnimatePresence>
        {selectedAsset && !printAsset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50">
                <h3 className="text-lg font-bold text-neutral-900">Asset Details</h3>
                <button onClick={() => setSelectedAsset(null)} className="text-neutral-400 hover:text-neutral-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-8">
                <div className="flex-1 space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-neutral-900">{selectedAsset.name}</h2>
                    <p className="text-neutral-500 font-mono mt-1">{selectedAsset.assetTag}</p>
                    <div className="flex gap-2 mt-3">
                      <span className="px-2.5 py-1 bg-neutral-100 text-neutral-700 rounded-lg text-xs font-semibold uppercase">{selectedAsset.type}</span>
                      <span className={\`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase \${selectedAsset.status === 'available' ? 'bg-green-100 text-green-700' : selectedAsset.status === 'assigned' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}\`}>{selectedAsset.status}</span>
                    </div>
                  </div>
                  
                  <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                    <h4 className="text-sm font-bold text-neutral-900 mb-3">Assignment</h4>
                    {selectedAsset.employee ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-neutral-900">Assigned to: {selectedAsset.employee.firstName} {selectedAsset.employee.lastName}</span>
                        <span className="text-xs text-neutral-500">Employee ID: {selectedAsset.employee.employeeId}</span>
                      </div>
                    ) : selectedAsset.site ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-neutral-900">Assigned to Site: {selectedAsset.site.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-neutral-500 italic">Currently unassigned</span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 mb-3">History</h4>
                    <div className="space-y-3">
                      {assetHistory.length > 0 ? assetHistory.map((log: any, i: number) => (
                        <div key={i} className="flex gap-3 text-sm">
                          <div className="mt-1 w-2 h-2 rounded-full bg-neutral-400 shrink-0" />
                          <div>
                            <p className="font-medium text-neutral-900">{log.user?.name || 'System User'} <span className="text-neutral-500 font-normal">({log.action})</span></p>
                            <p className="text-neutral-600">{log.details}</p>
                            <p className="text-xs text-neutral-400 mt-0.5">{new Date(log.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      )) : (
                        <p className="text-sm text-neutral-500">No history available.</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
                  <h4 className="text-sm font-bold text-neutral-900">Identification</h4>
                  <div 
                    onClick={() => setPrintAsset(selectedAsset)}
                    className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 flex flex-col items-center gap-4 cursor-pointer hover:border-indigo-300 hover:shadow-sm transition-all group"
                  >
                    <div className="bg-white p-2 rounded-lg shadow-sm group-hover:scale-105 transition-transform">
                      <QRCodeSVG value={selectedAsset.assetTag} size={140} level="H" />
                    </div>
                    <div className="bg-white p-2 rounded-lg shadow-sm w-full flex justify-center group-hover:scale-105 transition-transform overflow-hidden">
                      <Barcode value={selectedAsset.assetTag} width={1.2} height={40} fontSize={12} background="#ffffff" />
                    </div>
                    <p className="text-xs text-center text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Click to open print view</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Print Modal */}
      <AnimatePresence>
        {showBulkPrint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
                <h3 className="text-lg font-bold text-neutral-900">Bulk Print Asset Labels ({selectedAssets.size})</h3>
                <button onClick={() => setShowBulkPrint(false)} className="text-neutral-400 hover:text-neutral-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 bg-neutral-50 custom-scrollbar" id="bulk-print-area">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {assets.filter(a => selectedAssets.has(a.id)).map(asset => (
                    <div key={asset.id} className="bg-white p-4 rounded-xl shadow-sm border border-neutral-200 text-center flex flex-col items-center gap-3">
                      <h4 className="font-bold text-sm text-neutral-900 truncate w-full">{asset.name}</h4>
                      <QRCodeSVG value={asset.assetTag} size={100} level="H" />
                      <div className="w-full flex justify-center overflow-hidden">
                        <Barcode value={asset.assetTag} width={1} height={30} fontSize={10} background="#ffffff" margin={0} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-6 py-4 border-t border-neutral-100 bg-white flex justify-end gap-3">
                <button onClick={() => setShowBulkPrint(false)} className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                <button
                  onClick={() => {
                    const printContent = document.getElementById('bulk-print-area');
                    if (printContent) {
                      const originalContents = document.body.innerHTML;
                      document.body.innerHTML = \`<div class="print-area p-6">\${printContent.innerHTML}</div>\`;
                      window.print();
                      document.body.innerHTML = originalContents;
                      window.location.reload();
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Printer className="w-4 h-4" /> Print All Labels
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
`;

code = code.replace(/\{(\/\* Print Label Modal \*\/)/, modalsCode + '\n      {$1');

// Stop propagation on row actions
code = code.replace(
  /<button onClick=\{\(\) => setPrintAsset\(asset\)\}/g,
  `<button onClick={(e) => { e.stopPropagation(); setPrintAsset(asset); }}`
);

fs.writeFileSync('src/components/Assets.tsx', code);
