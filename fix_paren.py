with open("src/components/Assets.tsx", "r") as f:
    content = f.read()

content = content.replace(") : (activeTab === 'map' ? (", ") : activeTab === 'map' ? (")

with open("src/components/Assets.tsx", "w") as f:
    f.write(content)
print("done")
