with open("src/components/Dashboard.tsx", "r") as f:
    content = f.read()

content = content.replace("               ))}\n               {expiringDocs.length === 0", "               )) : null}\n               {expiringDocs.length === 0")

with open("src/components/Dashboard.tsx", "w") as f:
    f.write(content)
print("done")
