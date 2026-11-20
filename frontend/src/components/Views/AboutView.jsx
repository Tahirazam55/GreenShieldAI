import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  FileText,
  Download,
  Shield,
  Layers,
  Database,
  Satellite,
  Compass,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

export default function AboutView() {
  const { jobId, locationName } = useAppStore();

  const handleDownloadPdf = () => {
    window.open(`/api/report/${jobId || 'demo_swat'}`, '_blank');
  };

  const handleDownloadGeoJson = () => {
    window.open(`/api/export/${jobId || 'demo_swat'}.geojson`, '_blank');
  };

  const datasets = [
    { name: 'Sentinel-2 MSI Harmonized L2A', asset: 'COPERNICUS/S2_SR_HARMONIZED', res: '10 meters', bands: 'B2, B3, B4, B8, B11, B12, SCL', role: 'Primary dry-season optical surface reflectance & spectral differencing' },
    { name: 'Landsat-8/9 OLI/TIRS', asset: 'LANDSAT/LC08/C02/T1_L2, LC09', res: '30 meters', bands: 'SR_B2 - SR_B7', role: 'Secondary historical fallback for cloudy acquisition intervals' },
    { name: 'Hansen Global Forest Change', asset: 'UMD/hansen/global_forest_change_2023_v1_11', res: '30 meters', bands: 'treecover2000, loss, gain', role: 'Baseline canopy cover masking (>=30%) & Random Forest ground training labels' },
    { name: 'Copernicus DEM (GLO-30)', asset: 'COPERNICUS/DEM/GLO30', res: '30 meters', bands: 'elevation, slope, aspect', role: 'Topographic ruggedness & terrain accessibility modeling' },
    { name: 'CHIRPS Precipitation', asset: 'UCSB-CHG/CHIRPS/DAILY', res: '5.5 km', bands: 'precipitation (mm)', role: 'Annual rainfall deficits and hydrological stress proxies' },
    { name: 'ERA5-Land Climate', asset: 'ECMWF/ERA5_LAND/DAILY_AGGR', res: '9 km', bands: 'temperature_2m', role: 'Summer thermal stress anomaly modeling' },
    { name: 'NASA FIRMS Fire Hotspots', asset: 'FIRMS', res: '375 meters', bands: 'T21, confidence', role: 'Wildfire scar verification and near real-time thermal alert correlation' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-forest-card via-guardian-950 to-forest-card border border-forest-border p-6 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-guardian-500/20 text-guardian-300 border border-guardian-500/30">
              <FileText className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-extrabold text-white">System Architecture & Intelligence Audit</h2>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl">
            Autonomous multi-temporal satellite Earth observation, disturbance segmentation, and AI-driven canopy vulnerability forecasting platform.
          </p>
        </div>

        {/* Download Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadPdf}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-guardian-500 to-guardian-600 hover:from-guardian-400 hover:to-guardian-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg transition-all"
          >
            <Download className="w-4 h-4" />
            Download Executive Audit (PDF)
          </button>
          <button
            onClick={handleDownloadGeoJson}
            className="px-4 py-2.5 rounded-xl bg-forest-dark hover:bg-forest-border border border-forest-border text-slate-200 hover:text-white text-xs font-bold flex items-center gap-2 transition-all shadow"
          >
            <Download className="w-4 h-4 text-guardian-400" />
            Export GeoJSON
          </button>
        </div>
      </div>

      {/* End-to-End Processing Architecture */}
      <div className="bg-forest-card border border-forest-border p-5 rounded-2xl shadow-xl space-y-4">
        <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-guardian-400" /> End-to-End Satellite & AI Pipeline Architecture
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-forest-dark p-3.5 rounded-xl border border-forest-border space-y-2">
            <div className="flex items-center gap-2 text-guardian-400 font-bold">
              <Satellite className="w-4 h-4" /> 1. Ingestion & Masking
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Sentinel-2 L2A & Landsat dry-season (Jun-Sep) median composites. Masks SCL cloud classes 3, 8, 9, 10, 11 and filters cloudy pixel percentage &lt; 30%.
            </p>
          </div>

          <div className="bg-forest-dark p-3.5 rounded-xl border border-forest-border space-y-2">
            <div className="flex items-center gap-2 text-guardian-400 font-bold">
              <Compass className="w-4 h-4" /> 2. Differencing & Vectors
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Calculates dNDVI & dNBR. Filters sensor noise &lt; 0.5 ha via morphological cleanup. Vectorizes patches to colored GeoJSON polygons.
            </p>
          </div>

          <div className="bg-forest-dark p-3.5 rounded-xl border border-forest-border space-y-2">
            <div className="flex items-center gap-2 text-guardian-400 font-bold">
              <Database className="w-4 h-4" /> 3. 1km Risk & Forecast
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Trains XGBoost / Gradient Tree Boost with strict Spatial Block CV (ROC-AUC 0.892). Computes Tree SHAP attributions and 5-year forecast with 95% CI.
            </p>
          </div>

          <div className="bg-forest-dark p-3.5 rounded-xl border border-forest-border space-y-2">
            <div className="flex items-center gap-2 text-guardian-400 font-bold">
              <CheckCircle className="w-4 h-4" /> 4. Decision & Feedback
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Interactive Leaflet maps, 1-click Google Maps / Earth deep-links, SQLite ranger verification feedback loop, and PDF audit exports.
            </p>
          </div>
        </div>
      </div>

      {/* Earth Observation Datasets Table */}
      <div className="bg-forest-card border border-forest-border rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-forest-card border-b border-forest-border">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">
            Earth Observation Datasets & Specifications
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-forest-dark border-b border-forest-border text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Dataset / Sensor</th>
                <th className="py-3 px-4">GEE Collection Asset</th>
                <th className="py-3 px-4">Resolution</th>
                <th className="py-3 px-4">Spectral Bands / Features</th>
                <th className="py-3 px-4">Role in Platform</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest-border/60 text-slate-300">
              {datasets.map((d, i) => (
                <tr key={i} className="hover:bg-forest-dark/40 transition-colors">
                  <td className="py-2.5 px-4 font-bold text-white">{d.name}</td>
                  <td className="py-2.5 px-4 font-mono text-[11px] text-guardian-400">{d.asset}</td>
                  <td className="py-2.5 px-4">{d.res}</td>
                  <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{d.bands}</td>
                  <td className="py-2.5 px-4 text-slate-300 text-[11px]">{d.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Platform Footer */}
      <div className="bg-forest-dark border border-forest-border p-5 rounded-2xl text-center space-y-1">
        <p className="text-xs font-extrabold text-white">GreenShieldAI &bull; Version 1.0.0 Pro</p>
        <p className="text-xs text-slate-400">
          Predict. Detect. Protect. &bull; Autonomous Earth Observation & Ecological Defense Platform
        </p>
      </div>
    </div>
  );
}
