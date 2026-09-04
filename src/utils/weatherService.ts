import { WeatherCategory, WeatherForecastResponse, WeatherAreaMetadata, WeatherForecastItem } from '../types';
import { calculateDistanceInMeters } from './haversine';

/**
 * Classifies a Singapore weather forecast string into an animation category:
 * 'sunny' | 'cloudy' | 'rain' | 'thunder' | 'night'
 */
export function classifyWeatherCondition(forecastText: string): WeatherCategory {
  const text = forecastText.toLowerCase();

  // Determine if it's currently night in Singapore (UTC+8)
  const isSingaporeNight = (() => {
    // Singapore is UTC+8
    const singaporeHour = (new Date().getUTCHours() + 8) % 24;
    return singaporeHour >= 19 || singaporeHour < 7;
  })();

  if (text.includes('thunder')) {
    return 'thunder';
  }

  if (
    text.includes('rain') ||
    text.includes('shower') ||
    text.includes('drizzle')
  ) {
    return 'rain';
  }

  if (text.includes('cloud') || text.includes('hazy') || text.includes('overcast') || text.includes('windy')) {
    if (text.includes('night') || (isSingaporeNight && !text.includes('day'))) {
      return 'night';
    }
    return 'cloudy';
  }

  if (text.includes('fair') || text.includes('sunny') || text.includes('clear')) {
    if (text.includes('night') || (isSingaporeNight && !text.includes('day'))) {
      return 'night';
    }
    return 'sunny';
  }

  return (isSingaporeNight && !text.includes('day')) ? 'night' : 'sunny';
}

/**
 * Fetches the Singapore 2-Hour Weather Forecast from data.gov.sg or local API.
 * Finds the forecast area nearest to user / bus stop latitude and longitude.
 */
export async function fetchSingaporeWeather(
  latitude: number = 1.3521,
  longitude: number = 103.8198
): Promise<WeatherForecastResponse> {
  try {
    // Try our backend proxy route first (avoids CORS issues on Vercel or local Express)
    const res = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.forecast) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend weather proxy unavailable, attempting direct fetch:', err);
  }

  // Fallback: direct fetch from Singapore data.gov.sg open API
  try {
    const directRes = await fetch('https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast');
    if (!directRes.ok) {
      throw new Error(`Data.gov.sg returned HTTP ${directRes.status}`);
    }

    const payload = await directRes.json();
    const dataObj = payload.data || payload;
    const areas: WeatherAreaMetadata[] = dataObj.area_metadata || [];
    const items = dataObj.items || [];
    const latestItem = items[items.length - 1] || {};
    const forecastsList: { area: string; forecast: string }[] = latestItem.forecasts || [];

    // Find nearest area using Haversine
    let nearestAreaName = 'City';
    let minDistance = Infinity;

    areas.forEach((area) => {
      if (area.labelLocation) {
        const dist = calculateDistanceInMeters(
          latitude,
          longitude,
          area.labelLocation.latitude,
          area.labelLocation.longitude
        );
        if (dist < minDistance) {
          minDistance = dist;
          nearestAreaName = area.name;
        }
      }
    });

    const matchingForecast = forecastsList.find(
      (f) => f.area.toLowerCase() === nearestAreaName.toLowerCase()
    );

    const forecastText = matchingForecast ? matchingForecast.forecast : (forecastsList[0]?.forecast || 'Fair (Day)');
    const validPeriod = latestItem.valid_period || {
      start: new Date().toISOString(),
      end: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      text: 'Next 2 hours',
    };

    return {
      validPeriod,
      updateTimestamp: latestItem.update_timestamp || new Date().toISOString(),
      nearestArea: nearestAreaName,
      forecast: forecastText,
      category: classifyWeatherCondition(forecastText),
      allForecasts: forecastsList.map((f) => ({
        area: f.area,
        forecast: f.forecast,
      })),
    };
  } catch (err) {
    console.warn('Direct weather fetch failed, returning Singapore standard forecast:', err);
    // Graceful fallback for offline / disconnected situations
    const fallbackText = 'Partly Cloudy (Day)';
    return {
      validPeriod: {
        start: new Date().toISOString(),
        end: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
        text: 'Next 2 hours',
      },
      updateTimestamp: new Date().toISOString(),
      nearestArea: 'Central Singapore',
      forecast: fallbackText,
      category: classifyWeatherCondition(fallbackText),
    };
  }
}
