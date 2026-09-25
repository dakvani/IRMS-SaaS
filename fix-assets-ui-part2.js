import fs from 'fs';
let code = fs.readFileSync('src/components/Assets.tsx', 'utf-8');

// Depreciation calculation logic
const calcCode = `
  const calculateDepreciation = (asset: any) => {
    if (!asset.purchasePrice || !asset.purchaseDate || !asset.salvageValue || !asset.usefulLifeYears) return null;
    const price = asset.purchasePrice;
    const salvage = asset.salvageValue;
    const life = asset.usefulLifeYears;
    const yearsElapsed = (new Date().getTime() - new Date(asset.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    
    if (yearsElapsed < 0) return price;
    
    if (asset.depreciationMethod === 'straight_line') {
      const yearlyDepreciation = (price - salvage) / life;
      const totalDepreciation = yearlyDepreciation * Math.min(yearsElapsed, life);
      return Math.max(salvage, price - totalDepreciation);
    } else if (asset.depreciationMethod === 'double_declining') {
      const rate = (1 / life) * 2;
      let bookValue = price;
      for (let i = 0; i < Math.floor(yearsElapsed); i++) {
        bookValue -= bookValue * rate;
      }
      // fractional year
      const fraction = yearsElapsed - Math.floor(yearsElapsed);
      bookValue -= (bookValue * rate * fraction);
      return Math.max(salvage, bookValue);
    }
    return price;
  };
  
  const getNextMaintenance = (asset: any) => {
    if (!asset.maintenanceIntervalDays) return null;
    const baseDate = asset.lastMaintenanceDate || asset.purchaseDate;
    if (!baseDate) return null;
    const next = new Date(baseDate);
    next.setDate(next.getDate() + asset.maintenanceIntervalDays);
    return next;
  };
`;
code = code.replace(/useEffect\(\(\) => \{/, calcCode + '\n  useEffect(() => {');

// Scanner logic
const scannerLogic = `
  useEffect(() => {
    let html5QrcodeScanner: Html5QrcodeScanner | null = null;
    if (isScanning) {
      html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: {width: 250, height: 250} }, false);
      html5QrcodeScanner.render(
        (decodedText) => {
          setSearchTerm(decodedText);
          setIsScanning(false);
          html5QrcodeScanner?.clear();
          // Find asset
          const found = assets.find(a => a.assetTag === decodedText);
          if (found) handleAssetClick(found);
        },
        (error) => {}
      );
    }
    return () => {
      if (html5QrcodeScanner) html5QrcodeScanner.clear().catch(e => console.error(e));
    };
  }, [isScanning, assets]);
`;
code = code.replace(/useEffect\(\(\) => \{\s*fetchData\(\);\s*\}, \[\]\);/, `useEffect(() => { fetchData(); }, []);\n${scannerLogic}`);

// Add Scanner UI + List/Board toggle
code = code.replace(
  /\{!isAdding && \(\s*<div className="flex gap-2">/,
  `{!isAdding && (
          <div className="flex gap-2">
            <div className="flex bg-neutral-100 rounded-lg p-1 mr-2 border border-neutral-200">
              <button onClick={() => setViewMode('list')} className={\`p-1.5 rounded-md \${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}\`}><List className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('board')} className={\`p-1.5 rounded-md \${viewMode === 'board' ? 'bg-white shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}\`}><LayoutGrid className="w-4 h-4" /></button>
            </div>
            <button 
              onClick={() => setIsScanning(true)}
              className="bg-white text-neutral-700 border border-neutral-200 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-neutral-50 shadow-sm"
            >
              <ScanLine className="w-4 h-4" /> Scan QR
            </button>`
);

// Add scanner modal
const scanModal = `
      {/* Scanner Modal */}
      <AnimatePresence>
        {isScanning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
                <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2"><ScanLine className="w-5 h-5" /> Scan Asset</h3>
                <button onClick={() => setIsScanning(false)} className="text-neutral-400 hover:text-neutral-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <div id="reader" className="w-full overflow-hidden rounded-xl border border-neutral-200"></div>
                <p className="text-sm text-center text-neutral-500 mt-4">Point your camera at an asset QR code or barcode to instantly pull up its details.</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
`;
code = code.replace(/\{(\/\* Asset Details Modal \*\/)/, scanModal + '\n      {$1');

fs.writeFileSync('src/components/Assets.tsx', code);
