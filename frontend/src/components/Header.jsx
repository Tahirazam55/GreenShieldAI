import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Trees, ShieldCheck, Activity, Globe, Zap, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Header() {
  const {
    geeStatus,
    mode,
    setMode,
    presets,
    activePresetId,
    setLocation,
    fetchAnalysisResults,
    startAnalysis
  } = useAppStore();

  const handlePresetSelect = (id) => {
    const meta = presets[id];
    if (meta) {
      setLocation(id, meta);
      startAnalysis(meta.bbox, id, meta.name);
    }
  };

  return (
    <header className="h-16 border-b border-forest-border bg-forest-dark/90 backdrop-blur-md px-6 flex items-center justify-between z-30 sticky top-0 shadow-lg">
      {/* Brand */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-guardian-500 to-forest-card border border-guardian-400/40 flex items-center justify-center shadow-md">
          <Trees className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
              GreenShieldAI
            </h1>
            <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-guardian-500/20 text-guardian-300 border border-guardian-500/30">
              v1.0 Pro
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Predict &bull; Detect &bull; Protect</p>
        </div>
      </div>

      {/* Preset Quick Chooser */}
      <div className="hidden md:flex items-center space-x-1.5 bg-forest-card/80 border border-forest-border/80 px-2.5 py-1 rounded-xl">
        <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
          <Globe className="w-3.5 h-3.5 text-guardian-400" /> Presets:
        </span>
        {Object.values(presets || {}).slice(0, 4).map((p) => (
          <button
            key={p.id}
            onClick={() => handlePresetSelect(p.id)}
            className={`text-xs px-2.5 py-1 rounded-lg transition-all font-medium ${
              activePresetId === p.id
                ? 'bg-guardian-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-forest-border/50'
            }`}
          >
            {p.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Mode & GEE Status Badges */}
      <div className="flex items-center space-x-3">
        {/* Mode Switcher */}
        <div className="flex items-center bg-forest-card border border-forest-border rounded-xl p-0.5 text-xs">
          <button
            onClick={() => setMode('DEMO')}
            className={`px-3 py-1 rounded-lg transition-all font-semibold flex items-center gap-1 ${
              mode === 'DEMO'
                ? 'bg-guardian-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3 h-3 text-amber-300" /> Demo Mode
          </button>
          <button
            onClick={() => setMode('LIVE')}
            className={`px-3 py-1 rounded-lg transition-all font-semibold flex items-center gap-1 ${
              mode === 'LIVE'
                ? 'bg-guardian-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3 h-3 text-cyan-300" /> Live GEE
          </button>
        </div>

        {/* GEE Health Badge */}
        <div
          title={geeStatus?.error || 'Earth Engine Client status'}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border bg-forest-card/70 text-xs"
        >
          {geeStatus?.connected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-emerald-300 font-semibold hidden lg:inline">GEE Connected</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-amber-300 font-semibold hidden lg:inline">High-Fidelity Demo Cache</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
