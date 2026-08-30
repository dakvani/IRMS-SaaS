import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Users, Shield, Save } from 'lucide-react';
import { motion } from 'motion/react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
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
  }, []);

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
        </div>
      </div>
    </div>
  );
}
