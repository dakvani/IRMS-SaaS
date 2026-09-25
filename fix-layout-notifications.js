import fs from 'fs';
let code = fs.readFileSync('src/components/Layout.tsx', 'utf-8');

code = code.replace(
  /fetch\('\/api\/audit-logs\?limit=5', \{/,
  `fetch('/api/notifications', {`
);

code = code.replace(
  /const data = await res\.json\(\);\s*setNotifications\(data\.slice\(0, 5\)\);/,
  `const data = await res.json();\n          setNotifications(data);`
);

code = code.replace(
  /<p className="text-sm text-neutral-900 font-medium">\s*<span className="font-bold">\{n\.user\?\.name \|\| 'System'\}<\/span> \{n\.action\.toLowerCase\(\)\} \{n\.entity\.toLowerCase\(\)\}\s*<\/p>\s*\{n\.details && <p className="text-xs text-neutral-500 mt-1">\{n\.details\}<\/p>\}/g,
  `<p className="text-sm text-neutral-900 font-medium">\n                              <span className="font-bold">{n.title}</span>\n                            </p>\n                            {n.message && <p className="text-xs text-neutral-500 mt-1">{n.message}</p>}`
);

// Unread badge logic
code = code.replace(
  /\{notifications\.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"><\/span>\}/,
  `{notifications.filter(n => n.isRead === 0).length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>}`
);

// Mark as read function
const markAsReadCode = `
  const markAsRead = async () => {
    try {
      await fetch('/api/notifications/read', {
        method: 'PUT',
        headers: { Authorization: \`Bearer \${(window as any)._token}\` }
      });
      setNotifications(notifications.map(n => ({...n, isRead: 1})));
      setShowNotifications(false);
    } catch(e) {}
  };
`;

code = code.replace(/const location = useLocation\(\);/, `const location = useLocation();\n  ${markAsReadCode}`);

code = code.replace(
  /<button onClick=\{.*?\} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">Mark all as read<\/button>/,
  `<button onClick={markAsRead} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">Mark all as read</button>`
);

fs.writeFileSync('src/components/Layout.tsx', code);
