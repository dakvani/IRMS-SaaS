import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Users, Shield, Save, Bell, Database, Check, Sun, Moon, Palette } from 'lucide-react';
import { motion } from 'motion/react';
import { getTheme, applyTheme, ThemeMode } from '../utils/theme';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [theme, setThemeState] = useState<ThemeMode>(getTheme());
  const [notifications, setNotifications] = useState({ 
    assetMaintenance: { email: true, push: false, inApp: true },
    leaveStatus: { email: true, push: true, inApp: true },
    timesheetApprovals: { email: false, push: false, inApp: true }
  });
  const [categories, setCategories] = useState(['Forklift', 'Crane', 'Excavator', 'Laptop', 'Desktop']);
  const [newCategory, setNewCategory] = useState('');
  const [org, setOrg] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [orgName, setOrgName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const token = (window as any)._token;
      if (!token) return;

      const [orgRes, usersRes] = await Promise.all([
        fetch('/api/organization', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (orgRes.ok) {
        const orgData = await orgRes.json();
        setOrg(orgData);
        setOrgName(orgData.name);
      }
      
      if (usersRes.ok) {
        setUsers(await usersRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

useEffect(() => {
    fetchSettings();
    const storedCats = localStorage.getItem('assetCategories');
    if (storedCats) {
      try {
        setCategories(JSON.parse(storedCats));
      } catch (e) {}
    }
  }, []);
  
  useEffect(() => {
    if (categories.length > 0) {
      localStorage.setItem('assetCategories', JSON.stringify(categories));
    }
  }, [categories]);

  const handleSaveOrg = async () => {
    try {
      const token = (window as any)._token;
      const res = await fetch('/api/organization', {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: orgName })
      });
      if (res.ok) {
        alert('Organization updated successfully!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      const token = (window as any)._token;
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        fetchSettings(); // refresh
      } else {
        let error; try { error = await res.json(); } catch(e) { error = { error: 'Server error' }; }
        alert(`Error: ${error.error}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-neutral-500">Loading settings...</div>;
  }

  const roleOptions = [
    { id: 'saas_super_admin', name: 'SaaS Super Admin' },
    { id: 'org_admin', name: 'Organization Admin' },
    { id: 'it_manager', name: 'IT Manager' },
    { id: 'hr_admin', name: 'HR / Employee Admin' },
    { id: 'coordinator', name: 'Coordinator' },
    { id: 'site_supervisor', name: 'Site Supervisor' },
    { id: 'employee', name: 'Employee' }
  ];

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Organization Settings</h1>
          <p className="text-neutral-500 font-medium mt-1">Manage organization profile, users, and roles.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex min-h-[500px]">
        {/* Sidebar */}
        <div className="w-64 border-r border-neutral-200 p-4 bg-neutral-50/30">
          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${activeTab === 'profile' ? 'bg-white text-neutral-900 shadow-sm border border-neutral-200/60' : 'text-neutral-600 hover:bg-neutral-100'}`}
            >
              <SettingsIcon className="w-4 h-4" />
              Organization Profile
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${activeTab === 'users' ? 'bg-white text-neutral-900 shadow-sm border border-neutral-200/60' : 'text-neutral-600 hover:bg-neutral-100'}`}
            >
              <Users className="w-4 h-4" />
              User Management
            </button>
            <button 
              onClick={() => setActiveTab('roles')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${activeTab === 'roles' ? 'bg-white text-neutral-900 shadow-sm border border-neutral-200/60' : 'text-neutral-600 hover:bg-neutral-100'}`}
            >
              <Shield className="w-4 h-4" />
              Roles & Permissions
            </button>
          
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
            <button 
              onClick={() => setActiveTab('theme')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${activeTab === 'theme' ? 'bg-white text-neutral-900 shadow-sm border border-neutral-200/60' : 'text-neutral-600 hover:bg-neutral-100'}`}
            >
              {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-500" /> : <Sun className="w-4 h-4 text-amber-500" />}
              Theme & Appearance
            </button>
          </nav>
        </div>
        
        {/* Content */}
        <div className="flex-1 p-8">
          {activeTab === 'profile' && (
            <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="max-w-xl space-y-6">
              <h3 className="text-lg font-bold text-neutral-900">Organization Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">Organization Name</label>
                  <input 
                    type="text" 
                    value={orgName} 
                    onChange={e => setOrgName(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">Primary Contact Email</label>
                  <input type="email" defaultValue="admin@organization.com" disabled className="w-full px-3 py-2 border border-neutral-200 bg-neutral-50 rounded-lg outline-none text-neutral-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">Timezone</label>
                  <select className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none bg-white">
                    <option>UTC (Universal Coordinated Time)</option>
                    <option>America/New_York</option>
                    <option>Asia/Riyadh</option>
                  </select>
                </div>
                <div className="pt-4 border-t border-neutral-100">
                  <button onClick={handleSaveOrg} className="bg-neutral-900 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-neutral-800 transition-colors">
                    <Save className="w-4 h-4" /> Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div initial={{opacity: 0}} animate={{opacity: 1}}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-neutral-900">System Users</h3>
                <button className="bg-neutral-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors">
                  Invite User
                </button>
              </div>
              <div className="border border-neutral-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-50 sticky top-0 z-10 border-b border-neutral-200 text-neutral-500 font-semibold text-xs">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3 w-48">Change Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {users.map(u => (
                      <tr key={u.id}>
                        <td className="px-4 py-3 font-medium text-neutral-900">{u.name || '-'}</td>
                        <td className="px-4 py-3 text-neutral-600">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            u.role === 'saas_super_admin' ? 'bg-purple-100 text-purple-700' :
                            u.role === 'org_admin' ? 'bg-blue-100 text-blue-700' :
                            'bg-neutral-100 text-neutral-700'
                          }`}>
                            {u.role.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <select 
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="w-full text-xs px-2 py-1.5 bg-white border border-neutral-300 rounded focus:ring-1 focus:ring-neutral-900 outline-none"
                          >
                            {roleOptions.map(r => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'roles' && (
            <motion.div initial={{opacity: 0}} animate={{opacity: 1}}>
              <h3 className="text-lg font-bold text-neutral-900 mb-6">Roles & Permissions</h3>
              <div className="space-y-4">
                {[
                  { id: 'saas_super_admin', name: 'SaaS Super Admin', desc: 'Platform administration', scope: 'All tenants / platform functions' },
                  { id: 'org_admin', name: 'Organization Admin', desc: 'Company administration', scope: 'Entire organization' },
                  { id: 'it_manager', name: 'IT Manager', desc: 'System & infrastructure administration', scope: 'Entire organization + system controls' },
                  { id: 'hr_admin', name: 'HR / Employee Admin', desc: 'Employee records and documents', scope: 'Workforce modules' },
                  { id: 'coordinator', name: 'Coordinator', desc: 'Site operations and daily records', scope: 'Assigned sites/projects' },
                  { id: 'site_supervisor', name: 'Site Supervisor', desc: 'Site attendance and operational visibility', scope: 'Assigned site' },
                  { id: 'employee', name: 'Employee', desc: 'Self-service', scope: 'Own records' }
                ].map(role => (
                  <div key={role.id} className="p-4 border border-neutral-200 rounded-xl flex justify-between items-center hover:border-neutral-300 transition-colors bg-white">
                    <div>
                      <h4 className="font-bold text-neutral-900">{role.name}</h4>
                      <p className="text-sm text-neutral-500 mt-1">{role.desc} • <span className="font-medium text-neutral-700">Scope:</span> {role.scope}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          {activeTab === 'notifications' && (
            <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="max-w-2xl">
              <h3 className="text-lg font-bold text-neutral-900 mb-6">Notification Preferences</h3>
              <div className="space-y-6">
                {Object.entries(notifications).map(([key, prefs]: [string, any]) => (
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

          {activeTab === 'theme' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl space-y-6">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 tracking-tight">Theme & Appearance</h3>
                <p className="text-sm text-neutral-500 mt-1">
                  Customize the interface theme. Switch between light and dark modes to suit your work environment.
                </p>
              </div>

              {/* Direct Simple UI Toggle */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                      theme === 'dark' ? 'bg-indigo-950 text-indigo-400' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {theme === 'dark' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900 text-base">
                        {theme === 'dark' ? 'Dark Theme Active' : 'Light Theme Active'}
                      </h4>
                      <p className="text-xs text-neutral-500">
                        {theme === 'dark' 
                          ? 'Optimized for low-light conditions with higher contrast.' 
                          : 'Standard high-readability daylight workspace.'}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <div className="flex items-center gap-3 bg-neutral-100 p-1.5 rounded-full border border-neutral-200">
                    <button
                      type="button"
                      onClick={() => {
                        setThemeState('light');
                        applyTheme('light');
                      }}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                        theme === 'light'
                          ? 'bg-white text-neutral-900 shadow-sm'
                          : 'text-neutral-500 hover:text-neutral-900'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      Light
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setThemeState('dark');
                        applyTheme('dark');
                      }}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                        theme === 'dark'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-neutral-500 hover:text-neutral-900'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" />
                      Dark
                    </button>
                  </div>
                </div>
              </div>

              {/* Visual Selection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Light Card */}
                <div
                  onClick={() => {
                    setThemeState('light');
                    applyTheme('light');
                  }}
                  className={`cursor-pointer rounded-2xl border-2 p-5 transition-all text-left relative ${
                    theme === 'light'
                      ? 'border-indigo-600 bg-indigo-50/20 shadow-md ring-2 ring-indigo-600/10'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sun className="w-5 h-5 text-amber-500" />
                      <span className="font-bold text-neutral-900 text-sm">Light Mode</span>
                    </div>
                    {theme === 'light' && (
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  
                  {/* Miniature Mockup */}
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 space-y-2 mb-3">
                    <div className="flex items-center justify-between h-4 bg-white rounded border border-neutral-200 px-2">
                      <div className="w-8 h-1.5 bg-neutral-300 rounded"></div>
                      <div className="w-4 h-1.5 bg-neutral-200 rounded"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <div className="h-7 bg-white rounded border border-neutral-200 p-1">
                        <div className="w-4 h-1 bg-indigo-400 rounded"></div>
                      </div>
                      <div className="h-7 bg-white rounded border border-neutral-200 p-1">
                        <div className="w-5 h-1 bg-neutral-300 rounded"></div>
                      </div>
                      <div className="h-7 bg-white rounded border border-neutral-200 p-1">
                        <div className="w-3 h-1 bg-neutral-300 rounded"></div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-500">
                    Clean, crisp white interface designed for daytime productivity.
                  </p>
                </div>

                {/* Dark Card */}
                <div
                  onClick={() => {
                    setThemeState('dark');
                    applyTheme('dark');
                  }}
                  className={`cursor-pointer rounded-2xl border-2 p-5 transition-all text-left relative ${
                    theme === 'dark'
                      ? 'border-indigo-600 bg-indigo-950/20 shadow-md ring-2 ring-indigo-600/10'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Moon className="w-5 h-5 text-indigo-400" />
                      <span className="font-bold text-neutral-900 text-sm">Dark Mode</span>
                    </div>
                    {theme === 'dark' && (
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  
                  {/* Miniature Dark Mockup */}
                  <div className="rounded-xl border border-slate-700 bg-slate-900 p-2.5 space-y-2 mb-3">
                    <div className="flex items-center justify-between h-4 bg-slate-800 rounded border border-slate-700 px-2">
                      <div className="w-8 h-1.5 bg-slate-500 rounded"></div>
                      <div className="w-4 h-1.5 bg-slate-600 rounded"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <div className="h-7 bg-slate-800 rounded border border-slate-700 p-1">
                        <div className="w-4 h-1 bg-indigo-500 rounded"></div>
                      </div>
                      <div className="h-7 bg-slate-800 rounded border border-slate-700 p-1">
                        <div className="w-5 h-1 bg-slate-600 rounded"></div>
                      </div>
                      <div className="h-7 bg-slate-800 rounded border border-slate-700 p-1">
                        <div className="w-3 h-1 bg-slate-600 rounded"></div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-500">
                    High contrast dark palette engineered to minimize glare and fatigue.
                  </p>
                </div>
              </div>
            </motion.div>
          )}


        </div>
      </div>
    </div>
  );
}