import { BusRoute } from '../types';
import { SINGAPORE_BUS_ROUTES, searchBusServices } from '../data/singaporeBusStops';
import { SERVICE_10_DIR1, SERVICE_10_DIR2 } from '../data/ltaBusRoutesData';

/**
 * Fetches bus route information, utilizing the backend LTA DataMall BusRoutes API
 * with automatic fallback to high-fidelity local route datasets.
 */
export async function fetchBusRoute(
  serviceNo: string,
  direction: number = 1
): Promise<BusRoute | null> {
  const cleanSvc = serviceNo.trim().toUpperCase();
  if (!cleanSvc) return null;

  try {
    const res = await fetch(`/api/bus-route?ServiceNo=${encodeURIComponent(cleanSvc)}&Direction=${direction}`);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.stops) && data.stops.length > 0) {
        return data as BusRoute;
      }
    }
  } catch (err) {
    console.warn('Network error querying /api/bus-route, falling back to local routes:', err);
  }

  // Local fallback: Check exact service and direction
  if (cleanSvc === '10') {
    return direction === 2 ? SERVICE_10_DIR2 : SERVICE_10_DIR1;
  }

  const localMatch = SINGAPORE_BUS_ROUTES.find(
    (r) => r.serviceNo.toUpperCase() === cleanSvc && (r.direction === direction || !r.direction)
  );
  if (localMatch) {
    return localMatch;
  }

  // Any route matching service number
  const anyDirMatch = SINGAPORE_BUS_ROUTES.find((r) => r.serviceNo.toUpperCase() === cleanSvc);
  if (anyDirMatch) {
    return anyDirMatch;
  }

  // Check searchBusServices dynamic synthesizer
  const searchResults = searchBusServices(cleanSvc);
  if (searchResults.length > 0) {
    return searchResults[0];
  }

  return null;
}

/**
 * Returns all predefined bus routes
 */
export function getAllBusRoutes(): BusRoute[] {
  return SINGAPORE_BUS_ROUTES;
}
