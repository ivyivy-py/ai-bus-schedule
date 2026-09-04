import React from 'react';
import {
  Sun,
  CloudRain,
  CloudLightning,
  Cloud,
  Moon,
  Wind,
  MapPin,
  RefreshCw,
  Sparkles,
  Droplets,
  Thermometer,
} from 'lucide-react';
import { WeatherCategory, WeatherForecastResponse } from '../types';

interface WeatherCardProps {
  weather: WeatherForecastResponse | null;
  loading: boolean;
  onRefresh: () => void;
  activeCategory: WeatherCategory;
  categoryOverride: WeatherCategory | null;
  onSelectCategoryOverride: (cat: WeatherCategory | null) => void;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({
  weather,
  loading,
  onRefresh,
  activeCategory,
  categoryOverride,
  onSelectCategoryOverride,
}) => {
  const getWeatherIcon = (cat: WeatherCategory) => {
    switch (cat) {
      case 'sunny':
        return <Sun className="w-8 h-8 text-amber-400 animate-spin-slow" />;
      case 'rain':
        return <CloudRain className="w-8 h-8 text-sky-400" />;
      case 'thunder':
        return <CloudLightning className="w-8 h-8 text-indigo-300" />;
      case 'night':
        return <Moon className="w-8 h-8 text-indigo-200" />;
      case 'cloudy':
      default:
        return <Cloud className="w-8 h-8 text-slate-300" />;
    }
  };

  const formatValidTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Split forecast into light display header and bold display header
  const rawForecast = weather?.forecast || (loading ? 'Loading...' : 'Fair (Day)');
  const words = rawForecast.split(' ');
  const firstWord = words[0] || 'Fair';
  const secondWord = words.slice(1).join(' ') || (words.length === 1 ? 'Showers' : '');

  const tempEstimate = activeCategory === 'rain' || activeCategory === 'thunder' ? 28 : 31;
  const feelsLike = tempEstimate + 4;
  const humidityEstimate = activeCategory === 'rain' || activeCategory === 'thunder' ? '85%' : '76%';
  const precipitationEstimate =
    activeCategory === 'thunder' ? '85%' : activeCategory === 'rain' ? '70%' : '15%';

  return (
    <div
      id="weather-forecast-card"
      className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative shadow-2xl h-full"
    >
      {/* Top Header Row */}
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <span className="px-3 py-1 bg-sky-500/20 text-sky-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-sky-500/30 inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
            Current Weather
          </span>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              {weather?.nearestArea || 'Singapore'}, SG
            </span>
            <button
              id="refresh-weather-btn"
              onClick={onRefresh}
              disabled={loading}
              title="Refresh weather data"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Large Editorial Headline styled like the Bento design */}
        <div className="mb-4">
          <h2 className="text-4xl sm:text-5xl font-light text-slate-100 tracking-tight leading-none mb-1">
            {firstWord}
          </h2>
          <h3 className="text-5xl sm:text-6xl font-bold text-white tracking-tight leading-none mb-4">
            {secondWord}
          </h3>

          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-semibold text-slate-100">{tempEstimate}°</span>
              <span className="text-slate-500 text-sm">Feels like {feelsLike}°</span>
            </div>
            <div className="p-2.5 bg-slate-800/50 rounded-2xl border border-slate-700/40">
              {getWeatherIcon(activeCategory)}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Rows matching Bento Grid format */}
      <div className="relative z-10 space-y-2 mt-2 pt-3 border-t border-slate-800">
        <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
          <span className="text-sm text-slate-400 flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-sky-400" />
            Precipitation
          </span>
          <span className="text-sm font-semibold text-slate-200">{precipitationEstimate}</span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
          <span className="text-sm text-slate-400 flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5 text-amber-400" />
            Humidity
          </span>
          <span className="text-sm font-semibold text-slate-200">{humidityEstimate}</span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
          <span className="text-sm text-slate-400 flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5 text-slate-400" />
            2-Hr Window
          </span>
          <span className="text-xs font-mono text-sky-300 font-semibold">
            {weather?.validPeriod
              ? `${formatValidTime(weather.validPeriod.start)} – ${formatValidTime(weather.validPeriod.end)}`
              : 'Singapore NEA'}
          </span>
        </div>

        {/* Animation Ticker Chips for Testing */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-sky-400" />
              Weather FX
            </span>
            {categoryOverride && (
              <button
                onClick={() => onSelectCategoryOverride(null)}
                className="text-[10px] text-sky-400 hover:underline cursor-pointer"
              >
                Reset to Live
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => onSelectCategoryOverride(null)}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                categoryOverride === null
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
              }`}
            >
              Live
            </button>
            <button
              onClick={() => onSelectCategoryOverride('sunny')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                categoryOverride === 'sunny'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
              }`}
            >
              ☀️ Sun
            </button>
            <button
              onClick={() => onSelectCategoryOverride('rain')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                categoryOverride === 'rain'
                  ? 'bg-sky-400 text-slate-950 shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
              }`}
            >
              🌧️ Rain
            </button>
            <button
              onClick={() => onSelectCategoryOverride('thunder')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                categoryOverride === 'thunder'
                  ? 'bg-purple-400 text-slate-950 shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
              }`}
            >
              ⚡ Storm
            </button>
            <button
              onClick={() => onSelectCategoryOverride('night')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                categoryOverride === 'night'
                  ? 'bg-indigo-400 text-slate-950 shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
              }`}
            >
              🌙 Night
            </button>
          </div>
        </div>
      </div>

      {/* Atmospheric glowing orb in bottom right */}
      <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-sky-500/10 blur-[80px] rounded-full pointer-events-none" />
    </div>
  );
};
