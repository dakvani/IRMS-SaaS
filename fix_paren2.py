import re
with open("src/components/Assets.tsx", "r") as f:
    content = f.read()

content = re.sub(r"\)\s*:\s*\(\s*activeTab === 'map'\s*\?\s*\(", ") : activeTab === 'map' ? (", content)

with open("src/components/Assets.tsx", "w") as f:
    f.write(content)
print("done")
