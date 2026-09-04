import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bus,
  MapPin,
  Compass,
  AlertTriangle,
  Info,
  ShieldCheck,
  Radio,
  ExternalLink,
  Sparkles,
  Layers,
  ArrowRight,
  X,
} from 'lucide-react';
import {
  BusStop,
  BusRoute,
  BusArrivalResponse,
  WeatherForecastResponse,
  WeatherCategory,
} from './types';
import { SINGAPORE_BUS_STOPS, getBusStopByCode, SINGAPORE_BUS_ROUTES } from './data/singaporeBusStops';
import { calculateDistanceInMeters } from './utils/haversine';
import { fetchSingaporeWeather } from './utils/weatherService';
import { fetchBusArrivals } from './utils/busArrivalService';
import { WeatherBackground } from './components/WeatherBackground';
import { BusStopMap } from './components/BusStopMap';
import { BusRouterHeader } from './components/BusRouterHeader';
import { BusStopDrawer } from './components/BusStopDrawer';
import { WeatherModal } from './components/WeatherModal';

export default function App() {
  // User device location
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null
  );
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Active bus stop & all stops
  const [selectedStop, setSelectedStop] = useState<BusStop | null>(() => {
    // Default to a prominent Singapore hub: Orchard Stn / Lucky Plaza (09048) or Changi Airport PTB2 (83139)
    return SINGAPORE_BUS_STOPS.find((s) => s.code === '09048') || SINGAPORE_BUS_STOPS[0];
  });
  const [allStopsWithDist, setAllStopsWithDist] = useState<BusStop[]>(SINGAPORE_BUS_STOPS);

  // Active route preview (busrouter.sg style polyline)
  const [selectedRoute, setSelectedRoute] = useState<BusRoute | null>(null);

  // Highlighted road name (when user searches or clicks a road)
  const [highlightRoadName, setHighlightRoadName] = useState<string | null>(null);

  // Bus arrivals state
  const [arrivalData, setArrivalData] = useState<BusArrivalResponse | null>(null);
  const [arrivalsLoading, setArrivalsLoading] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(30);

  // Weather state
  const [weatherData, setWeatherData] = useState<WeatherForecastResponse | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [weatherCategoryOverride, setWeatherCategoryOverride] = useState<WeatherCategory | null>(
    null
  );
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState<boolean>(false);
  const [showWeatherOverlay, setShowWeatherOverlay] = useState<boolean>(true);

  // Info modal toggle
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);

  // Keep a ref to avoid stale closures in interval
  const selectedStopRef = useRef<BusStop | null>(selectedStop);
  useEffect(() => {
    selectedStopRef.current = selectedStop;
  }, [selectedStop]);

  const activeArrivalRequestIdRef = useRef<number>(0);

  /**
   * Sorts bus stops by distance to user coordinates
   */
  const computeNearbyStops = useCallback((lat: number, lon: number) => {
    const stopsWithDist = SINGAPORE_BUS_STOPS.map((stop) => ({
      ...stop,
      distance: calculateDistanceInMeters(lat, lon, stop.latitude, stop.longitude),
    }));

    stopsWithDist.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    setAllStopsWithDist(stopsWithDist);
    return stopsWithDist;
  }, []);

  /**
   * Request user GPS position
   */
  const handleRequestUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coords = { latitude, longitude };
        setUserLocation(coords);
        setIsLocating(false);

        const sorted = computeNearbyStops(latitude, longitude);
        if (sorted.length > 0) {
          setSelectedStop(sorted[0]);
        }
      },
      (error) => {
        setIsLocating(false);
        let msg = 'Unable to retrieve your location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location access denied. Please enable GPS permissions.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location information is unavailable.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out.';
        }
        setLocationError(msg);

        // Fallback: Default to central Singapore stops
        computeNearbyStops(1.3521, 103.8198);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [computeNearbyStops]);

  /**
   * Fetch live bus arrivals for active stop
   */
  const loadArrivals = useCallback(async (stop: BusStop) => {
    const requestId = ++activeArrivalRequestIdRef.current;
    setArrivalsLoading(true);

    try {
      const data = await fetchBusArrivals(stop.code);
      if (requestId === activeArrivalRequestIdRef.current) {
        setArrivalData(data);
        setArrivalsLoading(false);
        setCountdown(30);
      }
    } catch (err) {
      if (requestId === activeArrivalRequestIdRef.current) {
        setArrivalsLoading(false);
      }
    }
  }, []);

  /**
   * Trigger arrivals whenever selectedStop changes
   */
  useEffect(() => {
    if (selectedStop) {
      loadArrivals(selectedStop);
    }
  }, [selectedStop, loadArrivals]);

  /**
   * Auto-refresh arrivals countdown (every 30 seconds)
   */
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (selectedStopRef.current) {
            loadArrivals(selectedStopRef.current);
          }
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loadArrivals]);

  /**
   * Fetch Singapore NEA 2-Hour Weather
   */
  useEffect(() => {
    const loadWeather = async () => {
      setWeatherLoading(true);
      try {
        const lat = userLocation?.latitude || selectedStop?.latitude || 1.3521;
        const lon = userLocation?.longitude || selectedStop?.longitude || 103.8198;
        const data = await fetchSingaporeWeather(lat, lon);
        setWeatherData(data);
      } catch (err) {
        console.error('Failed to load Singapore weather', err);
      } finally {
        setWeatherLoading(false);
      }
    };

    loadWeather();
    const weatherInterval = setInterval(loadWeather, 5 * 60 * 1000); // refresh every 5 mins
    return () => clearInterval(weatherInterval);
  }, [userLocation, selectedStop]);

  /**
   * Auto-attempt geolocation on initial mount
   */
  useEffect(() => {
    handleRequestUserLocation();
  }, [handleRequestUserLocation]);

  // Determine current active weather theme
  const effectiveWeatherCategory: WeatherCategory =
    weatherCategoryOverride || weatherData?.category || 'sunny';

  const handleSelectStop = (stop: BusStop) => {
    setSelectedStop(stop);
    // If a road highlight was active, keep or update
  };

  const handleSelectRoute = (route: BusRoute) => {
    setSelectedRoute(route);
    // Also select the first stop of the route if not already
    if (route.stops.length > 0) {
      const firstStop = getBusStopByCode(route.stops[0]);
      if (firstStop) {
        setSelectedStop(firstStop);
      }
    }
  };

  const handleHighlightRoad = (roadName: string) => {
    setHighlightRoadName(roadName);
    const stopsOnRoad = allStopsWithDist.filter((s) =>
      s.roadName.toLowerCase().includes(roadName.toLowerCase())
    );
    if (stopsOnRoad.length > 0) {
      setSelectedStop(stopsOnRoad[0]);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 flex flex-col select-none">
      {/* Dynamic Animated Weather Background Canvas (as requested by user prompt) */}
      {showWeatherOverlay && (
        <div className="pointer-events-none fixed inset-0 z-[10] opacity-40">
          <WeatherBackground category={effectiveWeatherCategory} />
        </div>
      )}

      {/* Floating Top Navigation & Search Bar (busrouter.sg inspired) */}
      <BusRouterHeader
        onSelectStop={handleSelectStop}
        onSelectRoute={handleSelectRoute}
        onHighlightRoad={handleHighlightRoad}
        onLocateUser={handleRequestUserLocation}
        isLocating={isLocating}
        weather={weatherData}
        onOpenWeather={() => setIsWeatherModalOpen(true)}
        activeWeatherCategory={effectiveWeatherCategory}
      />

      {/* Full-Screen Map (The primary interface, just like busrouter.sg) */}
      <main className="relative flex-1 w-full h-full z-0">
        <BusStopMap
          userLocation={userLocation}
          allStops={allStopsWithDist}
          selectedStop={selectedStop}
          onSelectStop={handleSelectStop}
          selectedRoute={selectedRoute}
          onClearRoute={() => setSelectedRoute(null)}
          onRequestUserLocation={handleRequestUserLocation}
          locatingUser={isLocating}
          highlightRoadName={highlightRoadName}
          onClearHighlightRoad={() => setHighlightRoadName(null)}
        />
      </main>

      {/* Floating Bus Stop Drawer / Arrival Inspector (busrouter.sg slide-over style) */}
      {selectedStop && (
        <BusStopDrawer
          selectedStop={selectedStop}
          arrivals={arrivalData}
          loading={arrivalsLoading}
          onRefresh={() => loadArrivals(selectedStop)}
          countdown={countdown}
          onClose={() => setSelectedStop(null)}
          onSelectStop={handleSelectStop}
          onSelectRoute={handleSelectRoute}
        />
      )}

      {/* Floating Bottom Quick Bar (Weather toggle, Info modal, Simulation indicator) */}
      <footer className="absolute bottom-4 right-16 z-[400] flex items-center gap-2 pointer-events-auto">
        <button
          onClick={() => setShowInfoModal(true)}
          className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-lg text-xs font-medium flex items-center gap-1.5 backdrop-blur-md cursor-pointer transition-all"
          title="About & Vercel API Key Setup"
        >
          <Info className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden md:inline">API & Guide</span>
        </button>

        <button
          onClick={() => setShowWeatherOverlay(!showWeatherOverlay)}
          className={`px-3 py-1.5 rounded-xl border shadow-lg text-xs font-medium flex items-center gap-1.5 backdrop-blur-md cursor-pointer transition-all ${
            showWeatherOverlay
              ? 'bg-slate-900/90 text-amber-300 border-amber-500/40'
              : 'bg-slate-900/60 text-slate-400 border-slate-800'
          }`}
          title="Toggle Animated Weather Atmosphere"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Atmosphere</span>
        </button>
      </footer>

      {/* Weather Modal / Forecast Drawer */}
      <WeatherModal
        isOpen={isWeatherModalOpen}
        onClose={() => setIsWeatherModalOpen(false)}
        weather={weatherData}
        loading={weatherLoading}
        activeCategory={effectiveWeatherCategory}
        onSelectCategory={(cat) => setWeatherCategoryOverride(cat)}
      />

      {/* Location Error Toast */}
      {locationError && (
        <div className="absolute top-20 right-4 z-[600] bg-rose-950/90 border border-rose-600/50 text-rose-200 text-xs px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 max-w-sm animate-in fade-in slide-in-from-top duration-200">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{locationError}</span>
          <button
            onClick={() => setLocationError(null)}
            className="ml-auto text-rose-300 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Information & Vercel API Guide Modal */}
      {showInfoModal && (
        <div
          className="fixed inset-0 z-[800] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowInfoModal(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">Singapore Bus & Weather</h3>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
              <p>
                <strong>Inspired by BusRouter SG:</strong> Map-first transit explorer for Singapore
                with real-time bus arrivals, route polyline previews, and road search with
                Singapore text normalization (e.g. searching <em>&quot;Orchard Road&quot;</em> matches <em>Orchard Rd</em>).
              </p>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Radio className="w-4 h-4" />
                  <span>Vercel Hosting & Environment Variables</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  This app queries the LTA DataMall API. When hosting on Vercel, define:
                </p>
                <code className="block p-2 rounded bg-slate-900 font-mono text-[11px] text-emerald-300 border border-slate-800">
                  LTA_DATAMALL_API_KEY=your_lta_account_key_here
                </code>
                <p className="text-[10px] text-slate-500">
                  If the key is not set, the built-in resilient simulator automatically provides realistic
                  Singapore bus arrival timings and load levels so the app always functions seamlessly.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <div className="font-semibold text-amber-400">Singapore NEA Weather</div>
                <p className="text-[11px] text-slate-400">
                  Powered by data.gov.sg 2-Hour Weather Forecast API with live canvas weather
                  particles (sunshine rays, raindrops, thunder flashes, starry night).
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
