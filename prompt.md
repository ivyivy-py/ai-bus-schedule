# Prompts Log - Singapore Bus & Weather Ticker

This file contains the complete record of user prompts and feature specifications for the **Singapore Bus & Weather Ticker** project, organized chronologically from initial concept through architectural updates and integrations.

---

## 1. Initial Application Specification & Setup

### User Prompt
> Build a full-stack Singapore Bus & Weather Ticker web application featuring:
> - **Real-Time Bus Arrivals**: Query Singapore Land Transport Authority (LTA) DataMall v3 API for bus arrival timings (NextBus, NextBus2, NextBus3) with estimated minutes, crowd load indicators (Seats Available, Standing Available, Limited Standing), bus type (Single Deck, Double Deck, Bendy), and wheelchair accessibility.
> - **Bus Stop & Route Navigation**:
>   - Comprehensive list of Singapore bus stops with search by road name, bus stop code, or description.
>   - Full route inspection for bus services (e.g., Service 10 Direction 1 Tampines to Kent Ridge, and Direction 2 Kent Ridge to Tampines) with sequential stops, stop sequence numbers, distances, and operational timings.
>   - Nearest bus stops calculation using browser GPS geolocation and the Haversine distance formula.
> - **Interactive Map**:
>   - Responsive map view centered on Singapore coordinates (`[1.3521, 103.8198]`) with boundary constraints.
>   - Bus stop markers, active selection highlight, route polyline overlay, and animated user location GPS pin.
> - **2-Hour Weather Forecast Integration**:
>   - Real-time 2-hour weather nowcast from Data.gov.sg / National Environment Agency (NEA) API.
>   - Match weather forecast to the closest meteorological area based on the user's selected bus stop or current GPS coordinates.
>   - Dynamic atmospheric weather background effects (animated rain droplets, moving cloud layers, sunny/clear particle shimmer, thunderstorm animations).
>   - Weather overlay toggle on the map and dedicated weather detail drawer/modal.
> - **Full-Stack Architecture**:
>   - Vite + React + TypeScript + Tailwind CSS frontend.
>   - Serverless backend functions in `/api` for Vercel deployment (`/api/bus-arrival`, `/api/bus-route`, `/api/weather`, `/api/health`).
>   - Express server fallback in `server.ts` for local and containerized development.
>   - Realistic simulation data fallback if external API keys or network requests are unavailable.

---

## 2. Environment Configuration & LTA_ACCOUNT_KEY Migration

### User Prompt
> Create a `.env.example` file with proper configuration.
> Ensure that `LTA_ACCOUNT_KEY` is supported as the standard environment variable name for Singapore Land Transport Authority DataMall APIs in Vercel and local environments.
> Update all backend endpoints (`/api/bus-arrival.ts`, `/api/bus-route.ts`, `/api/health.js`, and `server.ts`) and frontend banners to recognize `LTA_ACCOUNT_KEY` (while keeping backwards-compatibility for `LTA_API_KEY` and `DATAMALL_API_KEY`).
> Implement an API health check endpoint `/api/health.js` to monitor the operational status of external APIs.

---

## 3. OneMap Base Map Credit & Sample Code Integration

### User Prompt
> I have added in "ONE_MAP_API_KEY" so that there is a base map on the website. Please include this code block in the footer of the website to credit back the ONE_MAP team. it is also a sample of how the map is used.
> ```html
> <html>
>    <head>
>       <title>OneMap: Default Map (TileJSON)</title>
>       <link rel="stylesheet" href="https://www.onemap.gov.sg/web-assets/libs/leaflet/leaflet.css" />
>       <script src="https://www.onemap.gov.sg/web-assets/libs/leaflet/onemap-leaflet.js"></script>
>       <script src="https://www.onemap.gov.sg/web-assets/libs/leaflet/leaflet-tilejson.js"></script>
>       <script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
>    </head>
> 
>    <body>
>       <h1>Default Map (TileJSON)</h1>
>       <div id='mapdiv' style='height:800px;'></div>
>       <script>
>          let sw = L.latLng(1.144, 103.535);
>          let ne = L.latLng(1.494, 104.502);
>          let bounds = L.latLngBounds(sw, ne);
> 
>          let map;
> 
>          $.get("https://www.onemap.gov.sg/maps/json/raster/tilejson/2.2.0/Default.json", function(data, status)
>          {
>             map = L.TileJSON.createMap('mapdiv', data);
> 
>             map.setMaxBounds(bounds);
>             
>             map.setView(L.latLng(1.2868108, 103.8545349), 16);
> 
>             /** DO NOT REMOVE the OneMap attribution below **/
>             map.attributionControl.setPrefix('<img src="https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png" style="height:20px;width:20px;"/>&nbsp;<a href="https://www.onemap.gov.sg/" target="_blank" rel="noopener noreferrer">OneMap</a>&nbsp;&copy;&nbsp;contributors&nbsp;&#124;&nbsp;<a href="https://www.sla.gov.sg/" target="_blank" rel="noopener noreferrer">Singapore Land Authority</a>');
>          });
>       </script>
>    </body>
> </html>
> ```
> please put this in /api as well

---

## 4. Exclusive OneMap Basemap & Removal of Carto References

### User Prompt
> remove the references to carto.com/basemaps/apikey. use only from onemap

#### Requirements Executed:
- Purged all references, fallback URLs, and tile layers pointing to `cartocdn.com`, `carto.com`, and external basemap API keys.
- Set the map tile provider exclusively to Singapore Land Authority OneMap (`https://www.onemap.gov.sg/maps/tiles/Default/{z}/{x}/{y}.png`).
- Applied Singapore geographical bounding box (`sw: [1.144, 103.535]`, `ne: [1.494, 104.502]`) with `minZoom: 11` and `maxZoom: 19`.
- Added the mandatory OneMap attribution logo and SLA credit prefix to the Leaflet attribution control.

---

## 5. Project Prompts Documentation

### User Prompt
> create a prompt.md file containing all the prompts for this project and place this under the project root folder

---

## 6. Vercel Build Conflict Resolution (api/onemap.js vs api/onemap.html)

### User Prompt
> there was a vercel build error, please fix :
> The production deployment for project ai-bus-schedule failed on branch main at commit 9b18e6a.
> Two or more files have conflicting paths or names. Please make sure path segments and filenames, without their extension, are unique. The path "api/onemap.js" has conflicts with "api/onemap.html".

#### Requirements Executed:
- Removed conflicting `api/onemap.html` file so that `api/onemap.js` uniquely handles the `/api/onemap` route.
- Updated `vercel.json` with a rewrite rule routing `/api/onemap.html` to `/api/onemap?format=html`.
- Preserved `/public/onemap-sample.html` for direct static serving and dynamic HTML delivery via `/api/onemap.js`.
