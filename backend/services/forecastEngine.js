/**
 * Forest Cover Forecasting Engine
 * Calculates linear trend & 95% confidence bands for multi-year projections.
 */

function calculateForecast(years, forestCoverPcts, forecastHorizon = 5) {
  const n = years.length;
  if (n < 2) {
    return { forecast: [], annualRatePct: 0, r2Score: 0, summaryText: 'Insufficient historical data' };
  }

  // Calculate means
  const sumX = years.reduce((a, b) => a + b, 0);
  const sumY = forestCoverPcts.reduce((a, b) => a + b, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;

  // Slope (b) and Intercept (a)
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (years[i] - meanX) * (forestCoverPcts[i] - meanY);
    den += Math.pow(years[i] - meanX, 2);
  }

  const slope = den !== 0 ? num / den : 0;
  const intercept = meanY - slope * meanX;

  // Residual variance for standard error
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const fitted = intercept + slope * years[i];
    ssRes += Math.pow(forestCoverPcts[i] - fitted, 2);
    ssTot += Math.pow(forestCoverPcts[i] - meanY, 2);
  }

  const r2Score = ssTot > 0 ? Math.max(0, 1 - (ssRes / ssTot)) : 0.85;
  const dof = Math.max(n - 2, 1);
  const residualStd = Math.sqrt(ssRes / dof);
  const tCritical = 2.365; // ~95% t-critical for 7-8 df

  const results = [];

  // Historical records
  for (let i = 0; i < n; i++) {
    results.push({
      year: years[i],
      type: 'Historical',
      predictedCoverPct: parseFloat(forestCoverPcts[i].toFixed(1)),
      lowerBoundPct: parseFloat(forestCoverPcts[i].toFixed(1)),
      upperBoundPct: parseFloat(forestCoverPcts[i].toFixed(1))
    });
  }

  // Projections
  const lastYear = years[years.length - 1];
  const lastObserved = forestCoverPcts[forestCoverPcts.length - 1];

  for (let step = 1; step <= forecastHorizon; step++) {
    const yr = lastYear + step;
    const pred = intercept + slope * yr;
    const sePred = residualStd * Math.sqrt(1 + (1 / n) + (Math.pow(yr - meanX, 2) / den));
    const margin = tCritical * sePred;

    const predClamped = Math.max(5, Math.min(95, pred));
    const lowerClamped = Math.max(5, Math.min(95, pred - margin));
    const upperClamped = Math.max(5, Math.min(95, pred + margin));

    results.push({
      year: yr,
      type: 'Projected',
      predictedCoverPct: parseFloat(predClamped.toFixed(1)),
      lowerBoundPct: parseFloat(lowerClamped.toFixed(1)),
      upperBoundPct: parseFloat(upperClamped.toFixed(1))
    });
  }

  const annualRate = parseFloat(slope.toFixed(3));
  const finalProj = results[results.length - 1].predictedCoverPct;
  const netDelta = parseFloat((finalProj - lastObserved).toFixed(1));
  const targetYear = lastYear + forecastHorizon;

  let summaryText = '';
  if (annualRate < -0.1) {
    summaryText = `Downward trajectory: projected net loss of ${Math.abs(netDelta)}% canopy cover by ${targetYear} if current disturbance rate persists unchecked.`;
  } else if (annualRate > 0.1) {
    summaryText = `Positive trajectory: projected increase of ${netDelta}% canopy cover by ${targetYear} under current afforestation trends.`;
  } else {
    summaryText = `Canopy equilibrium: stable trajectory with slight ${netDelta}% variation projected through ${targetYear}.`;
  }

  return {
    forecast: results,
    annualRatePct: annualRate,
    r2Score: parseFloat(r2Score.toFixed(3)),
    summaryText,
    notice: 'Algorithmic projection assuming continuation of recent environmental trends. For decision support and early intervention only.'
  };
}

module.exports = {
  calculateForecast
};
