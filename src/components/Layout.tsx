import { useEffect, useState } from 'react';
import { getAccessToken, googleSignIn, initAuth, logout } from '../firebase';
import { LogOut, Users, MapPin, Briefcase, LayoutDashboard, ClipboardList, Clock, CalendarOff, Package, GraduationCap, Upload, Truck, Home, History, Bell, Settings, FileText, X, ShieldCheck, Sun, Moon, ChevronRight, Activity } from 'lucide-react';
import { User } from 'firebase/auth';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { getTheme, applyTheme, ThemeMode } from '../utils/theme';

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
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(getTheme());
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handler = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handler);
    return () => window.removeEventListener('gmp-quota-exceeded', handler);
  }, []);

  useEffect(() => {
    const handleThemeChange = (e: any) => {
      if (e.detail?.theme) setTheme(e.detail.theme);
      else setTheme(getTheme());
    };
    window.addEventListener('theme-change', handleThemeChange);
    return () => window.removeEventListener('theme-change', handleThemeChange);
  }, []);
  
  const markAsRead = async () => {
    try {
      await fetch('/api/notifications/read', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${(window as any)._token}` }
      });
      setNotifications(notifications.map(n => ({...n, isRead: 1})));
      setShowNotifications(false);
    } catch(e) {}
  };


  
  useEffect(() => {
    if (dbUser && (window as any)._token) {
      fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${(window as any)._token}` }
      })
      .then(res => {
        if (!res.ok) return [];
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setNotifications(data);
      })
      .catch(e => console.error(e));
    }
  }, [dbUser]);

  useEffect(() => {
    // Check if there is an existing valid session in storage
    const storedToken = localStorage.getItem('irms_token') || (window as any)._token;
    if (storedToken) {
      (window as any)._token = storedToken;
      fetch('/api/me', {
        headers: { 'Authorization': `Bearer ${storedToken}` }
      })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) {
          setDbUser(data.user);
          (window as any)._dbUser = data.user;
          setNeedsAuth(false);
          setIsLoading(false);
        }
      })
      .catch(() => {});
    }

    const handleAuthTokenUpdated = async (e: any) => {
      const token = e.detail?.token || localStorage.getItem('irms_token');
      if (token) {
        (window as any)._token = token;
        try {
          const res = await fetch('/api/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setDbUser(data.user);
            (window as any)._dbUser = data.user;
            setNeedsAuth(false);
          }
        } catch (err) {}
        setIsLoading(false);
      }
    };
    window.addEventListener('auth-token-updated', handleAuthTokenUpdated);

    const unsubscribe = initAuth(
      async (currentUser, token) => {
        setUser(currentUser);
        (window as any)._token = token;
        localStorage.setItem('irms_token', token);
        
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
        const activeLocalToken = localStorage.getItem('irms_token') || (window as any)._token;
        if (!activeLocalToken) {
          setUser(null);
          setDbUser(null);
          setNeedsAuth(true);
          (window as any)._token = null;
          (window as any)._dbUser = null;
        }
        setIsLoading(false);
      }
    );

    // Timeout safety: prevent getting stuck in loading spinner
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => {
      unsubscribe();
      window.removeEventListener('auth-token-updated', handleAuthTokenUpdated);
      clearTimeout(timer);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch(e) {}
    localStorage.removeItem('irms_token');
    setUser(null);
    setDbUser(null);
    setNeedsAuth(true);
    (window as any)._token = null;
    (window as any)._dbUser = null;
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
    `flex items-center justify-between px-3.5 py-2.5 lg:py-3 rounded-xl font-semibold text-sm transition-all duration-150 group ${
      isActive 
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25' 
        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950'
    }`;

  const role = dbUser?.role || 'employee';

  // Role-based visibility rules
  const canViewAdmin = ['saas_super_admin', 'org_admin', 'it_manager'].includes(role);
  const canViewHR = ['saas_super_admin', 'org_admin', 'hr_admin'].includes(role);
  const canViewOps = ['saas_super_admin', 'org_admin', 'coordinator', 'site_supervisor'].includes(role);
  const canViewAll = ['saas_super_admin', 'org_admin'].includes(role);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-neutral-900 font-sans">
      {/* Google Maps Platform Demo Key Quota Banner */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}
      <header className="bg-white border-b border-neutral-100 sticky top-0 z-10 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <NavLink
            to="/dashboard"
            onClick={(e) => {
              e.preventDefault();
              navigate('/dashboard');
            }}
            className="flex items-center gap-3 cursor-pointer group hover:opacity-90 transition-opacity"
            title="Return to Dashboard"
          >
            <div className="bg-neutral-900 text-white p-2.5 rounded-xl group-hover:scale-105 transition-transform shadow-xs">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-neutral-950">IRMS SaaS</span>
          </NavLink>
          
          <GlobalSearch />

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors">
                  <Bell className="w-5 h-5" />
                  {notifications.filter(n => n.isRead === 0).length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>}
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
                              <span className="font-bold">{n.title}</span>
                            </p>
                            {n.message && <p className="text-xs text-neutral-500 mt-1">{n.message}</p>}
                            <p className="text-xs text-neutral-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                          </div>
                        )) : (
                          <div className="p-6 text-center text-sm text-neutral-500">No notifications</div>
                        )}
                      </div>
                      <div className="p-3 border-t border-neutral-100 text-center bg-neutral-50">
                        <button onClick={markAsRead} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">Mark all as read</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button
                type="button"
                onClick={() => {
                  const nextTheme = theme === 'dark' ? 'light' : 'dark';
                  setTheme(nextTheme);
                  applyTheme(nextTheme);
                }}
                className="p-2.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
              </button>
              {canViewAdmin && (
                <NavLink to="/settings" className="p-2.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors" title="Settings">
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

      <main className="w-full flex-1">
        <div className="flex flex-col md:flex-row w-full min-h-[calc(100vh-5rem)]">
          {/* Left Panel - Full Height, Always Static, Same as Page Height */}
          <div className="w-full md:w-68 lg:w-72 shrink-0 md:sticky md:top-20 md:h-[calc(100vh-5rem)] bg-white border-r border-neutral-200/80 z-20 self-start">
            <nav className="h-full flex flex-col justify-between p-4 lg:p-5 overflow-y-auto custom-scrollbar">
              <div className="flex flex-col gap-5">
                {/* Core Overview */}
                <div className="space-y-1">
                  <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
                    Overview
                  </div>
                  <NavLink to="/dashboard" className={navItemClass}>
                    <div className="flex items-center gap-3">
                      <LayoutDashboard className="w-5 h-5 shrink-0 text-indigo-500 group-hover:scale-105 transition-transform" />
                      <span className="font-semibold">Dashboard</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-0 group-[.bg-indigo-600]:opacity-80 transition-opacity" />
                  </NavLink>
                </div>

                {/* Workforce & Operations */}
                <div className="space-y-1">
                  <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
                    Workforce & Operations
                  </div>
                  {(canViewHR || canViewAll) && (
                    <NavLink to="/employees" className={navItemClass}>
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 shrink-0 text-sky-500 group-hover:scale-105 transition-transform" />
                        <span className="font-semibold">Employees</span>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-0 group-[.bg-indigo-600]:opacity-80 transition-opacity" />
                    </NavLink>
                  )}

                  {canViewOps && (
                    <>
                      <NavLink to="/sites" className={navItemClass}>
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 shrink-0 text-emerald-500 group-hover:scale-105 transition-transform" />
                          <span className="font-semibold">Sites & Projects</span>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-0 group-[.bg-indigo-600]:opacity-80 transition-opacity" />
                      </NavLink>
                      
                      <NavLink to="/timesheets" className={navItemClass}>
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 shrink-0 text-amber-500 group-hover:scale-105 transition-transform" />
                          <span className="font-semibold">Timesheets</span>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-0 group-[.bg-indigo-600]:opacity-80 transition-opacity" />
                      </NavLink>
                      <NavLink to="/leaves" className={navItemClass}>
                        <div className="flex items-center gap-3">
                          <CalendarOff className="w-5 h-5 shrink-0 text-purple-500 group-hover:scale-105 transition-transform" />
                          <span className="font-semibold">Leave Mgmt</span>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-0 group-[.bg-indigo-600]:opacity-80 transition-opacity" />
                      </NavLink>
                    </>
                  )}
                </div>

                {/* Resources & Facilities */}
                <div className="space-y-1">
                  <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
                    Resources & Logistics
                  </div>
                  {canViewOps && (
                    <>
                      <NavLink to="/assets" className={navItemClass}>
                        <div className="flex items-center gap-3">
                          <Package className="w-5 h-5 shrink-0 text-orange-500 group-hover:scale-105 transition-transform" />
                          <span className="font-semibold">Assets</span>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-0 group-[.bg-indigo-600]:opacity-80 transition-opacity" />
                      </NavLink>
                      
                      <NavLink to="/accommodations" className={navItemClass}>
                        <div className="flex items-center gap-3">
                          <Home className="w-5 h-5 shrink-0 text-rose-500 group-hover:scale-105 transition-transform" />
                          <span className="font-semibold">Staff Accommodation</span>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-0 group-[.bg-indigo-600]:opacity-80 transition-opacity" />
                      </NavLink>
                    </>
                  )}

                  <NavLink to="/trainings" className={navItemClass}>
                    <div className="flex items-center gap-3">
                      <GraduationCap className="w-5 h-5 shrink-0 text-teal-500 group-hover:scale-105 transition-transform" />
                      <span className="font-semibold">Trainings</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-0 group-[.bg-indigo-600]:opacity-80 transition-opacity" />
                  </NavLink>
                </div>

                {/* Governance */}
                {canViewAdmin && (
                  <div className="space-y-1">
                    <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
                      Governance
                    </div>
                    <NavLink 
                      to="/data-compliance" 
                      className={({ isActive }) => {
                        const isMergedActive = isActive || ['/reports', '/audit-logs', '/import'].includes(location.pathname);
                        return `flex items-center justify-between px-3.5 py-2.5 lg:py-3 rounded-xl font-semibold text-sm transition-all duration-150 group ${
                          isMergedActive 
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25' 
                            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950'
                        }`;
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 shrink-0 text-blue-500 group-hover:scale-105 transition-transform" />
                        <span className="font-semibold">Data & Compliance</span>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-0 group-[.bg-indigo-600]:opacity-80 transition-opacity" />
                    </NavLink>
                  </div>
                )}
              </div>

              {/* Bottom Panel Utility & Status Anchor */}
              <div className="pt-4 mt-4 border-t border-neutral-100 space-y-2.5">
                {canViewAdmin && (
                  <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                        isActive
                          ? 'bg-neutral-900 text-white shadow-sm'
                          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="w-4 h-4 text-neutral-400" />
                      <span>Settings</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 border border-neutral-200">
                      Admin
                    </span>
                  </NavLink>
                )}

                <div className="p-3 rounded-2xl bg-neutral-50/80 border border-neutral-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">System Status</span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Operational
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-500 flex items-center justify-between font-medium">
                    <span>IRMS Platform</span>
                    <span className="font-semibold text-neutral-700 capitalize">{role.replace(/_/g, ' ')}</span>
                  </div>
                </div>
              </div>
            </nav>
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1 min-w-0 p-6 md:p-8 lg:p-10 bg-[#FAFAFA]">
            <div className="max-w-7xl mx-auto w-full">
              <Outlet />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
