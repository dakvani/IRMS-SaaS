import fs from 'fs';
let code = fs.readFileSync('src/components/Reports.tsx', 'utf-8');

code = code.replace(/const \[activeTab, setActiveTab\] = useState<'exports' \| 'audit'>\('exports'\);/, "const [activeTab, setActiveTab] = useState<'exports' | 'audit' | 'assets'>('exports');\n  const [assetReports, setAssetReports] = useState<any[]>([]);\n  const [isLoadingAssets, setIsLoadingAssets] = useState(false);");

// Fetch asset reports when tab is changed
code = code.replace(/if \(activeTab === 'audit'\) \{[\s\n]*fetchAuditLogs\(\);[\s\n]*\}/, `if (activeTab === 'audit') fetchAuditLogs();\n    if (activeTab === 'assets') fetchAssetReports();`);

const fetchAssetReportsStr = `
  const fetchAssetReports = async () => {
    setIsLoadingAssets(true);
    try {
      const token = (window as any)._token;
      const res = await fetch('/api/reports/assets', { headers: { Authorization: \`Bearer \${token}\` }});
      if (res.ok) setAssetReports(await res.json());
    } catch(e) { console.error(e); } finally { setIsLoadingAssets(false); }
  };
`;

code = code.replace(/const fetchAuditLogs = async/, fetchAssetReportsStr + '\n  const fetchAuditLogs = async');

// Add Assets tab button
code = code.replace(/<button [\s\n]*className=\{\`pb-3 text-sm font-medium border-b-2 transition-colors \$\{activeTab === 'audit' \? 'border-blue-600 text-blue-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'\}\`\}[\s\n]*onClick=\{\(\) => setActiveTab\('audit'\)\}[\s\n]*>[\s\n]*Audit Logs[\s\n]*<\/button>/, `<button className={\`pb-3 text-sm font-medium border-b-2 transition-colors \${activeTab === 'audit' ? 'border-blue-600 text-blue-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}\`} onClick={() => setActiveTab('audit')}>Audit Logs</button>\n          <button className={\`pb-3 text-sm font-medium border-b-2 transition-colors \${activeTab === 'assets' ? 'border-blue-600 text-blue-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}\`} onClick={() => setActiveTab('assets')}>Asset Performance</button>`);

// Add Assets tab content
const assetsTabStr = `
        {/* ASSETS PERFORMANCE TAB */}
        {activeTab === 'assets' && (
          <div>
            <div className="p-6 bg-neutral-50 border-b border-neutral-200">
              <h3 className="text-lg font-bold text-neutral-900 mb-1">Asset Downtime & Service Report</h3>
              <p className="text-sm text-neutral-600">Calculates total downtime days and service frequency over the last 12 months for underperforming equipment.</p>
            </div>
            {isLoadingAssets ? (
              <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
            ) : assetReports.length === 0 ? (
              <div className="p-12 text-center text-neutral-500"><p>No service history found in the last 12 months.</p></div>
            ) : (
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm flex-1 min-h-[400px] md:min-h-0 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-50 sticky top-0 z-10 text-neutral-500 border-b border-neutral-200 uppercase text-xs font-semibold">
                    <tr>
                      <th className="px-6 py-3">Asset Name</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3">Asset Tag</th>
                      <th className="px-6 py-3">12m Service Frequency</th>
                      <th className="px-6 py-3">Total Downtime (Days)</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {assetReports.sort((a,b) => b.downtime - a.downtime).map((report) => (
                      <tr key={report.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-neutral-900">{report.name}</td>
                        <td className="px-6 py-4"><span className="px-2 py-1 bg-neutral-100 text-neutral-700 rounded text-xs">{report.type}</span></td>
                        <td className="px-6 py-4 font-mono text-neutral-500 text-xs">{report.assetTag}</td>
                        <td className="px-6 py-4 font-bold text-neutral-700">{report.serviceCount}x</td>
                        <td className="px-6 py-4 font-bold text-red-600">{report.downtime} days</td>
                        <td className="px-6 py-4">
                          {report.downtime > 14 || report.serviceCount > 3 ? (
                            <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">High Risk</span>
                          ) : (
                            <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">Healthy</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
`;

code = code.replace(/\{activeTab === 'audit' && \(/, assetsTabStr + '\n        {activeTab === \'audit\' && (');

fs.writeFileSync('src/components/Reports.tsx', code);
