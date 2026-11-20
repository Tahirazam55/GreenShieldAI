const fs = require('fs');
const path = require('path');
const CONFIG = require('../config');

let isInitialized = false;
let initError = null;
let eeInstance = null;

try {
  eeInstance = require('@google/earthengine');
} catch (e) {
  initError = 'Failed to import @google/earthengine: ' + e.message;
}

function initGee() {
  return new Promise((resolve) => {
    if (!eeInstance) {
      isInitialized = false;
      return resolve({ success: false, message: initError || 'EE not installed' });
    }

    if (isInitialized) {
      return resolve({ success: true, message: 'Earth Engine already initialized' });
    }

    // Check for private key file
    const keyPath = path.resolve(CONFIG.GEE_KEY_PATH);
    if (fs.existsSync(keyPath)) {
      try {
        const privateKey = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        eeInstance.data.authenticateViaPrivateKey(
          privateKey,
          () => {
            eeInstance.initialize(
              null,
              null,
              () => {
                isInitialized = true;
                initError = null;
                console.log('[GEE] Earth Engine initialized successfully via Service Account.');
                resolve({ success: true, message: 'Connected to Earth Engine via Service Account' });
              },
              (err) => {
                isInitialized = false;
                initError = err ? err.message : 'Initialization failed';
                console.warn('[GEE] Initialization error:', initError);
                resolve({ success: false, message: initError });
              },
              null,
              CONFIG.GEE_PROJECT_ID || privateKey.project_id
            );
          },
          (err) => {
            isInitialized = false;
            initError = err ? err.message : 'Authentication failed';
            console.warn('[GEE] Authentication error:', initError);
            resolve({ success: false, message: initError });
          }
        );
        return;
      } catch (err) {
        initError = 'Failed to parse GEE key: ' + err.message;
        console.warn('[GEE]', initError);
        return resolve({ success: false, message: initError });
      }
    }

    // If no key file, check if initialized or use demo mode
    initError = 'Service account key not found at ' + CONFIG.GEE_KEY_PATH + '. Operating in High-Fidelity Demo Mode.';
    isInitialized = false;
    resolve({ success: false, message: initError });
  });
}

function isGeeReady() {
  return isInitialized;
}

function getGeeStatus() {
  return {
    connected: isInitialized,
    mode: isInitialized ? 'Live GEE Mode' : 'High-Fidelity Demo Mode (Offline)',
    error: initError,
    projectId: CONFIG.GEE_PROJECT_ID || 'greenshield-ai',
    apiKeyPresent: !!CONFIG.GEE_API_KEY
  };
}

module.exports = {
  ee: eeInstance,
  initGee,
  isGeeReady,
  getGeeStatus
};
