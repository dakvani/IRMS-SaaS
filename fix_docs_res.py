with open("src/components/Dashboard.tsx", "r") as f:
    content = f.read()

import re

# We will replace the entire fetching logic inside fetchDashboardData
fetch_fn = r"(const fetchDashboardData = async \(\) => \{)([\s\S]*?)(\}\s*catch \(\w\))"

new_fetch_fn = """
    setIsLoading(true);
    try {
      const token = (window as any)._token;
      if (token) {
        const [statsRes, assetsRes, logsRes] = await Promise.all([
          fetch('/api/dashboard/stats', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/assets', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/audit-logs?limit=8', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        if (statsRes.ok) setStats(await statsRes.json());
        
        if (assetsRes.ok) {
          const assets = await assetsRes.json();
          const expiring: any[] = [];
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
          });
          expiring.sort((a,b) => a.time - b.time);
          setExpiringDocs(expiring.slice(0, 5));
        }

        if (logsRes.ok) setRecentLogs(await logsRes.json());
      }
    }"""

content = re.sub(fetch_fn, r"\1" + new_fetch_fn + r"\3", content)

with open("src/components/Dashboard.tsx", "w") as f:
    f.write(content)
print("done")
