import re

with open('src/components/Employees.tsx', 'r') as f:
    content = f.read()

# Make it support an activeProfileTab state
if 'const [activeProfileTab, setActiveProfileTab] = useState' not in content:
    content = content.replace("const [showAssignForm, setShowAssignForm] = useState(false);", 
        "const [showAssignForm, setShowAssignForm] = useState(false);\n  const [activeProfileTab, setActiveProfileTab] = useState<'overview' | 'resources'>('overview');")

tabs_html = """
            <div className="flex border-b border-neutral-100 mb-6">
              <button onClick={() => setActiveProfileTab('overview')} className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeProfileTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}>Overview & Assignments</button>
              <button onClick={() => setActiveProfileTab('resources')} className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeProfileTab === 'resources' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}>Resource Summary</button>
            </div>
            
            {activeProfileTab === 'overview' && (
"""

# Inject the tabs HTML before the grid
content = content.replace('<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">', tabs_html + '<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">')

# Close the activeProfileTab condition and add the resources tab
resources_html = """
            )}
            
            {activeProfileTab === 'resources' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
                  <h3 className="font-bold text-neutral-900 mb-4 pb-2 border-b border-neutral-100 flex items-center gap-2"><Package className="w-5 h-5 text-indigo-600" /> Aggregated Resources & Assets</h3>
                  <p className="text-sm text-neutral-500 mb-6">A complete summary of all assets, vehicles, and equipment currently assigned to {selectedEmployee?.name || selectedEmployee?.firstName}.</p>
                  
                  {isLoadingProfile ? (
                    <p className="text-neutral-400 text-sm">Loading resources...</p>
                  ) : employeeAssets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {employeeAssets.map((asset: any) => (
                        <div key={asset.id} className="border border-neutral-100 rounded-xl p-4 hover:border-indigo-200 bg-neutral-50/50 transition-colors flex items-start gap-4">
                          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                             {asset.type?.toLowerCase() === 'vehicle' ? <Truck className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-bold text-neutral-900">{asset.name}</p>
                            <p className="text-sm text-neutral-500 font-mono mt-0.5">{asset.assetTag}</p>
                            <div className="mt-2 flex gap-2">
                               <span className="text-[10px] font-bold uppercase bg-white border border-neutral-200 text-neutral-600 px-2 py-0.5 rounded">{asset.type}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                      <Package className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                      <p className="text-neutral-500 text-sm">No resources currently assigned.</p>
                    </div>
                  )}
                </div>
                
                <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
                  <h3 className="font-bold text-neutral-900 mb-4 pb-2 border-b border-neutral-100 flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-600" /> Training & Certifications</h3>
                  {isLoadingProfile ? (
                    <p className="text-neutral-400 text-sm">Loading certifications...</p>
                  ) : documents.filter((d:any) => d.documentType?.toLowerCase().includes('cert')).length > 0 ? (
                    <div className="space-y-3">
                      {documents.filter((d:any) => d.documentType?.toLowerCase().includes('cert')).map((doc: any) => (
                        <div key={doc.id} className="border border-neutral-100 rounded-xl p-4 hover:border-indigo-200 bg-neutral-50/50 transition-colors flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5" />
                             </div>
                             <div>
                               <p className="font-bold text-neutral-900">{doc.documentType}</p>
                               <p className="text-xs text-neutral-500 mt-1">Issued: {doc.issueDate ? new Date(doc.issueDate).toLocaleDateString() : 'N/A'}</p>
                             </div>
                          </div>
                          {doc.expiryDate && (
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-neutral-400 uppercase">Expires</p>
                              <p className="text-sm font-medium text-neutral-700">{new Date(doc.expiryDate).toLocaleDateString()}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                      <FileText className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                      <p className="text-neutral-500 text-sm">No training certifications on file.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
"""

content = content.replace('</div>\n          </motion.div>', '</div>\n' + resources_html + '\n          </motion.div>')

# Ensure Truck icon is imported
if 'Truck' not in content:
    content = content.replace("import { Users", "import { Truck, Users")

with open('src/components/Employees.tsx', 'w') as f:
    f.write(content)

