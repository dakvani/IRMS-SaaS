with open("src/components/Assets.tsx", "r") as f:
    content = f.read()

import re

# Add printFormat state
if "const [printFormat" not in content:
    content = content.replace("const [printAsset, setPrintAsset] = useState<any | null>(null);", "const [printAsset, setPrintAsset] = useState<any | null>(null);\n  const [printFormat, setPrintFormat] = useState<'qr' | 'barcode' | 'both'>('qr');")

# Replace single print modal
single_modal_regex = r"(<div className=\"p-8 flex justify-center bg-neutral-50\" id=\"print-area\">\s*<div className=\"bg-white p-4 rounded-xl border border-neutral-200 text-center shadow-sm\">)([\s\S]*?)(</div>\s*</div>\s*<div className=\"px-6 py-4 border-t border-neutral-100 bg-white flex justify-end\">)"
single_modal_repl = r"""<div className="px-6 py-3 border-b border-neutral-100 bg-white flex justify-center gap-4">
                  <label className="text-sm font-medium flex items-center gap-2 cursor-pointer"><input type="radio" name="pformat" checked={printFormat==='qr'} onChange={()=>setPrintFormat('qr')}/> QR Code</label>
                  <label className="text-sm font-medium flex items-center gap-2 cursor-pointer"><input type="radio" name="pformat" checked={printFormat==='barcode'} onChange={()=>setPrintFormat('barcode')}/> Barcode</label>
                  <label className="text-sm font-medium flex items-center gap-2 cursor-pointer"><input type="radio" name="pformat" checked={printFormat==='both'} onChange={()=>setPrintFormat('both')}/> Both</label>
               </div>
               <div className="p-8 flex justify-center bg-neutral-50 print-only" id="print-area">
                 <div className="bg-white p-4 rounded-xl border border-neutral-200 text-center shadow-sm flex flex-col items-center">
                    {(printFormat === 'qr' || printFormat === 'both') && <QRCodeSVG value={printAsset.assetTag} size={printFormat==='both'?80:120} level="H" />}
                    {(printFormat === 'barcode' || printFormat === 'both') && <Barcode value={printAsset.assetTag} width={1.5} height={printFormat==='both'?40:60} fontSize={14} background="transparent" margin={0} marginTop={printFormat==='both'?10:0} />}
                    {printFormat === 'qr' && <p className="mt-3 font-mono font-bold text-sm">{printAsset.assetTag}</p>}
                    <p className="text-xs text-neutral-500 mt-1 truncate w-full max-w-[150px]">{printAsset.name}</p>
                 </div>
               </div>
               <div className="px-6 py-4 border-t border-neutral-100 bg-white flex justify-end">"""
content = re.sub(single_modal_regex, single_modal_repl, content)

# Replace bulk print modal
bulk_modal_regex = r"(<div className=\"p-6 max-h-\[60vh\] overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-4 bg-neutral-50 print-grid\" id=\"bulk-print-area\">)([\s\S]*?)(</div>\s*<div className=\"px-6 py-4 border-t border-neutral-100 bg-white flex justify-end\">)"
bulk_modal_repl = r"""<div className="px-6 py-3 border-b border-neutral-100 bg-white flex justify-center gap-4">
                  <label className="text-sm font-medium flex items-center gap-2 cursor-pointer"><input type="radio" name="pformat_bulk" checked={printFormat==='qr'} onChange={()=>setPrintFormat('qr')}/> QR Code</label>
                  <label className="text-sm font-medium flex items-center gap-2 cursor-pointer"><input type="radio" name="pformat_bulk" checked={printFormat==='barcode'} onChange={()=>setPrintFormat('barcode')}/> Barcode</label>
                  <label className="text-sm font-medium flex items-center gap-2 cursor-pointer"><input type="radio" name="pformat_bulk" checked={printFormat==='both'} onChange={()=>setPrintFormat('both')}/> Both</label>
               </div>
               <div className="p-6 max-h-[60vh] overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-4 bg-neutral-50 print-grid" id="bulk-print-area">
                 {Array.from(selectedAssets).map(id => {
                    const a = assets.find(x => x.id === id);
                    if (!a) return null;
                    return (
                      <div key={id} className="bg-white p-4 rounded-xl border border-neutral-200 text-center shadow-sm flex flex-col items-center">
                         {(printFormat === 'qr' || printFormat === 'both') && <QRCodeSVG value={a.assetTag} size={printFormat==='both'?80:100} level="H" />}
                         {(printFormat === 'barcode' || printFormat === 'both') && <Barcode value={a.assetTag} width={1.5} height={printFormat==='both'?40:60} fontSize={14} background="transparent" margin={0} marginTop={printFormat==='both'?10:0} />}
                         {printFormat === 'qr' && <p className="mt-3 font-mono font-bold text-sm">{a.assetTag}</p>}
                         <p className="text-xs text-neutral-500 mt-1 truncate w-full">{a.name}</p>
                      </div>
                    )
                 })}
               </div>
               <div className="px-6 py-4 border-t border-neutral-100 bg-white flex justify-end">"""
content = re.sub(bulk_modal_regex, bulk_modal_repl, content)

with open("src/components/Assets.tsx", "w") as f:
    f.write(content)
print("done")
