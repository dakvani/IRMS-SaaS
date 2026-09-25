with open("src/components/Assets.tsx", "r") as f:
    content = f.read()

content = content.replace(">{asset.status}</span>", ">{asset.status === 'assigned' ? 'assigned / occupied' : asset.status}</span>")
content = content.replace(">{asset.status}\n                    </span>", ">{asset.status === 'assigned' ? 'assigned / occupied' : asset.status}\n                    </span>")

# Fix the same in selected asset view
content = content.replace(">{selectedAsset.status}</span>", ">{selectedAsset.status === 'assigned' ? 'assigned / occupied' : selectedAsset.status}</span>")

with open("src/components/Assets.tsx", "w") as f:
    f.write(content)
print("done")
