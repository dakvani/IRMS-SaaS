import fs from 'fs';
let code = fs.readFileSync('src/components/Employees.tsx', 'utf-8');

// Add state for employeeAssets
code = code.replace(
  /const \[documents, setDocuments\] = useState<any\[\]>\(\[\]\);/,
  `const [documents, setDocuments] = useState<any[]>([]);\n  const [employeeAssets, setEmployeeAssets] = useState<any[]>([]);`
);

// Add fetch to fetchProfileData
code = code.replace(
  /const \[assRes, docRes\] = await Promise\.all\(\[/,
  `const [assRes, docRes, assetRes] = await Promise.all([`
);
code = code.replace(
  /fetch\('\/api\/employee-documents'.*?\)\s*\]\);/,
  `fetch('/api/employee-documents', { headers: { Authorization: \`Bearer \${token}\` } }),\n        fetch(\`/api/employees/\${empId}/assets\`, { headers: { Authorization: \`Bearer \${token}\` } })\n      ]);`
);
code = code.replace(
  /setDocuments\(allDocs\.filter\(\(d: any\) => d\.employee\?\.id === empId\)\);\s*\}/,
  `setDocuments(allDocs.filter((d: any) => d.employee?.id === empId));\n      }\n\n      if (assetRes.ok) {\n        setEmployeeAssets(await assetRes.json());\n      }`
);

// Add display for assigned assets in the profile view
const assetDisplayCode = `
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm col-span-1 md:col-span-2 lg:col-span-3">
                <h4 className="font-bold text-neutral-900 mb-4 flex items-center gap-2"><Package className="w-5 h-5 text-amber-500" /> Assigned Assets</h4>
                {employeeAssets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {employeeAssets.map(asset => (
                      <div key={asset.id} className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-sm text-neutral-900">{asset.name}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">{asset.assetTag} &bull; {asset.type}</p>
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-[10px] font-bold uppercase">{asset.status}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-6 bg-neutral-50 rounded-xl border border-neutral-100 text-sm text-neutral-500">
                    No assets currently assigned to this employee.
                  </div>
                )}
              </div>
`;

// Insert after the Documents section
code = code.replace(
  /(<h4 className="font-bold text-neutral-900 mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-600" \/> Documents<\/h4>[\s\S]*?<\/div>\s*<\/div>)/,
  `$1\n${assetDisplayCode}`
);

// Import Package if not already imported
if (!code.includes('Package,')) {
  code = code.replace(/import \{ (.*) \} from 'lucide-react';/, `import { $1, Package } from 'lucide-react';`);
}

fs.writeFileSync('src/components/Employees.tsx', code);
