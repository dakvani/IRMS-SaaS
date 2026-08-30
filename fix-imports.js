import fs from 'fs';
let code = fs.readFileSync('src/components/Layout.tsx', 'utf-8');

// Ensure motion and AnimatePresence are imported
if (!code.includes("import { motion, AnimatePresence }")) {
  code = code.replace("import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';", 
    "import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';\nimport { motion, AnimatePresence } from 'motion/react';");
}

// Add X to lucide-react if missing
if (!code.includes(", X }") && !code.includes(" X,")) {
  code = code.replace("Settings, FileText } from 'lucide-react';", "Settings, FileText, X } from 'lucide-react';");
}

fs.writeFileSync('src/components/Layout.tsx', code);
