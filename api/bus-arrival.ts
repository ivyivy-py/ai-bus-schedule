import { POPULAR_BUS_SERVICES, getBusStopByCode } from '../src/data/singaporeBusStops';

/**
 * Vercel Serverless Function: /api/bus-arrival
 * Queries the Singapore LTA DataMall v3 BusArrival API using the secret AccountKey.
 */

const getOperator = (svc: string): string => {
  const s = svc.toUpperCase();
  if (['106', '66', '78', '79', '97', '98', '143', '183', '333', '334', '335', '857', '857B'].includes(s)) return 'TTS';
  if (['12', '12E', '34', '36', '36A', '36B', '43', '62', '82', '83', '84', '85', '118', '119', '136', '381', '382', '386', '660', '663', '665'].includes(s)) return 'GAS';
  if (['77', '167', '190', '61', '67', '75', '176', '178', '180', '184', '187', '188', '700', '850E', '854', '856', '858', '900', '901', '903', '911', '912', '913', '920', '922', '925', '950', '951E', '960', '961', '962', '963', '964', '965', '966', '969', '970', '972', '975', '980', '983', '985'].includes(s)) return 'SMRT';
  return 'SBST';
};

export default async function handler(req: any, res: any) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const busStopCode = (req.query?.BusStopCode || req.query?.busStopCode || '').trim();
  const serviceNo = (req.query?.ServiceNo || req.query?.serviceNo || '').trim();

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

        return res.status(200).json({
          busStopCode,
          services,
          isSimulated: false,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('LTA DataMall fetch error in Vercel function:', err);
    }
  }

  // Graceful simulation fallback using actual Singapore bus stop services
  let assignedServices = POPULAR_BUS_SERVICES[busStopCode];
  if (!assignedServices || assignedServices.length === 0) {
    assignedServices = ['7', '14', '65', '106', '147', '190'];
  }

  let servicesList = [...assignedServices];
  if (serviceNo) {
    if (!servicesList.includes(serviceNo)) {
      servicesList = [serviceNo, ...servicesList];
    } else {
      servicesList = [serviceNo, ...servicesList.filter((s) => s !== serviceNo)];
    }
  }

  const now = Date.now();
  const stopHash = busStopCode.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);

  const simulated = servicesList.map((svc: string, i: number) => {
    const svcHash = svc.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const baseOffsetMinutes = ((stopHash + svcHash + i * 3) % 10) + 1;
    const operator = getOperator(svc);

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

  return res.status(200).json({
    busStopCode,
    services: simulated,
    isSimulated: true,
    message: 'Simulated data. Set LTA_API_KEY environment variable in Vercel for live Singapore LTA DataMall feed.',
    timestamp: new Date().toISOString(),
  });
}
