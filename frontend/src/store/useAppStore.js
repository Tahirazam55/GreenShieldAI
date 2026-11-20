import { create } from 'zustand';

export const useAppStore = create((set, get) => ({
  // Navigation
  activeTab: 'location',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Mode & GEE Status
  mode: 'DEMO',
  setMode: (mode) => set({ mode }),
  geeStatus: { connected: false, mode: 'High-Fidelity Demo Mode (Offline)', apiKeyPresent: true },
  setGeeStatus: (status) => set({ geeStatus: status }),

  // Presets & Active Location
  presets: {},
  setPresets: (presets) => set({ presets }),
  activePresetId: 'swat',
  locationName: 'Swat (Miandam / Kalam)',
  bbox: [72.50, 35.15, 72.62, 35.25],
  center: [35.20, 72.56],
  zoom: 13,

  setLocation: (presetId, meta) => {
    const nextJobId = presetId === 'custom' ? get().jobId : `demo_${presetId}`;
    set({
      activePresetId: presetId,
      locationName: meta.name,
      bbox: meta.bbox,
      center: meta.center,
      zoom: meta.zoom || 13,
      jobId: nextJobId
    });
    // Immediately synchronize analysis data so Live Map and Historical View match
    if (presetId && presetId !== 'custom') {
      get().fetchAnalysisResults(`demo_${presetId}`);
    }
  },

  selectPreset: (presetId) => {
    const meta = get().presets[presetId];
    if (meta) {
      get().setLocation(presetId, meta);
      get().startAnalysis(meta.bbox, presetId, meta.name);
    }
  },

  setCustomBbox: (bbox, center, name = 'Custom Region') => {
    set({
      bbox,
      center,
      locationName: name,
      activePresetId: 'custom'
    });
  },

  searchAndSelectPlace: (item) => {
    const name = item.shortName || item.name.split(',')[0].trim();
    get().setCustomBbox(item.bbox, [item.lat, item.lon], name);
    get().startAnalysis(item.bbox, 'custom', name);
  },

  analyzeCoordinate: (lat, lon, label = 'Inspected AOI') => {
    const dLat = 0.045;
    const dLon = 0.055;
    const bbox = [
      parseFloat((lon - dLon).toFixed(4)),
      parseFloat((lat - dLat).toFixed(4)),
      parseFloat((lon + dLon).toFixed(4)),
      parseFloat((lat + dLat).toFixed(4))
    ];
    get().setCustomBbox(bbox, [lat, lon], label);
    get().startAnalysis(bbox, 'custom', label);
  },

  // Active Analysis Payload
  jobId: 'demo_swat',
  analysisData: null,
  isAnalyzing: false,
  analysisProgress: 0,
  analysisStep: '',

  startAnalysis: async (bbox, presetId, locationName) => {
    set({ isAnalyzing: true, analysisProgress: 10, analysisStep: 'Connecting to satellite processing engine...' });

    try {
      const mode = get().mode;
      const resp = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bbox, presetId, locationName, mode })
      });
      const data = await resp.json();
      const jobId = data.jobId;
      set({ jobId });

      // Subscribe to SSE progress
      const eventSource = new EventSource(`/api/progress/${jobId}`);
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          set({
            analysisProgress: payload.progress,
            analysisStep: payload.step
          });

          if (payload.progress >= 100) {
            eventSource.close();
            get().fetchAnalysisResults(jobId);
          }
        } catch {}
      };

      eventSource.onerror = () => {
        eventSource.close();
        get().fetchAnalysisResults(jobId);
      };
    } catch (err) {
      console.error('Analysis failed:', err);
      // Fallback
      get().fetchAnalysisResults(`demo_${presetId}`);
    }
  },

  fetchAnalysisResults: async (jobId) => {
    try {
      const [statsRes, segRes, riskRes, fcRes] = await Promise.all([
        fetch(`/api/stats/${jobId}`).then(r => r.json()),
        fetch(`/api/segmentation/${jobId}`).then(r => r.json()),
        fetch(`/api/risk/${jobId}`).then(r => r.json()),
        fetch(`/api/forecast/${jobId}`).then(r => r.json())
      ]);

      set({
        jobId,
        analysisData: {
          timeSeries: statsRes.timeSeries,
          location: statsRes.location,
          polygonsGeoJSON: segRes.polygonsGeoJSON,
          stats: segRes.stats,
          gridGeoJSON: riskRes.gridGeoJSON,
          top10Priorities: riskRes.top10Priorities,
          featureImportances: riskRes.featureImportances,
          modelCard: riskRes.modelCard,
          forecast: fcRes.forecast
        },
        isAnalyzing: false,
        analysisProgress: 100
      });
    } catch (e) {
      console.warn('Failed to load full analysis, using demo fallback:', e);
      set({ isAnalyzing: false });
    }
  },

  // Layer Toggles
  layers: {
    forest_loss: true,
    vegetation_decline: true,
    burn_scar: true,
    regrowth: true,
    stable_forest: false,
    riskGrid: false
  },
  toggleLayer: (layerName) => {
    set((state) => ({
      layers: { ...state.layers, [layerName]: !state.layers[layerName] }
    }));
  },

  layerOpacity: 0.6,
  setLayerOpacity: (opacity) => set({ layerOpacity: opacity }),

  // Live View Drawer (Ensures only one drawer/modal open at a time)
  isLiveViewOpen: false,
  openLiveView: () => set({ isLiveViewOpen: true, isPatchHistoryOpen: false }),
  closeLiveView: () => set({ isLiveViewOpen: false }),

  // Patch History Modal (Requirement 4)
  isPatchHistoryOpen: false,
  patchHistoryData: null,
  isLoadingPatchHistory: false,

  openPatchHistory: async (patch) => {
    // Close other drawers/modals first
    set({
      isLiveViewOpen: false,
      isPatchHistoryOpen: true,
      isLoadingPatchHistory: true
    });

    try {
      const lat = patch?.lat ?? patch?.centroidLat ?? 35.1952;
      const lon = patch?.lon ?? patch?.centroidLon ?? 72.5641;
      const patchId = patch?.patchId ?? patch?.id ?? (patch?.rank ? `PATCH_00${patch.rank}` : 'HR-01');
      const category = patch?.category ?? patch?.source ?? 'High-Risk Disturbance';
      const jobId = get().jobId || 'demo_swat';

      const resp = await fetch(`/api/patch-history?lat=${lat}&lon=${lon}&patchId=${encodeURIComponent(patchId)}&category=${encodeURIComponent(category)}&jobId=${jobId}`);
      const data = await resp.json();

      if (data.success) {
        set({
          patchHistoryData: data.data,
          isLoadingPatchHistory: false
        });
      } else {
        set({ isLoadingPatchHistory: false });
      }
    } catch (err) {
      console.error('Failed to load patch history:', err);
      set({ isLoadingPatchHistory: false });
    }
  },

  closePatchHistory: () => set({ isPatchHistoryOpen: false, patchHistoryData: null }),

  inspectedPoint: {
    lat: 35.1952,
    lon: 72.5641,
    source: 'Swat Priority Disturbance Patch #1',
    category: 'Severe Disturbance / Cutting',
    riskScore: 0.85,
    dndvi: -0.34,
    areaHa: 4.8,
    latestPassDate: '2026-09-14 (Sentinel-2 L2A)'
  },
  setInspectedPoint: (point) => set({ inspectedPoint: point, isLiveViewOpen: true, isPatchHistoryOpen: false }),

  // Initial Boot
  fetchInitialData: async () => {
    try {
      const health = await fetch('/api/health').then(r => r.json());
      set({ geeStatus: health.earthEngine });

      const presets = await fetch('/api/presets').then(r => r.json());
      set({ presets: presets.data });

      // Preload Swat analysis
      get().fetchAnalysisResults('demo_swat');
    } catch (e) {
      console.warn('Error during boot:', e);
    }
  }
}));
