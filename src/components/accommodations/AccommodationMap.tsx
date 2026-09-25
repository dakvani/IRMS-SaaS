import React, { useState, useMemo } from 'react';
import { Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import { Home, MapPin, Building2, Briefcase, Navigation, Users, Bed, Check, ExternalLink } from 'lucide-react';

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

interface AccommodationMapProps {
  accommodations: any[];
  sites: any[];
  projects: any[];
  selectedAccommodationId?: number | null;
  onSelectAccommodation?: (acc: any) => void;
  onAdmitToAccommodation?: (acc: any) => void;
  isPickingLocation?: boolean;
  onPickCoordinates?: (coords: { lat: number; lng: number; address?: string }) => void;
}

export default function AccommodationMap({
  accommodations,
  sites,
  projects,
  selectedAccommodationId,
  onSelectAccommodation,
  onAdmitToAccommodation,
  isPickingLocation,
  onPickCoordinates,
}: AccommodationMapProps) {
  const [activeMarker, setActiveMarker] = useState<{ type: 'acc' | 'site' | 'project'; data: any } | null>(null);
  const [showSites, setShowSites] = useState(true);
  const [showProjects, setShowProjects] = useState(true);
  const [proximityOrigin, setProximityOrigin] = useState<{ type: 'site' | 'project'; id: number } | null>(null);
  const [pickedPin, setPickedPin] = useState<{ lat: number; lng: number } | null>(null);

  // Filter valid accommodation points
  const validAccommodations = useMemo(() => {
    return accommodations
      .map((a) => {
        const lat = parseFloat(String(a.latitude || a.gpsCoordinates?.split(',')[0] || ''));
        const lng = parseFloat(String(a.longitude || a.gpsCoordinates?.split(',')[1] || ''));
        if (!isNaN(lat) && !isNaN(lng)) {
          return { ...a, parsedLat: lat, parsedLng: lng };
        }
        return null;
      })
      .filter(Boolean) as any[];
  }, [accommodations]);

  // Filter valid sites
  const validSites = useMemo(() => {
    return sites
      .map((s) => {
        const lat = parseFloat(String(s.latitude || s.gpsCoordinates?.split(',')[0] || ''));
        const lng = parseFloat(String(s.longitude || s.gpsCoordinates?.split(',')[1] || ''));
        if (!isNaN(lat) && !isNaN(lng)) {
          return { ...s, parsedLat: lat, parsedLng: lng };
        }
        return null;
      })
      .filter(Boolean) as any[];
  }, [sites]);

  // Filter valid projects
  const validProjects = useMemo(() => {
    return projects
      .map((p) => {
        const lat = parseFloat(String(p.latitude || p.gpsCoordinates?.split(',')[0] || ''));
        const lng = parseFloat(String(p.longitude || p.gpsCoordinates?.split(',')[1] || ''));
        if (!isNaN(lat) && !isNaN(lng)) {
          return { ...p, parsedLat: lat, parsedLng: lng };
        }
        return null;
      })
      .filter(Boolean) as any[];
  }, [projects]);

  // Find center of map based on available data or default
  const defaultCenter = useMemo(() => {
    if (validAccommodations.length > 0) {
      return { lat: validAccommodations[0].parsedLat, lng: validAccommodations[0].parsedLng };
    }
    if (validSites.length > 0) {
      return { lat: validSites[0].parsedLat, lng: validSites[0].parsedLng };
    }
    return { lat: 24.6877, lng: 46.7219 }; // Default Saudi Central
  }, [validAccommodations, validSites]);

  // Calculate distances if proximity origin is selected
  const proximitySortedAccs = useMemo(() => {
    if (!proximityOrigin) return [];
    let originPoint: { lat: number; lng: number; name: string } | null = null;
    if (proximityOrigin.type === 'site') {
      const s = validSites.find((x) => x.id === proximityOrigin.id);
      if (s) originPoint = { lat: s.parsedLat, lng: s.parsedLng, name: s.name };
    } else {
      const p = validProjects.find((x) => x.id === proximityOrigin.id);
      if (p) originPoint = { lat: p.parsedLat, lng: p.parsedLng, name: p.name };
    }

    if (!originPoint) return [];

    return validAccommodations
      .map((acc) => ({
        ...acc,
        distanceKm: calculateDistanceKm(originPoint!.lat, originPoint!.lng, acc.parsedLat, acc.parsedLng),
        originName: originPoint!.name,
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [proximityOrigin, validSites, validProjects, validAccommodations]);

  const handleMapClick = (e: any) => {
    if (isPickingLocation && e.detail?.latLng) {
      const lat = Number(e.detail.latLng.lat.toFixed(6));
      const lng = Number(e.detail.latLng.lng.toFixed(6));
      setPickedPin({ lat, lng });
      if (onPickCoordinates) {
        onPickCoordinates({ lat, lng });
      }
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[650px] bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
      {/* Map Left Control Panel */}
      <div className="lg:w-80 p-4 border-b lg:border-b-0 lg:border-r border-neutral-200 flex flex-col gap-4 overflow-y-auto custom-scrollbar shrink-0 bg-neutral-50/50">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-orange-100 text-orange-700 rounded-lg">
              <Home className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-neutral-900 text-base">Housing Geo-Explorer</h3>
          </div>
          <p className="text-xs text-neutral-500">
            Interactive map of accommodation campuses, construction sites, and projects.
          </p>
        </div>

        {/* Legend & Layer Toggles */}
        <div className="bg-white p-3 rounded-xl border border-neutral-200 space-y-2">
          <span className="text-xs font-semibold text-neutral-600 block uppercase tracking-wider">Map Layers</span>
          <div className="flex flex-col gap-1.5 text-xs">
            <div className="flex items-center justify-between py-1">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500 inline-block shadow-sm"></span>
                <span className="font-medium text-neutral-700">Accommodations</span>
              </span>
              <span className="bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-bold text-[10px]">
                {validAccommodations.length}
              </span>
            </div>

            <label className="flex items-center justify-between py-1 cursor-pointer">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showSites}
                  onChange={(e) => setShowSites(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="w-3 h-3 rounded-full bg-blue-600 inline-block shadow-sm"></span>
                <span className="font-medium text-neutral-700">Construction Sites</span>
              </span>
              <span className="bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-bold text-[10px]">
                {validSites.length}
              </span>
            </label>

            <label className="flex items-center justify-between py-1 cursor-pointer">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showProjects}
                  onChange={(e) => setShowProjects(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="w-3 h-3 rounded-full bg-purple-600 inline-block shadow-sm"></span>
                <span className="font-medium text-neutral-700">Projects</span>
              </span>
              <span className="bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-bold text-[10px]">
                {validProjects.length}
              </span>
            </label>
          </div>
        </div>

        {/* Proximity Radius Search */}
        <div className="bg-white p-3 rounded-xl border border-neutral-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-blue-600" />
              Find Housing Near Site/Project
            </span>
            {proximityOrigin && (
              <button
                onClick={() => setProximityOrigin(null)}
                className="text-[10px] text-neutral-400 hover:text-neutral-700 underline"
              >
                Reset
              </button>
            )}
          </div>

          <select
            className="w-full text-xs px-2.5 py-1.5 border border-neutral-300 rounded-lg bg-white"
            value={proximityOrigin ? `${proximityOrigin.type}-${proximityOrigin.id}` : ''}
            onChange={(e) => {
              if (!e.target.value) {
                setProximityOrigin(null);
                return;
              }
              const [type, id] = e.target.value.split('-');
              setProximityOrigin({ type: type as any, id: parseInt(id) });
            }}
          >
            <option value="">Select a Site or Project...</option>
            <optgroup label="Construction Sites">
              {validSites.map((s) => (
                <option key={`site-${s.id}`} value={`site-${s.id}`}>
                  Site: {s.name} ({s.location || 'Location'})
                </option>
              ))}
            </optgroup>
            <optgroup label="Projects">
              {validProjects.map((p) => (
                <option key={`project-${p.id}`} value={`project-${p.id}`}>
                  Project: {p.name}
                </option>
              ))}
            </optgroup>
          </select>

          {proximityOrigin && proximitySortedAccs.length > 0 && (
            <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">
                Nearest Accommodations
              </span>
              {proximitySortedAccs.slice(0, 5).map((acc) => (
                <div
                  key={acc.id}
                  onClick={() => {
                    setActiveMarker({ type: 'acc', data: acc });
                    if (onSelectAccommodation) onSelectAccommodation(acc);
                  }}
                  className="p-2 rounded-lg border border-neutral-100 hover:border-orange-300 bg-neutral-50/70 hover:bg-orange-50/40 cursor-pointer transition-colors text-xs"
                >
                  <div className="flex justify-between items-start font-semibold text-neutral-900">
                    <span className="truncate pr-1">{acc.name}</span>
                    <span className="text-orange-600 font-bold shrink-0">{acc.distanceKm} km</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-neutral-500 mt-0.5">
                    <span>{acc.type}</span>
                    <span className="text-emerald-700 font-medium">{acc.availableBeds ?? acc.totalCapacity} beds left</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {isPickingLocation && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900">
            <span className="font-bold flex items-center gap-1.5 text-amber-950 mb-1">
              <MapPin className="w-4 h-4 text-amber-600" />
              Pin Drop Mode Active
            </span>
            Click anywhere on the map to drop a pin and set property GPS coordinates!
            {pickedPin && (
              <div className="mt-2 p-1.5 bg-white rounded border border-amber-200 font-mono text-[11px]">
                Lat: {pickedPin.lat}, Lng: {pickedPin.lng}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Map Canvas */}
      <div className="flex-1 relative h-[400px] lg:h-full w-full">
        <Map
          mapId="DEMO_MAP_ID"
          defaultCenter={defaultCenter}
          defaultZoom={6}
          gestureHandling="greedy"
          disableDefaultUI={false}
          onClick={handleMapClick}
          className="w-full h-full"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        >
          {/* Accommodations Markers */}
          {validAccommodations.map((acc) => (
            <AdvancedMarker
              key={`acc-${acc.id}`}
              position={{ lat: acc.parsedLat, lng: acc.parsedLng }}
              onClick={() => setActiveMarker({ type: 'acc', data: acc })}
              title={acc.name}
            >
              <div className="group relative cursor-pointer transform hover:scale-110 transition-transform">
                <div
                  className={`p-2 rounded-xl text-white shadow-lg flex items-center justify-center border-2 border-white ${
                    selectedAccommodationId === acc.id
                      ? 'bg-orange-600 ring-4 ring-orange-300 scale-110'
                      : 'bg-gradient-to-br from-orange-500 to-amber-600'
                  }`}
                >
                  <Home className="w-4 h-4" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-neutral-900 text-white text-[9px] px-1 rounded-full font-bold border border-white">
                  {acc.availableBeds ?? acc.totalCapacity ?? '0'}
                </div>
              </div>
            </AdvancedMarker>
          ))}

          {/* Construction Sites Markers */}
          {showSites &&
            validSites.map((site) => (
              <AdvancedMarker
                key={`site-${site.id}`}
                position={{ lat: site.parsedLat, lng: site.parsedLng }}
                onClick={() => setActiveMarker({ type: 'site', data: site })}
                title={`Site: ${site.name}`}
              >
                <div className="cursor-pointer transform hover:scale-110 transition-transform">
                  <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md border-2 border-white flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
              </AdvancedMarker>
            ))}

          {/* Projects Markers */}
          {showProjects &&
            validProjects.map((proj) => (
              <AdvancedMarker
                key={`project-${proj.id}`}
                position={{ lat: proj.parsedLat, lng: proj.parsedLng }}
                onClick={() => setActiveMarker({ type: 'project', data: proj })}
                title={`Project: ${proj.name}`}
              >
                <div className="cursor-pointer transform hover:scale-110 transition-transform">
                  <div className="p-2 rounded-xl bg-purple-600 text-white shadow-md border-2 border-white flex items-center justify-center">
                    <Briefcase className="w-4 h-4" />
                  </div>
                </div>
              </AdvancedMarker>
            ))}

          {/* Location Picker Pin */}
          {pickedPin && (
            <AdvancedMarker position={pickedPin}>
              <div className="p-2 rounded-full bg-red-600 text-white shadow-xl animate-bounce border-2 border-white">
                <MapPin className="w-5 h-5" />
              </div>
            </AdvancedMarker>
          )}

          {/* InfoWindow for clicked entity */}
          {activeMarker && (
            <InfoWindow
              position={{
                lat: activeMarker.data.parsedLat,
                lng: activeMarker.data.parsedLng,
              }}
              onCloseClick={() => setActiveMarker(null)}
            >
              <div className="p-2 max-w-xs text-neutral-900">
                {activeMarker.type === 'acc' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-orange-600">
                      <Home className="w-4 h-4" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">
                        {activeMarker.data.type || 'Accommodation'}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-neutral-900">{activeMarker.data.name}</h4>
                      <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-neutral-400" />
                        {activeMarker.data.location || activeMarker.data.address || 'Location on record'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-neutral-50 p-2 rounded-lg text-xs">
                      <div>
                        <span className="text-[10px] text-neutral-400 block">Total Admit Cap</span>
                        <span className="font-bold text-neutral-800">
                          {activeMarker.data.totalCapacity || activeMarker.data.totalAdmitCapacity || 0} Beds
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-400 block">Available Now</span>
                        <span className="font-bold text-emerald-700">
                          {activeMarker.data.availableBeds ?? activeMarker.data.totalCapacity ?? 0} Beds
                        </span>
                      </div>
                    </div>

                    {activeMarker.data.nearSiteName && (
                      <p className="text-[11px] text-blue-700 bg-blue-50 px-2 py-1 rounded">
                        Linked Site: <strong>{activeMarker.data.nearSiteName}</strong>
                      </p>
                    )}

                    <div className="flex gap-2 pt-1">
                      {onAdmitToAccommodation && (
                        <button
                          onClick={() => {
                            onAdmitToAccommodation(activeMarker.data);
                            setActiveMarker(null);
                          }}
                          className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold py-1.5 px-3 rounded-lg shadow-sm"
                        >
                          Admit Staff Here
                        </button>
                      )}
                      {onSelectAccommodation && (
                        <button
                          onClick={() => {
                            onSelectAccommodation(activeMarker.data);
                            setActiveMarker(null);
                          }}
                          className="px-2 py-1.5 border border-neutral-200 hover:bg-neutral-100 rounded-lg text-xs font-medium text-neutral-700"
                        >
                          Details
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {activeMarker.type === 'site' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1 text-blue-600">
                      <Building2 className="w-4 h-4" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Construction Site</span>
                    </div>
                    <h4 className="font-bold text-sm text-neutral-900">{activeMarker.data.name}</h4>
                    <p className="text-xs text-neutral-500">
                      Location: {activeMarker.data.location || activeMarker.data.cityRegion || 'N/A'}
                    </p>
                    <button
                      onClick={() => {
                        setProximityOrigin({ type: 'site', id: activeMarker.data.id });
                        setActiveMarker(null);
                      }}
                      className="w-full mt-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Find Nearby Staff Housing
                    </button>
                  </div>
                )}

                {activeMarker.type === 'project' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1 text-purple-600">
                      <Briefcase className="w-4 h-4" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Project</span>
                    </div>
                    <h4 className="font-bold text-sm text-neutral-900">{activeMarker.data.name}</h4>
                    <p className="text-xs text-neutral-500">
                      Client: {activeMarker.data.client || 'Internal Project'}
                    </p>
                    <button
                      onClick={() => {
                        setProximityOrigin({ type: 'project', id: activeMarker.data.id });
                        setActiveMarker(null);
                      }}
                      className="w-full mt-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Find Nearby Staff Housing
                    </button>
                  </div>
                )}
              </div>
            </InfoWindow>
          )}
        </Map>
      </div>
    </div>
  );
}
