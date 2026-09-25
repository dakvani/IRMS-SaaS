import fs from 'fs';
let code = fs.readFileSync('src/components/Assets.tsx', 'utf-8');

const targetStr = `<div><h2 className="text-2xl font-bold text-neutral-900">{selectedAsset.name}</h2><p className="text-neutral-500 font-mono mt-1">{selectedAsset.assetTag} • {selectedAsset.type}</p></div>`;

const replacement = `<div>
                    <h2 className="text-2xl font-bold text-neutral-900">{selectedAsset.name}</h2>
                    <p className="text-neutral-500 font-mono mt-1">{selectedAsset.assetTag} • {selectedAsset.type}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-neutral-200 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Current Assignment</p>
                      {selectedAsset.employee ? (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                            {(selectedAsset.employee.name || \`\${selectedAsset.employee.firstName} \${selectedAsset.employee.lastName}\`)?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-neutral-900">{(selectedAsset.employee.name || \`\${selectedAsset.employee.firstName} \${selectedAsset.employee.lastName}\`)}</p>
                            <p className="text-xs text-neutral-500">Employee ID: {selectedAsset.employee.employeeId || 'N/A'}</p>
                          </div>
                        </div>
                      ) : selectedAsset.site ? (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                            📍
                          </div>
                          <div>
                            <p className="font-bold text-neutral-900">{selectedAsset.site.name}</p>
                            <p className="text-xs text-neutral-500">Site Assignment</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm font-medium text-neutral-500">Unassigned / In Storage</p>
                      )}
                    </div>
                    <span className={\`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium \${selectedAsset.status === 'available' ? 'bg-green-100 text-green-700' : selectedAsset.status === 'assigned' ? 'bg-blue-100 text-blue-700' : selectedAsset.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' : 'bg-neutral-100 text-neutral-700'}\`}>
                      {selectedAsset.status.charAt(0).toUpperCase() + selectedAsset.status.slice(1)}
                    </span>
                  </div>`;

code = code.replace(targetStr, replacement);
fs.writeFileSync('src/components/Assets.tsx', code);
