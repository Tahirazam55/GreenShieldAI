# 🌲 GreenShieldAI — 5-Minute Live Demonstration Script
### *Predict. Detect. Protect.*
**Frontend App URL: `http://localhost:5173` | Backend API: `http://localhost:5000`**

---

### ⏱️ Quick Summary Timing Table
| Minute | Section | Primary Visual / Action | Key Speaking Point |
| :---: | :--- | :--- | :--- |
| **0:00 – 1:00** | **Introduction & AOI Selection** | View 1: Location Select | *"Mountainous terrain makes physical inspection of millions of hectares impossible; GreenShieldAI replaces slow manual patrols with predictive AI intelligence."* |
| **1:00 – 2:00** | **Historical Comparison (2018–2026)** | View 2: Split Swipe Slider & Place Search | *"Multi-temporal cloud-masked archive reveals progressive canopy loss; drag slider to compare any two years with distinct imagery; switch location or search any valley on the fly."* |
| **2:00 – 3:00** | **Disturbance Segmentation & Decadal Patch History** | View 3: Vector Polygons & Modal | *"Morphological filters isolate contiguous disturbance patches; click 'View past images' on high-risk patches to inspect 10-year Landsat 8, 5-year Sentinel-2, and +5/+10 year future simulations."* |
| **3:00 – 4:00** | **Future Risk & 5-Year Forecast** | View 4: 1km Risk & SHAP | *"Gradient Tree Boost predicts next 12-month vulnerability with honest Spatial Block CV (0.892 ROC-AUC); SHAP explains top drivers."* |
| **4:00 – 5:00** | **Live View, Field Feedback & Audit** | Drawer, View 5 & 6 | *"Embedded Zoom 17 satellite inspection, 1-click Google Maps/Earth deep-links, SQLite ranger log feedback, and downloadable PDF report."* |

---

## 🎬 Minute-by-Minute Demonstration Steps

### Minute 0:00 – 1:00 | Setting the Stage & Selecting AOI (View 1)
1. **Screen:** Open **`http://localhost:5173`** in your browser.
2. **Action:**
   - In the top header, highlight the **`High-Fidelity Demo Cache`** badge (demonstrating 100% offline resilience with zero latency).
   - In the preset bar, select **`Swat (Miandam / Kalam)`**.
   - Show the Esri satellite basemap and target 10 $\times$ 10 km bounding box.
   - Click **`Analyze Swat (Miandam / Kalam)`**. Show the animated Server-Sent Events (SSE) progress modal.
3. **Speaking Points:**
   > *"Welcome. Mountainous forest reserves are vital ecological buffers, yet rugged topography makes physical inspection of large areas unfeasible. **GreenShieldAI** is an autonomous Earth Observation and AI intelligence platform that detects canopy loss, predicts 12-month degradation risk, and forecasts multi-year trajectories."*

---

### Minute 1:00 – 2:00 | Multi-Temporal Archive, Location Switcher & Split Swipe Slider (View 2)
1. **Action:** Click **`2. Historical Archive`** in the left sidebar.
2. **Demonstration:**
   - Show the **Location selector** and **Place Search box** at the top of the tab.
   - On the **Swipe Slider**, select Left Year (e.g. 2018) and Right Year (e.g. 2026). Drag the central slider handle horizontally across the screen to reveal the distinct optical layers.
   - Click the **Live View** button on the present image side to immediately open the Zoom 17 optical inspection drawer.
   - Switch to the **Annual Gallery** sub-tab to show all 9 annual composites (2018 to 2026) with authentic acquisition dates and sensor labels.
   - Switch to **Statistical Trajectories** to show the Recharts line chart of Mean NDVI and Canopy Cover decline.
3. **Speaking Points:**
   > *"In View 2, our dry-season median composites filter cloud and seasonal variations. The user can switch locations or search any place directly from this tab. Notice the swipe slider loads distinct imagery for both years, showing visible canopy degradation with accurate acquisition dates."*

---

### Minute 2:00 – 3:00 | Disturbance Segmentation & Decadal Patch Time-Compare (View 3)
1. **Action:** Click **`3. Affected Areas`** in the sidebar.
2. **Demonstration:**
   - Notice the **Place Search** box at the top.
   - Point out the color-coded vector polygons:
     - 🔴 **Red:** Forest Loss ($dNDVI < -0.25$)
     - 🟠 **Orange:** Vegetation Decline / Thinning
     - ⚫ **Dark Purple:** Burn Scar ($dNBR > 0.27$ + FIRMS)
     - 🔵 **Cyan:** Regrowth / Plantation
   - Adjust the **Opacity Slider** in the sidebar.
   - Point out the compliance notice: *"Notice: Detections represent potential disturbance requiring field verification"*.
   - In the **Top 10 Priority Table** or on the map popup, click **`View past images`** on Patch #1.
   - **Show the Patch Time-Compare Modal**:
     - Toggle between **10 Years Ago (2016 Landsat 8)** and **5 Years Ago (2021 Sentinel-2)** vs **Present (2026 Sentinel-2)**.
     - Toggle **Swipe** and **Side-by-Side** mode.
     - Point out the **Predicted Future Trajectory (+5 & +10 Years)** with the notice: *"Estimated projection, not a real image"*.
     - Show the **Micro Canopy Trajectory Chart** for that specific patch.
3. **Speaking Points:**
   > *"In View 3, morphological filters strip away sensor noise to identify contiguous disturbance patches. When we click 'View past images' for any high-risk patch, we get a multi-decadal timeline: 10 years ago via Landsat 8, 5 years ago via Sentinel-2, present condition, and machine-learning projections for 2031 and 2036."*

---

### Minute 3:00 – 4:00 | 1km Predictive Heatmap, 5-Year Forecast & SHAP (View 4)
1. **Action:** Click **`4. Future Prediction`** in the sidebar.
2. **Demonstration:**
   - Show the 1km $\times$ 1km risk heatmap (Red = High, Orange = Moderate, Green = Low).
   - Click on the **5-Year Trajectory** tab: show the Recharts area chart with the shaded **95% Confidence Band** projecting canopy cover through 2031.
   - Click on the **SHAP Drivers** tab: show the horizontal bar chart showing that negative NDVI trend and road distance drive over 57% of predictive risk.
   - Show the **Model Card** tab: highlight the **0.892 ROC-AUC** evaluated strictly on a **Held-out Spatial Block Split**.
3. **Speaking Points:**
   > *"GreenShieldAI is fundamentally forward-looking. Our Gradient Tree Boost model scores every 1km² management zone for degradation risk over the next 12 months. Rather than naive cross-validation that leaks spatial autocorrelation, we evaluate strictly on a Held-out Spatial Block Split, achieving a genuine 0.892 ROC-AUC. Tree SHAP explains that previous NDVI trajectory and road proximity are the two primary drivers."*

---

### Minute 4:00 – 5:00 | Live View Drawer, Field Feedback & PDF Export (View 5 & 6)
1. **Action:** Click on any polygon or Priority Cell to open the **Live View Drawer**:
   - Inspect the embedded live satellite view at **Zoom 17 (Esri Clarity)**.
   - Highlight the external deep-link buttons: **Google Maps Satellite**, **Google Earth 3D Web**, and **Google Street View**.
   - Notice the **View Past Images** button directly in the drawer.
   - Click **`Dispatch Ranger Patrol & Log Verification`**.
2. **Action:** View 5 opens (Field Verification):
   - Notice the coordinates are pre-filled.
   - Show the SQLite ground truth audit log.
   - Point out the bottom callout explaining how field confirmations continuously retrain the AI models.
3. **Action:** Click **`6. Methodology & Export`**:
   - Click **`Download Executive Audit (PDF)`** to download the standalone PDF summary.
   - Click **`Export GeoJSON`** to download vector boundaries for GIS software.
4. **Closing Statement:**
   > *"From multi-spectral satellite ingestion to 1km predictive intelligence, ranger dispatch deep-links, decadal patch history, SQLite feedback loops, and PDF executive audits, GreenShieldAI provides an operational, tamper-evident, AI-driven shield for forest ecosystems. Thank you!"*
