import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import MainMap from '../Map/MainMap';
import PlaceSearchBar from '../Common/PlaceSearchBar';
import {
  Layers,
  AlertTriangle,
  Download,
  Crosshair,
  ExternalLink,
  ShieldAlert,
  Clock,
  Sparkles,
  MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SegmentationView() {
  const {
    analysisData,
    locationName,
    activePresetId,
    presets,
    selectPreset,
    jobId,
    setInspectedPoint,
    openPatchHistory
  } = useAppStore();

  const stats = analysisData?.stats || {
    classes: {},
    totalRoiHa: 10000,
    totalAffectedHa: 209.1,
    top10Patches: []
  };

  const classes = stats.classes || {};
  const top10 = stats.top10Patches || [];

  const handleSelectPatch = (patch) => {
    setInspectedPoint({
      lat: patch.centroidLat,
      lon: patch.centroidLon,
      source: `Priority Patch #${patch.rank} (${patch.category})`,
      category: patch.category,
      riskScore: 0.88,
      dndvi: -0.32,
      areaHa: patch.areaHa,
      latestPassDate: '2026-09-14 (Sentinel-2 L2A)'
    });
    toast.success(`Selected Patch #${patch.rank} (${patch.areaHa} ha). Live View drawer opened!`);
  };

  const handleOpenPatchHistory = (e, patch) => {
    e.stopPropagation();
    openPatchHistory(patch);
  };

  const handleDownloadGeoJSON = () => {
    window.open(`/api/export/${jobId || 'demo_swat'}.geojson`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Search & Location Bar (Requirement 3: Add Place Search) */}
      <div className="bg-forest-card border border-forest-border p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-2 bg-forest-dark px-3 py-2 rounded-xl border border-forest-border text-xs">
            <MapPin className="w-4 h-4 text-guardian-400 shrink-0" />
            <span className="text-slate-400 font-semibold">Location:</span>
            <select
              value={activePresetId}
              onChange={(e) => {
                const val = e.target.value;
                if (val !== 'custom') {
                  selectPreset(val);
                }
              }}
              className="bg-transparent text-white font-bold outline-none cursor-pointer text-xs"
            >
              {Object.values(presets || {}).map((p) => (
                <option key={p.id} value={p.id} className="bg-forest-dark text-white">
                  {p.name}
                </option>
              ))}
              <option value="custom" className="bg-forest-dark text-amber-300" disabled={activePresetId !== 'custom'}>
                Custom: {locationName}
              </option>
            </select>
          </div>
        </div>

        {/* Nominatim Place Search Box */}
        <div className="w-full md:w-80">
          <PlaceSearchBar placeholder="Search place (Kalam, Kumrat, Kaghan)..." />
        </div>
      </div>

      {/* Banner with Official Compliance Disclaimer */}
      <div className="bg-forest-card border border-forest-border p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1 max-w-3xl">
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-guardian-400" />
            Disturbance Segmentation & Canopy Classification &bull; {locationName}
          </h2>
          <p className="text-xs text-amber-300/90 font-medium flex items-center gap-1.5 pt-1">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
            <span><strong>Notice:</strong> Detections represent potential disturbance requiring field verification. Earth observation algorithms detect spectral variance that may result from natural mortality, snow damage, or seasonal thinning in addition to anthropogenic cutting.</span>
          </p>
        </div>

        <button
          onClick={handleDownloadGeoJSON}
          className="px-4 py-2.5 rounded-xl bg-forest-dark hover:bg-forest-border border border-forest-border text-white text-xs font-bold flex items-center gap-2 transition-all shadow"
        >
          <Download className="w-4 h-4 text-guardian-400" />
          Export GeoJSON Polygons
        </button>
      </div>

      {/* KPI Cards Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Object.entries(classes).map(([key, cls]) => (
          <div
            key={key}
            className="bg-forest-card border border-forest-border rounded-xl p-3.5 space-y-1 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider truncate">
                {cls.shortLabel}
              </span>
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: cls.color }}
              />
            </div>
            <div className="text-xl font-extrabold text-white font-mono">
              {cls.areaHa.toFixed(1)} <span className="text-xs font-normal text-slate-400">ha</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-forest-border/60">
              <span>{cls.percentage}% of ROI</span>
              <span>{cls.patchCount} patches</span>
            </div>
          </div>
        ))}
      </div>

      {/* Map & Top 10 Patches Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <MainMap height="h-[540px]" />
        </div>

        {/* Top 10 Patches Priority Table */}
        <div className="lg:col-span-5 bg-forest-card border border-forest-border rounded-2xl p-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-guardian-400" /> Priority Disturbance Patches
              </h3>
              <span className="text-[10px] text-slate-400">Top 10 High-Risk Areas</span>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-[440px] pr-1">
              {top10.map((patch) => (
                <div
                  key={patch.rank}
                  className="bg-forest-dark/80 hover:bg-forest-dark border border-forest-border/80 hover:border-guardian-500/60 rounded-xl p-3 transition-all cursor-pointer group space-y-2"
                  onClick={() => handleSelectPatch(patch)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: patch.color }} />
                      #{patch.rank} {patch.category}
                    </span>
                    <span className="font-mono font-bold text-xs text-guardian-300">
                      {patch.areaHa.toFixed(1)} ha
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono">{patch.centroidLat.toFixed(4)}, {patch.centroidLon.toFixed(4)}</span>
                    <span className="text-[10px] text-slate-400">Priority #{patch.rank}</span>
                  </div>

                  {/* Action Buttons: Inspect in Live View + View Past Images */}
                  <div className="flex items-center justify-between pt-1 border-t border-forest-border/60 gap-2">
                    <button
                      onClick={(e) => handleOpenPatchHistory(e, patch)}
                      className="px-2.5 py-1 rounded-lg bg-forest-card hover:bg-forest-border text-guardian-300 hover:text-white border border-guardian-500/30 text-[10px] font-bold flex items-center gap-1 transition-all"
                      title="Open decadal satellite history & future projection modal"
                    >
                      <Clock className="w-3 h-3 text-guardian-400" />
                      View past images
                    </button>

                    <button
                      onClick={() => handleSelectPatch(patch)}
                      className="text-guardian-400 group-hover:underline flex items-center gap-1 text-[10px] font-medium"
                    >
                      Inspect in Live View &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-forest-border/60 text-[11px] text-slate-400 text-center">
            Click <strong>&ldquo;View past images&rdquo;</strong> to compare 10-year/5-year past imagery and projections.
          </div>
        </div>
      </div>
    </div>
  );
}
