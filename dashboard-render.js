import fs from 'fs';
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

code = code.replace(
  "AlertTriangle, FileText }",
  "AlertTriangle, FileText, Activity }"
);

// find <WorkloadHeatmap variants={item} />
// I will replace it with a Recent Activity section.

const recentActivitySection = `
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={item} className="bg-white rounded-2xl border border-neutral-200 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-neutral-900 tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" /> Recent Activity
            </h3>
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {recentLogs.length > 0 ? recentLogs.map((log: any) => (
              <div key={log.id} className="flex gap-4">
                <div className="relative flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-50 z-10"></div>
                  <div className="w-[1px] h-full bg-neutral-100 absolute top-2.5"></div>
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium text-neutral-900">
                    <span className="font-bold">{log.user?.name || 'System'}</span> {log.action.toLowerCase()} {log.entity.toLowerCase()}
                  </p>
                  {log.details && <p className="text-xs text-neutral-500 mt-1">{log.details}</p>}
                  <p className="text-xs text-neutral-400 mt-1">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-6 text-neutral-500 text-sm">No recent activity.</div>
            )}
          </div>
        </motion.div>
        
        <WorkloadHeatmap variants={item} />
      </div>
`;

code = code.replace("<WorkloadHeatmap variants={item} />", recentActivitySection);

fs.writeFileSync('src/components/Dashboard.tsx', code);
