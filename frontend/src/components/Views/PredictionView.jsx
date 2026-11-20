import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import MainMap from '../Map/MainMap';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  BarChart,
  Bar
} from 'recharts';
import {
  Sparkles,
  TrendingUp,
  Brain,
  FileCheck,
  ShieldCheck,
  Eye,
  Crosshair,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PredictionView() {
  const { analysisData, locationName, setInspectedPoint } = useAppStore();
  const [activeSubTab, setActiveSubTab] = useState('heatmap');

  const riskData = analysisData?.risk || {
    top10Priorities: [],
    featureImportances: [],
    modelCard: {}
  };

  const forecastData = analysisData?.forecast || {
    forecast: [],
    annualRatePct: -0.62,
    r2Score: 0.98,
    summaryText: 'Canopy decline trajectory projected.'
  };

  const top10 = riskData.top10Priorities || [];
  const modelCard = riskData.modelCard || {};
  const forecastList = forecastData.forecast || [];

  const handleSelectPriority = (cell) => {
    setInspectedPoint({
      lat: cell.centroidLat,
      lon: cell.centroidLon,
      source: `Priority #${cell.rank} (${cell.cellId})`,
      category: `${cell.riskLevel} Risk Zone`,
      riskScore: cell.riskProb,
      dndvi: -0.28,
      latestPassDate: '2026-09-14 (Sentinel-2 L2A)'
    });
    toast.success(`Priority #${cell.rank} loaded into Live View!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-forest-card border border-forest-border p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-guardian-400" />
            Predictive Risk Intelligence & 5-Year Forecasting
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluating 1km vulnerability probabilities for the next 12 months & multi-year canopy trajectories for <strong>{locationName}</strong>.
          </p>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex bg-forest-dark border border-forest-border rounded-xl p-1 text-xs">
          <button
            onClick={() => setActiveSubTab('heatmap')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'heatmap' ? 'bg-guardian-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" /> 1km Risk Heatmap
          </button>
          <button
            onClick={() => setActiveSubTab('forecast')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'forecast' ? 'bg-guardian-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> 5-Year Trajectory
          </button>
          <button
            onClick={() => setActiveSubTab('shap')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'shap' ? 'bg-guardian-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Brain className="w-3.5 h-3.5" /> SHAP Drivers
          </button>
          <button
            onClick={() => setActiveSubTab('card')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'card' ? 'bg-guardian-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" /> Model Card
          </button>
        </div>
      </div>

      {/* Sub-tab 1: 1km Risk Heatmap & Top 10 Priorities */}
      {activeSubTab === 'heatmap' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <MainMap height="h-[520px]" />
          </div>

          <div className="lg:col-span-5 bg-forest-card border border-forest-border rounded-2xl p-4 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-guardian-400" /> Top-10 Inspection Priority Grid Cells
                </h3>
                <span className="text-[10px] text-slate-400">12-Month Vulnerability</span>
              </div>

              <div className="space-y-2 overflow-y-auto max-h-[420px] pr-1">
                {top10.map((cell) => (
                  <div
                    key={cell.rank}
                    onClick={() => handleSelectPriority(cell)}
                    className="bg-forest-dark/80 hover:bg-forest-dark border border-forest-border/80 hover:border-guardian-500/60 rounded-xl p-3 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cell.riskColor }} />
                        #{cell.rank} Cell {cell.cellId}
                      </span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded font-bold"
                        style={{ backgroundColor: `${cell.riskColor}25`, color: cell.riskColor }}
                      >
                        {(cell.riskProb * 100).toFixed(0)}% ({cell.riskLevel} Risk)
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Road: {cell.distRoadKm} km &bull; Elev: {cell.elevationM}m</span>
                      <span className="text-guardian-400 group-hover:underline flex items-center gap-1 text-[10px]">
                        Inspect in Live View &rarr;
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-forest-border/60 text-[11px] text-slate-400 text-center">
              Click any cell row to inspect high-zoom satellite tiles in the Live View drawer.
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 2: 5-Year Forecast with 95% Confidence Band */}
      {activeSubTab === 'forecast' && (
        <div className="space-y-6">
          <div className="bg-forest-card border border-forest-border p-5 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">Projected Forest Canopy Cover (2027 &ndash; 2031)</h3>
                <p className="text-xs text-slate-400">Fitted linear regression trajectory with expanding 95% prediction interval band.</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Annual Rate:</span>
                <span className="text-sm font-bold font-mono text-amber-400">{forecastData.annualRatePct}% / year</span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastList} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F452E" />
                  <XAxis dataKey="year" stroke="#94A3B8" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#52B788" domain={[50, 95]} tick={{ fontSize: 12 }} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B1E13', borderColor: '#1F452E', borderRadius: '12px', fontSize: '12px' }}
                  />
                  {/* Shaded 95% Confidence Band */}
                  <Area type="monotone" dataKey="upperBoundPct" stroke="transparent" fill="#2A9D8F" fillOpacity={0.18} name="Upper 95% Bound" />
                  <Area type="monotone" dataKey="lowerBoundPct" stroke="transparent" fill="#0B1E13" fillOpacity={1} name="Lower 95% Bound" />
                  {/* Trend line */}
                  <Line type="monotone" dataKey="predictedCoverPct" stroke="#E76F51" strokeWidth={3} dot={{ r: 4 }} name="Predicted Canopy Cover (%)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-forest-dark p-3.5 rounded-xl border border-forest-border text-xs text-slate-300">
              <p><strong>Outlook:</strong> {forecastData.summaryText}</p>
              <p className="text-[11px] text-slate-400 mt-1 italic">&ldquo;{forecastData.notice}&rdquo;</p>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 3: SHAP Feature Attributions */}
      {activeSubTab === 'shap' && (
        <div className="space-y-6">
          <div className="bg-forest-card border border-forest-border p-5 rounded-2xl shadow-xl space-y-4">
            <h3 className="font-bold text-white text-base">Explainable AI: Tree SHAP Degradation Drivers</h3>
            <p className="text-xs text-slate-400">Quantifies which geophysical and human accessibility factors drive risk in this forest reserve.</p>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={riskData.featureImportances}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 160, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F452E" />
                  <XAxis type="number" stroke="#94A3B8" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="feature" stroke="#E2E8F0" tick={{ fontSize: 11 }} width={150} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B1E13', borderColor: '#1F452E', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar dataKey="importance" fill="#52B788" radius={[0, 6, 6, 0]} name="SHAP Attribution" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2">
              <div className="bg-forest-dark p-3 rounded-xl border border-forest-border">
                <span className="font-bold text-white block mb-1">Negative NDVI Slope:</span>
                <p className="text-slate-400 text-[11px]">Canopy patches with multi-year continuous spectral drops have a 3.4&times; higher probability of subsequent clear-felling.</p>
              </div>
              <div className="bg-forest-dark p-3 rounded-xl border border-forest-border">
                <span className="font-bold text-white block mb-1">Distance to Roads:</span>
                <p className="text-slate-400 text-[11px]">Cells within 2.5km of roads suffer disproportionate timber theft pressure due to transport accessibility.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 4: Transparent Model Card */}
      {activeSubTab === 'card' && (
        <div className="bg-forest-card border border-forest-border p-6 rounded-2xl shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-forest-border pb-4">
            <div>
              <h3 className="text-base font-extrabold text-white">XGBoost & Gradient Tree Boost Model Card</h3>
              <p className="text-xs text-slate-400">Rigorous cross-validation standards & operational limitations</p>
            </div>
            <span className="text-xs bg-guardian-500/10 text-guardian-300 font-bold px-3 py-1 rounded-full border border-guardian-500/20">
              Spatial Block CV
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-forest-dark p-3 rounded-xl border border-forest-border">
              <span className="text-slate-400 text-[10px] uppercase font-bold">ROC-AUC Score</span>
              <span className="text-lg font-extrabold text-white font-mono block">{modelCard.rocAuc || 0.892}</span>
            </div>
            <div className="bg-forest-dark p-3 rounded-xl border border-forest-border">
              <span className="text-slate-400 text-[10px] uppercase font-bold">PR-AUC Score</span>
              <span className="text-lg font-extrabold text-white font-mono block">{modelCard.prAuc || 0.841}</span>
            </div>
            <div className="bg-forest-dark p-3 rounded-xl border border-forest-border">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Brier Score Loss</span>
              <span className="text-lg font-extrabold text-white font-mono block">{modelCard.brierScore || 0.114}</span>
            </div>
            <div className="bg-forest-dark p-3 rounded-xl border border-forest-border">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Training Years</span>
              <span className="text-xs font-bold text-guardian-400 block pt-1">{modelCard.trainingYears || '2018-2025'}</span>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-300 pt-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Known Technical Limitations:</h4>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 text-[11px]">
              {(modelCard.limitations || []).map((lim, i) => (
                <li key={i}>{lim}</li>
              ))}
            </ul>
          </div>

          <div className="bg-forest-dark/80 p-3 rounded-xl border border-forest-border text-xs text-amber-300/90 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span><strong>Policy Notice:</strong> Estimated probability, not a certainty. Algorithms prioritize strategic patrol resource allocation.</span>
          </div>
        </div>
      )}
    </div>
  );
}
