/**
 * Precompute Demo Cache Script
 * Pre-generates high-fidelity offline cache for all 6 Khyber Pakhtunkhwa preset regions.
 * Run once via `npm run precompute` to guarantee 100% offline judging reliability.
 */

const fs = require('fs');
const path = require('path');
const CONFIG = require('../config');
const { generateYearlyTimeSeries, generateDisturbancePolygons, computeClassStatistics } = require('../services/analysisEngine');
const { generate1kmGrid, evaluateGridRisk } = require('../services/riskModel');
const { calculateForecast } = require('../services/forecastEngine');
const { setCachedAnalysis } = require('../services/cacheService');

function precomputeAll() {
  console.log('='.repeat(70));
  console.log('FOREST GUARDIAN KP - PRECOMPUTING OFFLINE CACHE (NODE.JS)');
  console.log('Target Cache Directory:', CONFIG.CACHE_DIR);
  console.log('='.repeat(70));

  const presets = Object.values(CONFIG.PRESET_LOCATIONS);

  for (const loc of presets) {
    console.log(`\n[+] Processing ${loc.name} (ID: ${loc.id})...`);
    console.log(`    Bounding Box: [${loc.bbox.join(', ')}]`);

    // 1. Time Series
    const timeSeries = generateYearlyTimeSeries(loc.id);

    // 2. Disturbance Polygons & Stats
    const polygonsGeoJSON = generateDisturbancePolygons(loc.bbox, loc.id);
    const stats = computeClassStatistics(polygonsGeoJSON, 10000.0);

    // 3. 1km Risk Grid & SHAP
    const rawGrid = generate1kmGrid(loc.bbox, 1000);
    const riskResult = evaluateGridRisk(rawGrid, loc.id.charCodeAt(0) * 10);

    // 4. 5-Year Forecast
    const years = timeSeries.map((t) => t.year);
    const covers = timeSeries.map((t) => t.forestCoverPct);
    const forecastResult = calculateForecast(years, covers, 5);

    // Complete payload
    const cachePayload = {
      jobId: `demo_${loc.id}`,
      presetId: loc.id,
      location: loc,
      timeSeries,
      segmentation: {
        polygonsGeoJSON,
        stats
      },
      risk: riskResult,
      forecast: forecastResult,
      latestPassDate: '2026-09-14 (Sentinel-2 L2A Cloud-Free)',
      isDemoData: true,
      timestamp: new Date().toISOString()
    };

    // Save to cache
    setCachedAnalysis(`preset_${loc.id}`, cachePayload);
    setCachedAnalysis(`job_demo_${loc.id}`, cachePayload);

    // Also write standalone GeoJSON file for direct export
    const geojsonPath = path.join(CONFIG.CACHE_DIR, `${loc.id}_polygons.geojson`);
    fs.writeFileSync(geojsonPath, JSON.stringify(polygonsGeoJSON, null, 2), 'utf8');

    console.log(`    [OK] Polygons: ${polygonsGeoJSON.features.length} patches (${stats.totalAffectedHa} ha affected)`);
    console.log(`    [OK] 1km Grid: ${riskResult.gridGeoJSON.features.length} cells (ROC-AUC: ${riskResult.modelCard.rocAuc})`);
    console.log(`    [OK] 5-Year Forecast: ${forecastResult.annualRatePct}%/yr (R²: ${forecastResult.r2Score})`);
    console.log(`    [OK] Successfully persisted to cache.`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('ALL 6 KP REGIONS PRECOMPUTED & READY FOR LIVE DEMO!');
  console.log('='.repeat(70));
}

precomputeAll();
