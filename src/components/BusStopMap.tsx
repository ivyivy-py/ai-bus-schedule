import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { BusStop } from '../types';
import { Locate, MapPin, Navigation } from 'lucide-react';

interface BusStopMapProps {
  userLocation: { latitude: number; longitude: number } | null;
  nearbyStops: BusStop[];
  selectedStop: BusStop | null;
  onSelectStop: (stop: BusStop) => void;
  onRequestUserLocation: () => void;
  locatingUser: boolean;
}

export const BusStopMap: React.FC<BusStopMapProps> = ({
  userLocation,
  nearbyStops,
  selectedStop,
  onSelectStop,
  onRequestUserLocation,
  locatingUser,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center: Singapore center or selected stop
    const initialLat = selectedStop?.latitude || userLocation?.latitude || 1.3521;
    const initialLng = selectedStop?.longitude || userLocation?.longitude || 103.8198;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 16,
      zoomControl: false,
    });

    // High quality OpenStreetMap tiles with dark/modern cartography styling
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Add zoom control in top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
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
            <span class="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping"></span>
            <span class="relative inline-flex items-center justify-center rounded-full h-5 w-5 bg-emerald-500 border-2 border-white shadow-lg text-white font-bold text-[9px]">
              ME
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
          .bindTooltip('Your Current Location', { permanent: false, direction: 'top' });
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
  }, [userLocation]);

  // Update bus stop markers whenever nearbyStops or selectedStop changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    nearbyStops.forEach((stop) => {
      const isSelected = selectedStop?.code === stop.code;

      const stopIcon = L.divIcon({
        className: 'custom-bus-stop-pin',
        html: `
          <div class="cursor-pointer transition-transform hover:scale-110 flex flex-col items-center group">
            <div class="px-2 py-1 rounded-md shadow-md text-xs font-bold font-mono tracking-tight flex items-center gap-1 border ${
              isSelected
                ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-300 ring-offset-1 shadow-emerald-500/40'
                : 'bg-slate-900/90 text-slate-100 border-slate-700 hover:border-emerald-400 hover:text-emerald-300'
            }">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 6v6"/>
                <path d="M16 6v6"/>
                <rect width="16" height="16" x="4" y="3" rx="2"/>
                <path d="M4 11h16"/>
                <path d="M8 19v2"/>
                <path d="M16 19v2"/>
              </svg>
              <span>${stop.code}</span>
            </div>
            <div class="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent ${
              isSelected ? 'border-t-[5px] border-t-emerald-600' : 'border-t-[5px] border-t-slate-900'
            }"></div>
          </div>
        `,
        iconSize: [60, 30],
        iconAnchor: [30, 28],
      });

      const marker = L.marker([stop.latitude, stop.longitude], {
        icon: stopIcon,
        zIndexOffset: isSelected ? 500 : 100,
      });

      marker.on('click', () => {
        onSelectStop(stop);
      });

      // Bind popup with stop details
      marker.bindPopup(`
        <div class="p-1 text-slate-900 text-sm font-sans">
          <div class="font-bold text-base text-slate-950">${stop.description}</div>
          <div class="text-xs text-slate-600 mb-1">${stop.roadName} &bull; Code: <strong>${stop.code}</strong></div>
          ${stop.distance ? `<div class="text-xs text-emerald-700 font-semibold mb-2">📍 ${stop.distance < 1000 ? `${stop.distance}m away` : `${(stop.distance / 1000).toFixed(1)}km away`}</div>` : ''}
          <button id="popup-select-${stop.code}" class="w-full mt-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold cursor-pointer">
            View Live Arrivals &rarr;
          </button>
        </div>
      `);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`popup-select-${stop.code}`);
        if (btn) {
          btn.onclick = () => {
            onSelectStop(stop);
            map.closePopup();
          };
        }
      });

      markersLayer.addLayer(marker);
    });
  }, [nearbyStops, selectedStop, onSelectStop]);

  // Pan to selected stop when it changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedStop) return;

    map.panTo([selectedStop.latitude, selectedStop.longitude], {
      animate: true,
      duration: 0.8,
    });
  }, [selectedStop]);

  const handleCenterOnUser = () => {
    const map = mapInstanceRef.current;
    if (userLocation && map) {
      map.setView([userLocation.latitude, userLocation.longitude], 17, { animate: true });
    } else {
      onRequestUserLocation();
    }
  };

  const handleCenterOnSelectedStop = () => {
    const map = mapInstanceRef.current;
    if (selectedStop && map) {
      map.setView([selectedStop.latitude, selectedStop.longitude], 17, { animate: true });
    }
  };

  return (
    <div
      id="bus-stop-map-wrapper"
      className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-slate-800/80 shadow-2xl bg-slate-900"
    >
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Floating Map Navigation Controls */}
      <div className="absolute top-3 left-3 z-[400] flex flex-col gap-2">
        <button
          id="map-locate-me-btn"
          onClick={handleCenterOnUser}
          disabled={locatingUser}
          title="Locate me & show nearest bus stops"
          className="px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700/80 shadow-lg text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer hover:border-emerald-500"
        >
          <Locate className={`w-3.5 h-3.5 text-emerald-400 ${locatingUser ? 'animate-spin' : ''}`} />
          <span>{locatingUser ? 'Locating...' : 'Nearest Stops'}</span>
        </button>

        {selectedStop && (
          <button
            id="map-focus-stop-btn"
            onClick={handleCenterOnSelectedStop}
            title="Focus on currently selected bus stop"
            className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-lg text-xs font-medium flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Focus Stop {selectedStop.code}</span>
          </button>
        )}
      </div>

      {/* Map legend / status in bottom left */}
      <div className="absolute bottom-3 left-3 z-[400] px-2.5 py-1.5 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] text-slate-300 shadow-md flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
          Selected Stop
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block" />
          Nearby Stops ({nearbyStops.length})
        </span>
      </div>
    </div>
  );
};
