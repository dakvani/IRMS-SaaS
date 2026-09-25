with open("src/components/Assets.tsx", "r") as f:
    content = f.read()

import re

# Add map to viewMode
content = content.replace("const [viewMode, setViewMode] = useState<'list' | 'icon'>('icon');", "const [viewMode, setViewMode] = useState<'list' | 'icon' | 'map'>('icon');")

# Add the Leaflet icon fix at the top
icon_fix = """import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});"""
content = content.replace("import L from 'leaflet';", icon_fix)

# Add the map button
btn_list = """<button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-neutral-500'}`}><List className="w-4 h-4" /></button>"""
btn_map = """<button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-neutral-500'}`}><List className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('map')} className={`p-1.5 rounded-md ${viewMode === 'map' ? 'bg-white shadow-sm' : 'text-neutral-500'}`}><MapPin className="w-4 h-4" /></button>"""
content = content.replace(btn_list, btn_map)

# Render the map view
icon_view = ") : viewMode === 'icon' ? ("
map_view = """) : viewMode === 'map' ? (
             <div className="bg-white border border-neutral-200 rounded-3xl p-2 shadow-sm h-[600px] overflow-hidden">
                <MapContainer center={[51.505, -0.09]} zoom={2} style={{ height: '100%', width: '100%', borderRadius: '1.5rem', zIndex: 0 }}>
                   <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                   {sites.map(site => {
                      if (!site.gpsCoordinates) return null;
                      const [lat, lng] = site.gpsCoordinates.split(',').map((n: string) => parseFloat(n.trim()));
                      if (isNaN(lat) || isNaN(lng)) return null;
                      
                      const siteAssets = filteredAssets.filter(a => a.assignedToSiteId === site.id);
                      
                      return (
                         <Marker key={site.id} position={[lat, lng]}>
                            <Popup>
                               <div className="font-bold">{site.name}</div>
                               <div className="text-xs text-neutral-500">{site.address}</div>
                               <div className="mt-2 text-sm">
                                 Assets assigned: {siteAssets.length}
                               </div>
                               {siteAssets.length > 0 && (
                                  <ul className="mt-1 pl-4 list-disc text-xs text-indigo-600">
                                     {siteAssets.slice(0, 5).map((a: any) => <li key={a.id}>{a.name} ({a.assetTag})</li>)}
                                     {siteAssets.length > 5 && <li>...and {siteAssets.length - 5} more</li>}
                                  </ul>
                               )}
                            </Popup>
                         </Marker>
                      )
                   })}
                </MapContainer>
             </div>
          ) : viewMode === 'icon' ? ("""
content = content.replace(icon_view, map_view)

with open("src/components/Assets.tsx", "w") as f:
    f.write(content)
print("done")
