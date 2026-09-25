with open("src/components/Dashboard.tsx", "r") as f:
    content = f.read()

import re

# Add fetching assets for document expirations
fetch_block = """          fetch('/api/dashboard/stats', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/assets', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/audit-logs?limit=8', { headers: { Authorization: `Bearer ${token}` } })"""

content = content.replace("          fetch('/api/dashboard/stats', { headers: { Authorization: `Bearer ${token}` } }),\n          fetch('/api/employee-documents', { headers: { Authorization: `Bearer ${token}` } }),\n          fetch('/api/audit-logs?limit=8', { headers: { Authorization: `Bearer ${token}` } })", fetch_block)

processing_block = """
        if (statsRes.ok) {
          const statsData = await statsRes.ok ? await statsRes.json() : {};
          setStats(statsData);
        }
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
        if (logsRes.ok) {
"""

content = re.sub(r"        if \(statsRes\.ok\) \{[\s\S]*?if \(logsRes\.ok\)", processing_block.strip(), content)
content = content.replace("const [statsRes, docsRes, logsRes] = await Promise.all([", "const [statsRes, assetsRes, logsRes] = await Promise.all([")


# replace mock data array with expiringDocs
mock_data = r"\[\s*\{\s*title:\s*'Vehicle Reg\. Renewal',[\s\S]*?\}\s*\]"
content = re.sub(mock_data, "expiringDocs", content)


with open("src/components/Dashboard.tsx", "w") as f:
    f.write(content)
print("done")
