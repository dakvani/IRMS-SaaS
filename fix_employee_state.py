with open("src/components/Employees.tsx", "r") as f:
    content = f.read()

content = content.replace("  const [availableAssets, setAvailableAssets] = useState<any[]>([]);", "  const [availableAssets, setAvailableAssets] = useState<any[]>([]);\n  const [assignAssetForm, setAssignAssetForm] = useState({ assetId: '' });")

with open("src/components/Employees.tsx", "w") as f:
    f.write(content)
print("done")
