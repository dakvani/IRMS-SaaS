with open("src/components/Assets.tsx", "r") as f:
    content = f.read()

import re

# Find activeTab === 'calendar' ? ... : activeTab === 'financial' ? ... : (
financial_view = r"(activeTab === 'financial'\s*\?\s*\([\s\S]*?</div>\s*\)\s*:\s*\()"
match = re.search(financial_view, content)
if match:
    map_view = """activeTab === 'map' ? (
        <div className="bg-white border border-neutral-200 rounded-3xl p-1 overflow-hidden shadow-sm h-[600px] z-0 relative">
          <MapContainer center={[24.7136, 46.6753]} zoom={5} style={{ height: '100%', width: '100%', borderRadius: '1.5rem', zIndex: 0 }}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
            {sites.map(s => (
               <Marker key={s.id} position={[s.latitude || 24.7136, s.longitude || 46.6753]}>
                  <Popup>
                     <div className="font-bold text-neutral-900">{s.name}</div>
                     <div className="text-xs text-neutral-500 mt-1">{assets.filter(a => a.assignedToSiteId === s.id).length} Assets Assigned</div>
                  </Popup>
               </Marker>
            ))}
          </MapContainer>
        </div>
      ) : ("""
    content = content.replace("activeTab === 'financial' ? (", "activeTab === 'financial' ? (") # just to find it easily
    # I'll manually slice to insert map view
    idx = content.find("activeTab === 'financial' ? (")
    # let's find the closing parenthesis of financial view
    idx2 = content.find("        </div>\n      ) : (\n        <div className=\"flex-1 pb-16\">", idx)
    if idx2 != -1:
        insert_idx = idx2 + len("        </div>\n      ) : (\n")
        # insert map view before the flex-1
        content = content[:insert_idx] + map_view.replace("activeTab === 'map' ? (", "activeTab === 'map' ? (") + content[insert_idx + 2:] # remove the `(\n` since map_view adds it

with open("src/components/Assets.tsx", "w") as f:
    f.write(content)
print("done")
