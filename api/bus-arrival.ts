/**
 * Vercel Serverless Function: /api/bus-arrival
 * Queries the Singapore LTA DataMall v3 BusArrival API using the secret AccountKey.
 */

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

  // Graceful simulation fallback
  const mockServices = ['15', '24', '36', '65', '190'].slice(0, 4);
  const now = Date.now();
  const simulated = mockServices.map((svc, i) => ({
    serviceNo: svc,
    operator: i % 2 === 0 ? 'SBST' : 'SMRT',
    nextBus: {
      estimatedArrival: new Date(now + ((i * 3) % 7 + 1) * 60 * 1000).toISOString(),
      load: ['SEA', 'SEA', 'SDA', 'LSD'][i % 4],
      feature: 'WAB',
      type: i % 2 === 0 ? 'DD' : 'SD',
    },
    nextBus2: {
      estimatedArrival: new Date(now + ((i * 3) % 7 + 8) * 60 * 1000).toISOString(),
      load: 'SEA',
      feature: 'WAB',
      type: 'SD',
    },
    nextBus3: {
      estimatedArrival: new Date(now + ((i * 3) % 7 + 17) * 60 * 1000).toISOString(),
      load: 'SEA',
      feature: 'WAB',
      type: 'DD',
    },
  }));

  return res.status(200).json({
    busStopCode,
    services: serviceNo ? simulated.filter(s => s.serviceNo === serviceNo) : simulated,
    isSimulated: true,
    message: 'Simulated data. Set LTA_API_KEY environment variable in Vercel for live Singapore LTA DataMall feed.',
    timestamp: new Date().toISOString(),
  });
}
