import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Locate, ChevronRight, Bus, Compass } from 'lucide-react';
import { BusStop } from '../types';
import { searchBusStops } from '../data/singaporeBusStops';
import { formatDistance } from '../utils/haversine';

interface BusStopSelectorProps {
  selectedStop: BusStop | null;
  onSelectStop: (stop: BusStop) => void;
  onFindNearest: () => void;
  isLocating: boolean;
  userLocation: { latitude: number; longitude: number } | null;
}

export const BusStopSelector: React.FC<BusStopSelectorProps> = ({
  selectedStop,
  onSelectStop,
  onFindNearest,
  isLocating,
  userLocation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<BusStop[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Popular quick bus stops for instant 1-click test (including 83139 from prompt)
  const QUICK_STOPS = [
    { code: '83139', name: 'Changi Airport PTB2' },
    { code: '09048', name: 'Lucky Plaza / Orchard' },
    { code: '03509', name: 'Marina Bay Sands' },
    { code: '84009', name: 'Bedok Interchange' },
    { code: '28009', name: 'Jurong East Int' },
    { code: '01112', name: 'Bugis Stn' },
  ];

  // Update suggestions as search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }
    const results = searchBusStops(searchQuery);
    setSuggestions(results);
  }, [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (stop: BusStop) => {
    onSelectStop(stop);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleManualCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchQuery.trim();
    if (!clean) return;

    if (suggestions.length > 0) {
      handleSelect(suggestions[0]);
    } else if (/^\d{5}$/.test(clean)) {
      handleSelect({
        code: clean,
        roadName: 'Singapore Road Network',
        description: `Bus Stop ${clean}`,
        latitude: 1.3521,
        longitude: 103.8198,
      });
    }
  };

  return (
    <div
      id="bus-stop-selector-section"
      className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4"
      ref={containerRef}
    >
      {/* Search Input Bar & Nearest Button */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleManualCodeSubmit} className="relative flex-1">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
            <input
              id="bus-stop-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Search 5-digit bus stop code (e.g. 83139, 09048) or road name..."
              className="w-full pl-11 pr-24 py-3 bg-slate-950/70 border border-slate-800 focus:border-sky-400 rounded-2xl text-slate-100 placeholder-slate-500 text-sm font-medium outline-none transition-all shadow-inner focus:ring-2 focus:ring-sky-500/20"
              autoComplete="off"
            />
            <button
              type="submit"
              id="search-submit-button"
              className="absolute right-2.5 px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-bold tracking-wide transition-colors cursor-pointer"
            >
              Search
            </button>
          </div>

          {/* Autocomplete suggestions dropdown */}
          {isOpen && suggestions.length > 0 && (
            <div
              id="bus-stop-suggestions-dropdown"
              className="absolute left-0 right-0 top-full mt-2 z-50 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-h-72 overflow-y-auto divide-y divide-slate-800"
            >
              {suggestions.map((stop) => (
                <button
                  key={stop.code}
                  type="button"
                  onClick={() => handleSelect(stop)}
                  className="w-full px-4 py-3 text-left hover:bg-slate-800/70 flex items-center justify-between group transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-8 rounded-lg bg-sky-500/10 group-hover:bg-sky-500/20 text-sky-400 flex items-center justify-center font-mono font-bold text-xs border border-sky-500/30">
                      {stop.code}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-100 group-hover:text-sky-200">
                        {stop.description}
                      </div>
                      <div className="text-xs text-slate-400">
                        {stop.roadName} {stop.distance ? `• ${formatDistance(stop.distance)}` : ''}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          )}
        </form>

        {/* Locate Nearest Stop Button */}
        <button
          type="button"
          id="locate-nearest-stop-btn"
          onClick={onFindNearest}
          disabled={isLocating}
          className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs border border-slate-700/80 shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] group"
        >
          <Locate className={`w-4 h-4 text-sky-400 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Locating GPS...' : 'Nearest Stop (GPS)'}</span>
        </button>
      </div>

      {/* Quick Select Popular Stops */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 flex items-center gap-1 mr-1">
          <Compass className="w-3 h-3 text-sky-400" />
          Major Hubs:
        </span>
        {QUICK_STOPS.map((q) => {
          const isSelected = selectedStop?.code === q.code;
          return (
            <button
              key={q.code}
              id={`quick-stop-${q.code}`}
              type="button"
              onClick={() => {
                const results = searchBusStops(q.code);
                if (results[0]) handleSelect(results[0]);
              }}
              className={`px-3 py-1.5 text-xs rounded-xl transition-all cursor-pointer font-medium flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 shadow-sm'
                  : 'bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/50'
              }`}
            >
              <span className="font-mono text-[11px] font-bold text-sky-400">{q.code}</span>
              <span>{q.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
