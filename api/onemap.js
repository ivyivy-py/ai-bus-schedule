/**
 * Vercel Serverless Function & API route: /api/onemap
 * 
 * Provides OneMap base map details, sample code, and tile configurations.
 * If requested as HTML or with ?format=html, returns the runnable sample HTML page.
 */

const ONEMAP_SAMPLE_HTML = `<html>
   <head>
      <title>OneMap: Default Map (TileJSON)</title>
      <link rel="stylesheet" href="https://www.onemap.gov.sg/web-assets/libs/leaflet/leaflet.css" />
      <script src="https://www.onemap.gov.sg/web-assets/libs/leaflet/onemap-leaflet.js"></script>
      <script src="https://www.onemap.gov.sg/web-assets/libs/leaflet/leaflet-tilejson.js"></script>
      <script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
   </head>

   <body>
      <h1>Default Map (TileJSON)</h1>
      <div id='mapdiv' style='height:800px;'></div>
      <script>
         let sw = L.latLng(1.144, 103.535);
         let ne = L.latLng(1.494, 104.502);
         let bounds = L.latLngBounds(sw, ne);

         let map;

         $.get("https://www.onemap.gov.sg/maps/json/raster/tilejson/2.2.0/Default.json", function(data, status)
         {
            map = L.TileJSON.createMap('mapdiv', data);

            map.setMaxBounds(bounds);
            
            map.setView(L.latLng(1.2868108, 103.8545349), 16);

            /** DO NOT REMOVE the OneMap attribution below **/
            map.attributionControl.setPrefix('<img src="https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png" style="height:20px;width:20px;"/>&nbsp;<a href="https://www.onemap.gov.sg/" target="_blank" rel="noopener noreferrer">OneMap</a>&nbsp;&copy;&nbsp;contributors&nbsp;&#124;&nbsp;<a href="https://www.sla.gov.sg/" target="_blank" rel="noopener noreferrer">Singapore Land Authority</a>');
         });
      </script>
   </body>
</html>`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const format = req.query?.format || '';
  const acceptHeader = req.headers?.accept || '';

  // If user requested HTML explicitly or accessed directly in browser navigation
  if (format === 'html' || (!format && acceptHeader.includes('text/html') && !acceptHeader.includes('application/json'))) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(ONEMAP_SAMPLE_HTML);
  }

  const oneMapApiKey = (process.env.ONE_MAP_API_KEY || '').trim();
  const hasKey = oneMapApiKey.length > 0;

  return res.status(200).json({
    service: 'OneMap Singapore Base Map API',
    hasApiKey: hasKey,
    apiKeyMasked: hasKey ? `${oneMapApiKey.slice(0, 3)}...${oneMapApiKey.slice(-3)}` : null,
    attribution: {
      html: '<img src="https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png" style="height:20px;width:20px;"/>&nbsp;<a href="https://www.onemap.gov.sg/" target="_blank" rel="noopener noreferrer">OneMap</a>&nbsp;&copy;&nbsp;contributors&nbsp;&#124;&nbsp;<a href="https://www.sla.gov.sg/" target="_blank" rel="noopener noreferrer">Singapore Land Authority</a>',
      text: 'OneMap © contributors | Singapore Land Authority',
      logoUrl: 'https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png',
      website: 'https://www.onemap.gov.sg/',
      slaWebsite: 'https://www.sla.gov.sg/',
    },
    tileJsonUrl: 'https://www.onemap.gov.sg/maps/json/raster/tilejson/2.2.0/Default.json',
    tileUrls: {
      default: 'https://www.onemap.gov.sg/maps/tiles/Default/{z}/{x}/{y}.png',
      night: 'https://www.onemap.gov.sg/maps/tiles/Night/{z}/{x}/{y}.png',
      grey: 'https://www.onemap.gov.sg/maps/tiles/Grey/{z}/{x}/{y}.png',
      original: 'https://www.onemap.gov.sg/maps/tiles/Original/{z}/{x}/{y}.png',
    },
    sampleHtml: ONEMAP_SAMPLE_HTML,
    sampleUrl: '/api/onemap.html',
    documentation: 'https://www.onemap.gov.sg/apidocs/',
  });
}

export { ONEMAP_SAMPLE_HTML };
