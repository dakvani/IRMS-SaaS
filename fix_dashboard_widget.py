with open("src/components/Dashboard.tsx", "r") as f:
    content = f.read()

import re

# Add state
if "const [upcomingMaintenance" not in content:
    content = content.replace("const [expiringDocs, setExpiringDocs] = useState<any[]>([]);", "const [expiringDocs, setExpiringDocs] = useState<any[]>([]);\n  const [upcomingMaintenance, setUpcomingMaintenance] = useState<any[]>([]);")

# Process maintenance
logic_to_insert = """
          const maint: any[] = [];
          
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
          
          maint.sort((a,b) => a.time - b.time);
          setUpcomingMaintenance(maint.slice(0, 5));
"""

content = re.sub(r"assets\.forEach\(\(a: any\) => \{[\s\S]*?\}\);\s*", logic_to_insert, content)

# Remove the accidental expiringDocs in Activity Feed
content = content.replace("                )}\n               {expiringDocs.length === 0 && <p className=\"text-sm text-neutral-500 text-center py-4\">No upcoming expirations in the next 30 days.</p>}\n             </div>", "                )}\n             </div>")


# Add the maintenance widget in the UI
maint_widget = """          <motion.div variants={item} className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 flex flex-col">
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
          </motion.div>"""

# Place it in the grid with Imminent Document Expirations
content = content.replace("<div className=\"grid grid-cols-1 lg:grid-cols-2 gap-8\">", "<div className=\"grid grid-cols-1 lg:grid-cols-3 gap-8\">")
content = content.replace("          <motion.div variants={item} className=\"bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 flex flex-col flex-1 min-h-[400px]\">", maint_widget + "\n          <motion.div variants={item} className=\"bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 flex flex-col flex-1 min-h-[400px]\">")

with open("src/components/Dashboard.tsx", "w") as f:
    f.write(content)
print("done")
