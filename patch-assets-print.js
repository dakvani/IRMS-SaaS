import fs from 'fs';
let code = fs.readFileSync('src/components/Assets.tsx', 'utf-8');

// Replace printFormat with labelConfig
code = code.replace(
  /const \[printFormat, setPrintFormat\] = useState\<'both' \| 'qr' \| 'barcode'\>\('both'\);/,
  "const [labelConfig, setLabelConfig] = useState({ showQR: true, showBarcode: true, showId: true, showName: true, showType: true });"
);

// We need a smart label dialog component (or just render checkboxes instead of the select).
const smartLabelControls = `
                  <div className="flex items-center gap-4 bg-neutral-100 p-2 rounded-lg">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-neutral-700 cursor-pointer"><input type="checkbox" checked={labelConfig.showName} onChange={e => setLabelConfig({...labelConfig, showName: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" /> Name</label>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-neutral-700 cursor-pointer"><input type="checkbox" checked={labelConfig.showId} onChange={e => setLabelConfig({...labelConfig, showId: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" /> ID</label>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-neutral-700 cursor-pointer"><input type="checkbox" checked={labelConfig.showType} onChange={e => setLabelConfig({...labelConfig, showType: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" /> Type</label>
                    <div className="w-px h-4 bg-neutral-300"></div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-neutral-700 cursor-pointer"><input type="checkbox" checked={labelConfig.showQR} onChange={e => setLabelConfig({...labelConfig, showQR: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" /> QR</label>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-neutral-700 cursor-pointer"><input type="checkbox" checked={labelConfig.showBarcode} onChange={e => setLabelConfig({...labelConfig, showBarcode: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" /> Barcode</label>
                  </div>
`;

// Replace single print selector
code = code.replace(
  /<select value=\{printFormat\}[\s\S]*?<\/select>/g,
  smartLabelControls
);

// Update single print sticker content
code = code.replace(
  /<h4 className="font-bold text-lg text-neutral-900 leading-tight">\{printAsset.name\}<\/h4>[\s\S]*?<p className="text-xs font-bold text-neutral-400 uppercase mt-2 tracking-widest">\{printAsset.type\}<\/p>/,
  `{labelConfig.showName && <h4 className="font-bold text-lg text-neutral-900 leading-tight">{printAsset.name}</h4>}
                  {labelConfig.showId && <p className="text-sm font-mono text-neutral-500">{printAsset.assetTag}</p>}
                  {labelConfig.showQR && <QRCodeSVG value={printAsset.assetTag} size={120} level="H" />}
                  {labelConfig.showBarcode && <div className="w-full flex justify-center overflow-hidden"><Barcode value={printAsset.assetTag} width={1.2} height={40} fontSize={11} displayValue={false} background="#ffffff" margin={0} /></div>}
                  {labelConfig.showType && <p className="text-xs font-bold text-neutral-400 uppercase mt-2 tracking-widest">{printAsset.type}</p>}`
);

// Update bulk print sticker content
code = code.replace(
  /<h4 className="font-bold text-sm text-neutral-900 truncate w-full">\{asset.name\}<\/h4>[\s\S]*?margin=\{0\} \/><\/div>\}/g,
  `{labelConfig.showName && <h4 className="font-bold text-sm text-neutral-900 truncate w-full">{asset.name}</h4>}
                      {labelConfig.showId && <p className="text-xs font-mono text-neutral-500">{asset.assetTag}</p>}
                      {labelConfig.showQR && <QRCodeSVG value={asset.assetTag} size={100} level="H" />}
                      {labelConfig.showBarcode && <div className="w-full flex justify-center overflow-hidden"><Barcode value={asset.assetTag} width={1} height={30} fontSize={10} displayValue={false} background="#ffffff" margin={0} /></div>}
                      {labelConfig.showType && <p className="text-[10px] font-bold text-neutral-400 uppercase mt-1 tracking-widest">{asset.type}</p>}`
);

fs.writeFileSync('src/components/Assets.tsx', code);
