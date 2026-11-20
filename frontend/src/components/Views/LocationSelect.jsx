import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import MainMap from '../Map/MainMap';
import {
  Search,
  MapPin,
  Play,
  Trees,
  AlertTriangle,
  Compass,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function LocationSelect() {
  const {
    presets,
    activePresetId,
    selectPreset,
    setLocation,
    searchAndSelectPlace,
    locationName,
    bbox,
    startAnalysis,
    isAnalyzing
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Compute area in sq km
  const widthKm = ((bbox[2] - bbox[0]) * 92.0);
  const heightKm = ((bbox[3] - bbox[1]) * 111.0);
  const areaSqKm = Math.round(widthKm * heightKm);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const resp = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await resp.json();
      setSearchResults(data.results || []);
      if (!data.results || data.results.length === 0) {
        toast.error('No matching locations found in KP. Try Kalam, Kumrat, or Shogran.');
      }
    } catch {
      toast.error('Search service timeout, please select a preset.');
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (item) => {
    searchAndSelectPlace(item);
    setSearchResults([]);
    setSearchQuery('');
    toast.success(`Analyzing ${item.name.split(',')[0]}...`);
  };

  const handleRunAnalysis = () => {
    startAnalysis(bbox, activePresetId, locationName);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-forest-card to-guardian-950 border border-forest-border p-6 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-guardian-500/20 text-guardian-300 border border-guardian-500/30">
              <Trees className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-extrabold text-white">Area of Interest (AOI) Selection</h2>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl">
            Choose a protected forest division across Khyber Pakhtunkhwa or search any mountain valley to initiate multi-temporal Earth Observation intelligence.
          </p>
        </div>

        <button
          onClick={handleRunAnalysis}
          disabled={isAnalyzing}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-guardian-500 to-guardian-600 hover:from-guardian-400 hover:to-guardian-500 text-white font-extrabold text-sm flex items-center gap-2 shadow-lg hover:shadow-guardian-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-white" />
          Analyze {locationName}
        </button>
      </div>

      {/* Main Grid: Controls + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Controls Column */}
        <div className="lg:col-span-5 space-y-4">
          {/* Nominatim Place Search Box */}
          <div className="bg-forest-card border border-forest-border p-4 rounded-2xl shadow-sm space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-guardian-400" /> Search Place Name (KP)
            </h3>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Kalam, Kaghan, Nathia Gali, Kumrat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-forest-dark border border-forest-border rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-guardian-500 font-medium"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-4 py-2 bg-guardian-600 hover:bg-guardian-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                {isSearching ? '...' : 'Search'}
              </button>
            </form>

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="space-y-1 bg-forest-dark/95 border border-forest-border p-2 rounded-xl text-xs max-h-40 overflow-y-auto">
                {searchResults.map((res, i) => (
                  <button
                    key={i}
                    onClick={() => selectSearchResult(res)}
                    className="w-full text-left p-2 rounded-lg hover:bg-forest-card transition-all text-slate-200 truncate flex items-center gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5 text-guardian-400 shrink-0" />
                    <span className="truncate">{res.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Preset KP Forest Cards */}
          <div className="bg-forest-card border border-forest-border p-4 rounded-2xl shadow-sm space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-guardian-400" /> Preset Forest Reserves (KP)
              </span>
              <span className="text-[10px] text-slate-400 font-normal">6 Protected Divisions</span>
            </h3>

            <div className="grid grid-cols-1 gap-2 max-h-[320px] overflow-y-auto pr-1">
              {Object.values(presets || {}).map((p) => {
                const isSelected = activePresetId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => selectPreset(p.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-guardian-600/20 border-guardian-500 text-white shadow-md'
                        : 'bg-forest-dark/70 border-forest-border/80 text-slate-300 hover:bg-forest-dark hover:border-forest-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white">{p.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-forest-card text-guardian-300 font-medium">
                        {p.district}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{p.forestType}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Area Constraint Indicator */}
          <div className="bg-forest-dark border border-forest-border p-3.5 rounded-2xl text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Target Extent Area:</span>
              <span className="font-mono font-bold text-white">{areaSqKm} km² (~{areaSqKm * 100} ha)</span>
            </div>
            {areaSqKm > 400 && (
              <div className="text-amber-400 text-[11px] flex items-center gap-1.5 pt-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Selected area exceeds 400 km². Please narrow bounds for optimal response speed.
              </div>
            )}
          </div>
        </div>

        {/* Right Map Preview Column */}
        <div className="lg:col-span-7">
          <MainMap height="h-[520px]" />
        </div>
      </div>
    </div>
  );
}
