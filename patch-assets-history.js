import fs from 'fs';
let code = fs.readFileSync('src/components/Assets.tsx', 'utf-8');

const targetStr = `                  <div>
                    <div className="flex items-center justify-between mb-3"><h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2"><Settings className="w-4 h-4 text-neutral-600" /> Maintenance Logs</h4><button onClick={() => setShowMaintenanceForm(!showMaintenanceForm)} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">+ Log Service</button></div>`;

const replacement = `                  <div>
                    <div className="flex items-center justify-between mb-3"><h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2"><Clock className="w-4 h-4 text-blue-600" /> Asset History</h4></div>
                    <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 mb-4 max-h-48 overflow-y-auto space-y-3">
                      {assetHistory.length > 0 ? assetHistory.map((log: any) => (
                        <div key={log.id} className="flex gap-3 text-sm border-b border-neutral-100 last:border-0 pb-2 last:pb-0">
                          <div className="mt-0.5"><div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5"></div></div>
                          <div>
                            <p className="font-bold text-neutral-900">{log.action}</p>
                            <p className="text-neutral-600 text-xs mt-0.5">{log.details}</p>
                            <p className="text-neutral-400 text-[10px] mt-1">{new Date(log.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      )) : <p className="text-neutral-500 text-xs text-center py-2">No history available for this asset.</p>}
                    </div>

                    <div className="flex items-center justify-between mb-3"><h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2"><Settings className="w-4 h-4 text-neutral-600" /> Maintenance Logs</h4><button onClick={() => setShowMaintenanceForm(!showMaintenanceForm)} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">+ Log Service</button></div>`;

code = code.replace(targetStr, replacement);
fs.writeFileSync('src/components/Assets.tsx', code);
