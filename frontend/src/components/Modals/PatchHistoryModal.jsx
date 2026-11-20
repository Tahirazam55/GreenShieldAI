import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import {
  X,
  Clock,
  Sliders,
  Columns,
  Layers,
  Sparkles,
  TrendingDown,
  ExternalLink,
  ShieldAlert,
  Loader2,
  Calendar,
  Satellite
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function PatchHistoryModal() {
  const {
    isPatchHistoryOpen,
    closePatchHistory,
    patchHistoryData,
    isLoadingPatchHistory,
    openLiveView,
    setInspectedPoint
  } = useAppStore();

  const [compareMode, setCompareMode] = useState('swipe'); // 'swipe' | 'side-by-side' | 'epochs'
  const [baselineEpoch, setBaselineEpoch] = useState('past10'); // 'past10' | 'past5'
  const [sliderPos, setSliderPos] = useState(50);

  if (!isPatchHistoryOpen) return null;

  const data = patchHistoryData;
  const p10 = data?.past10Years;
  const p5 = data?.past5Years;
  const pres = data?.present;
  const f5 = data?.future5Years;
  const f10 = data?.future10Years;

  const selectedBaseline = baselineEpoch === 'past10' ? p10 : p5;

  const exactTileUrl = data?.localTileUrl || data?.exactTileUrl ||
    (data?.coordinates ? `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/15/${data?.tileCoords?.y || 12882}/${data?.tileCoords?.x || 22964}` : `/cache/thumbnails/${data?.regionId || 'swat'}_2026.png`);

  const handleOpenLiveView = () => {
    if (data?.coordinates) {
      setInspectedPoint({
        lat: data.coordinates.lat,
        lon: data.coordinates.lon,
        source: `Patch ${data.patchId} (Historical Archive)`,
        category: 'Inspected High-Risk Patch',
        riskScore: 0.88,
        dndvi: -0.34,
        latestPassDate: pres?.acquisitionDate || '2026-09-14'
      });
      closePatchHistory();
      openLiveView();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-forest-card border border-forest-border w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-forest-border flex items-center justify-between bg-forest-dark/90">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-guardian-500/20 border border-guardian-500/30 flex items-center justify-center text-guardian-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-base text-white">
                    Multi-Decadal Patch Observation & Time-Compare
                  </h3>
                  <span className="text-[10px] bg-red-500/20 text-red-300 font-mono font-bold px-2 py-0.5 rounded-full border border-red-500/30">
                    {data?.patchId || 'Target Patch'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Exact Coordinates: <strong className="font-mono text-slate-200">{data?.coordinates?.lat?.toFixed(5)}, {data?.coordinates?.lon?.toFixed(5)}</strong> &bull; Region: <span className="capitalize text-guardian-300">{data?.regionId || 'AOI'}</span>
                </p>
              </div>
            </div>

            <button
              onClick={closePatchHistory}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-forest-border transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {isLoadingPatchHistory || !data ? (
              <div className="h-72 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-guardian-400 animate-spin" />
                <p className="text-xs text-slate-400">Retrieving multi-epoch satellite imagery & projections...</p>
              </div>
            ) : (
              <>
                {/* Control Bar: Mode Toggle & Baseline Selector */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-forest-dark p-3 rounded-xl border border-forest-border">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-slate-400 font-medium">Compare Baseline:</span>
                    <button
                      onClick={() => setBaselineEpoch('past10')}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                        baselineEpoch === 'past10'
                          ? 'bg-guardian-600 text-white shadow'
                          : 'text-slate-400 hover:text-white bg-forest-card/50'
                      }`}
                    >
                      10 Yrs Ago (2016 Landsat 8)
                    </button>
                    <button
                      onClick={() => setBaselineEpoch('past5')}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                        baselineEpoch === 'past5'
                          ? 'bg-guardian-600 text-white shadow'
                          : 'text-slate-400 hover:text-white bg-forest-card/50'
                      }`}
                    >
                      5 Yrs Ago (2021 Sentinel-2)
                    </button>
                  </div>

                  <div className="flex items-center space-x-1.5 bg-forest-card p-1 rounded-lg border border-forest-border text-xs">
                    <button
                      onClick={() => setCompareMode('swipe')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
                        compareMode === 'swipe' ? 'bg-guardian-600 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" /> Swipe
                    </button>
                    <button
                      onClick={() => setCompareMode('side-by-side')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
                        compareMode === 'side-by-side' ? 'bg-guardian-600 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Columns className="w-3.5 h-3.5" /> Side-by-Side
                    </button>
                    <button
                      onClick={() => setCompareMode('epochs')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
                        compareMode === 'epochs' ? 'bg-guardian-600 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" /> All Epochs
                    </button>
                  </div>
                </div>

                {/* View 1: Swipe Slider */}
                {compareMode === 'swipe' && selectedBaseline && pres && (
                  <div className="space-y-3">
                    <div className="relative h-72 sm:h-84 w-full rounded-2xl overflow-hidden border border-forest-border shadow-inner select-none bg-forest-dark">
                      {/* Left Baseline Layer */}
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{
                          backgroundImage: `url('${selectedBaseline.imageUrl}'), url('${exactTileUrl}'), url('/cache/thumbnails/${data?.regionId || 'swat'}_2018.png')`,
                          filter: baselineEpoch === 'past10' ? 'contrast(1.1) saturate(1.25) brightness(1.02)' : 'contrast(1.08) saturate(1.2)'
                        }}
                      >
                        <div className="absolute top-3 left-3 bg-forest-dark/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-forest-border text-xs font-bold text-white shadow">
                          <span>🌿 {selectedBaseline.label} ({selectedBaseline.year})</span>
                          <span className="block text-[10px] text-guardian-300 font-normal">
                            {selectedBaseline.sensor} &bull; {selectedBaseline.canopyCoverPct}% Canopy
                          </span>
                        </div>
                      </div>

                      {/* Right Present Layer (Clipped) */}
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{
                          backgroundImage: `url('${pres.imageUrl}'), url('${exactTileUrl}'), url('/cache/thumbnails/${data?.regionId || 'swat'}_2026.png')`,
                          filter: 'contrast(1.1) saturate(0.85)',
                          clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)`
                        }}
                      >
                        <div className="absolute inset-0 bg-red-950/20 mix-blend-multiply pointer-events-none" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-24 h-24 rounded-full border-2 border-dashed border-red-500/80 bg-red-500/20 animate-pulse flex flex-col items-center justify-center">
                            <span className="text-[10px] font-mono font-bold text-red-200 bg-black/75 px-1.5 py-0.5 rounded shadow">
                              {data?.patchId}
                            </span>
                          </div>
                        </div>
                        <div className="absolute top-3 right-3 bg-red-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-red-500/40 text-xs font-bold text-white shadow">
                          <span>🚨 {pres.label} ({pres.year})</span>
                          <span className="block text-[10px] text-red-200 font-normal">
                            {pres.sensor} &bull; {pres.canopyCoverPct}% Canopy
                          </span>
                        </div>
                      </div>

                      {/* Divider Handle */}
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl cursor-ew-resize z-10"
                        style={{ left: `${sliderPos}%` }}
                      >
                        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-guardian-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                          <Sliders className="w-4 h-4" />
                        </div>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sliderPos}
                        onChange={(e) => setSliderPos(parseFloat(e.target.value))}
                        className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-20"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 bg-forest-dark p-2.5 rounded-xl border border-forest-border/80">
                      <span>Left: {selectedBaseline.sensor} ({selectedBaseline.acquisitionDate})</span>
                      <span className="text-red-400 font-bold font-mono">
                        Net Shift: {(pres.canopyCoverPct - selectedBaseline.canopyCoverPct).toFixed(1)}% Canopy ({pres.meanNdvi - selectedBaseline.meanNdvi > 0 ? `+` : ``}{(pres.meanNdvi - selectedBaseline.meanNdvi).toFixed(3)} NDVI)
                      </span>
                      <span>Right: {pres.sensor} ({pres.acquisitionDate})</span>
                    </div>
                  </div>
                )}

                {/* View 2: Side-by-Side Comparison */}
                {compareMode === 'side-by-side' && selectedBaseline && pres && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Past Card */}
                    <div className="bg-forest-dark border border-forest-border rounded-2xl overflow-hidden shadow">
                      <div className="h-52 w-full relative overflow-hidden bg-forest-dark">
                        <img
                          src={selectedBaseline.imageUrl}
                          alt={selectedBaseline.label}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = exactTileUrl;
                          }}
                          className="w-full h-full object-cover"
                          style={{ filter: baselineEpoch === 'past10' ? 'contrast(1.12) saturate(1.25) brightness(1.02)' : 'contrast(1.08) saturate(1.2)' }}
                        />
                        <div className="absolute top-2.5 left-2.5 bg-forest-dark/90 px-2.5 py-1 rounded-lg text-xs font-bold text-white border border-forest-border flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          {selectedBaseline.label} ({selectedBaseline.year})
                        </div>
                      </div>
                      <div className="p-3.5 space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Sensor:</span>
                          <span className="font-semibold text-white">{selectedBaseline.sensor}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Acquisition:</span>
                          <span className="font-mono text-guardian-300">{selectedBaseline.acquisitionDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Canopy Cover:</span>
                          <span className="font-mono font-bold text-emerald-400">{selectedBaseline.canopyCoverPct}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Mean NDVI:</span>
                          <span className="font-mono text-guardian-400">{selectedBaseline.meanNdvi}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 pt-1 border-t border-forest-border/60">{selectedBaseline.note}</p>
                      </div>
                    </div>

                    {/* Present Card */}
                    <div className="bg-forest-dark border border-forest-border rounded-2xl overflow-hidden shadow">
                      <div className="h-52 w-full relative overflow-hidden bg-forest-dark">
                        <img
                          src={pres.imageUrl}
                          alt={pres.label}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = exactTileUrl;
                          }}
                          className="w-full h-full object-cover"
                          style={{ filter: 'contrast(1.1) saturate(0.85)' }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-20 h-20 rounded-full border-2 border-dashed border-red-500/80 bg-red-500/20 flex flex-col items-center justify-center">
                            <span className="text-[9px] font-mono font-bold text-red-200 bg-black/75 px-1 rounded shadow">
                              {data?.patchId}
                            </span>
                          </div>
                        </div>
                        <div className="absolute top-2.5 left-2.5 bg-red-950/90 px-2.5 py-1 rounded-lg text-xs font-bold text-white border border-red-500/40 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                          {pres.label} ({pres.year})
                        </div>
                      </div>
                      <div className="p-3.5 space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Sensor:</span>
                          <span className="font-semibold text-white">{pres.sensor}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Acquisition:</span>
                          <span className="font-mono text-red-300">{pres.acquisitionDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Canopy Cover:</span>
                          <span className="font-mono font-bold text-red-400">{pres.canopyCoverPct}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Mean NDVI:</span>
                          <span className="font-mono text-red-400">{pres.meanNdvi}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 pt-1 border-t border-forest-border/60">{pres.note}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* View 3: All Epochs (Past, Present, and Projections) */}
                {compareMode === 'epochs' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {[p10, p5, pres, f5, f10].filter(Boolean).map((epoch, idx) => (
                      <div key={idx} className="bg-forest-dark border border-forest-border rounded-xl overflow-hidden text-xs">
                        <div className="h-28 w-full relative bg-forest-dark">
                          <img
                            src={epoch.imageUrl}
                            alt={epoch.label}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = exactTileUrl;
                            }}
                            className="w-full h-full object-cover"
                            style={{
                              filter: idx === 0 ? 'contrast(1.12) saturate(1.25) brightness(1.02)' : idx === 1 ? 'contrast(1.08) saturate(1.2)' : idx >= 3 ? 'contrast(1.05) saturate(0.7) hue-rotate(-15deg)' : 'contrast(1.1) saturate(0.85)'
                            }}
                          />
                          <div className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                            idx >= 3 ? 'bg-amber-950/90 text-amber-300 border border-amber-500/40' : idx === 2 ? 'bg-red-950/90 text-red-300 border border-red-500/40' : 'bg-forest-dark/90 text-white'
                          }`}>
                            {epoch.year} &bull; {epoch.canopyCoverPct}%
                          </div>
                        </div>
                        <div className="p-2.5 space-y-1">
                          <span className="font-bold text-white block text-[11px] truncate">{epoch.label}</span>
                          <span className="text-[10px] text-slate-400 block truncate">{epoch.sensor}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Future Projections Card (+5 Years & +10 Years) */}
                <div className="bg-forest-dark/90 border border-forest-border rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Predicted Future Trajectory (+5 & +10 Years Simulation)
                    </h4>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2.5 py-1 rounded-full border border-amber-500/30 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                      Estimated projection, not a real image
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* +5 Years */}
                    <div className="bg-forest-card p-3.5 rounded-xl border border-forest-border space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white">+5 Years ({f5?.year || 2031})</span>
                        <span className="text-amber-400 font-mono font-bold">{f5?.canopyCoverPct}% Canopy</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Modeled NDVI: <code className="font-mono text-guardian-300">{f5?.meanNdvi}</code>. Simulates unchecked edge-expansion disturbance if local ranger enforcement is absent.
                      </p>
                      <div className="text-[10px] text-slate-400 border-t border-forest-border/60 pt-1.5 flex justify-between">
                        <span>Model: Gradient Tree Boost</span>
                        <span>{f5?.projectionDate}</span>
                      </div>
                    </div>

                    {/* +10 Years */}
                    <div className="bg-forest-card p-3.5 rounded-xl border border-forest-border space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white">+10 Years ({f10?.year || 2036})</span>
                        <span className="text-red-400 font-mono font-bold">{f10?.canopyCoverPct}% Canopy</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Modeled NDVI: <code className="font-mono text-red-300">{f10?.meanNdvi}</code>. Long-term vulnerability threshold: potential permanent loss of core canopy integrity.
                      </p>
                      <div className="text-[10px] text-slate-400 border-t border-forest-border/60 pt-1.5 flex justify-between">
                        <span>Model: Gradient Tree Boost</span>
                        <span>{f10?.projectionDate}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mini Patch NDVI / Canopy Trajectory Line Chart */}
                {data.patchTimeline && data.patchTimeline.length > 0 && (
                  <div className="bg-forest-dark/80 border border-forest-border rounded-2xl p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <TrendingDown className="w-4 h-4 text-guardian-400" />
                        Micro Canopy Trajectory for Patch {data.patchId} (2016 &ndash; 2036)
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">Landsat &bull; Sentinel-2 &bull; XGBoost</span>
                    </div>

                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.patchTimeline} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1F452E" />
                          <XAxis dataKey="year" stroke="#94A3B8" tick={{ fontSize: 11 }} />
                          <YAxis yAxisId="cover" stroke="#52B788" domain={[40, 90]} tick={{ fontSize: 11 }} unit="%" />
                          <YAxis yAxisId="ndvi" orientation="right" stroke="#457B9D" domain={[0.3, 0.8]} tick={{ fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0B1E13', borderColor: '#1F452E', borderRadius: '12px', fontSize: '11px' }}
                          />
                          <Legend />
                          <Line yAxisId="cover" type="monotone" dataKey="coverPct" name="Canopy Cover (%)" stroke="#22C55E" strokeWidth={2.5} dot={{ r: 3 }} />
                          <Line yAxisId="ndvi" type="monotone" dataKey="ndvi" name="Mean NDVI" stroke="#52B788" strokeWidth={1.5} strokeDasharray="3 3" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-forest-border bg-forest-dark/95 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-400">
              High-resolution multi-sensor audit cached in demo mode for maximum offline reliability.
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleOpenLiveView}
                className="px-4 py-2 rounded-xl bg-forest-card hover:bg-forest-border text-white text-xs font-semibold border border-forest-border transition-all flex items-center gap-1.5"
              >
                <Satellite className="w-3.5 h-3.5 text-guardian-400" />
                Inspect Live View & Deep-Links
              </button>
              <button
                onClick={closePatchHistory}
                className="px-4 py-2 rounded-xl bg-guardian-600 hover:bg-guardian-500 text-white text-xs font-bold transition-all shadow"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
