import React from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  MapPin,
  Clock,
  Layers,
  Sparkles,
  ClipboardCheck,
  FileText,
  Sliders,
  ExternalLink,
  Eye,
  Crosshair
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'location', label: '1. Location Select', icon: MapPin },
  { id: 'historical', label: '2. Historical Archive', icon: Clock },
  { id: 'segmentation', label: '3. Affected Areas', icon: Layers },
  { id: 'prediction', label: '4. Future Prediction', icon: Sparkles },
  { id: 'verification', label: '5. Field Verification', icon: ClipboardCheck },
  { id: 'about', label: '6. Methodology & Export', icon: FileText }
];

export default function Sidebar() {
  const {
    activeTab,
    setActiveTab,
    locationName,
    bbox,
    layers,
    toggleLayer,
    layerOpacity,
    setLayerOpacity,
    openLiveView,
    inspectedPoint
  } = useAppStore();

  return (
    <aside className="w-64 border-r border-forest-border bg-forest-dark/95 flex flex-col justify-between p-4 z-20 overflow-y-auto">
      <div className="space-y-6">
        {/* Active Region Card */}
        <div className="bg-forest-card/90 border border-forest-border rounded-xl p-3 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-guardian-400">Active AOI</span>
            <span className="text-[10px] bg-guardian-500/10 text-guardian-300 px-1.5 py-0.5 rounded border border-guardian-500/20">~100 km²</span>
          </div>
          <h2 className="font-bold text-sm text-white truncate">{locationName}</h2>
          <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">
            [{bbox.map((v) => v.toFixed(2)).join(', ')}]
          </p>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-2">
            Analysis Views
          </span>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-guardian-600 to-guardian-700 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-forest-card'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-guardian-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Layer Controls & Opacity (Always Accessible) */}
        <div className="bg-forest-card/60 border border-forest-border rounded-xl p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-guardian-400" /> Map Layers
            </span>
            <span className="text-[10px] text-slate-400 font-mono">{Math.round(layerOpacity * 100)}% Opacity</span>
          </div>

          {/* Opacity Slider */}
          <input
            type="range"
            min="0.2"
            max="1.0"
            step="0.05"
            value={layerOpacity}
            onChange={(e) => setLayerOpacity(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-forest-border rounded-lg appearance-none cursor-pointer accent-guardian-500"
          />

          {/* Layer Checkboxes */}
          <div className="space-y-1.5 text-xs">
            <label className="flex items-center space-x-2 cursor-pointer text-slate-200 hover:text-white">
              <input
                type="checkbox"
                checked={layers.forest_loss}
                onChange={() => toggleLayer('forest_loss')}
                className="rounded border-forest-border text-red-500 focus:ring-0 accent-red-500"
              />
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Forest Loss (dNDVI &lt; -0.25)
              </span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer text-slate-200 hover:text-white">
              <input
                type="checkbox"
                checked={layers.vegetation_decline}
                onChange={() => toggleLayer('vegetation_decline')}
                className="rounded border-forest-border text-amber-500 focus:ring-0 accent-amber-500"
              />
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Canopy Decline
              </span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer text-slate-200 hover:text-white">
              <input
                type="checkbox"
                checked={layers.burn_scar}
                onChange={() => toggleLayer('burn_scar')}
                className="rounded border-forest-border text-purple-900 focus:ring-0 accent-purple-800"
              />
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3D1308] border border-orange-500"></span> Burn Scars (FIRMS)
              </span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer text-slate-200 hover:text-white">
              <input
                type="checkbox"
                checked={layers.regrowth}
                onChange={() => toggleLayer('regrowth')}
                className="rounded border-forest-border text-teal-400 focus:ring-0 accent-teal-400"
              />
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span> Regrowth / Plantation
              </span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer text-slate-200 hover:text-white">
              <input
                type="checkbox"
                checked={layers.riskGrid}
                onChange={() => toggleLayer('riskGrid')}
                className="rounded border-forest-border text-cyan-400 focus:ring-0 accent-cyan-400"
              />
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-red-500 via-amber-500 to-green-500"></span> 1km Risk Heatmap
              </span>
            </label>
          </div>
        </div>

        {/* Live Inspection Drawer Trigger */}
        <button
          onClick={openLiveView}
          className="w-full py-2.5 px-3 rounded-xl bg-forest-card hover:bg-forest-border/80 border border-guardian-500/30 text-xs font-semibold text-guardian-300 flex items-center justify-between transition-all group"
        >
          <span className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-guardian-400 group-hover:rotate-45 transition-transform" />
            Live View Panel
          </span>
          <span className="text-[10px] bg-guardian-500/20 text-guardian-300 px-1.5 py-0.5 rounded font-mono">
            {inspectedPoint ? `${inspectedPoint.lat.toFixed(2)}, ${inspectedPoint.lon.toFixed(2)}` : 'Click Map'}
          </span>
        </button>
      </div>

      {/* Footer Branding */}
      <div className="pt-4 border-t border-forest-border/70 text-[11px] text-slate-400 text-center">
        <p className="font-semibold text-slate-300">GreenShieldAI</p>
        <p className="text-[10px]">Autonomous Earth Observation</p>
      </div>
    </aside>
  );
}
