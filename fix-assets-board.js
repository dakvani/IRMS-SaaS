import fs from 'fs';
let code = fs.readFileSync('src/components/Assets.tsx', 'utf-8');

// Add DnD handlers
const dndHandlers = `
  const handleDragStart = (e: React.DragEvent, asset: any) => {
    e.dataTransfer.setData('assetId', asset.id.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetSiteId: string) => {
    e.preventDefault();
    const assetId = e.dataTransfer.getData('assetId');
    if (!assetId) return;
    
    const asset = assets.find(a => a.id.toString() === assetId);
    if (!asset) return;
    
    const currentSiteId = asset.site ? asset.site.id.toString() : '';
    if (currentSiteId === targetSiteId) return;

    try {
      const token = (window as any)._token;
      const res = await fetch(\`/api/assets/\${assetId}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
        body: JSON.stringify({ ...asset, assignedToSiteId: targetSiteId || null, assignedToEmployeeId: null, status: 'assigned' })
      });
      if (res.ok) fetchData();
    } catch(err) { console.error(err); }
  };
`;
code = code.replace(/const handleAssetClick = /, dndHandlers + '\n  const handleAssetClick = ');

// Add Board View render logic
const boardViewCode = `
      {viewMode === 'board' && !isLoading && filtered.length > 0 && (
        <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar flex gap-4 p-4 bg-neutral-100/50 min-h-[500px]">
          {/* Unassigned Column */}
          <div 
            className="w-80 shrink-0 flex flex-col bg-neutral-100 rounded-2xl border border-neutral-200"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, '')}
          >
            <div className="p-3 border-b border-neutral-200 bg-white rounded-t-2xl flex justify-between items-center shadow-sm">
              <h3 className="font-bold text-neutral-700 text-sm">Unassigned / General</h3>
              <span className="bg-neutral-200 text-neutral-600 text-xs font-bold px-2 py-0.5 rounded-full">{filtered.filter(a => !a.site).length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              {filtered.filter(a => !a.site).map(asset => (
                <div 
                  key={asset.id} 
                  draggable
                  onDragStart={(e) => handleDragStart(e, asset)}
                  onClick={() => handleAssetClick(asset)}
                  className="bg-white p-3 rounded-xl shadow-sm border border-neutral-200 cursor-grab active:cursor-grabbing hover:border-indigo-300 hover:shadow-md transition-all"
                >
                  <p className="font-bold text-sm text-neutral-900">{asset.name}</p>
                  <p className="text-xs text-neutral-500 font-mono mt-1">{asset.assetTag}</p>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-[10px] font-bold uppercase text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">{asset.type}</span>
                    <span className={\`w-2 h-2 rounded-full \${asset.status === 'available' ? 'bg-green-500' : asset.status === 'maintenance' ? 'bg-yellow-500' : 'bg-neutral-400'}\`}></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Site Columns */}
          {sites.map(site => (
            <div 
              key={site.id}
              className="w-80 shrink-0 flex flex-col bg-blue-50/30 rounded-2xl border border-blue-100"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, site.id.toString())}
            >
              <div className="p-3 border-b border-blue-100 bg-white rounded-t-2xl flex justify-between items-center shadow-sm">
                <h3 className="font-bold text-blue-900 text-sm truncate pr-2">{site.name}</h3>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{filtered.filter(a => a.site?.id === site.id).length}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {filtered.filter(a => a.site?.id === site.id).map(asset => (
                  <div 
                    key={asset.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, asset)}
                    onClick={() => handleAssetClick(asset)}
                    className="bg-white p-3 rounded-xl shadow-sm border border-blue-100 cursor-grab active:cursor-grabbing hover:border-indigo-300 hover:shadow-md transition-all"
                  >
                    <p className="font-bold text-sm text-neutral-900">{asset.name}</p>
                    <p className="text-xs text-neutral-500 font-mono mt-1">{asset.assetTag}</p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-[10px] font-bold uppercase text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">{asset.type}</span>
                      <span className={\`w-2 h-2 rounded-full \${asset.status === 'assigned' ? 'bg-blue-500' : asset.status === 'maintenance' ? 'bg-yellow-500' : 'bg-neutral-400'}\`}></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
`;

code = code.replace(
  /\{\/\* Print Label Modal \*\/\}/,
  boardViewCode + '\n\n      {/* Print Label Modal */}'
);

// Hide List View when Board View is active
code = code.replace(
  /<div className="bg-white rounded-2xl border border-neutral-200 shadow-sm flex-1 min-h-\[400px\] md:min-h-0 overflow-y-auto custom-scrollbar">/,
  `{viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm flex-1 min-h-[400px] md:min-h-0 overflow-y-auto custom-scrollbar">`
);

code = code.replace(
  /<\/table>\s*<\/div>\s*\)\}\s*\{viewMode === 'board'/,
  `</table>\n        </div>\n      )}\n      {viewMode === 'board'`
);

fs.writeFileSync('src/components/Assets.tsx', code);
