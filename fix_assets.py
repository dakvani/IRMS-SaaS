with open("src/components/Assets.tsx", "r") as f:
    content = f.read()

import re

# Add Map to activeTab
content = content.replace("useState<'equipment' | 'vehicles' | 'calendar' | 'financial'>('equipment');", "useState<'equipment' | 'vehicles' | 'calendar' | 'financial' | 'map'>('equipment');")

# Add Tab Button
tab_buttons_match = re.search(r"(<button onClick=\{.*?setActiveTab\('financial'\).*?</button>)", content)
if tab_buttons_match:
    financial_btn = tab_buttons_match.group(1)
    map_btn = financial_btn.replace("'financial'", "'map'").replace("Financial Health", "Map View").replace("emerald", "indigo").replace("Calculator", "MapPin")
    content = content.replace(financial_btn, financial_btn + "\n          " + map_btn)

# Add imports for leaflet
if "import { MapContainer" not in content:
    imports_to_add = "import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';\nimport 'leaflet/dist/leaflet.css';\nimport L from 'leaflet';\n\n// Fix leaflet icon issue\ndelete (L.Icon.Default.prototype as any)._getIconUrl;\nL.Icon.Default.mergeOptions({\n  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',\n  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',\n  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',\n});\n"
    content = content.replace("import Barcode from 'react-barcode';", "import Barcode from 'react-barcode';\n" + imports_to_add)

with open("src/components/Assets.tsx", "w") as f:
    f.write(content)
print("done")
