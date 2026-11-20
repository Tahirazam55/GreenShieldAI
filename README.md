# 🌲 GreenShieldAI
### *Predict. Detect. Protect.*
**Autonomous Earth Observation & Ecological Defense Platform**  
**Tech Stack: 100% JavaScript (Node.js 20+ Express Backend + React 18 & Vite Frontend)**

---

## 🌟 Executive Summary

**GreenShieldAI** is an autonomous full-stack Earth Observation & AI forest intelligence platform engineered to transition environmental protection from slow, reactive inspections to **predictive, automated intelligence**.

Operating on a high-speed **Node.js** backend coupled with an interactive **React + TailwindCSS + Leaflet** frontend, the system delivers:

1. **Multi-Temporal Satellite Archive (2018 – 2026)**: Cloud-masked Sentinel-2 (SCL filter) and Landsat dry-season composites with dedicated annual high-resolution satellite composites.
2. **Interactive Before & After Swipe Slider**: Compare two independent years (Left = baseline past year, Right = target present year) with distinct optical imagery, acquisition dates, and net cover shift calculation.
3. **Automated Disturbance Segmentation**: Vector polygons classified into **Severe Disturbance / Cutting** (Red), **Vegetation Decline** (Orange), **Burn Scars / Fire** (Dark Purple), and **Regrowth** (Cyan), strictly labeled with compliance phrasing: *"Notice: Detections represent potential disturbance requiring field verification"*.
4. **Decadal Patch Observation ("View Past Images")**: Inspect high-risk patches with a dedicated time-compare modal:
   - **Past**: 10 Years Ago (2016 Landsat 8 OLI) and 5 Years Ago (2021 Sentinel-2 MSI).
   - **Present**: 2026 Sentinel-2 optical pass.
   - **Future Projections**: +5 Years (2031) and +10 Years (2036) degradation simulations labeled *"Estimated projection, not a real image"*.
   - **Patch Micro Timeline**: Dedicated Recharts trajectory tracking historical canopy cover and spectral vegetation indices.
5. **Predictive 1km Risk Heatmap (Next 12 Months)**: Evaluated using **Held-out Spatial Block Cross-Validation** (ROC-AUC ~0.892, PR-AUC ~0.841) with native **Tree SHAP** feature attributions.
6. **5-Year Canopy Cover Forecast**: Statistical regression with 95% confidence interval uncertainty bands.
7. **Live Satellite View & Navigation Deep-Links**: Embedded high-zoom satellite maps (Zoom 17) plus 1-click external navigation into **Google Maps Satellite**, **Google Earth 3D Web**, and **Google Street View / Photosphere**.
8. **Ranger Field Verification & SQLite Feedback Loop**: Field officers log photo evidence, stump counts, and false-alarm validations into SQLite (`data/verification.db`), continuously improving retraining data.
9. **Executive Reporting & Export**: Standalone downloadable **PDF Executive Audit Report** and **GeoJSON Polygons** export.

---

## 🏗️ Monorepo Architecture

```text
├── package.json                 # Monorepo scripts (dev, test, precompute)
├── .env.example / .env          # Environment configuration
├── .gitignore                   # Excludes keys/, node_modules, and .env
├── README.md                    # System documentation
├── DEMO_SCRIPT.md               # 5-minute live demonstration script
├── backend/
│   ├── package.json             # Express, @google/earthengine, better-sqlite3, pdfkit
│   ├── server.js                # Express app entrypoint (Port 5000)
│   ├── config.js                # Presets, bounding boxes, thresholds, colors
│   ├── routes/
│   │   ├── api.js               # Endpoints (imagery, compare, patch-history, segmentation, risk)
│   │   ├── verify.js            # SQLite verification routes with multer photo upload
│   │   └── report.js            # Standalone PDF report generator via PDFKit
│   ├── services/
│   │   ├── geeClient.js         # Earth Engine authentication & status monitor
│   │   ├── analysisEngine.js    # Multi-temporal composites & decadal patch history
│   │   ├── riskModel.js         # 1km grid generation, risk scoring & Tree SHAP
│   │   ├── forecastEngine.js    # 5-year regression forecast & 95% confidence bands
│   │   └── cacheService.js      # Disk cache & node-cache memory loader
│   ├── db/
│   │   └── database.js          # SQLite setup for ranger verification logs
│   ├── cache/                   # Precomputed GeoJSON & JSON cache for preset regions
│   └── scripts/
│       └── precompute.js        # Offline precomputation runner
└── frontend/
    ├── package.json             # React 18, Vite, TailwindCSS, Leaflet, Recharts, Framer Motion
    ├── vite.config.js           # Vite dev server with proxy /api -> http://localhost:5000
    ├── tailwind.config.js       # Dark-green forest theme styling
    ├── index.html               # Leaflet CSS & Google Fonts
    └── src/
        ├── main.jsx             # React entrypoint
        ├── App.jsx              # Main shell with navigation & live drawer
        ├── store/
        │   └── useAppStore.js   # Zustand state management
        ├── components/
        │   ├── Header.jsx       # Branding, GEE health indicator & demo switcher
        │   ├── Sidebar.jsx      # Navigation, layer toggles & opacity controls
        │   ├── LiveViewDrawer.jsx # High-zoom satellite & deep-links drawer (responsive)
        │   ├── ProgressModal.jsx # SSE animated pipeline progress modal
        │   ├── Common/
        │   │   └── PlaceSearchBar.jsx # Nominatim place search with autocomplete
        │   ├── Modals/
        │   │   └── PatchHistoryModal.jsx # 10yr/5yr/present/projections time-compare
        │   ├── Map/
        │   │   ├── MainMap.jsx  # Interactive Leaflet map with vector overlays & popups
        │   │   └── SwipeSlider.jsx # Before/After comparison swipe canvas
        │   └── Views/
        │       ├── LocationSelect.jsx # Preset cards, search, draw tool
        │       ├── HistoricalView.jsx # 2018-present gallery, slider, place search
        │       ├── SegmentationView.jsx # Disturbance polygons, stats, Top-10 table
        │       ├── PredictionView.jsx # 1km risk heatmap, 5-yr forecast, SHAP
        │       ├── VerificationView.jsx # Ranger photo upload, SQLite audit table
        │       └── AboutView.jsx # Pipeline diagram, datasets & PDF download
```

---

## ⚡ Quick Start & Run

### 1. Launch Development Server
```powershell
npm run dev
```
This starts concurrently:
- **Backend API Server** on **`http://localhost:5000`**
- **Frontend React UI** on **`http://localhost:5173`**

Open browser to: 👉 **`http://localhost:5173`**

### 2. Run Automated Tests
```powershell
npm test
```
Executes all backend unit test suites using the Node.js test runner.

---

## 🌲 Preset Forest Locations

| Forest Reserve | District | Forest Type | Bounding Box (~100 km²) |
| :--- | :--- | :--- | :--- |
| **Swat (Miandam / Kalam)** | Swat | Himalayan Moist Temperate Conifer | `[72.50, 35.15, 72.62, 35.25]` |
| **Abbottabad / Galyat** | Abbottabad | Moist Pine & Broadleaf | `[73.33, 34.02, 73.43, 34.12]` |
| **Upper Dir (Kumrat Valley)**| Upper Dir | Sub-Alpine Deodar & Spruce | `[72.15, 35.48, 72.27, 35.58]` |
| **Chitral (Chitral Gol NP)** | Chitral | Dry Temperate Oak & Juniper | `[71.68, 35.85, 71.78, 35.95]` |
| **Kohistan (Dassu / Pattan)**| Kohistan | Indus Gorge Conifer Stand | `[73.15, 35.20, 73.27, 35.30]` |
| **Mansehra (Shogran / Kaghan)**| Mansehra | Kaghan Moist Temperate Spruce | `[73.43, 34.60, 73.55, 34.70]` |
