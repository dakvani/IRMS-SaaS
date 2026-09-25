code = """
import React, { useEffect, useState } from 'react';
import { Users, MapPin, Briefcase, Package, ArrowUpRight, Clock, ShieldCheck, TrendingUp, MoreHorizontal, AlertTriangle, FileText, Activity } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'motion/react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalSites: 0,
    totalProjects: 0,
    totalAssets: 0
  });
  const [expiringDocs, setExpiringDocs] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = (window as any)._token;
        if (!token) throw new Error("No auth token");
        
        const [statsRes, docsRes, logsRes] = await Promise.all([
          fetch('/api/dashboard/stats', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/employee-documents', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/audit-logs?limit=8', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        if (statsRes.ok) setStats(await statsRes.json());
        if (docsRes.ok) {
          const allDocs = await docsRes.json();
          const now = new Date();
          const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          const expiring = allDocs.filter((d: any) => {
            if (!d.expiryDate) return false;
            const exp = new Date(d.expiryDate);
            return exp > now && exp <= thirtyDays && d.status !== 'expired';
          });
          setExpiringDocs(expiring);
        }
        if (logsRes && logsRes.ok) {
          const logs = await logsRes.json();
          setRecentLogs(logs);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
      </div>
    );
  }

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="h-full flex flex-col gap-8 overflow-y-auto custom-scrollbar pb-8">
      <div className="flex justify-between items-end">
        <motion.div variants={item}>
          <h1 className="text-3xl font-bold text-neutral-950 tracking-tight">Dashboard Overview</h1>
          <p className="text-neutral-500 mt-1 font-medium">Welcome back. Here's your operational snapshot.</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          title="Total Workforce" 
          value={stats.totalEmployees} 
          icon={<Users className="w-6 h-6 text-indigo-600" />} 
          trend="+12%" 
          bg="bg-indigo-50" 
          variants={item} 
        />
        <StatCard 
          title="Active Sites" 
          value={stats.totalSites} 
          icon={<MapPin className="w-6 h-6 text-emerald-600" />} 
          trend="+3%" 
          bg="bg-emerald-50" 
          variants={item} 
        />
        <StatCard 
          title="Ongoing Projects" 
          value={stats.totalProjects} 
          icon={<Briefcase className="w-6 h-6 text-blue-600" />} 
          trend="Steady" 
          bg="bg-blue-50" 
          variants={item} 
        />
        <StatCard 
          title="Managed Assets" 
          value={stats.totalAssets} 
          icon={<Package className="w-6 h-6 text-orange-600" />} 
          trend="+5%" 
          bg="bg-orange-50" 
          variants={item} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <ChartSection variants={item} />
          <HeatmapSection variants={item} />
        </div>
        <div className="flex flex-col gap-6">
          <motion.div variants={item} className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 flex flex-col h-[500px]">
             <h3 className="font-bold text-lg text-neutral-900 tracking-tight mb-4 flex items-center gap-2">
               <Activity className="w-5 h-5 text-indigo-600" /> System Activity Feed
             </h3>
             <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                {recentLogs.length > 0 ? recentLogs.map((log: any) => (
                  <div key={log.id} className="flex gap-4">
                     <div className="mt-1 flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-200"></div>
                        <div className="w-px h-full bg-neutral-200 mt-2"></div>
                     </div>
                     <div className="pb-4">
                        <p className="text-sm font-bold text-neutral-900 leading-tight">{log.action}</p>
                        <p className="text-xs text-neutral-600 mt-1 leading-snug">{log.details}</p>
                        <p className="text-[10px] uppercase font-bold text-neutral-400 mt-1.5">{new Date(log.createdAt).toLocaleString()}</p>
                     </div>
                  </div>
                )) : (
                  <p className="text-neutral-500 text-sm text-center pt-8">No recent activity.</p>
                )}
             </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ title, value, icon, trend, bg, variants }: { title: string, value: number, icon: React.ReactNode, trend: string, bg: string, variants: any }) {
  return (
    <motion.div 
      variants={variants}
      whileHover={{ y: -4, boxShadow: '0 20px 40px -12px rgba(79, 70, 229, 0.15)' }}
      className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 flex flex-col transition-all duration-300 relative overflow-hidden group"
    >
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 rounded-xl ${bg} ring-4 ring-white shadow-inner`}>{icon}</div>
        <span className="text-xs font-bold text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full">{trend}</span>
      </div>
      <div>
        <p className="text-sm font-semibold text-neutral-500 mb-1">{title}</p>
        <h3 className="text-3xl font-black text-neutral-900 tracking-tight">{value}</h3>
      </div>
    </motion.div>
  );
}

function ChartSection({ variants }: { variants: any }) {
  const data = [
    { name: 'Mon', employees: 400, assets: 240 },
    { name: 'Tue', employees: 300, assets: 139 },
    { name: 'Wed', employees: 200, assets: 980 },
    { name: 'Thu', employees: 278, assets: 390 },
    { name: 'Fri', employees: 189, assets: 480 },
    { name: 'Sat', employees: 239, assets: 380 },
    { name: 'Sun', employees: 349, assets: 430 },
  ];
  return (
    <motion.div variants={variants} className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
      <div className="mb-6">
        <h3 className="font-bold text-lg text-indigo-600 tracking-tight">Resource & Project Occupancy</h3>
        <p className="text-sm text-neutral-500 font-medium">Weekly trends across all active sites and projects</p>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorEmp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#a3a3a3', fontSize: 12}} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#a3a3a3', fontSize: 12}} dx={-10} />
            <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'}} />
            <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '20px'}} />
            <Area type="monotone" dataKey="employees" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorEmp)" />
            <Area type="monotone" dataKey="assets" stroke="#10b981" strokeWidth={3} fillOpacity={0} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

function HeatmapSection({ variants }: { variants: any }) {
  const sites = ['Site A (Riyadh)', 'Site B (Jeddah)', 'Project X (Dammam)', 'HQ', 'Storage Warehouse'];
  const assetTypes = ['Heavy Machinery', 'Light Vehicles', 'IT Equipment', 'Power Tools', 'Generators'];

  // Mock utilization data 0 to 4
  const getIntensity = (rIndex: number, cIndex: number) => {
    return Math.floor(Math.sin((rIndex + 1) * (cIndex + 1)) * 2 + 2); // Pseudo-random 0-4
  };

  const getColor = (intensity: number) => {
    switch(intensity) {
      case 0: return 'bg-neutral-50 border border-neutral-100'; // underused
      case 1: return 'bg-indigo-100 border border-indigo-200';
      case 2: return 'bg-indigo-300 border border-indigo-400';
      case 3: return 'bg-indigo-500 border border-indigo-600';
      case 4: return 'bg-rose-500 border border-rose-600'; // overused
      default: return 'bg-neutral-100';
    }
  };

  return (
    <motion.div variants={variants} className="bg-white rounded-2xl border border-neutral-200 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h3 className="font-bold text-lg text-indigo-600 tracking-tight">Asset & Vehicle Utilization Heatmap</h3>
          <p className="text-sm text-neutral-500 font-medium">Identify underused and overused resources across sites</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 mb-1">
          <span>Underused</span>
          <div className="w-3 h-3 rounded-sm bg-neutral-50 border border-neutral-200"></div>
          <div className="w-3 h-3 rounded-sm bg-indigo-300"></div>
          <div className="w-3 h-3 rounded-sm bg-indigo-500"></div>
          <div className="w-3 h-3 rounded-sm bg-rose-500"></div>
          <span>Overused</span>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="flex mb-2">
            <div className="w-40 shrink-0"></div>
            {assetTypes.map((type, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 text-center px-1">
                  {type}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2.5">
            {sites.map((site, rIndex) => (
              <div key={site} className="flex items-center group">
                <div className="w-40 shrink-0 text-sm font-semibold text-neutral-700 truncate pr-4 group-hover:text-indigo-600 transition-colors">
                  {site}
                </div>
                {assetTypes.map((_, cIndex) => {
                  const intensity = getIntensity(rIndex, cIndex);
                  return (
                    <div key={cIndex} className="flex-1 px-1">
                      <div 
                        className={`h-10 w-full rounded-lg ${getColor(intensity)} transition-all duration-200 hover:ring-2 hover:ring-offset-2 hover:ring-neutral-400 hover:scale-105 cursor-pointer`}
                        title={`${site} - ${assetTypes[cIndex]} | Utilization: ${intensity === 4 ? 'OVERUSED' : intensity === 0 ? 'IDLE' : 'NORMAL'}`}
                      ></div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
"""

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(code)
