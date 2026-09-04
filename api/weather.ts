/**
 * Vercel Serverless Function: /api/weather
 * Queries the Singapore 2-Hour Weather Forecast API from data.gov.sg.
 */

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const lat = parseFloat(req.query?.lat) || 1.3521;
  const lon = parseFloat(req.query?.lon) || 103.8198;

  try {
    const govRes = await fetch('https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast');
    if (!govRes.ok) {
      throw new Error(`Data.gov.sg HTTP ${govRes.status}`);
    }

    const payload = await govRes.json();
    const dataObj = payload.data || payload;
    const areas = dataObj.area_metadata || [];
    const items = dataObj.items || [];
    const latestItem = items[items.length - 1] || {};
    const forecastsList = latestItem.forecasts || [];

    let nearestAreaName = 'City';
    let minDistance = Infinity;

    areas.forEach((area: any) => {
      if (area.label_location) {
        const d = haversineMeters(lat, lon, area.label_location.latitude, area.label_location.longitude);
        if (d < minDistance) {
          minDistance = d;
          nearestAreaName = area.name;
        }
      }
    });

    const matching = forecastsList.find((f: any) => f.area.toLowerCase() === nearestAreaName.toLowerCase());
    const forecastText = matching ? matching.forecast : (forecastsList[0]?.forecast || 'Fair (Day)');

    // Classify category (Singapore is UTC+8)
    const textLower = forecastText.toLowerCase();
    const singaporeHour = (new Date().getUTCHours() + 8) % 24;
    const isSingaporeNight = singaporeHour >= 19 || singaporeHour < 7;

    let category = 'sunny';
    if (textLower.includes('thunder')) {
      category = 'thunder';
    } else if (textLower.includes('rain') || textLower.includes('shower') || textLower.includes('drizzle')) {
      category = 'rain';
    } else if (textLower.includes('cloud') || textLower.includes('overcast') || textLower.includes('hazy')) {
      category = (textLower.includes('night') || (isSingaporeNight && !textLower.includes('day'))) ? 'night' : 'cloudy';
    } else if (textLower.includes('night') || (isSingaporeNight && !textLower.includes('day'))) {
      category = 'night';
    }

    return res.status(200).json({
      validPeriod: latestItem.valid_period || {
        start: new Date().toISOString(),
        end: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
        text: 'Next 2 hours',
      },
      updateTimestamp: latestItem.update_timestamp || new Date().toISOString(),
      nearestArea: nearestAreaName,
      forecast: forecastText,
      category,
      allForecasts: forecastsList,
    });
  } catch (err) {
    console.warn('Weather fetch error in Vercel function:', err);
    return res.status(200).json({
      validPeriod: {
        start: new Date().toISOString(),
        end: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
        text: 'Next 2 hours',
      },
      updateTimestamp: new Date().toISOString(),
      nearestArea: 'Central Singapore',
      forecast: 'Partly Cloudy (Day)',
      category: 'cloudy',
    });
  }
}
