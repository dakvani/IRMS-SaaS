import fs from 'fs';
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

const heatmapCode = `
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
          <h3 className="font-bold text-lg text-neutral-900 tracking-tight">Team Workload Heatmap</h3>
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
                  <span className={\`text-[10px] uppercase font-bold tracking-wider \${isToday ? 'text-neutral-900' : 'text-neutral-400'}\`}>
                    {d.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span className={\`text-xs font-semibold mt-1 \${isToday ? 'bg-neutral-900 text-white px-2 py-0.5 rounded-md shadow-sm' : 'text-neutral-500'}\`}>
                    {d.getDate()} {d.toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                </div>
              );
            })}
          </div>
          
          <div className="space-y-2.5">
            {resources.map((res, rIndex) => (
              <div key={res} className="flex items-center group">
                <div className="w-40 shrink-0 text-sm font-semibold text-neutral-700 truncate pr-4 group-hover:text-neutral-900 transition-colors">
                  {res}
                </div>
                {days.map((_, dIndex) => {
                  const intensity = getIntensity(rIndex, dIndex);
                  return (
                    <div key={dIndex} className="flex-1 px-1">
                      <div 
                        className={\`h-10 w-full rounded-lg \${getColor(intensity)} transition-all duration-200 hover:ring-2 hover:ring-offset-2 hover:ring-neutral-400 hover:scale-105 cursor-pointer\`}
                        title={\`\${res} - Load Level: \${intensity}/4\`}
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
`;

code += '\n' + heatmapCode;

// Inject the component render just before the outer motion.div closes.
// The existing file ends like:
//       </div>
//     </motion.div>
//   );
// }

code = code.replace(/<\/div>\s*<\/motion\.div>\s*\);\s*\}/, '</div>\n      <WorkloadHeatmap variants={item} />\n    </motion.div>\n  );\n}');

fs.writeFileSync('src/components/Dashboard.tsx', code);
