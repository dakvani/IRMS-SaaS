import fs from 'fs';
let code = fs.readFileSync('src/components/Employees.tsx', 'utf-8');

const replacement = `
              {/* Assigned Assets */}
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
                <h3 className="font-bold text-neutral-900 mb-4 pb-2 border-b border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center gap-2"><Package className="w-5 h-5 text-neutral-400" /> Assigned Assets</div>
                </h3>
                {isLoadingProfile ? (
                  <p className="text-neutral-400 text-sm">Loading assets...</p>
                ) : employeeAssets.length > 0 ? (
                  <div className="space-y-3">
                    {employeeAssets.map((asset: any) => (
                      <div key={asset.id} className="border border-neutral-100 rounded-xl p-4 hover:border-neutral-200 bg-neutral-50/50">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-neutral-900">{asset.name}</p>
                            <p className="text-sm text-neutral-500 mt-1 font-mono">{asset.assetTag}</p>
                          </div>
                          <span className={\`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase \${asset.status === 'assigned' ? 'bg-blue-100 text-blue-700' : 'bg-neutral-100 text-neutral-600'}\`}>
                            {asset.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                    <p className="text-neutral-500 text-sm">No assets assigned to this employee.</p>
                  </div>
                )}
              </div>
`;

code = code.replace('{/* Documents */}', replacement + '\n              {/* Documents */}');

if (!code.includes('import {') || !code.includes('Package')) {
  code = code.replace('import { Users, Mail', 'import { Users, Mail, Package');
  code = code.replace('Briefcase, FileText', 'Briefcase, FileText, Package');
}

fs.writeFileSync('src/components/Employees.tsx', code);
