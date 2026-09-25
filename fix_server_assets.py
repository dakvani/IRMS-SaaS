with open("server.ts", "r") as f:
    content = f.read()

import re

# Insert photoUrl into destructuring
content = content.replace("maintenanceIntervalDays, lastMaintenanceDate, make, model, licensePlate, year, vin, warrantyExpiry } = req.body;", "maintenanceIntervalDays, lastMaintenanceDate, make, model, licensePlate, year, vin, warrantyExpiry, photoUrl } = req.body;")

# Insert photoUrl into db values
content = content.replace("warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry).toISOString() : null\n        });", "warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry).toISOString() : null,\n          photoUrl\n        });")

content = content.replace("warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry).toISOString() : null\n        }).where", "warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry).toISOString() : null,\n          photoUrl\n        }).where")

with open("server.ts", "w") as f:
    f.write(content)
print("done")
