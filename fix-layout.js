import fs from 'fs';
let code = fs.readFileSync('src/components/Layout.tsx', 'utf-8');

code = code.replace(
  "import { LayoutDashboard, Users, MapPin, Settings, LogOut, Bell, Search, Briefcase, Calendar, FileText, CheckSquare, Shield, Clock, Car, Monitor, HeartPulse, GraduationCap } from 'lucide-react';",
  "import { LayoutDashboard, Users, MapPin, Settings, LogOut, Bell, Search, Briefcase, Calendar, FileText, CheckSquare, Shield, Clock, Car, Monitor, HeartPulse, GraduationCap, X } from 'lucide-react';\nimport { motion, AnimatePresence } from 'motion/react';"
);

code = code.replace(
  "const [dbUser, setDbUser] = useState<any>(null);",
  "const [dbUser, setDbUser] = useState<any>(null);\n  const [showNotifications, setShowNotifications] = useState(false);\n  const [notifications, setNotifications] = useState<any[]>([]);"
);

const fetchNotifications = `
  useEffect(() => {
    if (dbUser && (window as any)._token) {
      fetch('/api/audit-logs?limit=5', {
        headers: { Authorization: \\\`Bearer \\\${(window as any)._token}\\\` }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setNotifications(data);
      })
      .catch(e => console.error(e));
    }
  }, [dbUser]);
`;

code = code.replace(
  "useEffect(() => {",
  fetchNotifications + "\n  useEffect(() => {"
);

const bellIconHtml = `
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
`;

code = code.replace(
  /<button className="relative p-2\.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors">[\s\S]*?<\/button>/,
  bellIconHtml.trim()
);

fs.writeFileSync('src/components/Layout.tsx', code);
