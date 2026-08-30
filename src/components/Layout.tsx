import { useEffect, useState } from 'react';
import { getAccessToken, googleSignIn, initAuth, logout } from '../firebase';
import { LogOut, Users, MapPin, Briefcase, LayoutDashboard, ClipboardList, Clock, CalendarOff, Package, GraduationCap, Upload, Truck, Home, History, Bell, Settings, FileText, X } from 'lucide-react';
import { User } from 'firebase/auth';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

import Landing from './Landing.tsx';
import GlobalSearch from './GlobalSearch.tsx';

export default function Layout() {
  const [needsAuth, setNeedsAuth] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<any>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();

  
  useEffect(() => {
    if (dbUser && (window as any)._token) {
      fetch('/api/audit-logs?limit=5', {
        headers: { Authorization: `Bearer ${(window as any)._token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setNotifications(data);
      })
      .catch(e => console.error(e));
    }
  }, [dbUser]);

  useEffect(() => {
    const unsubscribe = initAuth(
      async (currentUser, token) => {
        setUser(currentUser);
        (window as any)._token = token;
        
        try {
          const res = await fetch('/api/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setDbUser(data.user);
            (window as any)._dbUser = data.user;
          }
        } catch (e) {
          console.error("Failed to fetch user profile", e);
        }

        setNeedsAuth(false);
        setIsLoading(false);
      },
      () => {
        setUser(null);
        setDbUser(null);
        setNeedsAuth(true);
        setIsLoading(false);
        (window as any)._token = null;
        (window as any)._dbUser = null;
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setNeedsAuth(true);
    (window as any)._token = null;
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center py-24 text-neutral-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mb-4"></div>
        <p className="font-medium text-neutral-900">Loading workspace...</p>
      </div>
    );
  }

  if (needsAuth) {
    return <Landing />;
  }

  const navItemClass = ({ isActive }: { isActive: boolean }) => 
    `flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
      isActive 
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
        : 'text-neutral-500 hover:bg-indigo-50 hover:text-indigo-600'
    }`;

  const role = dbUser?.role || 'employee';

  // Role-based visibility rules
  const canViewAdmin = ['saas_super_admin', 'org_admin', 'it_manager'].includes(role);
  const canViewHR = ['saas_super_admin', 'org_admin', 'hr_admin'].includes(role);
  const canViewOps = ['saas_super_admin', 'org_admin', 'coordinator', 'site_supervisor'].includes(role);
  const canViewAll = ['saas_super_admin', 'org_admin'].includes(role);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-neutral-900 font-sans">
      <header className="bg-white border-b border-neutral-100 sticky top-0 z-10 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-neutral-900 text-white p-2.5 rounded-xl">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-neutral-950">IRMS SaaS</h1>
          </div>
          
          <GlobalSearch />

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors">
                  <Bell className="w-5 h-5" />
                  {notifications.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>}
                </button>
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-white border border-neutral-200 shadow-xl rounded-2xl z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
                        <h3 className="font-bold text-neutral-900">Notifications</h3>
                        <button onClick={() => setShowNotifications(false)} className="text-neutral-400 hover:text-neutral-900">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        {notifications.length > 0 ? notifications.map((n: any, i: number) => (
                          <div key={i} className="p-4 border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                            <p className="text-sm text-neutral-900 font-medium">
                              <span className="font-bold">{n.user?.name || 'System'}</span> {n.action.toLowerCase()} {n.entity.toLowerCase()}
                            </p>
                            {n.details && <p className="text-xs text-neutral-500 mt-1">{n.details}</p>}
                            <p className="text-xs text-neutral-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                          </div>
                        )) : (
                          <div className="p-6 text-center text-sm text-neutral-500">No notifications</div>
                        )}
                      </div>
                      <div className="p-3 border-t border-neutral-100 text-center bg-neutral-50">
                        <button onClick={() => setShowNotifications(false)} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">Mark all as read</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {canViewAdmin && (
                <NavLink to="/settings" className="p-2.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors">
                  <Settings className="w-5 h-5" />
                </NavLink>
              )}
            </div>
            <div className="flex items-center gap-3 bg-neutral-50 px-4 py-2 rounded-full border border-neutral-100">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || "User"} className="w-7 h-7 rounded-full border border-neutral-200" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold">
                  {user?.displayName?.[0] || 'U'}
                </div>
              )}
              <div className="hidden sm:block">
                <span className="text-sm font-bold text-neutral-700 block">{user?.displayName}</span>
                {dbUser && <span className="text-[10px] uppercase font-bold text-neutral-400 block">{dbUser.role.replace(/_/g, ' ')}</span>}
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="md:w-64 shrink-0">
            <nav className="bg-white rounded-3xl border border-neutral-100 p-3 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col gap-1.5 sticky top-[120px] h-auto md:h-[calc(100vh-160px)] overflow-y-auto custom-scrollbar">
              <NavLink to="/dashboard" className={navItemClass}>
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </NavLink>
              
              {(canViewHR || canViewAll) && (
                <>
                  <NavLink to="/employees" className={navItemClass}>
                    <Users className="w-5 h-5" />
                    Employees
                  </NavLink>
                </>
              )}

              {canViewOps && (
                <>
                  <NavLink to="/sites" className={navItemClass}>
                    <MapPin className="w-5 h-5" />
                    Sites & Projects
                  </NavLink>
                  
                  <NavLink to="/timesheets" className={navItemClass}>
                    <Clock className="w-5 h-5" />
                    Timesheets
                  </NavLink>
                  <NavLink to="/leaves" className={navItemClass}>
                    <CalendarOff className="w-5 h-5" />
                    Leave Mgmt
                  </NavLink>
                  <NavLink to="/assets" className={navItemClass}>
                    <Package className="w-5 h-5" />
                    Assets
                  </NavLink>
                  <NavLink to="/vehicles" className={navItemClass}>
                    <Truck className="w-5 h-5" />
                    Vehicles
                  </NavLink>
                  <NavLink to="/accommodations" className={navItemClass}>
                    <Home className="w-5 h-5" />
                    Accommodation
                  </NavLink>
                  <NavLink to="/inventory" className={navItemClass}>
                    <Package className="w-5 h-5" />
                    Room Inventory
                  </NavLink>
                </>
              )}

              <NavLink to="/trainings" className={navItemClass}>
                <GraduationCap className="w-5 h-5" />
                Trainings
              </NavLink>

              {canViewAdmin && (
                <>
                  <NavLink to="/reports" className={navItemClass}>
                    
                    <ClipboardList className="w-5 h-5" />
                    Reports
                  </NavLink>
                  <NavLink to="/audit-logs" className={navItemClass}>
                    <History className="w-5 h-5" />
                    Audit Logs
                  </NavLink>
                  <NavLink to="/import" className={navItemClass}>
                    <Upload className="w-5 h-5" />
                    Bulk Import
                  </NavLink>
                </>
              )}
            </nav>
          </div>
          
          <div className="flex-1 min-w-0 h-auto md:h-[calc(100vh-160px)] flex flex-col">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
