import React, { useState } from 'react';
import {
  Bus,
  RefreshCw,
  Clock,
  Compass,
  MapPin,
  ChevronRight,
  Accessibility,
  Route as RouteIcon,
  X,
  Search,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { BusStop, BusArrivalResponse, BusRoute } from '../types';
import { SINGAPORE_BUS_STOPS, SINGAPORE_BUS_ROUTES } from '../data/singaporeBusStops';

interface BusStopDrawerProps {
  selectedStop: BusStop | null;
  arrivals: BusArrivalResponse | null;
  loading: boolean;
  onRefresh: () => void;
  countdown: number;
  onClose: () => void;
  onSelectStop: (stop: BusStop) => void;
  onSelectRoute: (route: BusRoute) => void;
}

export const BusStopDrawer: React.FC<BusStopDrawerProps> = ({
  selectedStop,
  arrivals,
  loading,
  onRefresh,
  countdown,
  onClose,
  onSelectStop,
  onSelectRoute,
}) => {
  const [filterService, setFilterService] = useState('');
  const [showNearbyOnRoad, setShowNearbyOnRoad] = useState(false);

  if (!selectedStop) return null;

  // Other stops on this same road
  const stopsOnSameRoad = SINGAPORE_BUS_STOPS.filter(
    (s) =>
      s.code !== selectedStop.code &&
      s.roadName.toLowerCase() === selectedStop.roadName.toLowerCase()
  );

  // Filtered services
  const services = arrivals?.services || [];
  const filteredServices = filterService.trim()
    ? services.filter((s) =>
        s.serviceNo.toLowerCase().includes(filterService.trim().toLowerCase())
      )
    : services;

  // Helper to format minutes until arrival
  const formatMinutes = (isoString?: string) => {
    if (!isoString) return null;
    const arrivalTime = new Date(isoString).getTime();
    const now = Date.now();
    const diffMin = Math.round((arrivalTime - now) / 60000);

    if (diffMin <= 1) return { text: 'Arr', isArr: true, min: diffMin };
    return { text: `${diffMin}m`, isArr: false, min: diffMin };
  };

  const getLoadBadge = (load?: string) => {
    switch (load) {
      case 'SEA':
        return { label: 'Seats', bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
      case 'SDA':
        return { label: 'Standing', bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
      case 'LSD':
        return { label: 'Limited', bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30' };
      default:
        return { label: 'Seats', bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
    }
  };

  const getVehicleBadge = (type?: string) => {
    switch (type) {
      case 'DD':
        return { label: 'Double Deck', short: 'DD' };
      case 'BD':
        return { label: 'Bendy', short: 'BD' };
      default:
        return { label: 'Single Deck', short: 'SD' };
    }
  };

  const handleInspectRoute = (serviceNo: string) => {
    const foundRoute = SINGAPORE_BUS_ROUTES.find((r) => r.serviceNo === serviceNo);
    if (foundRoute) {
      onSelectRoute(foundRoute);
    } else {
      // Synthesize a route with this stop and nearby stops
      onSelectRoute({
        serviceNo,
        name: `Service ${serviceNo} via ${selectedStop.roadName}`,
        direction: 1,
        origin: selectedStop.description,
        destination: 'Terminus',
        stops: [selectedStop.code, ...stopsOnSameRoad.map((s) => s.code)].slice(0, 6),
        color: '#10B981',
      });
    }
  };

  return (
    <aside
      id="bus-stop-drawer"
      className="absolute top-20 left-3 bottom-6 w-[92vw] sm:w-[420px] max-w-[440px] z-[450] bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-left duration-200"
    >
      {/* Drawer Header (busrouter.sg iconic stop badge style) */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {/* Bus Stop Code Badge (Red, like busrouter.sg) */}
            <div className="px-2.5 py-1 rounded-xl bg-rose-600 text-white font-mono font-bold text-sm shadow-lg shadow-rose-900/30 border border-rose-400 shrink-0 mt-0.5">
              {selectedStop.code}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-base sm:text-lg text-white leading-snug truncate">
                {selectedStop.description}
              </h2>
              <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="truncate">{selectedStop.roadName}</span>
                {selectedStop.distance && (
                  <span className="text-emerald-400 font-mono text-[11px] shrink-0 ml-1">
                    &bull; {selectedStop.distance < 1000 ? `${selectedStop.distance}m` : `${(selectedStop.distance / 1000).toFixed(1)}km`}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            id="drawer-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer transition-colors shrink-0"
            title="Close stop panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls & Countdown */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/60 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Auto-refresh:</span>
            <span className="font-mono text-emerald-400 font-bold">{countdown}s</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Updating' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Filter input for services at this stop */}
        <div className="relative mt-3">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterService}
            onChange={(e) => setFilterService(e.target.value)}
            placeholder="Filter bus services (e.g. 143, 65)..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-900/90 text-xs text-white placeholder-slate-500 rounded-xl border border-slate-700/80 focus:border-emerald-500 outline-none"
          />
          {filterService && (
            <button
              onClick={() => setFilterService('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {services.length > 0 && (
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-0.5">
            <span className="font-medium text-slate-300">
              {filteredServices.length} bus {filteredServices.length === 1 ? 'service' : 'services'} calling at this stop
            </span>
            {filterService && (
              <span className="text-emerald-400 font-mono text-[10px]">
                (of {services.length} total)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Arrival Services List (busrouter.sg green badge style) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-800/40">
        {loading && services.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
            <span className="text-xs">Fetching live Singapore bus timings...</span>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            No active bus services match &quot;{filterService}&quot; at this stop.
          </div>
        ) : (
          filteredServices.map((svc) => {
            const next1 = formatMinutes(svc.nextBus?.estimatedArrival);
            const next2 = formatMinutes(svc.nextBus2?.estimatedArrival);
            const next3 = formatMinutes(svc.nextBus3?.estimatedArrival);

            const load1 = getLoadBadge(svc.nextBus?.load);
            const vehicle1 = getVehicleBadge(svc.nextBus?.type);
            const isWAB = svc.nextBus?.feature === 'WAB';

            return (
              <div
                key={svc.serviceNo}
                className="pt-2.5 first:pt-0 group hover:bg-slate-800/30 p-2 rounded-2xl transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  {/* Bus Service Badge (Iconic busrouter.sg Green Badge) */}
                  <div className="flex items-center gap-2.5">
                    <span className="w-14 py-1 rounded-xl bg-emerald-600 text-white font-mono font-extrabold text-sm text-center shadow-md shadow-emerald-950/40 border border-emerald-400/60 shrink-0">
                      {svc.serviceNo}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] px-1.5 py-0.2 rounded border font-medium ${load1.bg}`}>
                          {load1.label}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                          {vehicle1.short}
                        </span>
                        {isWAB && (
                          <Accessibility className="w-3 h-3 text-sky-400" title="Wheelchair Accessible" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500">{svc.operator}</span>
                    </div>
                  </div>

                  {/* Arrival Times (Next, 2nd, 3rd) */}
                  <div className="flex items-center gap-2">
                    {/* Primary Arrival Timing */}
                    <div className="text-right">
                      {next1 ? (
                        <div
                          className={`font-mono font-extrabold text-base sm:text-lg ${
                            next1.isArr
                              ? 'text-emerald-400 animate-pulse'
                              : next1.min <= 3
                              ? 'text-emerald-400'
                              : next1.min <= 7
                              ? 'text-amber-300'
                              : 'text-slate-200'
                          }`}
                        >
                          {next1.text}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 font-mono">-</span>
                      )}
                    </div>

                    {/* Following buses */}
                    <div className="flex flex-col text-right text-[10px] font-mono text-slate-400">
                      {next2 && <span className="hover:text-slate-200">{next2.text}</span>}
                      {next3 && <span className="text-slate-500">{next3.text}</span>}
                    </div>

                    {/* View Route on Map Button (busrouter.sg style) */}
                    <button
                      onClick={() => handleInspectRoute(svc.serviceNo)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-sky-600/30 hover:text-sky-300 text-slate-400 transition-colors cursor-pointer ml-1"
                      title={`Show Bus ${svc.serviceNo} Route on Map`}
                    >
                      <RouteIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Other Stops on Same Road Accordion (helps user jump between stops on Orchard Rd, etc.) */}
      {stopsOnSameRoad.length > 0 && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 shrink-0">
          <button
            onClick={() => setShowNearbyOnRoad(!showNearbyOnRoad)}
            className="w-full flex items-center justify-between text-xs text-slate-300 hover:text-white cursor-pointer py-1"
          >
            <div className="flex items-center gap-1.5 font-semibold text-amber-300">
              <Layers className="w-3.5 h-3.5" />
              <span>Other stops on {selectedStop.roadName} ({stopsOnSameRoad.length})</span>
            </div>
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform ${showNearbyOnRoad ? 'rotate-90' : ''}`}
            />
          </button>

          {showNearbyOnRoad && (
            <div className="mt-2 max-h-36 overflow-y-auto space-y-1 pr-1">
              {stopsOnSameRoad.map((s) => (
                <button
                  key={s.code}
                  onClick={() => onSelectStop(s)}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-between text-xs cursor-pointer group"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="px-1.5 py-0.2 rounded bg-rose-600/30 text-rose-300 font-mono text-[10px] font-bold">
                      {s.code}
                    </span>
                    <span className="text-slate-300 group-hover:text-white truncate">
                      {s.description}
                    </span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-white shrink-0 ml-2" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
