const fs = require('fs');
const path = require('path');
const NodeCache = require('node-cache');
const CONFIG = require('../config');

// In-memory cache with 2-hour TTL
const memCache = new NodeCache({ stdTTL: 7200, checkperiod: 600 });

// Ensure cache directory exists
if (!fs.existsSync(CONFIG.CACHE_DIR)) {
  fs.mkdirSync(CONFIG.CACHE_DIR, { recursive: true });
}

function getCacheFilePath(key) {
  const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(CONFIG.CACHE_DIR, `${safeKey}.json`);
}

function getCachedAnalysis(key) {
  // Check memory first
  const inMem = memCache.get(key);
  if (inMem) return inMem;

  // Check disk
  const filePath = getCacheFilePath(key);
  if (fs.existsSync(filePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      memCache.set(key, data);
      return data;
    } catch (e) {
      console.warn(`[Cache] Error reading ${filePath}:`, e.message);
    }
  }
  return null;
}

function setCachedAnalysis(key, data) {
  memCache.set(key, data);
  const filePath = getCacheFilePath(key);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.warn(`[Cache] Error writing ${filePath}:`, e.message);
  }
}

function getPresetCache(presetId) {
  return getCachedAnalysis(`preset_${presetId}`);
}

module.exports = {
  getCachedAnalysis,
  setCachedAnalysis,
  getPresetCache
};
