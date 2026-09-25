import re

with open('src/components/Settings.tsx', 'r') as f:
    content = f.read()

# Replace commonAssetNames with categories
if 'commonAssetNames' in content:
    content = content.replace("commonAssetNames", "categories")
    content = content.replace("setCommonAssetNames", "setCategories")
    content = content.replace("newAssetName", "newCategory")
    content = content.replace("setNewAssetName", "setNewCategory")

# Inject localStorage sync
effect_code = """
  useEffect(() => {
    fetchSettings();
    const storedCats = localStorage.getItem('assetCategories');
    if (storedCats) {
      try {
        setCategories(JSON.parse(storedCats));
      } catch (e) {}
    }
  }, []);
  
  useEffect(() => {
    if (categories.length > 0) {
      localStorage.setItem('assetCategories', JSON.stringify(categories));
    }
  }, [categories]);
"""
content = re.sub(r"  useEffect\(\(\) => \{\n    fetchSettings\(\);\n  \}, \[\]\);", effect_code.strip(), content)

# Change Asset Names text
content = content.replace("Common Asset Names", "Asset Categories")
content = content.replace("Asset Names", "Asset Categories")
content = content.replace("asset-names", "asset-categories")

with open('src/components/Settings.tsx', 'w') as f:
    f.write(content)
