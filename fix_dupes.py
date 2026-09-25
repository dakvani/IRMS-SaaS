with open("src/components/Employees.tsx", "r") as f:
    content = f.read()

import re

# Remove the first occurrence of handleOpenAssignAsset and handleAssignAssetSubmit from the old code if they exist
content = re.sub(r"const handleOpenAssignAsset = async \(\) => \{[\s\S]*?catch \(e\) \{\}\s*\};\s*const handleAssignAssetSubmit = async \(e: React.FormEvent\) => \{[\s\S]*?catch \(e\) \{\}\s*\};", "", content, count=1)

with open("src/components/Employees.tsx", "w") as f:
    f.write(content)
print("done")
