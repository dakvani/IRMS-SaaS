import fs from 'fs';

// Fix Layout.tsx
let layoutCode = fs.readFileSync('src/components/Layout.tsx', 'utf-8');
layoutCode = layoutCode.replace(
  "import { LayoutDashboard, Users, MapPin, Settings, LogOut, Bell, Search, Briefcase, Calendar, FileText, CheckSquare, Shield, Clock, Car, Monitor, HeartPulse, GraduationCap } from 'lucide-react';",
  "import { LayoutDashboard, Users, MapPin, Settings, LogOut, Bell, Search, Briefcase, Calendar, FileText, CheckSquare, Shield, Clock, Car, Monitor, HeartPulse, GraduationCap, X } from 'lucide-react';\nimport { motion, AnimatePresence } from 'motion/react';"
);
fs.writeFileSync('src/components/Layout.tsx', layoutCode);

// Fix Dashboard.tsx
let dashboardCode = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');
dashboardCode = dashboardCode.replace(
  "const [statsRes, docsRes] = await Promise.all([",
  "const [statsRes, docsRes, logsRes] = await Promise.all(["
);
fs.writeFileSync('src/components/Dashboard.tsx', dashboardCode);
