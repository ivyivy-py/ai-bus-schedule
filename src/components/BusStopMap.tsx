import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { BusStop, BusRoute } from '../types';
import { Locate, Compass, Route as RouteIcon, X, Layers, RefreshCw } from 'lucide-react';
import { SINGAPORE_BUS_STOPS, getBusStopByCode } from '../data/singaporeBusStops';

interface BusStopMapProps {
  userLocation: { latitude: number; longitude: number } | null;
  allStops: BusStop[];
  selectedStop: BusStop | null;
  onSelectStop: (stop: BusStop) => void;
  selectedRoute: BusRoute | null;
  onClearRoute: () => void;
  onToggleRouteDirection?: () => void;
  onRequestUserLocation: () => void;
  locatingUser: boolean;
  highlightRoadName: string | null;
  onClearHighlightRoad: () => void;
}

export const BusStopMap: React.FC<BusStopMapProps> = ({
  userLocation,
  allStops,
  selectedStop,
  onSelectStop,
  selectedRoute,
  onClearRoute,
  onToggleRouteDirection,
  onRequestUserLocation,
  locatingUser,
  highlightRoadName,
  onClearHighlightRoad,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const stopsLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center on Singapore
    const initialLat = selectedStop?.latitude || userLocation?.latitude || 1.3521;
    const initialLng = selectedStop?.longitude || userLocation?.longitude || 103.8198;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: false,
      maxBounds: [
        [1.15, 103.55],
        [1.5, 104.1],
      ],
      minZoom: 11,
    });

    // High quality modern cartography tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Zoom controls in top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    const routeLayer = L.layerGroup().addTo(map);
    routeLayerRef.current = routeLayer;

    const stopsLayer = L.layerGroup().addTo(map);
    stopsLayerRef.current = stopsLayer;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update User Location marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'custom-user-pin',
        html: `
          <div class="relative flex items-center justify-center w-8 h-8">
            <span class="absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75 animate-ping"></span>
            <span class="relative inline-flex items-center justify-center rounded-full h-5 w-5 bg-sky-500 border-2 border-white shadow-lg text-white font-bold text-[8px]">
              GPS
            </span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLocation.latitude, userLocation.longitude]);
      } else {
        userMarkerRef.current = L.marker([userLocation.latitude, userLocation.longitude], {
          icon: userIcon,
          zIndexOffset: 1000,
        })
          .addTo(map)
          .bindTooltip('Your Current Location (GPS)', { permanent: false, direction: 'top' });
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
  }, [userLocation]);

  // Render bus stop markers (busrouter.sg styled badges)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const stopsLayer = stopsLayerRef.current;
    if (!map || !stopsLayer) return;

    stopsLayer.clearLayers();

    // Ensure all stops in selectedRoute are included in rendering even if distant
    const stopsMap = new Map<string, BusStop>();
    const baseStops = allStops.length > 0 ? allStops : SINGAPORE_BUS_STOPS;
    baseStops.forEach((s) => stopsMap.set(s.code, s));

    if (selectedRoute) {
      selectedRoute.stops.forEach((code) => {
        if (!stopsMap.has(code)) {
          stopsMap.set(code, getBusStopByCode(code));
        }
      });
    }

    const stopsToRender = Array.from(stopsMap.values());

    stopsToRender.forEach((stop) => {
      const isSelected = selectedStop?.code === stop.code;
      const isRoadHighlighted =
        highlightRoadName &&
        stop.roadName.toLowerCase().includes(highlightRoadName.toLowerCase());
      const routeSeq = selectedRoute ? selectedRoute.stops.indexOf(stop.code) : -1;
      const isRouteStop = routeSeq !== -1;

      // Distinctive busrouter.sg style marker:
      // Red pill badge with white text, or green if selected, sky blue if route stop
      const badgeBg = isSelected
        ? 'bg-emerald-600 text-white border-white ring-4 ring-emerald-400/50 shadow-emerald-500/50'
        : isRouteStop
        ? 'bg-sky-600 text-white border-white ring-2 ring-sky-400 shadow-sky-500/40'
        : isRoadHighlighted
        ? 'bg-amber-600 text-white border-white ring-2 ring-amber-400'
        : 'bg-rose-600 hover:bg-rose-500 text-white border-white/90 shadow-md';

      const labelText = isRouteStop ? `#${routeSeq + 1} ${stop.code}` : stop.code;

      const stopIcon = L.divIcon({
        className: 'custom-bus-stop-pin',
        html: `
          <div class="cursor-pointer transition-all duration-200 hover:scale-125 flex flex-col items-center group ${
            isSelected ? 'scale-115 z-50' : isRouteStop ? 'z-40' : 'z-20'
          }">
            <div class="px-1.5 py-0.5 rounded-full shadow-lg text-[10px] font-mono font-bold tracking-tight flex items-center gap-1 border ${badgeBg}">
              <span class="w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white animate-pulse' : isRouteStop ? 'bg-sky-200' : 'bg-rose-200'}"></span>
              <span>${labelText}</span>
            </div>
            <div class="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] ${
              isSelected
                ? 'border-t-emerald-600'
                : isRouteStop
                ? 'border-t-sky-600'
                : isRoadHighlighted
                ? 'border-t-amber-600'
                : 'border-t-rose-600'
            }"></div>
          </div>
        `,
        iconSize: isRouteStop ? [60, 24] : [46, 24],
        iconAnchor: isRouteStop ? [30, 22] : [23, 22],
      });

      const marker = L.marker([stop.latitude, stop.longitude], {
        icon: stopIcon,
        zIndexOffset: isSelected ? 800 : isRouteStop ? 600 : isRoadHighlighted ? 500 : 100,
      });

      marker.on('click', () => {
        onSelectStop(stop);
      });

      // Interactive Popup
      marker.bindPopup(`
        <div class="p-1 text-slate-900 font-sans min-w-[180px]">
          <div class="flex items-center gap-1.5 mb-1">
            <span class="px-1.5 py-0.5 rounded bg-rose-600 text-white font-mono font-bold text-[10px]">${stop.code}</span>
            <span class="text-xs font-semibold text-slate-600">${stop.roadName}</span>
          </div>
          <div class="font-bold text-sm text-slate-950 leading-tight mb-2">${stop.description}</div>
          ${
            stop.distance
              ? `<div class="text-[11px] text-emerald-700 font-semibold mb-2">📍 ${
                  stop.distance < 1000
                    ? `${stop.distance}m away`
                    : `${(stop.distance / 1000).toFixed(1)}km away`
                }</div>`
              : ''
          }
          <button id="popup-view-arrivals-${stop.code}" class="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer text-center">
            View Live Arrivals &rarr;
          </button>
        </div>
      `);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`popup-view-arrivals-${stop.code}`);
        if (btn) {
          btn.onclick = () => {
            onSelectStop(stop);
            map.closePopup();
          };
        }
      });

      stopsLayer.addLayer(marker);
    });
  }, [allStops, selectedStop, highlightRoadName, selectedRoute, onSelectStop]);

  // Render bus route polyline (busrouter.sg route path)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const routeLayer = routeLayerRef.current;
    if (!map || !routeLayer) return;

    routeLayer.clearLayers();

    if (selectedRoute && selectedRoute.stops.length > 1) {
      const routeCoordinates: [number, number][] = [];

      selectedRoute.stops.forEach((stopCode) => {
        const s = getBusStopByCode(stopCode);
        if (s) {
          routeCoordinates.push([s.latitude, s.longitude]);
        }
      });

      if (routeCoordinates.length > 1) {
        // Outer glowing line
        const glowLine = L.polyline(routeCoordinates, {
          color: selectedRoute.color || '#0ea5e9',
          weight: 7,
          opacity: 0.35,
          lineCap: 'round',
          lineJoin: 'round',
        });

        // Inner solid line
        const solidLine = L.polyline(routeCoordinates, {
          color: selectedRoute.color || '#0ea5e9',
          weight: 4,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
          dashArray: '8, 4',
        });

        routeLayer.addLayer(glowLine);
        routeLayer.addLayer(solidLine);

        // Fit map bounds to show whole route
        map.fitBounds(L.latLngBounds(routeCoordinates), {
          padding: [80, 80],
          maxZoom: 15,
        });
      }
    }
  }, [selectedRoute]);

  // Fit map when road is highlighted
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !highlightRoadName) return;

    const matchingStops = allStops.filter((s) =>
      s.roadName.toLowerCase().includes(highlightRoadName.toLowerCase())
    );

    if (matchingStops.length > 0) {
      const bounds = L.latLngBounds(matchingStops.map((s) => [s.latitude, s.longitude]));
      map.fitBounds(bounds, { padding: [100, 100], maxZoom: 16 });
    }
  }, [highlightRoadName, allStops]);

  // Pan to selected stop smoothly
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedStop) return;

    map.panTo([selectedStop.latitude, selectedStop.longitude], {
      animate: true,
      duration: 0.6,
    });
  }, [selectedStop]);

  const handleCenterOnUser = () => {
    const map = mapInstanceRef.current;
    if (userLocation && map) {
      map.setView([userLocation.latitude, userLocation.longitude], 16, { animate: true });
    } else {
      onRequestUserLocation();
    }
  };

  const handleResetSingaporeView = () => {
    const map = mapInstanceRef.current;
    if (map) {
      map.setView([1.3521, 103.8198], 12, { animate: true });
    }
  };

  return (
    <div id="bus-router-map-container" className="relative w-full h-full min-h-[500px] overflow-hidden bg-slate-900">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Bento Grid Floating Route Card */}
      {selectedRoute && (
        <div
          id="active-route-bento-card"
          className="absolute top-24 sm:top-28 left-1/2 -translate-x-1/2 z-[400] w-[95%] max-w-xl bg-slate-950/92 backdrop-blur-xl border border-sky-500/40 rounded-2xl shadow-2xl p-3 text-slate-100 animate-in fade-in slide-in-from-top-4 duration-200"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2 mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="px-2.5 py-1 rounded-xl bg-sky-500 text-white font-mono font-black text-sm tracking-wide shadow-md shadow-sky-500/20 shrink-0">
                {selectedRoute.serviceNo}
              </span>
              {selectedRoute.operator && (
                <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[10px] uppercase font-bold border border-slate-700 shrink-0">
                  {selectedRoute.operator}
                </span>
              )}
              <div className="min-w-0 truncate">
                <span className="text-xs font-bold text-white truncate block">
                  {selectedRoute.name}
                </span>
                <span className="text-[11px] text-slate-400 truncate block">
                  {selectedRoute.origin} &rarr; {selectedRoute.destination}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {onToggleRouteDirection && (
                <button
                  onClick={onToggleRouteDirection}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 text-xs font-semibold flex items-center gap-1 border border-slate-700 cursor-pointer transition-colors"
                  title="Switch Direction"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Dir {selectedRoute.direction || 1}</span>
                </button>
              )}
              <button
                onClick={onClearRoute}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer transition-colors"
                title="Clear highlighted route"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bento Sub-Metrics Grid */}
          <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
            <div className="bg-slate-900/80 rounded-xl p-1.5 border border-slate-800/80">
              <div className="text-slate-400 text-[10px]">Stops</div>
              <div className="font-bold text-white font-mono">{selectedRoute.stops.length}</div>
            </div>
            <div className="bg-slate-900/80 rounded-xl p-1.5 border border-slate-800/80">
              <div className="text-slate-400 text-[10px]">Distance</div>
              <div className="font-bold text-sky-400 font-mono">
                {selectedRoute.distanceKm ? `${selectedRoute.distanceKm} km` : 'Full Run'}
              </div>
            </div>
            <div className="bg-slate-900/80 rounded-xl p-1.5 border border-slate-800/80">
              <div className="text-slate-400 text-[10px]">First Bus</div>
              <div className="font-bold text-emerald-400 font-mono">{selectedRoute.firstBus || '05:30'}</div>
            </div>
            <div className="bg-slate-900/80 rounded-xl p-1.5 border border-slate-800/80">
              <div className="text-slate-400 text-[10px]">Last Bus</div>
              <div className="font-bold text-amber-400 font-mono">{selectedRoute.lastBus || '23:30'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Highlighted Road Banner */}
      {highlightRoadName && (
        <div
          id="highlighted-road-banner"
          className="absolute top-28 left-1/2 -translate-x-1/2 z-[400] bg-slate-900/95 backdrop-blur-md border border-amber-500/40 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs max-w-lg w-[90%] sm:w-auto"
        >
          <span className="text-amber-400 font-bold">Road:</span>
          <span className="font-semibold text-white truncate">{highlightRoadName}</span>
          <button
            onClick={onClearHighlightRoad}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer ml-auto"
            title="Clear road highlight"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Map Action Controls in Bottom Right */}
      <div className="absolute bottom-6 right-4 z-[400] flex flex-col gap-2">
        <button
          id="map-locate-gps-btn"
          onClick={handleCenterOnUser}
          disabled={locatingUser}
          title="Locate my position (GPS)"
          className="w-10 h-10 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700/80 shadow-xl flex items-center justify-center backdrop-blur-md transition-all cursor-pointer hover:border-sky-400 active:scale-95"
        >
          <Locate className={`w-5 h-5 text-sky-400 ${locatingUser ? 'animate-spin' : ''}`} />
        </button>

        <button
          id="map-reset-singapore-btn"
          onClick={handleResetSingaporeView}
          title="Reset to Singapore Overview"
          className="w-10 h-10 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-xl flex items-center justify-center backdrop-blur-md transition-all cursor-pointer hover:border-sky-400 active:scale-95"
        >
          <Compass className="w-5 h-5" />
        </button>
      </div>

      {/* Map Legend (busrouter.sg reference) in Bottom Left */}
      <div className="absolute bottom-6 left-4 z-[400] hidden sm:flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 text-[11px] text-slate-300 shadow-xl">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 border border-white/50 inline-block" />
          <span>Bus Stop</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white inline-block" />
          <span>Selected</span>
        </div>
        {userLocation && (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse inline-block" />
            <span>You</span>
          </div>
        )}
      </div>
    </div>
  );
};
