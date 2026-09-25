import fs from 'fs';

const code = fs.readFileSync('src/components/Assets.tsx', 'utf-8');
const renderIndex = code.indexOf('return (');
const preRender = code.substring(0, renderIndex);

// I will construct a completely clean render block.
// To do this, I will just extract the internals of the modales and views from the existing code.

// 1. Extract Add Form
const addFormMatch = code.match(/\{isAdding \? \([\s\S]*?<\/div>\s*\)\s*:\s*isLoading \?/);
let addForm = addFormMatch ? addFormMatch[0].replace(/ : isLoading \?$/, '') : '';
if (addForm.startsWith('{isAdding ? (')) addForm = addForm.substring(13, addForm.length - 1).trim();

// 2. Extract Modals
const scannerModal = code.match(/\{\/\* Scanner Modal \*\/\}([\s\S]*?)<\/AnimatePresence>/)?.[0] || '';
const detailsModal = code.match(/\{\/\* Asset Details Modal \*\/\}([\s\S]*?)<\/AnimatePresence>/)?.[0] || '';
const printModal = code.match(/\{\/\* Print Label Modal \*\/\}([\s\S]*?)<\/AnimatePresence>/)?.[0] || '';
const bulkModal = code.match(/\{\/\* Bulk Print Modal \*\/\}([\s\S]*?)<\/AnimatePresence>/)?.[0] || '';

// 3. Extract Table rows
const tableRows = code.match(/<tbody className="divide-y divide-neutral-100">([\s\S]*?)<\/tbody>/)?.[0] || '';

// 4. Extract Board
const unassignedCol = code.match(/<h3 className="font-bold text-neutral-700 text-sm">Unassigned \/ General<\/h3>[\s\S]*?<\/div>\s*<\/div>/)?.[0] || '';
const siteCols = code.match(/\{sites\.map\(site => \([\s\S]*?\}\)\}/)?.[0] || '';

const cleanRender = `return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50/50">
        <h2 className="text-lg font-semibold">Equipment & Assets</h2>
        {!isAdding && (
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
            </button>
            {selectedAssets.size > 0 && (
              <button 
                onClick={() => setShowBulkPrint(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-700 shadow-sm"
              >
                <Printer className="w-4 h-4" /> Bulk Print ({selectedAssets.size})
              </button>
            )}
            <button 
              onClick={() => setIsAdding(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Asset
            </button>
          </div>
        )}
      </div>

      {isAdding ? (
        \${addForm}
      ) : isLoading ? (
        <div className="p-12 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-neutral-500">
          <Package className="w-12 h-12 mx-auto text-neutral-300 mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-1">No assets found</h3>
          <p>Add equipment to track across your organization.</p>
        </div>
      ) : (
        <>
          {viewMode === 'list' && (
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm flex-1 min-h-[400px] md:min-h-0 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50 sticky top-0 z-10 text-neutral-500 border-b border-neutral-200 uppercase text-xs font-semibold">
                  <tr>
                    <th className="px-6 py-3 w-12"><input type="checkbox" checked={selectedAssets.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="rounded border-neutral-300" /></th>
                    <th className="px-6 py-3">Asset</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Assignment</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                \${tableRows}
              </table>
            </div>
          )}

          {viewMode === 'board' && (
            <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar flex gap-4 p-4 bg-neutral-100/50 min-h-[500px]">
              <div 
                className="w-80 shrink-0 flex flex-col bg-neutral-100 rounded-2xl border border-neutral-200"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, '')}
              >
                <div className="p-3 border-b border-neutral-200 bg-white rounded-t-2xl flex justify-between items-center shadow-sm">
                  \${unassignedCol}
              
              \${siteCols}
            </div>
          )}
        </>
      )}

      \${scannerModal}
      \${detailsModal}
      \${printModal}
      \${bulkModal}
    </div>
  );
}`;

fs.writeFileSync('src/components/Assets.tsx', preRender + cleanRender);
