const test = require('node:test');
const assert = require('node:assert/strict');
const { generate1kmGrid, evaluateGridRisk } = require('../services/riskModel');
const { calculateForecast } = require('../services/forecastEngine');
const { computeClassStatistics, generateDisturbancePolygons } = require('../services/analysisEngine');
const { addVerification, getAllVerifications } = require('../db/database');
const CONFIG = require('../config');

test('1km Grid Generation creates valid cells within bounding box', () => {
  const bbox = [72.50, 35.15, 72.62, 35.25]; // Swat Miandam
  const grid = generate1kmGrid(bbox, 1000);

  assert.equal(grid.type, 'FeatureCollection');
  assert.ok(grid.features.length > 50, 'Grid should have > 50 cells');

  const first = grid.features[0];
  assert.ok(first.properties.cellId.startsWith('GRID_'));
  assert.ok(first.properties.centroidLat >= 35.15 && first.properties.centroidLat <= 35.25);
  assert.ok(first.properties.centroidLon >= 72.50 && first.properties.centroidLon <= 72.62);
});

test('Grid Risk Model evaluates probabilities and SHAP importances', () => {
  const bbox = [72.50, 35.15, 72.62, 35.25];
  const grid = generate1kmGrid(bbox, 1000);
  const result = evaluateGridRisk(grid, 42);

  assert.ok(result.top10Priorities.length <= 10);
  assert.equal(result.top10Priorities[0].rank, 1);
  assert.ok(result.top10Priorities[0].riskProb >= 0 && result.top10Priorities[0].riskProb <= 1);
  assert.ok(result.featureImportances.length > 3);
  assert.equal(result.modelCard.rocAuc, 0.892);
});

test('Forest Forecast calculates 5-year trend with 95% confidence bands', () => {
  const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
  const covers = [74.5, 73.8, 73.1, 72.5, 71.9, 71.2, 70.6, 70.0, 69.4];

  const result = calculateForecast(years, covers, 5);

  assert.ok(result.annualRatePct < 0, 'Canopy should show downward slope');
  assert.equal(result.forecast.length, years.length + 5);

  const lastProj = result.forecast[result.forecast.length - 1];
  assert.equal(lastProj.year, 2031);
  assert.ok(lastProj.lowerBoundPct <= lastProj.predictedCoverPct);
  assert.ok(lastProj.upperBoundPct >= lastProj.predictedCoverPct);
});

test('Disturbance Polygons & Class Statistics computation', () => {
  const bbox = [72.50, 35.15, 72.62, 35.25];
  const polys = generateDisturbancePolygons(bbox, 'swat');
  const stats = computeClassStatistics(polys, 10000);

  assert.ok(polys.features.length >= 4);
  assert.ok(stats.totalAffectedHa > 50);
  assert.ok(stats.classes.forest_loss.areaHa > 0);
  assert.ok(stats.top10Patches.length > 0);
});

test('SQLite Ground Verification Storage and Retrieval', () => {
  const newId = addVerification({
    region_id: 'swat',
    latitude: 35.2012,
    longitude: 72.5634,
    detected_class: 'Forest Loss',
    verification_status: 'Confirmed Disturbance',
    disturb_cause: 'Illegal Logging / Tree Cutting',
    notes: 'Automated test ground inspection log.',
    officer_name: 'Test Officer SDFO',
    confidence_rating: 5
  });

  assert.ok(newId > 0);
  const allLogs = getAllVerifications();
  assert.ok(allLogs.some(l => l.officer_name === 'Test Officer SDFO'));
});
