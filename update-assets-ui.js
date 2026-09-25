import fs from 'fs';

let code = fs.readFileSync('src/components/Assets.tsx', 'utf-8');

// Import QRCodeSVG and Barcode
code = code.replace(
  /import \{ (.*) \} from 'lucide-react';/,
  `import { $1, Printer } from 'lucide-react';\nimport { QRCodeSVG } from 'qrcode.react';\nimport Barcode from 'react-barcode';`
);

// Add printAsset state
code = code.replace(
  /const \[isAdding, setIsAdding\] = useState\(false\);/,
  `const [isAdding, setIsAdding] = useState(false);\n  const [printAsset, setPrintAsset] = useState<any>(null);`
);

// Make Asset Tag optional visually
code = code.replace(
  /<label className="text-sm font-medium text-neutral-700">Asset Tag \*\<\/label>\s*<input\s*type="text"\s*required/,
  `<label className="text-sm font-medium text-neutral-700">Asset Tag</label>\n                <input \n                  type="text" \n                  `
);
code = code.replace(
  /placeholder="e.g. IT-1001"/,
  `placeholder="Auto-generated if empty"`
);

// Add an Actions column to the table header
code = code.replace(
  /<th className="px-6 py-3">Status<\/th>\s*<\/tr>/,
  `<th className="px-6 py-3">Status</th>\n                <th className="px-6 py-3 text-right">Actions</th>\n              </tr>`
);

// Add a Print button to the table row
code = code.replace(
  /\{asset\.status\}\s*<\/span>\s*<\/td>\s*<\/tr>/g,
  `{asset.status}\n                    </span>\n                  </td>\n                  <td className="px-6 py-4 text-right">\n                    <button onClick={() => setPrintAsset(asset)} className="text-neutral-400 hover:text-indigo-600 transition-colors p-2" title="Print Label">\n                      <Printer className="w-4 h-4" />\n                    </button>\n                  </td>\n                </tr>`
);

// Add the Print Modal at the end of the component
const modalCode = `
      {/* Print Label Modal */}
      <AnimatePresence>
        {printAsset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
                <h3 className="text-lg font-bold text-neutral-900">Asset Label</h3>
                <button onClick={() => setPrintAsset(null)} className="text-neutral-400 hover:text-neutral-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 bg-neutral-50 flex flex-col items-center justify-center gap-6" id="asset-label-print-area">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 text-center w-full max-w-xs flex flex-col items-center gap-4">
                  <h4 className="font-bold text-lg text-neutral-900 truncate w-full">{printAsset.name}</h4>
                  <div className="bg-white p-2">
                    <QRCodeSVG value={printAsset.assetTag} size={120} level="H" />
                  </div>
                  <div className="w-full flex justify-center overflow-hidden">
                    <Barcode value={printAsset.assetTag} width={1.5} height={40} fontSize={14} background="#ffffff" />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-neutral-100 bg-white flex justify-end gap-3">
                <button
                  onClick={() => setPrintAsset(null)}
                  className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg text-sm font-medium transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const printContent = document.getElementById('asset-label-print-area');
                    if (printContent) {
                      const originalContents = document.body.innerHTML;
                      document.body.innerHTML = printContent.innerHTML;
                      window.print();
                      document.body.innerHTML = originalContents;
                      window.location.reload();
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Printer className="w-4 h-4" /> Print Label
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
`;

code = code.replace(/<\/div>\s*\);\s*\}/, modalCode + '\n    </div>\n  );\n}');

fs.writeFileSync('src/components/Assets.tsx', code);
