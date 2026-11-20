import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import {
  X,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  AlertTriangle,
  Compass,
  Send,
  ZoomIn,
  Clock,
  Sparkles
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function LiveViewDrawer() {
  const {
    isLiveViewOpen,
    closeLiveView,
    inspectedPoint,
    setActiveTab,
    openPatchHistory,
    analyzeCoordinate
  } = useAppStore();

  const [copied, setCopied] = useState(false);

  if (!inspectedPoint) return null;

  const latStr = inspectedPoint.lat.toFixed(6);
  const lonStr = inspectedPoint.lon.toFixed(6);

  const googleMapsUrl = `https://www.google.com/maps/@${latStr},${lonStr},18z/data=!3m1!1e3`;
  const googleEarthUrl = `https://earth.google.com/web/@${latStr},${lonStr},1500a,1000d,35y,0h,0t,0r`;
  const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latStr},${lonStr}`;

  const copyCoordinates = () => {
    navigator.clipboard.writeText(`${latStr}, ${lonStr}`);
    setCopied(true);
    toast.success('Coordinates copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDispatchRanger = () => {
    setActiveTab('verification');
    closeLiveView();
    toast.success('Target loaded into Field Verification form!');
  };

  const handleAnalyzeThisCoordinate = () => {
    if (analyzeCoordinate && inspectedPoint) {
      analyzeCoordinate(inspectedPoint.lat, inspectedPoint.lon, inspectedPoint.source || 'Inspected AOI');
      closeLiveView();
      toast.success(`Analyzing 10x10 km AOI around coordinate...`);
    }
  };

  const handleOpenPatchHistory = () => {
    openPatchHistory(inspectedPoint);
  };

  return (
    <AnimatePresence>
      {isLiveViewOpen && (
        <>
          {/* Mobile backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1900] sm:hidden"
            onClick={closeLiveView}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed inset-x-0 bottom-0 sm:inset-y-0 sm:right-0 sm:left-auto w-full sm:w-[480px] max-h-[88vh] sm:max-h-full bg-forest-dark border-t sm:border-t-0 sm:border-l border-forest-border shadow-2xl z-[2000] flex flex-col justify-between overflow-hidden rounded-t-3xl sm:rounded-none"
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-forest-border flex items-center justify-between bg-forest-card/90">
              <div className="flex items-center space-x-2.5">
                <span className="p-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
                  <Compass className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">Live Satellite View & Navigation</h3>
                  <p className="text-[11px] text-slate-400">High-Zoom Optical Inspection Panel</p>
                </div>
              </div>
              <button
                onClick={closeLiveView}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-forest-border transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Anomaly Metadata Card */}
              <div className="bg-forest-card border border-forest-border rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Flagged Anomaly</span>
                  <span className="text-[10px] bg-red-500/20 text-red-300 font-semibold px-2 py-0.5 rounded-full border border-red-500/30">
                    {inspectedPoint.category || 'Potential Disturbance'}
                  </span>
                </div>
                <h4 className="font-bold text-base text-white">{inspectedPoint.source || 'Inspected Coordinate'}</h4>

                {/* KPI Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="bg-forest-dark/80 p-2 rounded-lg border border-forest-border/60">
                    <span className="text-slate-400 block text-[10px]">Coordinates</span>
                    <code className="text-white font-mono font-bold text-xs">{latStr}, {lonStr}</code>
                  </div>
                  <div className="bg-forest-dark/80 p-2 rounded-lg border border-forest-border/60">
                    <span className="text-slate-400 block text-[10px]">Vulnerability Risk</span>
                    <span className="text-red-400 font-bold text-xs">{((inspectedPoint.riskScore || 0.85) * 100).toFixed(0)}% (High Risk)</span>
                  </div>
                  <div className="bg-forest-dark/80 p-2 rounded-lg border border-forest-border/60">
                    <span className="text-slate-400 block text-[10px]">Spectral dNDVI</span>
                    <span className="text-amber-400 font-mono font-bold text-xs">{inspectedPoint.dndvi ? (inspectedPoint.dndvi > 0 ? `+${inspectedPoint.dndvi}` : inspectedPoint.dndvi) : '-0.34'}</span>
                  </div>
                  <div className="bg-forest-dark/80 p-2 rounded-lg border border-forest-border/60">
                    <span className="text-slate-400 block text-[10px]">Latest Pass</span>
                    <span className="text-emerald-400 font-medium text-xs flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {inspectedPoint.latestPassDate || '2026-09-14'}
                    </span>
                  </div>
                </div>

                {/* Requirement 4: "View Past Images" Button in Details Drawer */}
                <button
                  onClick={handleOpenPatchHistory}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-forest-dark hover:bg-forest-dark/70 text-xs font-semibold text-guardian-300 border border-guardian-500/40 transition-all shadow group"
                >
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-guardian-400 group-hover:rotate-45 transition-transform" />
                    View Past Images (10yr &bull; 5yr &bull; Projections)
                  </span>
                  <span className="text-[10px] bg-guardian-500/20 text-guardian-300 px-2 py-0.5 rounded font-mono">
                    Time-Compare &rarr;
                  </span>
                </button>
              </div>

              {/* Embedded Live High-Zoom Satellite Map */}
              <div className="rounded-xl overflow-hidden border border-forest-border shadow-inner bg-forest-dark">
                <div className="bg-forest-card px-3 py-1.5 flex items-center justify-between border-b border-forest-border text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 font-semibold text-[11px]">
                    <ZoomIn className="w-3.5 h-3.5 text-guardian-400" /> Embedded Zoom 17 (Esri Clarity)
                  </span>
                  <span className="text-[10px] text-slate-400">10m Ground Resolution</span>
                </div>
                <div className="h-48 w-full relative">
                  <MapContainer
                    center={[inspectedPoint.lat, inspectedPoint.lon]}
                    zoom={17}
                    scrollWheelZoom={false}
                    className="h-full w-full"
                    zoomControl={false}
                  >
                    <TileLayer
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                      attribution="Esri World Imagery"
                      maxZoom={19}
                    />
                    <TileLayer
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                      maxZoom={19}
                    />
                    <Marker position={[inspectedPoint.lat, inspectedPoint.lon]} icon={customIcon}>
                      <Popup>
                        <div className="text-xs">
                          <strong>Inspected Site</strong><br />
                          {latStr}, {lonStr}
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </div>

              {/* Direct Deep-Links */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1 block">
                  External Real-Time Satellite Viewers
                </span>

                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-forest-card hover:bg-forest-border text-xs font-semibold text-white border border-forest-border transition-all"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">M</span>
                    Open in Google Maps (Satellite View)
                  </span>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </a>

                <a
                  href={googleEarthUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-forest-card hover:bg-forest-border text-xs font-semibold text-white border border-forest-border transition-all"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">E</span>
                    Open in Google Earth (3D Web)
                  </span>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </a>

                <a
                  href={streetViewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-forest-card hover:bg-forest-border text-xs font-semibold text-white border border-forest-border transition-all"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">S</span>
                    Open Google Street View / Photosphere
                  </span>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </a>

                <button
                  onClick={copyCoordinates}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-forest-dark hover:bg-forest-card text-xs font-semibold text-slate-300 border border-forest-border transition-all"
                >
                  <span className="flex items-center gap-2">
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    Copy Latitude & Longitude
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">{latStr}, {lonStr}</span>
                </button>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-forest-border bg-forest-card/90 space-y-2">
              <button
                onClick={handleAnalyzeThisCoordinate}
                className="w-full py-2 px-4 rounded-xl bg-forest-dark hover:bg-forest-border text-guardian-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 border border-forest-border transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-guardian-400" />
                Analyze 10x10 km Area Around Site
              </button>
              <button
                onClick={handleDispatchRanger}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-guardian-600 to-guardian-700 hover:from-guardian-500 hover:to-guardian-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <Send className="w-4 h-4" />
                Dispatch Ranger Patrol & Log Verification
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
