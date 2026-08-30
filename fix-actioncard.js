import fs from 'fs';
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');
code = code.replace(
  "function ActionCard({ title, subtitle, icon, bgClass = \"bg-neutral-100\", key }: { title: string, subtitle: string, icon: React.ReactNode, bgClass?: string, key?: any }) {",
  "function ActionCard({ title, subtitle, icon, bgClass = \"bg-neutral-100\" }: { title: string, subtitle: string, icon: React.ReactNode, bgClass?: string }) {"
);
fs.writeFileSync('src/components/Dashboard.tsx', code);
