import {
  SINGAPORE_BUS_ROUTES,
  getBusStopByCode,
  searchBusServices,
} from '../src/data/singaporeBusStops';
import { SERVICE_10_DIR1, SERVICE_10_DIR2 } from '../src/data/ltaBusRoutesData';

/**
 * Vercel Serverless Function: /api/bus-route
 * Queries the Singapore LTA DataMall BusRoutes API or returns curated high-precision route definitions.
 */
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const serviceNo = (req.query?.ServiceNo || req.query?.serviceNo || '').trim().toUpperCase();
  const direction = parseInt(req.query?.Direction || req.query?.direction || '1', 10) || 1;

  if (!serviceNo) {
    return res.status(400).json({ error: 'ServiceNo query parameter is required' });
  }

  // 1. Try LTA DataMall API if AccountKey is provided
  const apiKey = process.env.LTA_API_KEY || process.env.DATAMALL_API_KEY;
  if (apiKey && apiKey.trim() !== '') {
    try {
      const url = `https://datamall2.mytransport.sg/ltaodataservice/BusRoutes?$filter=ServiceNo eq '${encodeURIComponent(serviceNo)}'`;
      const response = await fetch(url, {
        headers: {
          AccountKey: apiKey,
          accept: 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const records = data.value || [];
        const dirRecords = records.filter((r: any) => r.Direction === direction);
        const activeRecords = dirRecords.length > 0 ? dirRecords : records;

        if (activeRecords.length > 0) {
          activeRecords.sort((a: any, b: any) => a.StopSequence - b.StopSequence);
          const stops = activeRecords.map((r: any) => r.BusStopCode);
          const firstRecord = activeRecords[0];
          const lastRecord = activeRecords[activeRecords.length - 1];
          const firstStop = getBusStopByCode(firstRecord.BusStopCode);
          const lastStop = getBusStopByCode(lastRecord.BusStopCode);

          return res.json({
            serviceNo,
            direction,
            operator: firstRecord.Operator || 'SBST',
            name: `${firstStop.description} ⇄ ${lastStop.description}`,
            origin: firstStop.description,
            destination: lastStop.description,
            stops,
            distanceKm: lastRecord.Distance || 0,
            firstBus: firstRecord.WD_FirstBus ? `${firstRecord.WD_FirstBus.slice(0, 2)}:${firstRecord.WD_FirstBus.slice(2)}` : '05:30',
            lastBus: firstRecord.WD_LastBus ? `${firstRecord.WD_LastBus.slice(0, 2)}:${firstRecord.WD_LastBus.slice(2)}` : '23:30',
            availableDirections: Array.from(new Set(records.map((r: any) => r.Direction as number))),
            isLiveLTA: true,
          });
        }
      }
    } catch (err) {
      console.warn('Vercel function error querying LTA BusRoutes API:', err);
    }
  }

  // 2. Specific Service 10 curated data with full 74 stops
  if (serviceNo === '10') {
    return res.json(direction === 2 ? SERVICE_10_DIR2 : SERVICE_10_DIR1);
  }

  // 3. Fallback to curated routes
  const foundRoute = SINGAPORE_BUS_ROUTES.find(
    (r) => r.serviceNo.toUpperCase() === serviceNo && (r.direction === direction || !r.direction)
  ) || SINGAPORE_BUS_ROUTES.find((r) => r.serviceNo.toUpperCase() === serviceNo);

  if (foundRoute) {
    return res.json(foundRoute);
  }

  // 4. Dynamic route generator fallback
  const dynamicRoutes = searchBusServices(serviceNo);
  if (dynamicRoutes.length > 0) {
    return res.json(dynamicRoutes[0]);
  }

  return res.status(404).json({ error: `Route for service ${serviceNo} not found` });
}
