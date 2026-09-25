with open("src/components/Employees.tsx", "r") as f:
    content = f.read()

import re

# In employeeAssets.map: {asset.status === 'assigned' ? 'bg-blue-100 text-blue-700' : 'bg-neutral-100 text-neutral-600'} 
# this is just the type being printed. I should also show the status there maybe?
# The code currently prints `{asset.type}`. 
# Let's leave it as is if it's just printing the type.

with open("src/components/Employees.tsx", "w") as f:
    f.write(content)
print("done")
