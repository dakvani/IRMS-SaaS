import fs from 'fs';
let code = fs.readFileSync('src/components/Timesheets.tsx', 'utf-8');

// Add History import
code = code.replace("MessageSquare } from 'lucide-react';", "MessageSquare, History } from 'lucide-react';");

const historyUI = `
              <div className="border-t border-neutral-100 bg-neutral-50 px-6 py-4 max-h-48 overflow-y-auto custom-scrollbar">
                <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2 mb-3">
                  <History className="w-4 h-4 text-neutral-500" /> Review History
                </h4>
                {batchHistory.length > 0 ? (
                  <div className="space-y-3">
                    {batchHistory.map(log => (
                      <div key={log.id} className="flex gap-3 text-sm">
                        <div className="mt-0.5">
                          {log.action === 'APPROVE' && <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />}
                          {log.action === 'REJECT' && <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5" />}
                          {log.action === 'ON_HOLD' && <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5" />}
                          {log.action === 'SUBMIT' && <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5" />}
                          {!['APPROVE', 'REJECT', 'ON_HOLD', 'SUBMIT'].includes(log.action) && <div className="w-2 h-2 rounded-full bg-neutral-400 mt-1.5" />}
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">
                            {log.user?.name || 'System User'} <span className="text-neutral-500 font-normal">({log.action})</span>
                          </p>
                          <p className="text-neutral-600">{log.details}</p>
                          <p className="text-xs text-neutral-400 mt-0.5">{new Date(log.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">No review history available.</p>
                )}
              </div>
              
              <div className="p-5 border-t border-neutral-100 bg-white">
`;

code = code.replace(/<div className="p-5 border-t border-neutral-100 bg-white">/, historyUI.trim());

fs.writeFileSync('src/components/Timesheets.tsx', code);
