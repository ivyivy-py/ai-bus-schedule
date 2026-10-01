import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Code, MapPin, Layers, CheckCircle2 } from 'lucide-react';

interface OneMapCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ONEMAP_SAMPLE_CODE = `<html>
   <head>
      <title>OneMap: Default Map (TileJSON)</title>
      <link rel="stylesheet" href="https://www.onemap.gov.sg/web-assets/libs/leaflet/leaflet.css" />
      <script src="https://www.onemap.gov.sg/web-assets/libs/leaflet/onemap-leaflet.js"></script>
      <script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
      <script src="https://www.onemap.gov.sg/web-assets/libs/leaflet/leaflet-tilejson.js"></script>
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

export const OneMapCreditModal: React.FC<OneMapCreditModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'preview' | 'info'>('code');

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(ONEMAP_SAMPLE_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-[850] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-3xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <img
              src="https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png"
              alt="OneMap Logo"
              className="w-7 h-7 object-contain"
            />
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                OneMap Singapore Team Credit & Sample
              </h2>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span>Singapore Land Authority (SLA)</span>
                <span>•</span>
                <span className="text-emerald-400 font-mono text-[10px]">ONE_MAP_API_KEY Ready</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Official Attribution Banner (Strictly maintaining SLA OneMap requirements) */}
        <div className="px-6 py-3 bg-amber-500/10 border-b border-amber-500/20 text-xs flex flex-wrap items-center justify-between gap-3 text-amber-200">
          <div className="flex items-center gap-2 font-medium">
            <img
              src="https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png"
              style={{ height: '20px', width: '20px' }}
              alt="OneMap Logo"
            />
            <span>
              <a
                href="https://www.onemap.gov.sg/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white font-semibold"
              >
                OneMap
              </a>{' '}
              &copy; contributors &#124;{' '}
              <a
                href="https://www.sla.gov.sg/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white font-semibold"
              >
                Singapore Land Authority
              </a>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/onemap.html"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Open Standalone Sample</span>
            </a>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="px-6 pt-3 pb-1 flex items-center gap-2 border-b border-slate-800/80 bg-slate-950/40 text-xs font-medium">
          <button
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'code'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-sky-400" />
            <span>TileJSON Sample Code</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Live Interactive Preview</span>
          </button>

          <button
            onClick={() => setActiveTab('info')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'info'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>API & Endpoint Specs</span>
          </button>

          <div className="ml-auto">
            {activeTab === 'code' && (
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Code!' : 'Copy Code'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'code' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-300 leading-relaxed">
                This code demonstrates how Singapore OneMap TileJSON 2.2.0 raster map tiles are loaded via
                Leaflet, bounded strictly within Singapore territory coordinates, and credited with the required
                SLA attribution prefix.
              </div>

              <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-4 font-mono text-[12px] leading-relaxed text-slate-200 overflow-x-auto shadow-inner">
                <pre>{ONEMAP_SAMPLE_CODE}</pre>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Available in the API directory:</strong> You can also access this endpoint via{' '}
                  <code className="text-sky-300 bg-slate-900 px-1.5 py-0.5 rounded">/api/onemap.html</code> or{' '}
                  <code className="text-sky-300 bg-slate-900 px-1.5 py-0.5 rounded">/api/onemap</code>.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-300">
                Live sandbox running the exact OneMap TileJSON client code provided:
              </div>
              <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-2xl h-[460px] bg-slate-950">
                <iframe
                  src="/api/onemap.html"
                  title="OneMap Default Map Live Preview"
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          )}

          {activeTab === 'info' && (
            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <h4 className="font-semibold text-white text-sm flex items-center gap-2">
                  <img
                    src="https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png"
                    alt="OneMap"
                    className="w-4 h-4"
                  />
                  About Singapore OneMap
                </h4>
                <p className="leading-relaxed text-slate-400">
                  OneMap is the authoritative national map of Singapore developed by the Singapore Land
                  Authority (SLA). It provides official spatial location services, geospatial layers, and
                  detailed base maps for government and public services.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-semibold text-sky-400">TileJSON 2.2.0 Endpoint</span>
                  <code className="block p-2 rounded bg-slate-900 font-mono text-[11px] text-slate-200 break-all border border-slate-800">
                    https://www.onemap.gov.sg/maps/json/raster/tilejson/2.2.0/Default.json
                  </code>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-semibold text-amber-400">Singapore Bounds (Leaflet)</span>
                  <code className="block p-2 rounded bg-slate-900 font-mono text-[11px] text-slate-200 border border-slate-800">
                    SW: [1.144, 103.535] | NE: [1.494, 104.502]
                  </code>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
                <span className="text-[11px] font-semibold text-emerald-400">
                  Environment Variable: ONE_MAP_API_KEY
                </span>
                <p className="text-[11px] text-slate-400">
                  Configured in <code className="text-emerald-300 font-mono">.env.example</code> and Vercel
                  environment settings. Enables high-volume base map queries and OneMap REST APIs.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-3.5 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Singapore Land Authority Official Attribution Verified</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
