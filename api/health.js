/**
 * Health Check & API Monitoring Endpoint: /api/health.js
 * 
 * Monitors the operational health of:
 * 1. Singapore LTA DataMall v3 BusArrival API
 * 2. Singapore LTA DataMall BusRoutes API
 * 3. Singapore Data.gov.sg 2-Hour Weather Forecast API
 * 4. Local simulation and curated fallback services
 */

// Helper to perform fetch with a timeout
async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const start = Date.now();
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    const latencyMs = Date.now() - start;
    clearTimeout(timeoutId);
    return { ok: response.ok, status: response.status, response, latencyMs, error: null };
  } catch (err) {
    const latencyMs = Date.now() - start;
    clearTimeout(timeoutId);
    return {
      ok: false,
      status: 0,
      response: null,
      latencyMs,
      error: err.name === 'AbortError' ? `Request timed out after ${timeoutMs}ms` : err.message,
    };
  }
}

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const query = req.query || {};
  const isDetailed = query.detailed !== 'false'; // detailed by default
  const ltaApiKey = (
    process.env.LTA_ACCOUNT_KEY ||
    process.env.LTA_API_KEY ||
    process.env.DATAMALL_API_KEY ||
    ''
  ).trim();
  const hasLtaKey = ltaApiKey.length > 0;

  const oneMapApiKey = (process.env.ONE_MAP_API_KEY || '').trim();
  const hasOneMapKey = oneMapApiKey.length > 0;

  const results = {
    ltaBusArrival: {
      name: 'LTA DataMall Bus Arrival v3',
      endpoint: 'https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival',
      configuredKey: hasLtaKey,
      status: 'unknown',
      operational: false,
      latencyMs: 0,
      details: '',
    },
    ltaBusRoutes: {
      name: 'LTA DataMall Bus Routes',
      endpoint: 'https://datamall2.mytransport.sg/ltaodataservice/BusRoutes',
      configuredKey: hasLtaKey,
      status: 'unknown',
      operational: false,
      latencyMs: 0,
      details: '',
    },
    weatherGovSg: {
      name: 'Data.gov.sg 2-Hour Weather Forecast',
      endpoint: 'https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast',
      configuredKey: true, // Public API, no key required
      status: 'unknown',
      operational: false,
      latencyMs: 0,
      details: '',
    },
    oneMap: {
      name: 'Singapore OneMap Base Map (SLA)',
      endpoint: 'https://www.onemap.gov.sg/maps/json/raster/tilejson/2.2.0/Default.json',
      configuredKey: hasOneMapKey,
      status: 'unknown',
      operational: false,
      latencyMs: 0,
      details: '',
    },
  };

  // 1. Check LTA Bus Arrival API
  if (hasLtaKey) {
    try {
      const testStop = '01012'; // Victoria St / Bugis Stn
      const check = await fetchWithTimeout(
        `https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=${testStop}`,
        {
          headers: {
            AccountKey: ltaApiKey,
            accept: 'application/json',
          },
        },
        5000
      );

      results.ltaBusArrival.latencyMs = check.latencyMs;

      if (check.ok) {
        const data = await check.response.json();
        const serviceCount = data?.Services?.length || 0;
        results.ltaBusArrival.status = 'ok';
        results.ltaBusArrival.operational = true;
        results.ltaBusArrival.details = `Live LTA feed active (${serviceCount} services retrieved at test stop ${testStop})`;
      } else if (check.status === 401 || check.status === 403) {
        results.ltaBusArrival.status = 'unauthorized';
        results.ltaBusArrival.operational = false;
        results.ltaBusArrival.details = `LTA returned HTTP ${check.status}. Check if LTA_ACCOUNT_KEY is valid. App will fallback to simulated arrival timings.`;
      } else {
        results.ltaBusArrival.status = 'error';
        results.ltaBusArrival.operational = false;
        results.ltaBusArrival.details = check.error || `HTTP ${check.status} from LTA DataMall. Simulated arrival fallback active.`;
      }
    } catch (err) {
      results.ltaBusArrival.status = 'error';
      results.ltaBusArrival.operational = false;
      results.ltaBusArrival.details = `Exception: ${err.message}. Simulated fallback active.`;
    }
  } else {
    results.ltaBusArrival.status = 'simulated';
    results.ltaBusArrival.operational = true;
    results.ltaBusArrival.details = 'No LTA_ACCOUNT_KEY environment variable provided. Realistic simulated bus arrivals are active and working.';
  }

  // 2. Check LTA Bus Routes API
  if (hasLtaKey) {
    try {
      const testService = '10';
      const check = await fetchWithTimeout(
        `https://datamall2.mytransport.sg/ltaodataservice/BusRoutes?$filter=ServiceNo eq '${testService}'`,
        {
          headers: {
            AccountKey: ltaApiKey,
            accept: 'application/json',
          },
        },
        5000
      );

      results.ltaBusRoutes.latencyMs = check.latencyMs;

      if (check.ok) {
        const data = await check.response.json();
        const recordCount = data?.value?.length || 0;
        results.ltaBusRoutes.status = 'ok';
        results.ltaBusRoutes.operational = true;
        results.ltaBusRoutes.details = `Live LTA BusRoutes active (${recordCount} stops indexed for Service ${testService})`;
      } else {
        results.ltaBusRoutes.status = 'fallback';
        results.ltaBusRoutes.operational = true;
        results.ltaBusRoutes.details = `LTA returned HTTP ${check.status}. Curated Singapore route geometry and stops database fallback active.`;
      }
    } catch (err) {
      results.ltaBusRoutes.status = 'fallback';
      results.ltaBusRoutes.operational = true;
      results.ltaBusRoutes.details = `Exception: ${err.message}. Curated route database fallback active.`;
    }
  } else {
    results.ltaBusRoutes.status = 'curated_fallback';
    results.ltaBusRoutes.operational = true;
    results.ltaBusRoutes.details = 'Local high-precision curated route geometries and stops active for Singapore bus services.';
  }

  // 3. Check Singapore 2-Hour Weather Forecast API (data.gov.sg)
  try {
    const check = await fetchWithTimeout(
      'https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast',
      { headers: { accept: 'application/json' } },
      5000
    );

    results.weatherGovSg.latencyMs = check.latencyMs;

    if (check.ok) {
      const data = await check.response.json();
      const areasCount = data?.data?.area_metadata?.length || data?.area_metadata?.length || 0;
      results.weatherGovSg.status = 'ok';
      results.weatherGovSg.operational = true;
      results.weatherGovSg.details = `Live data.gov.sg weather active (${areasCount} regional forecast zones in Singapore)`;
    } else {
      results.weatherGovSg.status = 'degraded';
      results.weatherGovSg.operational = false;
      results.weatherGovSg.details = check.error || `HTTP ${check.status} from data.gov.sg. Weather ticker fallback active.`;
    }
  } catch (err) {
    results.weatherGovSg.status = 'degraded';
    results.weatherGovSg.operational = false;
    results.weatherGovSg.details = `Exception: ${err.message}. Weather ticker fallback active.`;
  }

  // 4. Check Singapore OneMap Base Map (SLA TileJSON)
  try {
    const check = await fetchWithTimeout(
      'https://www.onemap.gov.sg/maps/json/raster/tilejson/2.2.0/Default.json',
      { headers: { accept: 'application/json' } },
      5000
    );

    results.oneMap.latencyMs = check.latencyMs;

    if (check.ok) {
      results.oneMap.status = 'ok';
      results.oneMap.operational = true;
      results.oneMap.details = 'OneMap TileJSON 2.2.0 endpoint active. Base map operational.';
    } else {
      results.oneMap.status = 'degraded';
      results.oneMap.operational = false;
      results.oneMap.details = check.error || `HTTP ${check.status} from OneMap. Fallback raster basemap active.`;
    }
  } catch (err) {
    results.oneMap.status = 'degraded';
    results.oneMap.operational = false;
    results.oneMap.details = `Exception: ${err.message}. Fallback basemap active.`;
  }

  // Overall system evaluation
  const allOperational = Object.values(results).every((api) => api.operational);
  const overallStatus = allOperational ? 'healthy' : 'degraded';

  const payload = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime ? process.uptime() : 0),
    service: 'Singapore Bus & Weather Ticker API',
    hasLtaApiKey: hasLtaKey,
    ltaKeyMasked: hasLtaKey ? `${ltaApiKey.slice(0, 4)}...${ltaApiKey.slice(-4)}` : null,
    hasOneMapKey: hasOneMapKey,
    apis: results,
    endpoints: {
      health: '/api/health.js',
      busArrival: '/api/bus-arrival?BusStopCode=01012',
      busRoute: '/api/bus-route?ServiceNo=10',
      weather: '/api/weather?lat=1.3521&lon=103.8198',
      oneMap: '/api/onemap',
      oneMapSample: '/api/onemap.html',
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsageMb: Math.round((process.memoryUsage?.().rss || 0) / (1024 * 1024)),
    },
  };

  return res.status(overallStatus === 'healthy' ? 200 : 207).json(payload);
}
