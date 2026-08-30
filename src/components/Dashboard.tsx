import React, { useEffect, useState } from 'react';
import { Users, MapPin, Briefcase, Package, ArrowUpRight, Clock, ShieldCheck, TrendingUp, MoreHorizontal, AlertTriangle, FileText, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
          fetch('/api/audit-logs?limit=5', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        if (statsRes.ok) setStats(await statsRes.json());
        if (docsRes.ok) {
          const allDocs = await docsRes.json();
          // Filter docs expiring in the next 30 days
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
          setRecentLogs(logs.slice(0, 5));
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

  const chartData = [
    { name: 'Jan', value: 40 },
    { name: 'Feb', value: 30 },
    { name: 'Mar', value: 20 },
    { name: 'Apr', value: 27 },
    { name: 'May', value: 18 },
    { name: 'Jun', value: 23 },
    { name: 'Jul', value: 34 },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 border border-red-100 rounded-lg text-sm font-medium">
        {error}
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

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
          title="Total Employees" 
          value={stats.totalEmployees} 
          icon={<Users className="w-5 h-5 text-indigo-600" />} 
          trend="+12%" 
          bg="bg-neutral-100"
          variants={item}
        />
        <StatCard 
          title="Active Sites" 
          value={stats.totalSites} 
          icon={<MapPin className="w-5 h-5 text-indigo-600" />} 
          trend="+2" 
          bg="bg-neutral-100"
          variants={item}
        />
        <StatCard 
          title="Active Projects" 
          value={stats.totalProjects} 
          icon={<Briefcase className="w-5 h-5 text-indigo-600" />} 
          trend="Stable" 
          bg="bg-neutral-100"
          variants={item}
        />
        <StatCard 
          title="Total Assets" 
          value={stats.totalAssets} 
          icon={<Package className="w-5 h-5 text-indigo-600" />} 
          trend="+5" 
          bg="bg-neutral-100"
          variants={item}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={item} className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6 flex flex-col h-full">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="font-bold text-lg text-indigo-600 tracking-tight">Activity Overview</h3>
              <p className="text-sm text-neutral-500 font-medium">Headcount deployment over time</p>
            </div>
            <select className="text-sm font-medium bg-neutral-50 border border-neutral-200 text-neutral-700 py-2 pl-3 pr-8 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="h-72 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#a3a3a3', fontSize: 12, fontWeight: 500}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#a3a3a3', fontSize: 12, fontWeight: 500}} />
                <Tooltip 
                  cursor={{fill: '#fafafa'}} 
                  contentStyle={{borderRadius: '12px', border: '1px solid #e5e5e5', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', fontWeight: 600, color: '#171717'}}
                />
                <Bar dataKey="value" fill="#171717" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={item} className="bg-white rounded-2xl border border-neutral-200 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-indigo-600 tracking-tight">Quick Actions</h3>
            <button className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors">
              <MoreHorizontal className="w-5 h-5 text-neutral-400" />
            </button>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
            {expiringDocs.length > 0 ? (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Expiring Soon (30 Days)</span>
                </div>
                {expiringDocs.slice(0, 3).map(doc => (
                  <ActionCard 
                    key={doc.id}
                    title={doc.documentType} 
                    subtitle={`${doc.employee?.firstName} ${doc.employee?.lastName} - Expires ${new Date(doc.expiryDate).toLocaleDateString()}`} 
                    icon={<FileText className="w-5 h-5 text-amber-600" />} 
                    bgClass="bg-amber-50"
                  />
                ))}
              </div>
            ) : null}
            <div className="flex items-center gap-2 mb-3 mt-4">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Common Actions</span>
            </div>
            <ActionCard title="Approve Timesheets" subtitle="12 pending approval" icon={<Clock className="w-5 h-5 text-indigo-600" />} bgClass="bg-indigo-50" />
            <ActionCard title="Review Leaves" subtitle="3 requests" icon={<ShieldCheck className="w-5 h-5 text-indigo-600" />} bgClass="bg-indigo-50" />
          </div>
        </motion.div>
      </div>
      
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
      <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none translate-x-4 -translate-y-4">
        {icon}
      </div>
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 rounded-xl ${bg} ring-4 ring-white shadow-inner`}>
          {icon}
        </div>
        <div className="flex items-center text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1.5 rounded-full border border-indigo-100">
          <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
          {trend}
        </div>
      </div>
      <div>
        <h4 className="text-4xl font-extrabold text-neutral-950 mb-1 tracking-tight">{value}</h4>
        <p className="text-sm font-semibold text-neutral-500">{title}</p>
      </div>
    </motion.div>
  );
}

function ActionCard({ title, subtitle, icon, bgClass = "bg-neutral-100" }: { title: string, subtitle: string, icon: React.ReactNode, bgClass?: string, key?: React.Key }) {
  return (
    <button className="w-full flex items-center p-4 hover:bg-neutral-50 rounded-xl transition-all duration-200 border border-transparent hover:border-neutral-200 hover:shadow-sm text-left group mb-2">
      <div className={`p-3 rounded-xl ${bgClass} mr-4 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div>
        <div className="font-bold text-indigo-600 text-sm tracking-tight">{title}</div>
        <div className="text-xs font-medium text-neutral-500 mt-0.5">{subtitle}</div>
      </div>
    </button>
  );
}


function WorkloadHeatmap({ variants }: { variants: any }) {
  const today = new Date();
  
  // Generate next 14 days (3 days ago to 10 days from now)
  const days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - 3 + i);
    return d;
  });

  const resources = [
    "Design Engineering",
    "Site A Excavation",
    "Site B Foundation",
    "Safety Inspections",
    "Logistics & Delivery"
  ];

  const getIntensity = (rIndex: number, dIndex: number) => {
     // Predictable pseudo-random variation
     const val = Math.sin(rIndex * 2.5 + dIndex) * Math.cos(dIndex * 1.5) * 2 + 2;
     return Math.max(0, Math.min(4, Math.round(val)));
  };

  const getColor = (intensity: number) => {
    switch(intensity) {
      case 0: return 'bg-neutral-100';
      case 1: return 'bg-neutral-300';
      case 2: return 'bg-neutral-500';
      case 3: return 'bg-neutral-700';
      case 4: return 'bg-neutral-900';
      default: return 'bg-neutral-100';
    }
  };

  return (
    <motion.div variants={variants} className="bg-white rounded-2xl border border-neutral-200 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6 mt-2">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h3 className="font-bold text-lg text-indigo-600 tracking-tight">Team Workload Heatmap</h3>
          <p className="text-sm text-neutral-500 font-medium">Resource utilization & upcoming task deadlines</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 mb-1">
          <span>Available</span>
          <div className="w-3 h-3 rounded-sm bg-neutral-100"></div>
          <div className="w-3 h-3 rounded-sm bg-neutral-300"></div>
          <div className="w-3 h-3 rounded-sm bg-neutral-500"></div>
          <div className="w-3 h-3 rounded-sm bg-neutral-700"></div>
          <div className="w-3 h-3 rounded-sm bg-neutral-900"></div>
          <span>At Capacity</span>
        </div>
      </div>
      
      <div className="overflow-x-auto custom-scrollbar pb-2">
        <div className="min-w-[700px]">
          <div className="flex mb-3">
            <div className="w-40 shrink-0"></div>
            {days.map((d, i) => {
              const isToday = i === 3;
              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${isToday ? 'text-indigo-600' : 'text-neutral-400'}`}>
                    {d.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span className={`text-xs font-semibold mt-1 ${isToday ? 'bg-neutral-900 text-white px-2 py-0.5 rounded-md shadow-sm' : 'text-neutral-500'}`}>
                    {d.getDate()} {d.toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                </div>
              );
            })}
          </div>
          
          <div className="space-y-2.5">
            {resources.map((res, rIndex) => (
              <div key={res} className="flex items-center group">
                <div className="w-40 shrink-0 text-sm font-semibold text-neutral-700 truncate pr-4 group-hover:text-indigo-600 transition-colors">
                  {res}
                </div>
                {days.map((_, dIndex) => {
                  const intensity = getIntensity(rIndex, dIndex);
                  return (
                    <div key={dIndex} className="flex-1 px-1">
                      <div 
                        className={`h-10 w-full rounded-lg ${getColor(intensity)} transition-all duration-200 hover:ring-2 hover:ring-offset-2 hover:ring-neutral-400 hover:scale-105 cursor-pointer`}
                        title={`${res} - Load Level: ${intensity}/4`}
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
