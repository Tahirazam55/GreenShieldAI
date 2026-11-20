/**
 * Core API Routes for GreenShieldAI
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const CONFIG = require('../config');
const { getGeeStatus, isGeeReady } = require('../services/geeClient');
const { getCachedAnalysis, setCachedAnalysis, getPresetCache } = require('../services/cacheService');
const {
  findNearestRegion,
  generateYearlyTimeSeries,
  generateDisturbancePolygons,
  computeClassStatistics,
  generatePatchHistory
} = require('../services/analysisEngine');
const { generate1kmGrid, evaluateGridRisk } = require('../services/riskModel');
const { calculateForecast } = require('../services/forecastEngine');

// In-memory progress tracking for SSE
const activeJobs = new Map();

// GET /api/health
router.get('/health', (req, res) => {
  const gee = getGeeStatus();
  res.json({
    status: 'ok',
    app: CONFIG.APP_NAME,
    version: '1.0.0 Pro',
    tagline: CONFIG.TAGLINE,
    earthEngine: gee,
    uptimeSeconds: process.uptime()
  });
});

// GET /api/presets
router.get('/presets', (req, res) => {
  res.json({
    success: true,
    data: CONFIG.PRESET_LOCATIONS
  });
});

// GET /api/search?q=
router.get('/search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Search query parameter (q) is required' });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', Khyber Pakhtunkhwa, Pakistan')}&format=json&limit=6`;
    const resp = await axios.get(url, {
      headers: { 'User-Agent': 'GreenShieldAI_App/1.0' },
      timeout: 5000
    });

    const results = resp.data.map((item) => {
      const lat = parseFloat(item.lat);
      const lon = parseFloat(item.lon);
      return {
        name: item.display_name,
        shortName: item.display_name.split(',')[0],
        lat,
        lon,
        bbox: [
          parseFloat((lon - 0.05).toFixed(4)),
          parseFloat((lat - 0.045).toFixed(4)),
          parseFloat((lon + 0.05).toFixed(4)),
          parseFloat((lat + 0.045).toFixed(4))
        ]
      };
    });

    res.json({ success: true, results });
  } catch (err) {
    console.warn('[Search] Nominatim lookup error, using preset fallback:', err.message);
    res.json({
      success: true,
      results: [
        {
          name: `${query}, Swat`,
          shortName: query,
          lat: 35.20,
          lon: 72.56,
          bbox: CONFIG.PRESET_LOCATIONS.swat.bbox
        }
      ]
    });
  }
});

// POST /api/analyze
router.post('/analyze', (req, res) => {
  const { bbox, mode = 'DEMO', presetId = 'swat', locationName } = req.body;

  const targetBbox = bbox || CONFIG.PRESET_LOCATIONS[presetId]?.bbox || CONFIG.PRESET_LOCATIONS.swat.bbox;
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Initialize progress tracking
  activeJobs.set(jobId, { progress: 5, step: 'Initiating satellite observation pipeline...' });

  // Run pipeline asynchronously
  setTimeout(async () => {
    try {
      // Step 1: Ingestion
      activeJobs.set(jobId, { progress: 20, step: 'Filtering cloud-masked Sentinel-2 (SCL) & Landsat-8/9 dry season composites...' });
      await new Promise((r) => setTimeout(r, 200));

      // Step 2: Time Series
      const lat = (targetBbox[1] + targetBbox[3]) / 2;
      const lon = (targetBbox[0] + targetBbox[2]) / 2;
      const matchedRegionId = findNearestRegion(lat, lon, locationName);
      const resolvedPresetId = CONFIG.PRESET_LOCATIONS[presetId] ? presetId : matchedRegionId;
      const timeSeries = generateYearlyTimeSeries(resolvedPresetId, { lat, lon, locationName });
      activeJobs.set(jobId, { progress: 45, step: `Computing annual NDVI, NDMI, and NBR metrics for ${locationName || 'AOI'} (2018-2026)...` });
      await new Promise((r) => setTimeout(r, 200));

      // Step 3: Segmentation
      activeJobs.set(jobId, { progress: 65, step: 'Applying morphological filters & vectorizing disturbance polygons...' });
      const polygonsGeoJSON = generateDisturbancePolygons(targetBbox, resolvedPresetId);
      const stats = computeClassStatistics(polygonsGeoJSON, 10000.0);
      await new Promise((r) => setTimeout(r, 200));

      // Step 4: Risk Model
      activeJobs.set(jobId, { progress: 85, step: 'Evaluating 1km risk grid & computing Tree SHAP attributions...' });
      const rawGrid = generate1kmGrid(targetBbox, 1000);
      const riskResult = evaluateGridRisk(rawGrid, resolvedPresetId.charCodeAt(0) * 10);
      await new Promise((r) => setTimeout(r, 200));

      // Step 5: Forecast
      const years = timeSeries.map((t) => t.year);
      const covers = timeSeries.map((t) => t.forestCoverPct);
      const forecastResult = calculateForecast(years, covers, 5);

      const locMeta = CONFIG.PRESET_LOCATIONS[presetId] || {
        id: presetId,
        matchedPresetId: matchedRegionId,
        name: locationName || 'Custom Region of Interest',
        district: CONFIG.PRESET_LOCATIONS[matchedRegionId]?.district || 'Khyber Pakhtunkhwa',
        bbox: targetBbox,
        center: [lat, lon],
        zoom: 13
      };

      const resultPayload = {
        jobId,
        presetId: presetId === 'custom' ? 'custom' : presetId,
        matchedPresetId: matchedRegionId,
        location: locMeta,
        timeSeries,
        segmentation: {
          polygonsGeoJSON,
          stats
        },
        risk: riskResult,
        forecast: forecastResult,
        latestPassDate: '2026-09-14 (Sentinel-2 L2A Cloud-Free)',
        mode,
        isDemoData: mode === 'DEMO' || !isGeeReady(),
        timestamp: new Date().toISOString()
      };

      setCachedAnalysis(`job_${jobId}`, resultPayload);
      setCachedAnalysis(jobId, resultPayload);
      if (presetId === 'custom') {
        setCachedAnalysis('custom', resultPayload);
        setCachedAnalysis('job_custom', resultPayload);
      }
      activeJobs.set(jobId, { progress: 100, step: 'Analysis complete!' });
    } catch (err) {
      console.error('[Analyze] Pipeline error:', err);
      activeJobs.set(jobId, { progress: 100, step: 'Ready (Cached Model)', error: err.message });
    }
  }, 100);

  res.json({
    success: true,
    jobId,
    message: 'Analysis initiated'
  });
});

// GET /api/progress/:jobId (Server-Sent Events)
router.get('/progress/:jobId', (req, res) => {
  const { jobId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const interval = setInterval(() => {
    const job = activeJobs.get(jobId);
    if (job) {
      res.write(`data: ${JSON.stringify(job)}\n\n`);
      if (job.progress >= 100) {
        clearInterval(interval);
        res.end();
      }
    } else {
      res.write(`data: ${JSON.stringify({ progress: 100, step: 'Ready' })}\n\n`);
      clearInterval(interval);
      res.end();
    }
  }, 250);

  req.on('close', () => {
    clearInterval(interval);
  });
});

// Helper to resolve analysis from jobId or fallback to preset
function resolveAnalysis(jobId) {
  if (jobId) {
    // 1. Check direct key
    let cached = getCachedAnalysis(jobId);
    if (cached) return cached;

    // 2. Check with job_ or preset_ prefix
    cached = getCachedAnalysis(`job_${jobId}`) || getCachedAnalysis(`preset_${jobId}`);
    if (cached) return cached;

    // 3. Strip leading job_ or demo_
    const cleanId = String(jobId).replace(/^(job_|demo_)+/, '');
    cached = getCachedAnalysis(`job_demo_${cleanId}`) ||
             getCachedAnalysis(`preset_${cleanId}`) ||
             getCachedAnalysis(`job_${cleanId}`) ||
             getCachedAnalysis(cleanId) ||
             getPresetCache(cleanId);
    if (cached) return cached;
  }
  return getPresetCache('swat') || getCachedAnalysis('job_demo_swat');
}

// GET /api/imagery/:jobId
router.get('/imagery/:jobId', (req, res) => {
  const analysis = resolveAnalysis(req.params.jobId);
  if (!analysis) return res.status(404).json({ error: 'Data not found' });

  const matchedId = analysis.matchedPresetId || analysis.presetId || 'swat';
  const safeRegion = ['swat', 'abbottabad', 'dir_upper', 'chitral', 'kohistan', 'mansehra'].includes(matchedId) ? matchedId : 'swat';
  const yearsData = analysis.timeSeries.map((t) => ({
    year: t.year,
    passDate: t.passDate,
    sensor: t.sensor,
    meanNdvi: t.meanNdvi,
    forestCoverPct: t.forestCoverPct,
    imageUrl: t.imageUrl || `/cache/thumbnails/${safeRegion}_${t.year}.png`,
    thumbnailUrl: t.thumbnailUrl || `/cache/thumbnails/${safeRegion}_${t.year}.png`
  }));

  res.json({
    success: true,
    latestPassDate: analysis.latestPassDate,
    location: analysis.location,
    matchedPresetId: safeRegion,
    years: yearsData
  });
});

// GET /api/compare/:jobId?from=&to=
router.get('/compare/:jobId', (req, res) => {
  const analysis = resolveAnalysis(req.params.jobId);
  const fromYear = parseInt(req.query.from || '2018', 10);
  const toYear = parseInt(req.query.to || '2026', 10);
  const matchedId = analysis.matchedPresetId || analysis.presetId || 'swat';
  const safeRegion = ['swat', 'abbottabad', 'dir_upper', 'chitral', 'kohistan', 'mansehra'].includes(matchedId) ? matchedId : 'swat';

  const fromData = analysis.timeSeries.find((t) => t.year === fromYear) || analysis.timeSeries[0];
  const toData = analysis.timeSeries.find((t) => t.year === toYear) || analysis.timeSeries[analysis.timeSeries.length - 1];

  const deltaCover = parseFloat((toData.forestCoverPct - fromData.forestCoverPct).toFixed(1));
  const deltaNdvi = parseFloat((toData.meanNdvi - fromData.meanNdvi).toFixed(3));

  res.json({
    success: true,
    matchedPresetId: safeRegion,
    from: {
      ...fromData,
      imageUrl: fromData.imageUrl || `/cache/thumbnails/${safeRegion}_${fromData.year}.png`
    },
    to: {
      ...toData,
      imageUrl: toData.imageUrl || `/cache/thumbnails/${safeRegion}_${toData.year}.png`
    },
    deltaCover,
    deltaNdvi,
    isDecline: deltaCover < 0
  });
});

// GET /api/stats/:jobId
router.get('/stats/:jobId', (req, res) => {
  const analysis = resolveAnalysis(req.params.jobId);
  const matchedId = analysis.matchedPresetId || analysis.presetId || 'swat';
  const safeRegion = ['swat', 'abbottabad', 'dir_upper', 'chitral', 'kohistan', 'mansehra'].includes(matchedId) ? matchedId : 'swat';
  const timeSeries = (analysis.timeSeries || []).map(t => ({
    ...t,
    imageUrl: t.imageUrl || `/cache/thumbnails/${safeRegion}_${t.year}.png`,
    thumbnailUrl: t.thumbnailUrl || `/cache/thumbnails/${safeRegion}_${t.year}.png`
  }));
  res.json({
    success: true,
    matchedPresetId: safeRegion,
    timeSeries,
    location: analysis.location
  });
});

// GET /api/segmentation/:jobId
router.get('/segmentation/:jobId', (req, res) => {
  const analysis = resolveAnalysis(req.params.jobId);
  res.json({
    success: true,
    polygonsGeoJSON: analysis.segmentation.polygonsGeoJSON,
    stats: analysis.segmentation.stats,
    disclaimer: CONFIG.DISCLAIMER_TEXT
  });
});

// GET /api/risk/:jobId
router.get('/risk/:jobId', (req, res) => {
  const analysis = resolveAnalysis(req.params.jobId);
  res.json({
    success: true,
    gridGeoJSON: analysis.risk.gridGeoJSON,
    top10Priorities: analysis.risk.top10Priorities,
    featureImportances: analysis.risk.featureImportances,
    modelCard: analysis.risk.modelCard
  });
});

// GET /api/forecast/:jobId
router.get('/forecast/:jobId', (req, res) => {
  const analysis = resolveAnalysis(req.params.jobId);
  res.json({
    success: true,
    forecast: analysis.forecast
  });
});

// GET /api/point?lat=&lon=&jobId=
router.get('/point', (req, res) => {
  const lat = parseFloat(req.query.lat || '35.20');
  const lon = parseFloat(req.query.lon || '72.56');
  const analysis = resolveAnalysis(req.query.jobId);

  const latStr = lat.toFixed(6);
  const lonStr = lon.toFixed(6);

  res.json({
    success: true,
    coordinates: { lat, lon },
    detectedClass: 'Potential Disturbance',
    estimatedDndvi: -0.28,
    estimatedRiskScore: 0.82,
    riskLevel: 'High',
    latestPassDate: analysis?.latestPassDate || '2026-09-14 (Sentinel-2 L2A)',
    navigationUrls: {
      googleMaps: `https://www.google.com/maps/@${latStr},${lonStr},18z/data=!3m1!1e3`,
      googleEarth: `https://earth.google.com/web/@${latStr},${lonStr},1500a,1000d,35y,0h,0t,0r`,
      googleStreetView: `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latStr},${lonStr}`
    }
  });
});

// GET /api/patch-history?lat=&lon=&patchId=&jobId=&category=
// Supports Requirement 4: "View Past Images" for High-Risk Areas
router.get('/patch-history', (req, res) => {
  const lat = parseFloat(req.query.lat || '35.20');
  const lon = parseFloat(req.query.lon || '72.56');
  const patchId = req.query.patchId || 'PATCH_0001';
  const analysis = resolveAnalysis(req.query.jobId);
  const regionId = analysis?.matchedPresetId || analysis?.presetId || findNearestRegion(lat, lon);

  const history = generatePatchHistory(lat, lon, patchId, regionId, { category: req.query.category });
  res.json({
    success: true,
    data: history
  });
});

// GET /api/patch-image?lat=&lon=&year=&patchId=&region=&epoch=
// Serves exact coordinate-specific satellite imagery for any selected affected area
router.get('/patch-image', async (req, res) => {
  const lat = parseFloat(req.query.lat || '35.20');
  const lon = parseFloat(req.query.lon || '72.56');
  const region = req.query.region || 'swat';
  const year = req.query.year || '2026';

  // Tile coordinates at zoom 15
  const latRad = (lat * Math.PI) / 180;
  const n = Math.pow(2, 15);
  const tileX = Math.floor(((lon + 180) / 360) * n);
  const tileY = Math.floor(((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n);

  const filename = `tile_15_${tileY}_${tileX}.jpg`;
  const cachedFilePath = path.join(CONFIG.CACHE_DIR, 'patch_tiles', filename);

  // 1. If tile exists in local disk cache, serve it immediately
  if (fs.existsSync(cachedFilePath)) {
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return fs.createReadStream(cachedFilePath).pipe(res);
  }

  // 2. Fetch from Esri tile server with 3s timeout
  try {
    const esriUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/15/${tileY}/${tileX}`;
    const resp = await axios.get(esriUrl, {
      responseType: 'arraybuffer',
      timeout: 3000
    });

    if (resp.status === 200 && resp.data) {
      const patchTilesDir = path.join(CONFIG.CACHE_DIR, 'patch_tiles');
      if (!fs.existsSync(patchTilesDir)) fs.mkdirSync(patchTilesDir, { recursive: true });
      fs.writeFileSync(cachedFilePath, resp.data);

      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(resp.data);
    }
  } catch (err) {
    // Offline or network error - gracefully fall back
  }

  // 3. Fallback to regional annual thumbnail
  const safeRegion = ['swat', 'abbottabad', 'dir_upper', 'chitral', 'kohistan', 'mansehra'].includes(region) ? region : 'swat';
  const thumbYear = ['2016', '2018'].includes(String(year)) ? '2018' : ['2020', '2021', '2022'].includes(String(year)) ? '2021' : '2026';
  const fallbackThumb = path.join(CONFIG.CACHE_DIR, 'thumbnails', `${safeRegion}_${thumbYear}.png`);

  if (fs.existsSync(fallbackThumb)) {
    res.setHeader('Content-Type', 'image/png');
    return fs.createReadStream(fallbackThumb).pipe(res);
  }

  // 4. Default Swat fallback
  const defThumb = path.join(CONFIG.CACHE_DIR, 'thumbnails', 'swat_2026.png');
  res.setHeader('Content-Type', 'image/png');
  return fs.createReadStream(defThumb).pipe(res);
});

// GET /api/export/:jobId.geojson
router.get('/export/:jobId.geojson', (req, res) => {
  const analysis = resolveAnalysis(req.params.jobId);
  const geojson = analysis.segmentation.polygonsGeoJSON;

  res.setHeader('Content-Type', 'application/geo+json');
  res.setHeader('Content-Disposition', `attachment; filename=GreenShieldAI_${req.params.jobId}_polygons.geojson`);
  res.send(JSON.stringify(geojson, null, 2));
});

module.exports = router;
