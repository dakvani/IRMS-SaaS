with open("src/components/Dashboard.tsx", "r") as f:
    content = f.read()

import re

# replace everything from if (docsRes.ok) { ... } to if (logsRes.ok)
block_to_replace = r"if \(docsRes\.ok\) \{[\s\S]*?if \(logsRes\.ok\)"

new_logic = """if (assetsRes.ok) {
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
        if (logsRes.ok)"""

content = re.sub(block_to_replace, new_logic, content)

# I should also fix the first time where I accidentally appended a second try block!
# Let's see if there are multiple "try {" inside fetchStats
match_try = [m.start() for m in re.finditer(r"try\s*\{", content)]
# Oh god, wait, if I had just appended new try blocks inside fetchStats?
