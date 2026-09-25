with open("src/components/Dashboard.tsx", "r") as f:
    content = f.read()

import re

useeffect_regex = r"(useEffect\(\(\) => \{\s*const fetchStats = async \(\) => \{)([\s\S]*?)(\};\s*fetchStats\(\);\s*\}, \[\]\);)"

new_useeffect = """
      try {
        const token = (window as any)._token;
        if (!token) throw new Error("No auth token");
        
        const [statsRes, assetsRes, logsRes] = await Promise.all([
          fetch('/api/dashboard/stats', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/assets', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/audit-logs?limit=8', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        if (statsRes.ok) setStats(await statsRes.json());
        
        if (assetsRes.ok) {
          const assets = await assetsRes.json();
          const expiring: any[] = [];
          const maint: any[] = [];
          const now = new Date();
          const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          
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
          expiring.sort((a,b) => a.time - b.time);
          setExpiringDocs(expiring.slice(0, 5));
          maint.sort((a,b) => a.time - b.time);
          setUpcomingMaintenance(maint.slice(0, 5));
        }

        if (logsRes && logsRes.ok) {
          const logs = await logsRes.json();
          setRecentLogs(logs);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
"""

content = re.sub(useeffect_regex, r"\1" + new_useeffect + r"\3", content)

with open("src/components/Dashboard.tsx", "w") as f:
    f.write(content)
print("done")
