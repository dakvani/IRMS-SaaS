import re

with open('src/components/Settings.tsx', 'r') as f:
    content = f.read()

# Make the following changes:
# 1. Add Bell, Database, Check to lucide-react imports
# 2. Add 'notifications' and 'asset-names' to tabs
# 3. Add rendering logic for the new tabs

new_imports = "import { Settings as SettingsIcon, Users, Shield, Save, Bell, Database, Check } from 'lucide-react';"
content = re.sub(r"import { Settings as SettingsIcon, Users, Shield, Save } from 'lucide-react';", new_imports, content)

# Find the tabs definition:
# <button onClick={() => setActiveTab('profile')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'profile' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}>Profile</button>
# Add our new tabs there.
tabs_code = """
              <button onClick={() => setActiveTab('profile')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'profile' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}>Profile</button>
              <button onClick={() => setActiveTab('organization')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'organization' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}>Organization</button>
              <button onClick={() => setActiveTab('users')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'users' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}>Users & Roles</button>
              <button onClick={() => setActiveTab('notifications')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'notifications' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}>Notifications</button>
              <button onClick={() => setActiveTab('asset-names')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'asset-names' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}>Asset Names</button>
"""

content = re.sub(r"<button onClick=\{\(\) => setActiveTab\('profile'\)\}.*?</button>.*?<button onClick=\{\(\) => setActiveTab\('users'\)\}.*?</button>", tabs_code.strip(), content, flags=re.DOTALL)


# Add state variables right after activeTab:
# const [notifications, setNotifications] = useState({ email: true, push: false, inApp: true });
states_code = """
  const [activeTab, setActiveTab] = useState('profile');
  const [notifications, setNotifications] = useState({ 
    assetMaintenance: { email: true, push: false, inApp: true },
    leaveStatus: { email: true, push: true, inApp: true },
    timesheetApprovals: { email: false, push: false, inApp: true }
  });
  const [commonAssetNames, setCommonAssetNames] = useState(['Forklift', 'Crane', 'Excavator', 'Laptop', 'Desktop']);
  const [newAssetName, setNewAssetName] = useState('');
"""
content = re.sub(r"const \[activeTab, setActiveTab\] = useState\('profile'\);", states_code.strip(), content)


# And the views!
views_code = """
              {/* Asset Names Tab */}
              {activeTab === 'asset-names' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2"><Database className="w-5 h-5 text-indigo-600"/> Common Asset Names</h3>
                    <p className="text-sm text-neutral-500 mt-1">Manage common asset names for dropdown menus. Only privileged users can edit this.</p>
                  </div>
                  <div className="bg-white border border-neutral-200 rounded-2xl p-6">
                    <div className="flex gap-3 mb-6">
                       <input 
                         type="text" 
                         value={newAssetName} 
                         onChange={e => setNewAssetName(e.target.value)}
                         placeholder="Add new asset name..." 
                         className="flex-1 px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20"
                       />
                       <button onClick={() => { if(newAssetName) { setCommonAssetNames([...commonAssetNames, newAssetName]); setNewAssetName(''); } }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700">Add</button>
                    </div>
                    <div className="space-y-2">
                       {commonAssetNames.map((name, i) => (
                          <div key={i} className="flex justify-between items-center p-3 bg-neutral-50 border border-neutral-100 rounded-xl">
                             <span className="font-medium text-neutral-700 text-sm">{name}</span>
                             <button onClick={() => setCommonAssetNames(commonAssetNames.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 bg-white border border-neutral-200 rounded-lg shadow-sm">Remove</button>
                          </div>
                       ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2"><Bell className="w-5 h-5 text-indigo-600"/> Notification Preferences</h3>
                    <p className="text-sm text-neutral-500 mt-1">Choose how you want to be notified for specific resource events.</p>
                  </div>
                  <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-neutral-50">
                        <tr>
                          <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase">Event</th>
                          <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase text-center">Email</th>
                          <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase text-center">Push</th>
                          <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase text-center">In-App</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {Object.entries(notifications).map(([key, prefs]) => (
                           <tr key={key}>
                             <td className="px-6 py-4 font-medium text-neutral-900 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</td>
                             <td className="px-6 py-4 text-center"><input type="checkbox" checked={prefs.email} onChange={() => setNotifications({...notifications, [key]: {...prefs, email: !prefs.email}})} className="w-4 h-4 text-indigo-600 rounded" /></td>
                             <td className="px-6 py-4 text-center"><input type="checkbox" checked={prefs.push} onChange={() => setNotifications({...notifications, [key]: {...prefs, push: !prefs.push}})} className="w-4 h-4 text-indigo-600 rounded" /></td>
                             <td className="px-6 py-4 text-center"><input type="checkbox" checked={prefs.inApp} onChange={() => setNotifications({...notifications, [key]: {...prefs, inApp: !prefs.inApp}})} className="w-4 h-4 text-indigo-600 rounded" /></td>
                           </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end">
                     <button className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 flex items-center gap-2"><Save className="w-4 h-4" /> Save Preferences</button>
                  </div>
                </div>
              )}
            </div>
          </div>
"""

content = re.sub(r"</div>\s*</div>\s*</motion.div>\s*</div>\s*\);\s*}", views_code + "\n          </motion.div>\n        </div>\n  );\n}", content)

with open('src/components/Settings.tsx', 'w') as f:
    f.write(content)
