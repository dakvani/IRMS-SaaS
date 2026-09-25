import fs from 'fs';

let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

// Import recharts
code = code.replace(
  /import \{ (.*) \} from 'lucide-react';/,
  `import { $1 } from 'lucide-react';\nimport { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';`
);

// Insert ResourceChart component definition
const chartComponent = `
function ResourceChart({ variants }: { variants: any }) {
  const data = [
    { name: 'Mon', SiteA: 4000, SiteB: 2400, Projects: 2400 },
    { name: 'Tue', SiteA: 3000, SiteB: 1398, Projects: 2210 },
    { name: 'Wed', SiteA: 2000, SiteB: 9800, Projects: 2290 },
    { name: 'Thu', SiteA: 2780, SiteB: 3908, Projects: 2000 },
    { name: 'Fri', SiteA: 1890, SiteB: 4800, Projects: 2181 },
    { name: 'Sat', SiteA: 2390, SiteB: 3800, Projects: 2500 },
    { name: 'Sun', SiteA: 3490, SiteB: 4300, Projects: 2100 },
  ];

  return (
    <motion.div variants={variants} className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 mt-6">
      <div className="mb-6">
        <h3 className="font-bold text-lg text-indigo-600 tracking-tight">Resource & Project Occupancy</h3>
        <p className="text-sm text-neutral-500 font-medium">Weekly trends across all active sites and projects</p>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorSiteA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorSiteB" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
            <Area type="monotone" dataKey="SiteA" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorSiteA)" />
            <Area type="monotone" dataKey="SiteB" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSiteB)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
`;

code = code.replace(/function StatCard/, chartComponent + '\nfunction StatCard');

// Add the ResourceChart under WorkloadHeatmap
code = code.replace(
  /<WorkloadHeatmap variants=\{item\} \/>\s*<\/div>\s*<\/motion\.div>\s*\);\s*\}/,
  `<WorkloadHeatmap variants={item} />\n      </div>\n      <ResourceChart variants={item} />\n    </motion.div>\n  );\n}`
);

fs.writeFileSync('src/components/Dashboard.tsx', code);
