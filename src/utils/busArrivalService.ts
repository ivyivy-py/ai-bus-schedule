import { BusArrivalResponse, BusServiceArrival, BusCrowdLevel, BusVehicleType } from '../types';
import { POPULAR_BUS_SERVICES, getBusStopByCode } from '../data/singaporeBusStops';

/**
 * Generates realistic synthetic arrival times for Singapore bus stops
 * when the LTA DataMall AccountKey is not set in environment variables.
 */
export function generateSimulatedArrivals(busStopCode: string): BusArrivalResponse {
  const stop = getBusStopByCode(busStopCode);
  const servicesList = POPULAR_BUS_SERVICES[busStopCode] || ['14', '65', '190', '502'];

  const loads: BusCrowdLevel[] = ['SEA', 'SEA', 'SDA', 'LSD'];
  const types: BusVehicleType[] = ['SD', 'DD', 'DD', 'BD'];
  const operators = ['SBST', 'SMRT', 'GAS', 'TTS'];

  const services: BusServiceArrival[] = servicesList.map((svcNum, index) => {
    // Generate randomized but realistic wait times (e.g. 2 min, 10 min, 22 min)
    const baseOffsetMinutes = ((index * 3) % 7) + 1;
    const now = Date.now();

    const eta1 = new Date(now + baseOffsetMinutes * 60 * 1000).toISOString();
    const eta2 = new Date(now + (baseOffsetMinutes + 7 + (index % 4)) * 60 * 1000).toISOString();
    const eta3 = new Date(now + (baseOffsetMinutes + 18 + (index % 6)) * 60 * 1000).toISOString();

    return {
      serviceNo: svcNum,
      operator: operators[index % operators.length],
      nextBus: {
        estimatedArrival: eta1,
        load: loads[(index + 1) % loads.length],
        feature: 'WAB',
        type: types[index % types.length],
      },
      nextBus2: {
        estimatedArrival: eta2,
        load: loads[index % loads.length],
        feature: 'WAB',
        type: types[(index + 1) % types.length],
      },
      nextBus3: {
        estimatedArrival: eta3,
        load: loads[(index + 2) % loads.length],
        feature: 'WAB',
        type: types[index % types.length],
      },
      status: 'Operating',
    };
  });

  return {
    busStopCode,
    busStopName: stop.description,
    roadName: stop.roadName,
    services,
    isSimulated: true,
    message: 'Displaying simulated timings (configure LTA_API_KEY in Vercel for live LTA data)',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Fetches bus arrival timings for a given bus stop code.
 * Queries the `/api/bus-arrival` endpoint.
 * Falls back to simulation if API key is not present or endpoint returns simulated payload.
 */
export async function fetchBusArrivals(
  busStopCode: string,
  serviceNo?: string
): Promise<BusArrivalResponse> {
  const cleanCode = busStopCode.trim();
  if (!cleanCode) {
    throw new Error('Bus stop code is required');
  }

  let url = `/api/bus-arrival?BusStopCode=${encodeURIComponent(cleanCode)}`;
  if (serviceNo && serviceNo.trim()) {
    url += `&ServiceNo=${encodeURIComponent(serviceNo.trim())}`;
  }

  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.services)) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Error fetching from /api/bus-arrival, falling back to simulated data:', err);
  }

  // Graceful fallback to realistic simulation
  return generateSimulatedArrivals(cleanCode);
}
