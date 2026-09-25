
import React, { useEffect, useState, useMemo } from 'react';
import { Users, MapPin, Briefcase, Package, ArrowUpRight, Clock, ShieldCheck, TrendingUp, MoreHorizontal, AlertTriangle, FileText, Activity, Search, X, Home, Truck, User, ChevronRight, FileDown } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'motion/react';
import EmployeeDossierModal from './EmployeeDossierModal.tsx';
import DashboardKpiSummary from './DashboardKpiSummary.tsx';
import DashboardQuickActions from './DashboardQuickActions.tsx';
import KpiSummaryPdfModal from './KpiSummaryPdfModal.tsx';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    totalSites: 0,
    totalProjects: 0,
    ongoingProjects: 0,
    totalAssets: 0,
    assignedAssets: 0,
    resourceUtilizationPercentage: 0
  });
  const [expiringDocs, setExpiringDocs] = useState<any[]>([]);
  const [upcomingMaintenance, setUpcomingMaintenance] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Personnel 360° Search State
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedDossierEmpId, setSelectedDossierEmpId] = useState<number | null>(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const fetchStats = async () => {
      try {
        const token = (window as any)._token;
        if (!token) throw new Error("No auth token");
        
        const [statsRes, assetsRes, logsRes, empsRes] = await Promise.all([
          fetch('/api/dashboard/stats', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/assets', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/audit-logs?limit=8', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/employees', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        if (statsRes.ok) {
          const s = await statsRes.json();
          if (s && !s.error) setStats(s);
        }
        if (empsRes.ok) {
          const emps = await empsRes.json();
          if (Array.isArray(emps)) setEmployees(emps);
        }
        
        if (assetsRes.ok) {
          const assets = await assetsRes.json();
          if (Array.isArray(assets)) {
            const expiring: any[] = [];
            const maint: any[] = [];
            const now = new Date();
            const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            
            assets.forEach((a: any) => {
               if (a.insuranceExpiry) {
                  const dt = new Date(a.insuranceExpiry);
                  if (dt <= thirtyDays) expiring.push({ title: 'Insurance Policy', asset: `${a.assetTag} (${a.name})`, date: dt < now ? 'Expired' : `Expires in ${Math.ceil((dt.getTime()-now.getTime())/(1000*3600*24))} days`, type: 'insurance', time: dt.getTime() });
               }
               if (a.registrationExpiry) {
                  const dt = new Date(a.registrationExpiry);
                  if (dt <= thirtyDays) expiring.push({ title: 'Registration Renewal', asset: `${a.assetTag} (${a.name})`, date: dt < now ? 'Expired' : `Expires in ${Math.ceil((dt.getTime()-now.getTime())/(1000*3600*24))} days`, type: 'registration', time: dt.getTime() });
               }
               if (a.inspectionExpiry) {
                  const dt = new Date(a.inspectionExpiry);
                  if (dt <= thirtyDays) expiring.push({ title: 'Safety Inspection', asset: `${a.assetTag} (${a.name})`, date: dt < now ? 'Expired' : `Expires in ${Math.ceil((dt.getTime()-now.getTime())/(1000*3600*24))} days`, type: 'inspection', time: dt.getTime() });
               }
               
               if (a.warrantyExpiry) {
                  const dt = new Date(a.warrantyExpiry);
                  if (dt <= thirtyDays) maint.push({ title: 'Warranty Expiration', asset: `${a.assetTag} (${a.name})`, date: dt < now ? 'Expired' : `Expires in ${Math.ceil((dt.getTime()-now.getTime())/(1000*3600*24))} days`, type: 'warranty', time: dt.getTime() });
               }
               
               if (a.lastMaintenanceDate && a.maintenanceIntervalDays) {
                  const nextMaint = new Date(new Date(a.lastMaintenanceDate).getTime() + a.maintenanceIntervalDays * 24 * 60 * 60 * 1000);
                  if (nextMaint <= thirtyDays) maint.push({ title: 'Scheduled Service', asset: `${a.assetTag} (${a.name})`, date: nextMaint < now ? 'Overdue' : `Due in ${Math.ceil((nextMaint.getTime()-now.getTime())/(1000*3600*24))} days`, type: 'maintenance', time: nextMaint.getTime() });
               }
            });
            expiring.sort((a,b) => a.time - b.time);
            setExpiringDocs(expiring.slice(0, 5));
            maint.sort((a,b) => a.time - b.time);
            setUpcomingMaintenance(maint.slice(0, 5));
          }
        }

        if (logsRes && logsRes.ok) {
          const logs = await logsRes.json();
          if (Array.isArray(logs)) setRecentLogs(logs);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    useEffect(() => {
      fetchStats();
    }, []);

  const filteredPersonnel = useMemo(() => {
    if (!employeeSearch || employeeSearch.trim().length < 2) return [];
    const q = employeeSearch.toLowerCase().trim();
    return employees.filter((e: any) => {
      const name = `${e.firstName || ''} ${e.lastName || ''}`.toLowerCase();
      const code = String(e.employeeId || '').toLowerCase();
      const dep = String(e.department || '').toLowerCase();
      const job = String(e.jobTitle || '').toLowerCase();
      const mobile = String(e.mobile || '').toLowerCase();
      return name.includes(q) || code.includes(q) || dep.includes(q) || job.includes(q) || mobile.includes(q);
    });
  }, [employees, employeeSearch]);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div variants={item}>
          <h1 className="text-3xl font-bold text-neutral-950 tracking-tight">Dashboard Overview</h1>
          <p className="text-neutral-500 mt-1 font-medium">Welcome back. Here's your operational snapshot.</p>
        </motion.div>
        <motion.div variants={item} className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsPdfModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-50 text-neutral-800 text-xs sm:text-sm font-semibold border border-neutral-200/90 shadow-2xs hover:border-neutral-300 transition-all cursor-pointer active:scale-98"
            title="Download Executive KPI Summary Report as PDF"
          >
            <FileDown className="w-4 h-4 text-orange-600" />
            <span>Download Report</span>
          </button>

          <DashboardQuickActions
            employees={employees}
            onSuccessRefresh={fetchStats}
            onDownloadReport={() => setIsPdfModalOpen(true)}
            mode="dropdown"
          />
        </motion.div>
      </div>

      {/* High-Level Executive KPI Summary Component */}
      <motion.div variants={item}>
        <DashboardKpiSummary
          stats={stats}
          onRefresh={fetchStats}
          onDownloadReport={() => setIsPdfModalOpen(true)}
        />
      </motion.div>

      {/* 360° Personnel & Master Operations Search Bar */}
      <motion.div variants={item} className="bg-white p-5 rounded-3xl border border-neutral-200/90 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-orange-500" />
              Master Personnel Search & 360° Dossier Lookup
            </h2>
            <p className="text-xs text-neutral-500">
              Input any employee name or ID to list all data belongs to him: assignments, asset history, vehicles, and housing stays.
            </p>
          </div>
          {employeeSearch && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-800 border border-orange-200">
              {filteredPersonnel.length} matching {filteredPersonnel.length === 1 ? 'employee' : 'employees'}
            </span>
          )}
        </div>

        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-4 top-3.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Type employee name, badge ID (e.g. EMP-101), department, or phone number..."
            className="w-full pl-11 pr-10 py-3 text-sm border border-neutral-200 rounded-2xl bg-neutral-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 text-neutral-900 placeholder:text-neutral-400 transition-all font-medium"
            value={employeeSearch}
            onChange={(e) => setEmployeeSearch(e.target.value)}
          />
          {employeeSearch && (
            <button
              onClick={() => setEmployeeSearch('')}
              className="absolute right-3.5 top-3 text-neutral-400 hover:text-neutral-600 p-1 rounded-full hover:bg-neutral-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Live Search Suggestions & 360 Records Preview */}
        {employeeSearch && employeeSearch.trim().length >= 2 && (
          <div className="pt-3 border-t border-neutral-100 space-y-2">
            {filteredPersonnel.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto custom-scrollbar p-1">
                {filteredPersonnel.map((emp: any) => (
                  <div
                    key={emp.id}
                    onClick={() => {
                      setSelectedDossierEmpId(emp.id);
                      setIsDossierOpen(true);
                    }}
                    className="p-3.5 rounded-2xl border border-neutral-200/90 bg-neutral-50/60 hover:bg-orange-50/50 hover:border-orange-200 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white font-bold flex items-center justify-center text-xs shrink-0 group-hover:bg-orange-600 transition-colors">
                        {emp.firstName?.[0] || 'E'}{emp.lastName?.[0] || ''}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-neutral-900 truncate">
                            {emp.firstName} {emp.lastName}
                          </span>
                          <span className="font-mono text-xs font-semibold text-neutral-600 bg-white px-2 py-0.5 rounded-md border border-neutral-200 shrink-0">
                            {emp.employeeId}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 truncate mt-0.5">
                          {emp.jobTitle || 'Technician'} • {emp.department || 'Operations'}
                        </p>
                      </div>
                    </div>

                    <button
                      className="px-3 py-1.5 bg-neutral-900 text-white group-hover:bg-orange-600 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1 shadow-2xs transition-colors ml-2"
                    >
                      <User className="w-3.5 h-3.5" /> View All Data
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-neutral-400 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                No employees found matching "{employeeSearch}". Try a different name or badge ID.
              </div>
            )}
          </div>
        )}
      </motion.div>

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
        <div className="flex flex-col">
          
          <motion.div variants={item} className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 mb-6">
             <h3 className="font-bold text-lg text-rose-600 tracking-tight mb-1 flex items-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
               Imminent Document Expirations
             </h3>
             <p className="text-xs text-neutral-500 mb-4 font-medium">Assets requiring immediate attention for registration, insurance, or inspection renewal.</p>
             <div className="space-y-3">
               {expiringDocs.length > 0 ? expiringDocs.map((doc, i) => (
                 <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-rose-50 border border-rose-100/50">
                    <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-rose-900">{doc.title}</p>
                      <p className="text-xs font-medium text-rose-700/70 mt-0.5">{doc.asset}</p>
                      <p className="text-xs font-bold text-rose-600 mt-1">{doc.date}</p>
                    </div>
                 </div>
               )) : null}
               {expiringDocs.length === 0 && <p className="text-sm text-neutral-500 text-center py-4">No upcoming expirations in the next 30 days.</p>}
             </div>
          </motion.div>
          <motion.div variants={item} className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 flex flex-col">
             <h3 className="font-bold text-lg text-amber-600 tracking-tight mb-1 flex items-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
               Maintenance & Service
             </h3>
             <p className="text-xs text-neutral-500 mb-4 font-medium">Assets with upcoming scheduled maintenance or warranty expirations.</p>
             <div className="space-y-3">
               {upcomingMaintenance.length > 0 ? upcomingMaintenance.map((m, i) => (
                 <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100/50">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-amber-900">{m.title}</p>
                      <p className="text-xs font-medium text-amber-700/70 mt-0.5">{m.asset}</p>
                      <p className="text-xs font-bold text-amber-600 mt-1">{m.date}</p>
                    </div>
                 </div>
               )) : null}
               {upcomingMaintenance.length === 0 && <p className="text-sm text-neutral-500 text-center py-4">No upcoming maintenance in the next 30 days.</p>}
             </div>
          </motion.div>
          <motion.div variants={item} className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 flex flex-col flex-1 min-h-[400px]">
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

      {/* 360° Master Dossier Modal */}
      {selectedDossierEmpId && (
        <EmployeeDossierModal
          employeeId={selectedDossierEmpId}
          isOpen={isDossierOpen}
          onClose={() => {
            setIsDossierOpen(false);
            setSelectedDossierEmpId(null);
          }}
          initialTab="overview"
        />
      )}

      {/* Floating Action Button for Quick Actions */}
      <DashboardQuickActions
        employees={employees}
        onSuccessRefresh={fetchStats}
        onDownloadReport={() => setIsPdfModalOpen(true)}
        mode="fab"
      />

      {/* Executive KPI Summary PDF Export Modal */}
      <KpiSummaryPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        stats={stats}
      />
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
