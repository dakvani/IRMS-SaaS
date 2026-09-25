with open("src/components/Settings.tsx", "r") as f:
    content = f.read()

# Add to sidebar
nav_end_idx = content.find("</nav>")
nav_add = """
            <button 
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${activeTab === 'notifications' ? 'bg-white text-neutral-900 shadow-sm border border-neutral-200/60' : 'text-neutral-600 hover:bg-neutral-100'}`}
            >
              <Bell className="w-4 h-4" />
              Notifications
            </button>
            <button 
              onClick={() => setActiveTab('asset-categories')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${activeTab === 'asset-categories' ? 'bg-white text-neutral-900 shadow-sm border border-neutral-200/60' : 'text-neutral-600 hover:bg-neutral-100'}`}
            >
              <Database className="w-4 h-4" />
              Asset Categories
            </button>
"""
content = content[:nav_end_idx] + nav_add + content[nav_end_idx:]

# Add tab contents
content_end_idx = content.rfind("</div>      </div>    </div>  );}")
tab_contents = """
          {activeTab === 'notifications' && (
            <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="max-w-2xl">
              <h3 className="text-lg font-bold text-neutral-900 mb-6">Notification Preferences</h3>
              <div className="space-y-6">
                {Object.entries(notifications).map(([key, prefs]) => (
                   <div key={key} className="bg-white border border-neutral-200 rounded-xl p-5">
                      <h4 className="font-bold text-neutral-900 mb-4 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                      <div className="flex items-center gap-8">
                         <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={prefs.email} onChange={(e) => setNotifications({...notifications, [key]: {...prefs, email: e.target.checked}})} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                            <span className="text-sm font-medium text-neutral-700">Email</span>
                         </label>
                         <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={prefs.push} onChange={(e) => setNotifications({...notifications, [key]: {...prefs, push: e.target.checked}})} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                            <span className="text-sm font-medium text-neutral-700">Push</span>
                         </label>
                         <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={prefs.inApp} onChange={(e) => setNotifications({...notifications, [key]: {...prefs, inApp: e.target.checked}})} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                            <span className="text-sm font-medium text-neutral-700">In-App</span>
                         </label>
                      </div>
                   </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'asset-categories' && (
            <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="max-w-2xl">
              <h3 className="text-lg font-bold text-neutral-900 mb-2">Asset Categorization Wizard</h3>
              <p className="text-sm text-neutral-500 mb-6">Define custom asset sub-categories and groups. These will be available in dropdowns when adding or editing assets.</p>
              
              <div className="bg-white border border-neutral-200 rounded-xl p-6 mb-6 shadow-sm">
                 <form onSubmit={(e) => {
                    e.preventDefault();
                    if(newCategory.trim() && !categories.includes(newCategory.trim())) {
                       setCategories([...categories, newCategory.trim()]);
                       setNewCategory('');
                    }
                 }} className="flex items-end gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">New Category Name</label>
                      <input type="text" placeholder="e.g. Heavy Machinery" value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" />
                    </div>
                    <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors h-[38px]">
                      Add Category
                    </button>
                 </form>
              </div>

              <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
                 <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold">
                       <tr><th className="px-6 py-3">Category Name</th><th className="px-6 py-3 w-24 text-right">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                       {categories.map((cat, i) => (
                          <tr key={i} className="hover:bg-neutral-50">
                             <td className="px-6 py-3 font-medium text-neutral-900">{cat}</td>
                             <td className="px-6 py-3 text-right">
                                <button onClick={() => setCategories(categories.filter(c => c !== cat))} className="text-red-500 hover:text-red-700 text-sm font-medium">Remove</button>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
            </motion.div>
          )}
"""

content = content[:content_end_idx] + tab_contents + content[content_end_idx:]

with open("src/components/Settings.tsx", "w") as f:
    f.write(content)
