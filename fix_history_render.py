with open("src/components/Assets.tsx", "r") as f:
    content = f.read()

import re

# Update history rendering
history_render_regex = r"(\{assetHistory\.length > 0 \? assetHistory\.map\(\(log: any, i: number\) => \([\s\S]*?\)\) : <p className=\"text-sm text-neutral-500 italic ml-12\">No history recorded\.</p>\})"

new_history_render = """{assetHistory.length > 0 ? assetHistory.map((log: any, i: number) => {
                          let actionName = log.action || log.status || 'Activity';
                          let desc = log.details || log.technicianNotes;
                          let isTransfer = log.action === 'TRANSFER_SITE';
                          let prevSite = '', newSite = '';
                          if (isTransfer && typeof desc === 'string' && desc.startsWith('{')) {
                             try {
                               const data = JSON.parse(desc);
                               prevSite = data.previousSite;
                               newSite = data.newSite;
                               actionName = 'Site Transfer';
                             } catch(e){}
                          }

                          return (
                          <div key={i} className="relative flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full border border-white bg-neutral-100 text-neutral-500 shadow shrink-0 flex items-center justify-center mt-0.5 z-10">
                              {isTransfer ? <MapPin className="w-4 h-4 text-indigo-600" /> : <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>}
                            </div>
                            <div className="flex-1 bg-white p-4 rounded-xl border border-neutral-100 shadow-sm hover:border-indigo-200 transition-colors">
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-bold text-neutral-900 text-sm">{actionName}</div>
                                <time className="font-mono text-[10px] text-neutral-400 font-bold uppercase">{new Date(log.createdAt || log.serviceDate).toLocaleDateString()} {new Date(log.createdAt || log.serviceDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</time>
                              </div>
                              {isTransfer ? (
                                 <div className="text-xs text-neutral-600 flex items-center gap-2 font-medium">
                                    <span className="px-2 py-1 bg-neutral-100 rounded-md border border-neutral-200">{prevSite}</span>
                                    <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">{newSite}</span>
                                    {log.userName && <span className="ml-auto text-[10px] text-neutral-400">by {log.userName}</span>}
                                 </div>
                              ) : (
                                 <div className="text-neutral-600 text-xs leading-relaxed">{desc}</div>
                              )}
                            </div>
                          </div>
                          )
                        }) : <p className="text-sm text-neutral-500 italic ml-12">No history recorded.</p>}"""

content = re.sub(history_render_regex, new_history_render, content)

with open("src/components/Assets.tsx", "w") as f:
    f.write(content)
print("done")
