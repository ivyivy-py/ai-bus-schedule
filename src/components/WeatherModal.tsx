import React from 'react';
import { CloudSun, CloudRain, Zap, Sun, Moon, Droplets, Wind, Thermometer, X } from 'lucide-react';
import { WeatherForecastResponse, WeatherCategory } from '../types';

interface WeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  weather: WeatherForecastResponse | null;
  loading: boolean;
  activeCategory: WeatherCategory;
  onSelectCategory: (cat: WeatherCategory) => void;
}

export const WeatherModal: React.FC<WeatherModalProps> = ({
  isOpen,
  onClose,
  weather,
  loading,
  activeCategory,
  onSelectCategory,
}) => {
  if (!isOpen) return null;

  const CATEGORIES: { id: WeatherCategory; label: string; icon: any; color: string }[] = [
    { id: 'sunny', label: 'Fair / Sunny', icon: Sun, color: 'text-amber-400 bg-amber-500/10' },
    { id: 'rain', label: 'Rain / Showers', icon: CloudRain, color: 'text-sky-400 bg-sky-500/10' },
    { id: 'thunder', label: 'Thundery Storm', icon: Zap, color: 'text-purple-400 bg-purple-500/10' },
    { id: 'cloudy', label: 'Cloudy / Overcast', icon: CloudSun, color: 'text-slate-300 bg-slate-500/10' },
    { id: 'night', label: 'Clear Night', icon: Moon, color: 'text-indigo-400 bg-indigo-500/10' },
  ];

  return (
    <div
      id="weather-modal-backdrop"
      className="fixed inset-0 z-[700] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="weather-modal-card"
        className="bg-slate-900/95 border border-slate-700/80 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <CloudSun className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-base text-white">Singapore Weather</h3>
              <p className="text-[11px] text-slate-400">NEA 2-Hour Nowcast & Atmospheric Canvas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Weather Forecast Details */}
        {weather ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <div>
                <span className="text-[11px] text-emerald-400 font-mono font-semibold uppercase tracking-wider">
                  📍 {weather.nearestArea || 'Central Singapore'}
                </span>
                <div className="font-extrabold text-xl sm:text-2xl text-white mt-0.5">
                  {weather.forecast}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Valid: {weather.validPeriod.text || 'Next 2 Hours'}
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                {activeCategory === 'rain' ? (
                  <CloudRain className="w-8 h-8 text-sky-400" />
                ) : activeCategory === 'thunder' ? (
                  <Zap className="w-8 h-8 text-purple-400" />
                ) : activeCategory === 'night' ? (
                  <Moon className="w-8 h-8 text-indigo-400" />
                ) : (
                  <Sun className="w-8 h-8 text-amber-400" />
                )}
              </div>
            </div>

            {/* Singapore Ambient Indicators */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                <Thermometer className="w-4 h-4 text-rose-400 mx-auto mb-1" />
                <div className="text-slate-400 text-[10px]">Temp</div>
                <div className="font-bold text-white font-mono">30°C - 32°C</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                <Droplets className="w-4 h-4 text-sky-400 mx-auto mb-1" />
                <div className="text-slate-400 text-[10px]">Humidity</div>
                <div className="font-bold text-white font-mono">75% - 88%</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                <Wind className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <div className="text-slate-400 text-[10px]">Wind</div>
                <div className="font-bold text-white font-mono">14 km/h</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-slate-400">
            {loading ? 'Retrieving live Singapore NEA weather forecast...' : 'Weather data ready.'}
          </div>
        )}

        {/* Dynamic Background Atmosphere Simulator */}
        <div className="border-t border-slate-800 pt-3">
          <div className="text-xs font-semibold text-slate-300 mb-2">
            Simulate Weather Atmosphere in Background:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 border-amber-400/80 text-white ring-2 ring-amber-400/30 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${cat.color.split(' ')[0]}`} />
                  <span className="truncate">{cat.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
