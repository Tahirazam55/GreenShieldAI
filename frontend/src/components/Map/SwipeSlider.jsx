import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  SlidersHorizontal,
  Calendar,
  ArrowRightLeft,
  Satellite,
  ExternalLink,
  Loader2,
  ZoomIn
} from 'lucide-react';

export default function SwipeSlider() {
  const {
    analysisData,
    locationName,
    activePresetId,
    center,
    openLiveView,
    setInspectedPoint
  } = useAppStore();

  const [sliderPosition, setSliderPosition] = useState(50);
  const [pastYear, setPastYear] = useState(2018);
  const [presentYear, setPresentYear] = useState(2026);
  const [isLeftLoading, setIsLeftLoading] = useState(false);
  const [isRightLoading, setIsRightLoading] = useState(false);

  const matchedRegion = analysisData?.location?.matchedPresetId || analysisData?.matchedPresetId;
  const safePreset = ['swat', 'abbottabad', 'dir_upper', 'chitral', 'kohistan', 'mansehra'].includes(activePresetId)
    ? activePresetId
    : (['swat', 'abbottabad', 'dir_upper', 'chitral', 'kohistan', 'mansehra'].includes(matchedRegion) ? matchedRegion : 'swat');

  const displayName = analysisData?.location?.name || locationName;

  const timeSeries = analysisData?.timeSeries || [];
  const pastData = timeSeries.find((t) => t.year === pastYear) || {
    forestCoverPct: 74.5,
    meanNdvi: 0.658,
    sensor: 'Sentinel-2 MSI Harmonized L2A',
    passDate: `${pastYear}-08-14`,
    imageUrl: `/cache/thumbnails/${safePreset}_${pastYear}.png`
  };

  const presentData = timeSeries.find((t) => t.year === presentYear) || {
    forestCoverPct: 69.5,
    meanNdvi: 0.620,
    sensor: 'Sentinel-2 MSI Harmonized L2A',
    passDate: `${presentYear}-09-14`,
    imageUrl: `/cache/thumbnails/${safePreset}_${presentYear}.png`
  };

  const leftImageUrl = pastData.imageUrl || `/cache/thumbnails/${safePreset}_${pastYear}.png`;
  const rightImageUrl = presentData.imageUrl || `/cache/thumbnails/${safePreset}_${presentYear}.png`;

  const deltaCover = (presentData.forestCoverPct - pastData.forestCoverPct).toFixed(1);
  const deltaNdvi = (presentData.meanNdvi - pastData.meanNdvi).toFixed(3);

  const latRad = ((center?.[0] || 35.20) * Math.PI) / 180;
  const n = Math.pow(2, 14);
  const tileX = Math.floor((((center?.[1] || 72.56) + 180) / 360) * n);
  const tileY = Math.floor(((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n);
  const centerTileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/14/${tileY}/${tileX}`;

  const handleOpenLiveView = (e) => {
    if (e) e.stopPropagation();
    setInspectedPoint({
      lat: center[0],
      lon: center[1],
      source: `${displayName} Present Composite`,
      category: 'Target Area Satellite Inspection',
      riskScore: 0.85,
      dndvi: -0.32,
      latestPassDate: presentData.passDate || '2026-09-14 (Sentinel-2 L2A)'
    });
    openLiveView();
  };

  return (
    <div className="bg-forest-card border border-forest-border rounded-2xl p-5 space-y-4 shadow-xl">
      {/* Header & Year Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-forest-border pb-3">
        <div>
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-guardian-400" />
            Interactive Before & After Temporal Swipe Slider
          </h3>
          <p className="text-xs text-slate-400">
            Compare any two independent satellite acquisitions for <strong>{displayName}</strong>. Drag slider to reveal changes.
          </p>
        </div>

        {/* Dual Year Selectors */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center space-x-1.5 bg-forest-dark px-3 py-1.5 rounded-xl border border-forest-border">
            <span className="text-slate-400 font-medium">Left (Baseline):</span>
            <select
              value={pastYear}
              onChange={(e) => {
                setIsLeftLoading(true);
                setPastYear(parseInt(e.target.value, 10));
                setTimeout(() => setIsLeftLoading(false), 200);
              }}
              className="bg-transparent text-white font-bold outline-none cursor-pointer"
            >
              {[2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025].map((y) => (
                <option key={y} value={y} className="bg-forest-dark text-white">
                  Year {y}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5 bg-forest-dark px-3 py-1.5 rounded-xl border border-forest-border">
            <span className="text-slate-400 font-medium">Right (Target):</span>
            <select
              value={presentYear}
              onChange={(e) => {
                setIsRightLoading(true);
                setPresentYear(parseInt(e.target.value, 10));
                setTimeout(() => setIsRightLoading(false), 200);
              }}
              className="bg-transparent text-white font-bold outline-none cursor-pointer"
            >
              {[2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026].map((y) => (
                <option key={y} value={y} className="bg-forest-dark text-white">
                  Year {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleOpenLiveView}
            className="px-3 py-1.5 rounded-xl bg-guardian-600 hover:bg-guardian-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all"
            title="Inspect present coordinate in high zoom Live View"
          >
            <Satellite className="w-3.5 h-3.5" /> Live View
          </button>
        </div>
      </div>

      {/* Swipe Canvas Container */}
      <div className="relative h-80 sm:h-96 w-full rounded-2xl overflow-hidden border border-forest-border shadow-inner select-none bg-forest-dark">
        {/* Left Layer: Past Year Baseline */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-300"
          style={{
            backgroundImage: `url('${leftImageUrl}'), url('${centerTileUrl}')`,
            filter: 'contrast(1.05) saturate(1.15)'
          }}
        >
          {isLeftLoading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-guardian-400 animate-spin" />
            </div>
          )}

          <div className="absolute top-3 left-3 bg-forest-dark/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-forest-border text-xs text-white shadow-lg pointer-events-none">
            <div className="font-bold flex items-center gap-1.5">
              <span>🌿 Baseline Year {pastYear}</span>
              <span className="text-guardian-300 font-mono font-normal">({pastData.forestCoverPct}% Canopy)</span>
            </div>
            <div className="text-[10px] text-slate-300 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3 text-guardian-400" />
              <span>Acquired: {pastData.passDate}</span>
              <span className="text-slate-400">&bull; {pastData.sensor?.split(' ')[0]} L2A</span>
            </div>
          </div>
        </div>

        {/* Right Layer: Present Year Target (CSS Clip-path) */}
        <div
          onClick={handleOpenLiveView}
          className="absolute inset-0 bg-cover bg-center transition-all duration-300 cursor-pointer group"
          style={{
            backgroundImage: `url('${rightImageUrl}'), url('${centerTileUrl}')`,
            filter: 'contrast(1.1) saturate(0.9)',
            clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)`
          }}
        >
          {isRightLoading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-red-400 animate-spin" />
            </div>
          )}

          {/* Slight disturbance tint overlay */}
          <div className="absolute inset-0 bg-red-950/20 mix-blend-multiply pointer-events-none" />

          {/* Right Badge */}
          <div className="absolute top-3 right-3 bg-red-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-red-500/40 text-xs text-white shadow-lg pointer-events-none">
            <div className="font-bold flex items-center gap-1.5 justify-end">
              <span>🚨 Target Year {presentYear}</span>
              <span className="text-red-200 font-mono font-normal">({presentData.forestCoverPct}% Canopy)</span>
            </div>
            <div className="text-[10px] text-red-200/90 flex items-center gap-1 justify-end mt-0.5">
              <Calendar className="w-3 h-3 text-red-300" />
              <span>Acquired: {presentData.passDate}</span>
              <span className="text-red-300/80">&bull; {presentData.sensor?.split(' ')[0]} L2A</span>
            </div>
          </div>

          {/* Live View Floating Action Trigger on Target Layer */}
          <div className="absolute bottom-3 right-3 z-20">
            <button
              onClick={handleOpenLiveView}
              className="px-3 py-1.5 rounded-xl bg-forest-dark/90 hover:bg-guardian-600 border border-guardian-500/50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xl transition-all"
            >
              <ZoomIn className="w-3.5 h-3.5 text-guardian-400" />
              <span>Click for Live View (Zoom 17)</span>
            </button>
          </div>
        </div>

        {/* Vertical Divider Line */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl cursor-ew-resize z-10 pointer-events-none"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-guardian-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white pointer-events-auto">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
        </div>

        {/* Range Input Overlay for Dragging */}
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPosition}
          onChange={(e) => setSliderPosition(parseFloat(e.target.value))}
          className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-20"
        />
      </div>

      {/* Metrics Delta Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
        <div className="bg-forest-dark p-3 rounded-xl border border-forest-border flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[11px]">Year {pastYear} Baseline</span>
            <span className="text-[10px] text-slate-400">{pastData.passDate}</span>
          </div>
          <span className="font-bold text-white font-mono text-sm">{pastData.forestCoverPct}%</span>
        </div>

        <div className="bg-forest-dark p-3 rounded-xl border border-forest-border flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[11px]">Year {presentYear} Target</span>
            <span className="text-[10px] text-slate-400">{presentData.passDate}</span>
          </div>
          <span className="font-bold text-white font-mono text-sm">{presentData.forestCoverPct}%</span>
        </div>

        <div className="bg-forest-dark p-3 rounded-xl border border-forest-border flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[11px]">Net Temporal Shift</span>
            <span className="text-[10px] text-slate-400">{presentYear - pastYear} Year Interval</span>
          </div>
          <span className={`font-bold font-mono text-sm ${deltaCover < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {deltaCover > 0 ? `+${deltaCover}` : deltaCover}% cover ({deltaNdvi > 0 ? `+${deltaNdvi}` : deltaNdvi} NDVI)
          </span>
        </div>
      </div>
    </div>
  );
}
