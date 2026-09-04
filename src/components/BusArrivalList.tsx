import React, { useState } from 'react';
import {
  Bus,
  RefreshCw,
  Clock,
  Accessibility,
  AlertCircle,
  Filter,
  Info,
  SlidersHorizontal,
} from 'lucide-react';
import { BusArrivalResponse, BusServiceArrival, BusStop } from '../types';
import { getArrivalMinutes, getCrowdBadgeInfo, getVehicleTypeLabel } from '../utils/timeFormat';
import { formatDistance } from '../utils/haversine';

interface BusArrivalListProps {
  selectedStop: BusStop | null;
  arrivalData: BusArrivalResponse | null;
  loading: boolean;
  onRefresh: () => void;
  lastUpdated: Date | null;
  refreshCountdown: number;
  onChangeStopClick?: () => void;
}

export const BusArrivalList: React.FC<BusArrivalListProps> = ({
  selectedStop,
  arrivalData,
  loading,
  onRefresh,
  lastUpdated,
  refreshCountdown,
  onChangeStopClick,
}) => {
  const [serviceFilter, setServiceFilter] = useState('');

  if (!selectedStop) {
    return (
      <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-3xl p-8 shadow-xl text-center">
        <Bus className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-200">No Bus Stop Selected</h3>
        <p className="text-sm text-slate-400 mt-1">
          Select a bus stop from the search bar or tap a pin on the map to view live arrivals.
        </p>
      </div>
    );
  }

  const allServices: BusServiceArrival[] = arrivalData?.services || [];

  // Filter services by user search input (e.g. "15", "65", "190")
  const filteredServices = allServices.filter((svc) =>
    serviceFilter.trim() === ''
      ? true
      : svc.serviceNo.toLowerCase().includes(serviceFilter.trim().toLowerCase())
  );

  const hasServices = allServices.length > 0;
  const isFilteredEmpty = hasServices && filteredServices.length === 0;

  return (
    <div
      id="bus-arrival-container"
      className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col shadow-xl"
    >
      {/* Bento Header: Bus Stop Info & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 font-mono font-bold text-xs border border-sky-500/30">
              Stop B{selectedStop.code}
            </span>
            {selectedStop.distance && (
              <span className="text-xs text-emerald-400 font-mono">
                {formatDistance(selectedStop.distance)} away
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {selectedStop.description}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {selectedStop.roadName} &bull; Singapore
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="text-right hidden sm:block">
            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1 justify-end">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>Refresh: {refreshCountdown}s</span>
            </div>
            {lastUpdated && (
              <div className="text-[10px] text-slate-500">
                {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>

          <button
            id="refresh-arrival-btn"
            onClick={onRefresh}
            disabled={loading}
            title="Refresh bus arrivals"
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-400' : ''}`} />
          </button>

          {onChangeStopClick && (
            <button
              onClick={onChangeStopClick}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl transition-colors text-xs sm:text-sm cursor-pointer shadow-md shadow-sky-500/20"
            >
              Change Stop
            </button>
          )}
        </div>
      </div>

      {/* Bus Service Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            id="service-filter-input"
            type="text"
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            placeholder="Filter bus service (e.g. 15, 24, 65, 143)..."
            className="w-full pl-9 pr-8 py-2 bg-slate-800/50 border border-slate-700/60 focus:border-sky-400 rounded-xl text-slate-100 placeholder-slate-500 text-xs font-medium outline-none transition-colors"
          />
          {serviceFilter && (
            <button
              type="button"
              onClick={() => setServiceFilter('')}
              className="absolute right-3 top-2 text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          <Bus className="w-3.5 h-3.5 text-sky-400" />
          <span>
            {filteredServices.length} of {allServices.length} services active
          </span>
        </div>
      </div>

      {/* Simulated Demo Mode Banner */}
      {arrivalData?.isSimulated && (
        <div
          id="simulation-notice-banner"
          className="mb-5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-2.5 shadow-sm"
        >
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-amber-300">Live Simulation Mode:</span> Set your free{' '}
            <code className="px-1.5 py-0.5 bg-amber-500/20 rounded font-mono text-[11px] text-amber-100">
              LTA_API_KEY
            </code>{' '}
            in Vercel or your local environment for live Singapore DataMall arrivals.
          </div>
        </div>
      )}

      {/* Notice when filtered service doesn't exist */}
      {isFilteredEmpty && (
        <div
          id="no-service-notice"
          className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center space-y-2 mb-4"
        >
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
          <h3 className="text-base font-bold text-rose-200">
            No Service &ldquo;{serviceFilter}&rdquo; at Stop #{selectedStop.code}
          </h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Bus service <strong>{serviceFilter}</strong> does not operate at this stop.
          </p>
          <button
            type="button"
            onClick={() => setServiceFilter('')}
            className="mt-2 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            Show All Services
          </button>
        </div>
      )}

      {/* Empty services notice */}
      {!loading && !hasServices && (
        <div
          id="empty-services-notice"
          className="p-8 rounded-2xl bg-slate-800/40 border border-slate-800 text-center space-y-2"
        >
          <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">No Bus Services Currently Operating</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No active arrivals for Bus Stop #{selectedStop.code}. Buses may have ceased operating for the night.
          </p>
        </div>
      )}

      {/* Bento Grid Bus Arrivals List */}
      <div className="flex-grow overflow-hidden flex flex-col gap-3.5">
        {filteredServices.map((service) => {
          const next1 = getArrivalMinutes(service.nextBus?.estimatedArrival);
          const next2 = getArrivalMinutes(service.nextBus2?.estimatedArrival);
          const next3 = getArrivalMinutes(service.nextBus3?.estimatedArrival);

          const crowd1 = getCrowdBadgeInfo(service.nextBus?.load);
          const vehicleLabel1 = getVehicleTypeLabel(service.nextBus?.type);
          const isWheelchair1 = service.nextBus?.feature === 'WAB';
          const isNotOperating = !service.nextBus?.estimatedArrival;

          // Color for Following and Later lines
          const getLoadColorBar = (load?: string) => {
            if (load === 'LSD') return 'bg-rose-500';
            if (load === 'SDA') return 'bg-amber-500';
            return 'bg-emerald-500';
          };

          return (
            <div
              key={service.serviceNo}
              id={`service-card-${service.serviceNo}`}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-slate-800/40 hover:bg-slate-800/60 rounded-2xl border border-slate-700/50 transition-all gap-4"
            >
              {/* Left Column: Big Italic Service Badge & Primary Arrival */}
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="w-16 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center rounded-lg font-black text-xl italic shrink-0">
                  {service.serviceNo}
                </div>

                <div>
                  <div className="text-[11px] text-slate-500 uppercase font-bold tracking-tighter mb-0.5 flex items-center gap-2">
                    <span>Next Bus</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      • {service.operator || 'LTA'}
                    </span>
                  </div>

                  {isNotOperating ? (
                    <div className="text-base font-mono font-bold text-rose-400">Not in service</div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <div
                        className={`text-2xl sm:text-3xl font-mono font-bold tracking-tighter ${
                          next1.isArriving
                            ? 'text-emerald-400 animate-pulse'
                            : next1.minutes !== null && next1.minutes <= 5
                            ? 'text-amber-400'
                            : 'text-slate-100'
                        }`}
                      >
                        {next1.isArriving ? 'ARRIVING' : next1.text.toUpperCase()}
                      </div>
                    </div>
                  )}

                  {/* Badges for Crowd load, deck type & wheelchair */}
                  {!isNotOperating && service.nextBus && (
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-full border text-[10px] font-medium flex items-center gap-1 ${crowd1.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${crowd1.dotClass}`} />
                        {crowd1.label}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700/50">
                        {vehicleLabel1}
                      </span>
                      {isWheelchair1 && (
                        <span
                          title="Wheelchair Accessible"
                          className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[10px] flex items-center"
                        >
                          <Accessibility className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Columns: Following & Later (Bento Grid layout) */}
              {!isNotOperating && (
                <div className="flex items-center justify-end gap-8 sm:gap-12 border-t sm:border-t-0 border-slate-700/40 pt-3 sm:pt-0">
                  {/* Following Bus */}
                  <div className="text-center min-w-[64px]">
                    <div className="text-[11px] text-slate-500 uppercase font-medium mb-1">
                      Following
                    </div>
                    <div className="text-lg sm:text-xl font-mono font-bold text-slate-200">
                      {next2.minutes !== null ? next2.text : '–'}
                    </div>
                    {service.nextBus2?.load && (
                      <div
                        className={`h-1 w-full rounded-full mt-1.5 ${getLoadColorBar(
                          service.nextBus2.load
                        )}`}
                        title={getCrowdBadgeInfo(service.nextBus2.load).label}
                      />
                    )}
                  </div>

                  {/* Later Bus */}
                  <div className="text-center min-w-[64px]">
                    <div className="text-[11px] text-slate-500 uppercase font-medium mb-1">Later</div>
                    <div className="text-lg sm:text-xl font-mono font-bold text-slate-200">
                      {next3.minutes !== null ? next3.text : '–'}
                    </div>
                    {service.nextBus3?.load && (
                      <div
                        className={`h-1 w-full rounded-full mt-1.5 ${getLoadColorBar(
                          service.nextBus3.load
                        )}`}
                        title={getCrowdBadgeInfo(service.nextBus3.load).label}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
