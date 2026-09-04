import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { POPULAR_BUS_SERVICES, getBusStopByCode, SINGAPORE_BUS_STOPS } from './src/data/singaporeBusStops';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to calculate distance
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

// 1. Bus Arrival API route
app.get('/api/bus-arrival', async (req, res) => {
  const busStopCode = (req.query.BusStopCode as string || '').trim();
  const serviceNo = (req.query.ServiceNo as string || '').trim();

  if (!busStopCode) {
    return res.status(400).json({ error: 'BusStopCode query parameter is required' });
  }

  const ltaApiKey = process.env.LTA_API_KEY || process.env.DATAMALL_API_KEY;

  if (ltaApiKey && ltaApiKey.trim() !== '') {
    try {
      let ltaUrl = `https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=${encodeURIComponent(busStopCode)}`;
      if (serviceNo) {
        ltaUrl += `&ServiceNo=${encodeURIComponent(serviceNo)}`;
      }

      const response = await fetch(ltaUrl, {
        headers: {
          AccountKey: ltaApiKey.trim(),
          accept: 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const services = (data.Services || []).map((s: any) => ({
          serviceNo: s.ServiceNo,
          operator: s.Operator,
          nextBus: s.NextBus ? {
            estimatedArrival: s.NextBus.EstimatedArrival,
            load: s.NextBus.Load,
            feature: s.NextBus.Feature,
            type: s.NextBus.Type,
          } : undefined,
          nextBus2: s.NextBus2 ? {
            estimatedArrival: s.NextBus2.EstimatedArrival,
            load: s.NextBus2.Load,
            feature: s.NextBus2.Feature,
            type: s.NextBus2.Type,
          } : undefined,
          nextBus3: s.NextBus3 ? {
            estimatedArrival: s.NextBus3.EstimatedArrival,
            load: s.NextBus3.Load,
            feature: s.NextBus3.Feature,
            type: s.NextBus3.Type,
          } : undefined,
        }));

        return res.json({
          busStopCode,
          services,
          isSimulated: false,
          timestamp: new Date().toISOString(),
        });
      } else {
        console.warn(`LTA API returned status ${response.status}. Falling back to simulation.`);
      }
    } catch (err) {
      console.warn('Error querying LTA DataMall API:', err);
    }
  }

  // Stop-specific realistic arrivals for Singapore bus stops
  const stop = getBusStopByCode(busStopCode);
  let assignedServices = POPULAR_BUS_SERVICES[busStopCode];

  // If this stop code doesn't have an explicit list, use default diverse services
  if (!assignedServices || assignedServices.length === 0) {
    assignedServices = ['7', '14', '65', '106', '147', '190'];
  }

  // If a specific service was requested, ensure it is included and placed first
  let servicesList = [...assignedServices];
  if (serviceNo) {
    if (!servicesList.includes(serviceNo)) {
      servicesList = [serviceNo, ...servicesList];
    } else {
      servicesList = [serviceNo, ...servicesList.filter((s) => s !== serviceNo)];
    }
  }

  const now = Date.now();
  // Hash the stop code to produce stable, natural variations per stop
  const stopHash = busStopCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const simulatedServices = servicesList.map((svc, i) => {
    const svcHash = svc.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    // Produce varied arrival minutes (e.g. 1m, 3m, 6m, 12m) based on stop code and service
    const baseOffsetMinutes = ((stopHash + svcHash + i * 3) % 10) + 1;
    const operator = svc === '106' ? 'TTS' : ['SBST', 'SMRT', 'GAS', 'TTS'][(stopHash + i) % 4];

    return {
      serviceNo: svc,
      operator,
      nextBus: {
        estimatedArrival: new Date(now + baseOffsetMinutes * 60 * 1000).toISOString(),
        load: ['SEA', 'SEA', 'SDA', 'LSD'][(stopHash + i) % 4] as any,
        feature: 'WAB',
        type: (i % 2 === 0 ? 'DD' : 'SD') as any,
      },
      nextBus2: {
        estimatedArrival: new Date(now + (baseOffsetMinutes + 6 + (i % 4)) * 60 * 1000).toISOString(),
        load: ['SEA', 'SDA', 'SEA', 'LSD'][(stopHash + i + 1) % 4] as any,
        feature: 'WAB',
        type: 'SD' as any,
      },
      nextBus3: {
        estimatedArrival: new Date(now + (baseOffsetMinutes + 16 + (i % 5)) * 60 * 1000).toISOString(),
        load: 'SEA' as any,
        feature: 'WAB',
        type: 'DD' as any,
      },
    };
  });

  return res.json({
    busStopCode,
    busStopName: stop.description,
    roadName: stop.roadName,
    services: simulatedServices,
    isSimulated: true,
    message: 'Displaying simulated timings (configure LTA_API_KEY for live LTA DataMall feed)',
    timestamp: new Date().toISOString(),
  });
});

// 2. Weather 2-Hour Forecast API route (Singapore data.gov.sg)
app.get('/api/weather', async (req, res) => {
  const lat = parseFloat(req.query.lat as string) || 1.3521;
  const lon = parseFloat(req.query.lon as string) || 103.8198;

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

    return res.json({
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
    console.warn('Weather API failed, returning fallback:', err);
    return res.json({
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
});

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Singapore Bus & Weather Ticker API',
    hasLtaKey: Boolean(process.env.LTA_API_KEY || process.env.DATAMALL_API_KEY),
    time: new Date().toISOString(),
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Singapore Bus & Weather Ticker running on http://localhost:${PORT}`);
  });
}

startServer();
