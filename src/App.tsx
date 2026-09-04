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
} from 'lucide-react';
import {
  BusStop,
  BusArrivalResponse,
  WeatherForecastResponse,
  WeatherCategory,
} from './types';
import { SINGAPORE_BUS_STOPS, getBusStopByCode } from './data/singaporeBusStops';
import { calculateDistanceInMeters, formatDistance } from './utils/haversine';
import { fetchSingaporeWeather } from './utils/weatherService';
import { fetchBusArrivals } from './utils/busArrivalService';
import { WeatherBackground } from './components/WeatherBackground';
import { WeatherCard } from './components/WeatherCard';
import { BusStopSelector } from './components/BusStopSelector';
import { BusStopMap } from './components/BusStopMap';
import { BusArrivalList } from './components/BusArrivalList';

export default function App() {
  // User device location
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null
  );
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Active bus stop & nearby stops
  const [selectedStop, setSelectedStop] = useState<BusStop | null>(null);
  const [nearbyStops, setNearbyStops] = useState<BusStop[]>([]);

  // Bus arrivals state
  const [arrivalData, setArrivalData] = useState<BusArrivalResponse | null>(null);
  const [arrivalsLoading, setArrivalsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<number>(30);

  // Weather state
  const [weatherData, setWeatherData] = useState<WeatherForecastResponse | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [weatherCategoryOverride, setWeatherCategoryOverride] = useState<WeatherCategory | null>(
    null
  );

  // Info modal toggle
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);

  // Live Singapore Time clock (UTC+8)
  const [sgTime, setSgTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Singapore',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      setSgTime(formatter.format(now));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Active ref to prevent stale closures in timers and fetch race conditions
  const selectedStopRef = useRef<BusStop | null>(null);
  useEffect(() => {
    selectedStopRef.current = selectedStop;
  }, [selectedStop]);

  const activeArrivalRequestIdRef = useRef<number>(0);
  const searchInputRef = useRef<HTMLDivElement | null>(null);

  /**
   * Sorts bus stops by distance to coordinates and populates nearby stops.
   */
  const computeNearbyStops = useCallback((lat: number, lon: number) => {
    const stopsWithDist = SINGAPORE_BUS_STOPS.map((stop) => ({
      ...stop,
      distance: calculateDistanceInMeters(lat, lon, stop.latitude, stop.longitude),
    }));

    stopsWithDist.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    setNearbyStops(stopsWithDist.slice(0, 15));
    return stopsWithDist;
  }, []);

  /**
   * Loads arrivals for a specific bus stop.
   * Uses requestId guard to prevent out-of-order responses.
   */
  const loadArrivals = useCallback(async (stop: BusStop) => {
    const requestId = ++activeArrivalRequestIdRef.current;
    setArrivalsLoading(true);

    try {
      const data = await fetchBusArrivals(stop.code);
      if (requestId === activeArrivalRequestIdRef.current) {
        setArrivalData(data);
        setLastUpdated(new Date());
        setCountdown(30);
      }
    } catch (err) {
      if (requestId === activeArrivalRequestIdRef.current) {
        console.error('Error fetching arrival times:', err);
      }
    } finally {
      if (requestId === activeArrivalRequestIdRef.current) {
        setArrivalsLoading(false);
      }
    }
  }, []);

  /**
   * Loads weather forecast near coordinates.
   */
  const loadWeather = useCallback(async (lat: number, lon: number) => {
    setWeatherLoading(true);
    try {
      const w = await fetchSingaporeWeather(lat, lon);
      setWeatherData(w);
    } catch (err) {
      console.error('Error fetching weather:', err);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  /**
   * Trigger device geolocation to find the nearest bus stop in Singapore.
   */
  const locateUser = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });

        const sorted = computeNearbyStops(latitude, longitude);
        if (sorted.length > 0) {
          const nearest = sorted[0];
          setSelectedStop(nearest);
          loadArrivals(nearest);
        }

        loadWeather(latitude, longitude);
      },
      (error) => {
        setIsLocating(false);
        let msg = 'Could not retrieve your location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location access was denied. Showing central Singapore bus stops.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out. Showing central Singapore stops.';
        }
        setLocationError(msg);

        // Fallback default: Changi Airport PTB2 (83139)
        if (!selectedStopRef.current) {
          const defaultStop = getBusStopByCode('83139');
          setSelectedStop(defaultStop);
          computeNearbyStops(defaultStop.latitude, defaultStop.longitude);
          loadArrivals(defaultStop);
          loadWeather(defaultStop.latitude, defaultStop.longitude);
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, [computeNearbyStops, loadArrivals, loadWeather]);

  // Initial load: Attempt geolocation or fallback to default stop (83139)
  useEffect(() => {
    locateUser();
  }, [locateUser]);

  // Handle manual selection of a bus stop
  const handleSelectStop = useCallback(
    (stop: BusStop) => {
      setSelectedStop(stop);
      loadArrivals(stop);

      if (!userLocation) {
        loadWeather(stop.latitude, stop.longitude);
      }
    },
    [loadArrivals, loadWeather, userLocation]
  );

  // Manual refresh of arrivals
  const handleManualRefresh = useCallback(() => {
    const current = selectedStopRef.current;
    if (current) {
      loadArrivals(current);
    }
  }, [loadArrivals]);

  // Manual refresh of weather
  const handleWeatherRefresh = useCallback(() => {
    const lat = userLocation?.latitude || selectedStop?.latitude || 1.3521;
    const lon = userLocation?.longitude || selectedStop?.longitude || 103.8198;
    loadWeather(lat, lon);
  }, [userLocation, selectedStop, loadWeather]);

  // Periodic auto-refresh countdown (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
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

    return () => clearInterval(interval);
  }, [loadArrivals]);

  // Scroll to search input when user clicks "Change Stop" inside the card
  const handleScrollToSearch = () => {
    if (searchInputRef.current) {
      searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = document.getElementById('bus-stop-search-input') as HTMLInputElement | null;
      if (input) input.focus();
    }
  };

  // Determine active weather animation category
  const activeWeatherCategory: WeatherCategory =
    weatherCategoryOverride || weatherData?.category || 'sunny';

  // Smart assistant commute tip based on weather & arrivals
  const smartAssistantTip = (() => {
    if (activeWeatherCategory === 'thunder') {
      return 'Thundery weather alert. Take Double Decker buses for dry upper-deck seating and sheltered interchange transfers.';
    }
    if (activeWeatherCategory === 'rain') {
      return 'Passing showers detected. Carry an umbrella or board the next arriving bus before heavy rain begins.';
    }
    if (arrivalData?.services && arrivalData.services.length > 0) {
      const firstService = arrivalData.services[0];
      return `Catch Bus ${firstService.serviceNo} to avoid peak crowds. Next arrival estimated shortly.`;
    }
    return 'Board your bus using contactless Mastercard/Visa or EZ-Link card for seamless tap-in transit.';
  })();

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans p-4 sm:p-6 lg:p-8 flex flex-col gap-6 relative overflow-x-hidden selection:bg-sky-500/30 selection:text-sky-200">
      {/* Bento Atmospheric Grid Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-transparent to-slate-950" />
        <div
          className="absolute top-0 left-0 w-full h-full opacity-20"
          style={{
            backgroundImage: 'radial-gradient(#60a5fa 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
      </div>

      {/* Atmospheric Weather Animation Canvas */}
      <WeatherBackground
        category={activeWeatherCategory}
        forecastText={weatherData?.forecast}
      />

      {/* Bento Header */}
      <header className="z-10 flex justify-between items-center pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            SG <span className="text-sky-400">Arrivals</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-medium">Real-time LTA &amp; NEA Data</p>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <div className="text-right">
            <div className="text-lg sm:text-xl font-mono text-white font-bold tracking-wider">
              {sgTime || '12:00:00'}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-widest">
              Singapore Time
            </div>
          </div>

          <div
            title="LTA & NEA Live Data Stream Active"
            className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0"
          >
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <button
            id="app-info-btn"
            onClick={() => setShowInfoModal(true)}
            className="hidden sm:flex px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold items-center gap-1.5 transition-all cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-sky-400" />
            <span>API &amp; Vercel Guide</span>
          </button>
        </div>
      </header>

      {/* Location Error Notice if GPS permission is denied */}
      {locationError && (
        <div
          id="location-error-alert"
          className="z-10 p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-md"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{locationError}</span>
          </div>
          <button
            onClick={locateUser}
            className="px-2.5 py-1 rounded-xl bg-amber-600/40 hover:bg-amber-600/60 text-amber-100 font-semibold text-xs cursor-pointer whitespace-nowrap"
          >
            Retry GPS
          </button>
        </div>
      )}

      {/* Bus Stop Search Bar Section */}
      <section ref={searchInputRef} className="z-10" aria-label="Search Bus Stops">
        <BusStopSelector
          selectedStop={selectedStop}
          onSelectStop={handleSelectStop}
          onFindNearest={locateUser}
          isLocating={isLocating}
          userLocation={userLocation}
        />
      </section>

      {/* Main Bento Grid Layout */}
      <main className="z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow items-stretch">
        {/* Bento Tile 1: Weather Forecast (col-span-1) */}
        <div className="col-span-1 flex flex-col">
          <WeatherCard
            weather={weatherData}
            loading={weatherLoading}
            onRefresh={handleWeatherRefresh}
            activeCategory={activeWeatherCategory}
            categoryOverride={weatherCategoryOverride}
            onSelectCategoryOverride={setWeatherCategoryOverride}
          />
        </div>

        {/* Bento Tile 2: Live Bus Arrivals (col-span-2) */}
        <div className="col-span-1 lg:col-span-2 flex flex-col">
          <BusArrivalList
            selectedStop={selectedStop}
            arrivalData={arrivalData}
            loading={arrivalsLoading}
            onRefresh={handleManualRefresh}
            lastUpdated={lastUpdated}
            refreshCountdown={countdown}
            onChangeStopClick={handleScrollToSearch}
          />
        </div>

        {/* Bento Tile 3: Nearest Stops */}
        <div className="col-span-1 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs uppercase tracking-widest text-slate-500 font-bold">
                Nearest Stops
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">1-Tap Select</span>
            </div>

            <div className="space-y-2.5">
              {nearbyStops.slice(0, 3).map((stop, idx) => {
                const isSelected = selectedStop?.code === stop.code;
                return (
                  <div
                    key={stop.code}
                    onClick={() => handleSelectStop(stop)}
                    className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-colors border ${
                      isSelected
                        ? 'bg-sky-500/15 border-sky-500/40 text-white'
                        : 'bg-slate-800/50 hover:bg-slate-700/50 border-transparent text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          isSelected ? 'bg-sky-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <span className="text-sm font-semibold block line-clamp-1">
                          {stop.description}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">Stop #{stop.code}</span>
                      </div>
                    </div>
                    {stop.distance && (
                      <span className="text-xs font-mono text-emerald-400 shrink-0 ml-2 font-semibold">
                        {formatDistance(stop.distance)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>{nearbyStops.length} nearby stops mapped</span>
            <button
              onClick={locateUser}
              className="text-sky-400 hover:text-sky-300 font-semibold cursor-pointer"
            >
              Update GPS
            </button>
          </div>
        </div>

        {/* Bento Tile 4: Service Updates & Advisory */}
        <div className="col-span-1 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-lg flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs uppercase tracking-widest text-slate-500 font-bold">
                Service Updates
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-semibold border border-emerald-500/20">
                NORMAL OP
              </span>
            </div>

            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex gap-3.5 items-start">
              <div className="w-10 h-10 shrink-0 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="text-xs leading-relaxed text-slate-300">
                <span className="font-bold text-amber-400 block mb-1 uppercase tracking-tight">
                  Transit Advisory
                </span>
                Standard weekend bus frequencies apply across SBS Transit, SMRT, Tower Transit, and Go-Ahead Singapore fleets.
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>Source: LTA DataMall v3</span>
            <span className="text-emerald-400 font-mono">100% On-Time</span>
          </div>
        </div>

        {/* Bento Tile 5: Smart Transit Assistant (Highlighted Accent Tile) */}
        <div className="col-span-1 bg-sky-500 rounded-3xl p-6 shadow-lg flex flex-col justify-between relative group overflow-hidden text-slate-950">
          <div className="relative z-10">
            <h4 className="text-xs uppercase tracking-widest text-sky-950 font-bold mb-1 opacity-80">
              Smart Assistant
            </h4>
            <p className="text-sky-950 font-bold text-lg leading-tight mt-2">{smartAssistantTip}</p>
          </div>

          <div className="relative z-10 mt-5 flex items-center justify-between">
            <button
              onClick={handleManualRefresh}
              className="bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer transition-colors shadow-md"
            >
              Refresh Timing
            </button>
            <span className="text-xs font-mono font-bold text-sky-950 opacity-80">
              AI Commute Tip
            </span>
          </div>

          {/* Decorative watermark icon from Bento design */}
          <svg
            className="absolute -right-8 -bottom-8 text-sky-400/30 w-36 h-36 pointer-events-none"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
          </svg>
        </div>

        {/* Bento Tile 6: Interactive Leaflet Map Section (Full Width Tile) */}
        <div className="col-span-1 lg:col-span-3 bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-400" />
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Interactive Singapore Bus Map
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Click any bus stop pin to inspect code and immediately load arrivals.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {userLocation ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium flex items-center gap-1.5 font-mono">
                  <Radio className="w-3.5 h-3.5 animate-ping" />
                  GPS Tracking Active
                </span>
              ) : (
                <button
                  onClick={locateUser}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold border border-slate-700 cursor-pointer"
                >
                  Enable GPS Location
                </button>
              )}
            </div>
          </div>

          <BusStopMap
            userLocation={userLocation}
            nearbyStops={nearbyStops}
            selectedStop={selectedStop}
            onSelectStop={handleSelectStop}
            onRequestUserLocation={locateUser}
            locatingUser={isLocating}
          />
        </div>
      </main>

      {/* Bento Footer */}
      <footer className="z-10 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] pt-4 pb-2 border-t border-slate-800/80 gap-3">
        <div>LTA DATAMALL API 3.0 &bull; SG GOV OPEN DATA</div>
        <div className="flex items-center gap-4">
          <span>DEV MODE: ENVIRONMENT_STABLE</span>
          <button
            onClick={() => setShowInfoModal(true)}
            className="hover:text-sky-400 transition-colors cursor-pointer underline lowercase tracking-normal"
          >
            setup guide
          </button>
        </div>
      </footer>

      {/* Info & Setup Modal */}
      {showInfoModal && (
        <div
          id="info-modal-backdrop"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowInfoModal(false)}
        >
          <div
            id="info-modal-card"
            className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-4 text-sm text-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-base text-white">Singapore Bus &amp; Weather Guide</h3>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 leading-relaxed text-xs sm:text-sm">
              <div>
                <h4 className="font-semibold text-sky-400 mb-1">1. LTA DataMall API Key (Vercel)</h4>
                <p className="text-slate-400">
                  To get live LTA arrival data, register for a free AccountKey at{' '}
                  <a
                    href="https://datamall.lta.gov.sg"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-400 underline inline-flex items-center gap-0.5"
                  >
                    datamall.lta.gov.sg <ExternalLink className="w-3 h-3" />
                  </a>
                  . Add it in Vercel under:
                </p>
                <div className="mt-1.5 p-2.5 rounded-xl bg-slate-950 font-mono text-xs text-amber-300 border border-slate-800">
                  LTA_API_KEY = your_account_key_here
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sky-400 mb-1">2. Weather Forecast API</h4>
                <p className="text-slate-400">
                  Connected to Singapore data.gov.sg (NEA 2-hour forecast). No key required! It matches the nearest Singapore forecast zone (e.g. Bedok, Downtown, Changi) to your GPS or selected bus stop.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-sky-400 mb-1">3. Bento Grid Design</h4>
                <p className="text-slate-400">
                  Features high-contrast dark card tiles, live Singapore Time clock, atmospheric particle background, and real-time transit telemetry.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-md"
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
