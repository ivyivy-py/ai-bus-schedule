import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MapPin,
  Locate,
  Bus,
  CloudSun,
  X,
  Navigation,
  Clock,
  ArrowRight,
  Hash,
} from 'lucide-react';
import { BusStop, BusRoute, WeatherForecastResponse, SearchMode } from '../types';
import {
  searchBusStops,
  searchRoads,
  searchBusServices,
  searchBusStopsByCode,
  SINGAPORE_BUS_STOPS,
  SINGAPORE_BUS_ROUTES,
} from '../data/singaporeBusStops';

interface BusRouterHeaderProps {
  onSelectStop: (stop: BusStop) => void;
  onSelectRoute: (route: BusRoute) => void;
  onHighlightRoad: (roadName: string) => void;
  onLocateUser: () => void;
  isLocating: boolean;
  weather: WeatherForecastResponse | null;
  onOpenWeather: () => void;
  activeWeatherCategory: string;
}

export const BusRouterHeader: React.FC<BusRouterHeaderProps> = ({
  onSelectStop,
  onSelectRoute,
  onHighlightRoad,
  onLocateUser,
  isLocating,
  weather,
  onOpenWeather,
}) => {
  // Input type selection: user chooses whether they are searching by bus service, road name, or bus-stop number
  const [searchMode, setSearchMode] = useState<SearchMode>('service');
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Scoped search results
  const [stopResults, setStopResults] = useState<BusStop[]>([]);
  const [roadResults, setRoadResults] = useState<
    { roadName: string; stopCount: number; stops: BusStop[] }[]
  >([]);
  const [serviceResults, setServiceResults] = useState<BusRoute[]>([]);
  const [crossModeSuggestions, setCrossModeSuggestions] = useState<{
    services: BusRoute[];
    stops: BusStop[];
    roads: { roadName: string; stopCount: number; stops: BusStop[] }[];
  }>({ services: [], stops: [], roads: [] });

  // Live Singapore Clock (SGT, UTC+8)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-SG', {
          timeZone: 'Asia/Singapore',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update suggestions based on selected searchMode and query
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setStopResults([]);
      setRoadResults([]);
      setServiceResults([]);
      setCrossModeSuggestions({ services: [], stops: [], roads: [] });
      return;
    }

    // Auto-detect exact 5-digit bus stop number as user types or pastes
    if (/^\d{5}$/.test(trimmed)) {
      const match = searchBusStopsByCode(trimmed);
      if (match.length > 0) {
        onSelectStop(match[0]);
      }
    }

    const services = searchBusServices(trimmed);
    const roads = searchRoads(trimmed);
    const stopsByCode = searchBusStopsByCode(trimmed);
    const stopsByName = searchBusStops(trimmed);
    // Combine stop matches, prioritizing exact code matches
    const allMatchingStops = Array.from(
      new Map([...stopsByCode, ...stopsByName].map((s) => [s.code, s])).values()
    );

    if (searchMode === 'service') {
      setServiceResults(services);
      setRoadResults([]);
      setStopResults([]);
      setCrossModeSuggestions({
        services: [],
        stops: allMatchingStops.slice(0, 5),
        roads: roads.slice(0, 3),
      });
    } else if (searchMode === 'road') {
      setRoadResults(roads);
      const stopsOnRoads = allMatchingStops.filter((s) =>
        roads.some((r) => r.roadName.toLowerCase() === s.roadName.toLowerCase())
      );
      setStopResults(stopsOnRoads.length > 0 ? stopsOnRoads : allMatchingStops);
      setServiceResults([]);
      setCrossModeSuggestions({
        services: services.slice(0, 5),
        stops: [],
        roads: [],
      });
    } else if (searchMode === 'stop_code') {
      setStopResults(allMatchingStops);
      setRoadResults([]);
      setServiceResults([]);
      setCrossModeSuggestions({
        services: services.slice(0, 5),
        stops: [],
        roads: roads.slice(0, 3),
      });
    }
  }, [query, searchMode, onSelectStop]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStopPick = (stop: BusStop) => {
    onSelectStop(stop);
    setQuery(`${stop.code} • ${stop.description}`);
    setIsOpen(false);
  };

  const handleRoadPick = (roadName: string, stops: BusStop[]) => {
    onHighlightRoad(roadName);
    if (stops.length > 0) {
      onSelectStop(stops[0]);
    }
    setQuery(roadName);
    setIsOpen(false);
  };

  const handleRoutePick = (route: BusRoute) => {
    onSelectRoute(route);
    setQuery(`Bus ${route.serviceNo}`);
    setIsOpen(false);
  };

  // Smart search execution across active mode and fallbacks
  const executeSearch = (rawQuery: string) => {
    const q = rawQuery.trim();
    if (!q) return;

    // 1. If 5-digit number, match stop code directly
    if (/^\d{5}$/.test(q)) {
      const direct = searchBusStopsByCode(q);
      if (direct.length > 0) {
        handleStopPick(direct[0]);
        return;
      }
    }

    // 2. Active mode matches
    if (searchMode === 'service') {
      const services = searchBusServices(q);
      if (services.length > 0) {
        handleRoutePick(services[0]);
        return;
      }
    } else if (searchMode === 'road') {
      const roads = searchRoads(q);
      if (roads.length > 0) {
        handleRoadPick(roads[0].roadName, roads[0].stops);
        return;
      }
      const stops = searchBusStops(q);
      if (stops.length > 0) {
        handleStopPick(stops[0]);
        return;
      }
    } else if (searchMode === 'stop_code') {
      const stops = searchBusStopsByCode(q);
      if (stops.length > 0) {
        handleStopPick(stops[0]);
        return;
      }
    }

    // 3. Smart cross-mode fallbacks:
    // Try matching service (e.g. user typed "106", "143", "65")
    const fallbackServices = searchBusServices(q);
    if (fallbackServices.length > 0) {
      handleRoutePick(fallbackServices[0]);
      return;
    }

    // Try matching stop code or description (e.g. user typed "04121", "SMU", "Lucky Plaza")
    const codeMatch = searchBusStopsByCode(q);
    if (codeMatch.length > 0) {
      handleStopPick(codeMatch[0]);
      return;
    }
    const nameMatch = searchBusStops(q);
    if (nameMatch.length > 0) {
      handleStopPick(nameMatch[0]);
      return;
    }

    // Try matching roads
    const fallbackRoads = searchRoads(q);
    if (fallbackRoads.length > 0) {
      handleRoadPick(fallbackRoads[0].roadName, fallbackRoads[0].stops);
      return;
    }
  };

  // Submit top result on Enter press or Go button click
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  // Switch mode and re-focus input with blank or converted query
  const handleModeChange = (mode: SearchMode) => {
    setSearchMode(mode);
    setIsOpen(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Mode UI Config
  const MODE_CONFIG = {
    service: {
      label: 'Bus Service',
      shortLabel: 'Service',
      icon: Bus,
      placeholder: 'Enter bus service number (e.g. 143, 65, 190, 36)...',
      activeColor: 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-950/40',
      tagColor: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
      popular: [
        { label: '106 (via SMU)', value: '106' },
        { label: '143', value: '143' },
        { label: '65', value: '65' },
        { label: '190', value: '190' },
        { label: '36', value: '36' },
        { label: '24', value: '24' },
        { label: '147', value: '147' },
        { label: '7', value: '7' },
        { label: '858', value: '858' },
      ],
    },
    road: {
      label: 'Road Name',
      shortLabel: 'Road',
      icon: Navigation,
      placeholder: 'Enter road name (e.g. Orchard Road, Stamford Rd, Victoria St)...',
      activeColor: 'bg-amber-600 text-white border-amber-500 shadow-amber-950/40',
      tagColor: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
      popular: [
        { label: 'Stamford Rd (SMU)', value: 'Stamford Road' },
        { label: 'Orchard Rd', value: 'Orchard Road' },
        { label: 'Bras Basah Rd', value: 'Bras Basah Road' },
        { label: 'Victoria St', value: 'Victoria Street' },
        { label: 'Clementi Rd', value: 'Clementi Road' },
        { label: 'Bt Timah Rd', value: 'Bukit Timah Road' },
        { label: 'Marine Parade', value: 'Marine Parade' },
      ],
    },
    stop_code: {
      label: 'Bus-Stop Number',
      shortLabel: 'Stop No.',
      icon: Hash,
      placeholder: 'Enter 5-digit bus stop number (e.g. 04121, 09048, 83139)...',
      activeColor: 'bg-rose-600 text-white border-rose-500 shadow-rose-950/40',
      tagColor: 'text-rose-400 bg-rose-500/15 border-rose-500/30',
      popular: [
        { label: '04121 (SMU)', value: '04121' },
        { label: '09048 (Orchard)', value: '09048' },
        { label: '83139 (Changi Airport)', value: '83139' },
        { label: '03509 (Marina Bay)', value: '03509' },
        { label: '84009 (Bedok Int)', value: '84009' },
        { label: '28009 (Jurong East)', value: '28009' },
      ],
    },
  };

  const activeConfig = MODE_CONFIG[searchMode];

  return (
    <header
      id="busrouter-floating-header"
      className="absolute top-2.5 left-2.5 right-2.5 z-[500] pointer-events-none flex flex-col items-center"
      ref={containerRef}
    >
      <div className="w-full max-w-5xl flex flex-col gap-2 pointer-events-auto">
        {/* Main Header Bar */}
        <div className="w-full flex items-center justify-between gap-2">
          {/* Brand Logo & SGT Clock */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-800 shadow-xl shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-white shadow-md shadow-rose-900/30 shrink-0">
              <Bus className="w-4 h-4" />
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-xs sm:text-sm text-white tracking-tight flex items-center gap-1">
                <span>BusRouter</span>
                <span className="px-1.5 py-0.2 rounded bg-rose-600/30 text-rose-400 text-[10px] font-mono border border-rose-500/30">
                  SG
                </span>
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 text-slate-400" />
                <span className="font-mono">{currentTime || 'Singapore Time'}</span>
              </div>
            </div>
          </div>

          {/* Search Box with Integrated Mode Selector */}
          <div className="relative flex-1 max-w-2xl">
            <form onSubmit={handleSubmit} className="relative flex items-center">
              {/* Left Search Icon */}
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none z-10" />

              {/* Main Text Input */}
              <input
                ref={inputRef}
                id="busrouter-global-search-input"
                type="text"
                inputMode={searchMode === 'stop_code' ? 'numeric' : 'text'}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                placeholder={activeConfig.placeholder}
                className="w-full pl-10 pr-32 py-2.5 bg-slate-900/95 backdrop-blur-md text-white placeholder-slate-400 text-xs sm:text-sm rounded-2xl border border-slate-700/80 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 shadow-xl outline-none transition-all"
              />

              {/* Clear Button, Go Button, and Search Mode Pill */}
              <div className="absolute right-2 flex items-center gap-1.5 z-10">
                {query ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setIsOpen(false);
                    }}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                    title="Clear input"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : null}

                {/* Direct Go/Search Button */}
                <button
                  type="submit"
                  id="busrouter-search-go-btn"
                  className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-semibold flex items-center gap-1 shadow-md shadow-rose-900/30 transition-all cursor-pointer"
                  title="Search and update bus arrivals"
                >
                  <span>Go</span>
                  <ArrowRight className="w-3 h-3" />
                </button>

                <span
                  className={`px-2 py-0.5 rounded-lg border text-[10px] font-semibold tracking-wide uppercase font-mono hidden sm:inline-block ${activeConfig.tagColor}`}
                >
                  {activeConfig.shortLabel}
                </span>
              </div>
            </form>

            {/* Dropdown Results Scoped to Selected Mode */}
            {isOpen && (
              <div
                id="busrouter-search-autocomplete"
                className="absolute left-0 right-0 mt-2 bg-slate-900/98 backdrop-blur-xl border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden max-h-[75vh] overflow-y-auto divide-y divide-slate-800 z-[600] animate-in fade-in slide-in-from-top-2 duration-150"
              >
                {/* Mode Selector Inside Dropdown Header (Easy switching) */}
                <div className="p-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-slate-400">Search by:</span>
                  <div className="flex items-center gap-1.5">
                    {(['service', 'road', 'stop_code'] as SearchMode[]).map((mode) => {
                      const cfg = MODE_CONFIG[mode];
                      const Icon = cfg.icon;
                      const isSelected = searchMode === mode;
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => handleModeChange(mode)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                            isSelected
                              ? `${cfg.activeColor} ring-1 ring-white/20`
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{cfg.shortLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Popular Quick-Select Pills if query is empty */}
                {!query.trim() && (
                  <div className="p-3 bg-slate-950/40">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <span>Popular {activeConfig.label}s in Singapore:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeConfig.popular.map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => {
                            setQuery(item.value);
                            if (searchMode === 'service') {
                              const match = searchBusServices(item.value);
                              if (match.length > 0) handleRoutePick(match[0]);
                            } else if (searchMode === 'road') {
                              const matchRoads = searchRoads(item.value);
                              if (matchRoads.length > 0)
                                handleRoadPick(matchRoads[0].roadName, matchRoads[0].stops);
                            } else if (searchMode === 'stop_code') {
                              const matchStops = searchBusStopsByCode(item.value);
                              if (matchStops.length > 0) handleStopPick(matchStops[0]);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* --- 1. BUS SERVICE RESULTS --- */}
                {searchMode === 'service' && query.trim() && (
                  <div className="p-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 px-2 py-1 flex items-center justify-between">
                      <span>Matching Bus Services (Routes)</span>
                      <span className="text-[9px] text-slate-400 lowercase font-mono">
                        {serviceResults.length} found
                      </span>
                    </div>

                    {serviceResults.length === 0 ? (
                      <div>
                        <div className="p-3 text-center text-xs text-slate-400">
                          No bus service route found for &quot;{query}&quot;. Try services like 106, 143, 65, 190.
                        </div>
                        {crossModeSuggestions.stops.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-800">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400 px-2 py-1">
                              Matching Bus Stops in Singapore:
                            </div>
                            <div className="space-y-1">
                              {crossModeSuggestions.stops.map((s) => (
                                <button
                                  key={s.code}
                                  onClick={() => handleStopPick(s)}
                                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800/90 transition-colors flex items-center justify-between cursor-pointer group"
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <span className="px-2 py-0.5 rounded bg-rose-600/30 text-rose-300 font-mono text-xs font-bold">
                                      {s.code}
                                    </span>
                                    <span className="text-xs text-white group-hover:text-rose-300 truncate">
                                      {s.description} ({s.roadName})
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-rose-400 font-semibold shrink-0">
                                    View Arrivals →
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1 mt-1">
                        {serviceResults.map((service) => (
                          <button
                            key={service.serviceNo}
                            onClick={() => handleRoutePick(service)}
                            className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-800/90 transition-colors flex items-center justify-between cursor-pointer group border border-transparent hover:border-slate-700/80"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-sm font-mono font-extrabold shrink-0 shadow-sm">
                                {service.serviceNo}
                              </span>
                              <div className="truncate">
                                <div className="font-semibold text-xs text-white group-hover:text-emerald-300">
                                  {service.name}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                  From <span className="text-slate-300">{service.origin}</span> → To{' '}
                                  <span className="text-slate-300">{service.destination}</span> (
                                  {service.stops.length} stops)
                                </div>
                              </div>
                            </div>
                            <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform">
                              <span>Show Route</span>
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* --- 2. ROAD NAME RESULTS --- */}
                {searchMode === 'road' && query.trim() && (
                  <div className="divide-y divide-slate-800/60">
                    {/* Matching Roads Header */}
                    <div className="p-2 bg-slate-950/50">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-2 py-1 flex items-center justify-between">
                        <span>Matching Roads in Singapore</span>
                        <span className="text-[9px] text-slate-400 lowercase font-mono">
                          {roadResults.length} roads found
                        </span>
                      </div>

                      {roadResults.length === 0 && stopResults.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">
                          No roads matching &quot;{query}&quot;. Try &quot;Orchard Road&quot;,
                          &quot;Victoria Street&quot;, &quot;Clementi Road&quot;.
                        </div>
                      ) : (
                        <div className="space-y-1 mt-1">
                          {roadResults.slice(0, 5).map((road) => (
                            <button
                              key={road.roadName}
                              onClick={() => handleRoadPick(road.roadName, road.stops)}
                              className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-800/90 transition-colors flex items-center justify-between cursor-pointer group border border-transparent hover:border-slate-700/80"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                                  <Navigation className="w-3.5 h-3.5" />
                                </div>
                                <div className="truncate">
                                  <span className="font-semibold text-xs text-white group-hover:text-amber-300">
                                    {road.roadName}
                                  </span>
                                  <div className="text-[10px] text-slate-400">
                                    Click to view all {road.stopCount} stops along this road
                                  </div>
                                </div>
                              </div>
                              <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-800 text-amber-300 font-mono font-bold shrink-0 border border-slate-700">
                                {road.stopCount} {road.stopCount === 1 ? 'stop' : 'stops'}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bus stops along these roads */}
                    {stopResults.length > 0 && (
                      <div className="p-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                          Bus Stops on this Road:
                        </div>
                        <div className="space-y-1 mt-1">
                          {stopResults.slice(0, 8).map((stop) => (
                            <button
                              key={stop.code}
                              onClick={() => handleStopPick(stop)}
                              className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800/80 transition-colors flex items-center justify-between cursor-pointer group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="px-2 py-0.5 rounded bg-rose-600/30 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold shrink-0">
                                  {stop.code}
                                </span>
                                <div className="truncate">
                                  <div className="font-semibold text-xs text-white group-hover:text-amber-300 truncate">
                                    {stop.description}
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate">
                                    {stop.roadName}
                                  </div>
                                </div>
                              </div>
                              {stop.distance && (
                                <span className="text-[10px] text-emerald-400 font-mono shrink-0 ml-2">
                                  {stop.distance < 1000
                                    ? `${stop.distance}m`
                                    : `${(stop.distance / 1000).toFixed(1)}km`}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* --- 3. BUS-STOP NUMBER RESULTS --- */}
                {searchMode === 'stop_code' && query.trim() && (
                  <div className="p-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400 px-2 py-1 flex items-center justify-between">
                      <span>Bus-Stop Number Matches</span>
                      <span className="text-[9px] text-slate-400 lowercase font-mono">
                        {stopResults.length} matches
                      </span>
                    </div>

                    {stopResults.length === 0 ? (
                      <div>
                        <div className="p-4 text-center text-xs text-slate-400">
                          No bus stop found matching code &quot;{query}&quot;. Enter a 5-digit stop
                          number (e.g. 04121, 09048, 83139).
                        </div>
                        {crossModeSuggestions.services.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-800">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 px-2 py-1">
                              Matching Bus Services:
                            </div>
                            <div className="space-y-1">
                              {crossModeSuggestions.services.map((svc) => (
                                <button
                                  key={svc.serviceNo}
                                  onClick={() => handleRoutePick(svc)}
                                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800/90 transition-colors flex items-center justify-between cursor-pointer group"
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <span className="px-2 py-0.5 rounded bg-emerald-600/30 text-emerald-300 font-mono text-xs font-bold">
                                      {svc.serviceNo}
                                    </span>
                                    <span className="text-xs text-white group-hover:text-emerald-300 truncate">
                                      {svc.name}
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-emerald-400 font-semibold shrink-0">
                                    Show Route →
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1 mt-1">
                        {stopResults.map((stop) => (
                          <button
                            key={stop.code}
                            onClick={() => handleStopPick(stop)}
                            className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-800/90 transition-colors flex items-center justify-between cursor-pointer group border border-transparent hover:border-slate-700/80"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="px-2.5 py-1 rounded-xl bg-rose-600/30 text-rose-300 border border-rose-500/40 text-sm font-mono font-extrabold shrink-0 shadow-sm">
                                {stop.code}
                              </span>
                              <div className="truncate">
                                <div className="font-semibold text-xs text-white group-hover:text-rose-300 truncate">
                                  {stop.description}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                  Road: <span className="text-slate-300">{stop.roadName}</span>
                                </div>
                              </div>
                            </div>
                            <span className="text-[11px] font-semibold text-rose-400 flex items-center gap-1 shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform">
                              <span>View Arrivals</span>
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Header Right Actions: Locate & Weather Pill */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="header-locate-user-btn"
              onClick={onLocateUser}
              disabled={isLocating}
              title="Locate nearest bus stop (GPS)"
              className="px-3 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700/80 shadow-xl text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer hover:border-sky-400 active:scale-95"
            >
              <Locate className={`w-3.5 h-3.5 text-sky-400 ${isLocating ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">{isLocating ? 'Locating...' : 'Near Me'}</span>
            </button>

            {/* Weather Pill */}
            <button
              id="header-weather-pill-btn"
              onClick={onOpenWeather}
              title="Singapore 2-Hour Weather Forecast"
              className="px-3 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700/80 shadow-xl text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer hover:border-amber-400 active:scale-95"
            >
              <CloudSun className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-200">
                {weather ? `${weather.forecast.split(' ')[0]}` : 'Weather'}
              </span>
            </button>
          </div>
        </div>

        {/* Dedicated Input Mode Segmented Selector (First choice before or during input) */}
        <div className="w-full flex items-center justify-center">
          <div className="inline-flex items-center p-1 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800/90 shadow-xl gap-1">
            <span className="text-[11px] text-slate-400 font-medium px-2 hidden sm:inline">
              Input Mode:
            </span>
            {(['service', 'road', 'stop_code'] as SearchMode[]).map((mode) => {
              const cfg = MODE_CONFIG[mode];
              const Icon = cfg.icon;
              const isSelected = searchMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleModeChange(mode)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? `${cfg.activeColor} shadow-md`
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};
