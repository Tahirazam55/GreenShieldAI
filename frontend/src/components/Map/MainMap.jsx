import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Rectangle, useMap, useMapEvents, Marker, Popup } from 'react-leaflet';
import { useAppStore } from '../../store/useAppStore';
import { Plus, Minus, Maximize2, Satellite, Sparkles } from 'lucide-react';
import L from 'leaflet';

// Map Controller for programmatically flying to coordinates only on actual location change
function MapController({ center, zoom }) {
  const map = useMap();
  const lastCenterRef = useRef(null);

  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2) {
      const isNew = !lastCenterRef.current ||
        Math.abs(lastCenterRef.current[0] - center[0]) > 0.0001 ||
        Math.abs(lastCenterRef.current[1] - center[1]) > 0.0001;

      if (isNew) {
        lastCenterRef.current = center;
        map.flyTo(center, zoom || 13, { duration: 1.2 });
      }
    }
  }, [center, zoom, map]);

  return null;
}

// On-Map Interactive Zoom In / Zoom Out and Reset Extent Control Widget
function MapZoomControl({ rectBounds }) {
  const map = useMap();
  const [currentZoom, setCurrentZoom] = useState(map.getZoom ? Math.round(map.getZoom()) : 13);

  useEffect(() => {
    if (!map) return;
    const updateZoom = () => {
      setCurrentZoom(Math.round(map.getZoom()));
    };
    map.on('zoomend', updateZoom);
    return () => {
      map.off('zoomend', updateZoom);
    };
  }, [map]);

  const handleZoomIn = (e) => {
    e.stopPropagation();
    e.preventDefault();
    map.zoomIn();
  };

  const handleZoomOut = (e) => {
    e.stopPropagation();
    e.preventDefault();
    map.zoomOut();
  };

  const handleFitExtent = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (rectBounds) {
      map.fitBounds(rectBounds, { padding: [35, 35], maxZoom: 14 });
    }
  };

  return (
    <div
      className="leaflet-top leaflet-right"
      style={{ pointerEvents: 'auto', zIndex: 1000, margin: '14px 14px 0 0' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col items-center bg-forest-card/95 backdrop-blur-md p-1.5 rounded-xl border border-forest-border shadow-2xl space-y-1">
        {/* Zoom In Button */}
        <button
          type="button"
          onClick={handleZoomIn}
          title="Zoom In (+)"
          className="w-8 h-8 rounded-lg bg-forest-dark hover:bg-guardian-600 text-white flex items-center justify-center font-bold text-base border border-forest-border/80 hover:border-guardian-400 transition-all shadow active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Live Zoom Level Badge */}
        <div
          className="text-[10px] font-mono font-bold text-guardian-300 py-0.5 select-none"
          title={`Current Zoom Level: ${currentZoom}`}
        >
          {currentZoom}z
        </div>

        {/* Zoom Out Button */}
        <button
          type="button"
          onClick={handleZoomOut}
          title="Zoom Out (−)"
          className="w-8 h-8 rounded-lg bg-forest-dark hover:bg-guardian-600 text-white flex items-center justify-center font-bold text-base border border-forest-border/80 hover:border-guardian-400 transition-all shadow active:scale-95 cursor-pointer"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Reset Extent / Fit AOI */}
        <button
          type="button"
          onClick={handleFitExtent}
          title="Fit Extent (Reset AOI View)"
          className="w-8 h-8 rounded-lg bg-forest-dark hover:bg-guardian-600 text-slate-300 hover:text-white flex items-center justify-center border border-forest-border/80 hover:border-guardian-400 transition-all shadow active:scale-95 cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// Map Click Listener for empty map clicks
function MapEventsHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export default function MainMap({ height = 'h-[540px]' }) {
  const {
    center,
    zoom,
    bbox,
    locationName,
    jobId,
    analysisData,
    layers,
    layerOpacity,
    setInspectedPoint,
    openPatchHistory,
    analyzeCoordinate
  } = useAppStore();

  const [clickedPoint, setClickedPoint] = useState(null);

  const handlePointClick = (lat, lon, source = 'Map Click', category = 'Flagged Site') => {
    setInspectedPoint({
      lat,
      lon,
      source,
      category,
      riskScore: 0.85,
      dndvi: -0.32,
      latestPassDate: '2026-09-14 (Sentinel-2 L2A)'
    });
  };

  // Polygon style handler
  const polygonStyle = (feature) => {
    const className = feature.properties.className;
    const isVisible = layers[className] !== false;
    const color = feature.properties.color || '#E63946';

    return {
      color: isVisible ? color : 'transparent',
      weight: isVisible ? 2 : 0,
      fillColor: isVisible ? color : 'transparent',
      fillOpacity: isVisible ? layerOpacity : 0
    };
  };

  // Risk grid style handler
  const gridStyle = (feature) => {
    const isVisible = layers.riskGrid === true;
    const color = feature.properties.riskColor || '#52B788';

    return {
      color: isVisible ? color : 'transparent',
      weight: isVisible ? 1 : 0,
      fillColor: isVisible ? color : 'transparent',
      fillOpacity: isVisible ? 0.45 : 0
    };
  };

  const onEachPolygon = (feature, layer) => {
    const p = feature.properties;

    const popupHtml = `
      <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; color: #FFFFFF; min-width: 210px; padding: 2px;">
        <div style="font-weight: 800; font-size: 13px; color: #FFFFFF; margin-bottom: 2px;">
          ${p.shortLabel || p.category || 'High-Risk Disturbance'}
        </div>
        <div style="color: #94A3B8; font-size: 11px; margin-bottom: 4px;">
          Coordinates: ${p.centroidLat?.toFixed(4)}, ${p.centroidLon?.toFixed(4)}
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 8px; border-top: 1px solid #1F452E; padding-top: 4px; color: #CBD5E1;">
          <span>Contiguous Area:</span>
          <b style="color: #52B788;">${p.areaHa} ha</b>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
          <button class="leaflet-popup-live-btn" style="background: #2D6A4F; color: white; border: 1px solid #52B788; border-radius: 8px; padding: 6px 8px; font-size: 11px; font-weight: 700; cursor: pointer; text-align: center;">
            🛰️ Live View
          </button>
          <button class="leaflet-popup-past-btn" style="background: #0B1E13; color: #52B788; border: 1px solid #1F452E; border-radius: 8px; padding: 6px 8px; font-size: 11px; font-weight: 700; cursor: pointer; text-align: center;">
            ⏳ Past Images
          </button>
        </div>
      </div>
    `;

    layer.bindPopup(popupHtml, { maxWidth: 260 });

    layer.on({
      popupopen: (e) => {
        const el = e.popup.getElement();
        if (!el) return;
        const liveBtn = el.querySelector('.leaflet-popup-live-btn');
        const pastBtn = el.querySelector('.leaflet-popup-past-btn');
        if (liveBtn) {
          liveBtn.onclick = (evt) => {
            evt.stopPropagation();
            handlePointClick(p.centroidLat, p.centroidLon, p.category, p.category);
          };
        }
        if (pastBtn) {
          pastBtn.onclick = (evt) => {
            evt.stopPropagation();
            openPatchHistory({
              lat: p.centroidLat,
              lon: p.centroidLon,
              patchId: p.patchId || (p.rank ? `PATCH_00${p.rank}` : 'HR-01'),
              category: p.category
            });
          };
        }
      }
    });

    layer.bindTooltip(
      `<strong>${p.shortLabel || p.category}</strong><br/>Area: ${p.areaHa} ha<br/>Click to inspect or view past images`,
      { sticky: true }
    );
  };

  const onEachGridCell = (feature, layer) => {
    const p = feature.properties;

    const popupHtml = `
      <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; color: #FFFFFF; min-width: 200px; padding: 2px;">
        <div style="font-weight: 800; font-size: 13px; color: #FFFFFF; margin-bottom: 2px;">
          Cell ${p.cellId} &bull; ${p.riskLevel} Risk
        </div>
        <div style="color: #94A3B8; font-size: 11px; margin-bottom: 4px;">
          Coordinates: ${p.centroidLat?.toFixed(4)}, ${p.centroidLon?.toFixed(4)}
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 8px; border-top: 1px solid #1F452E; padding-top: 4px; color: #CBD5E1;">
          <span>Vulnerability:</span>
          <b style="color: #E63946;">${(p.riskProb * 100).toFixed(0)}%</b>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
          <button class="leaflet-popup-cell-live-btn" style="background: #2D6A4F; color: white; border: 1px solid #52B788; border-radius: 8px; padding: 6px 8px; font-size: 11px; font-weight: 700; cursor: pointer; text-align: center;">
            🛰️ Live View
          </button>
          <button class="leaflet-popup-cell-past-btn" style="background: #0B1E13; color: #52B788; border: 1px solid #1F452E; border-radius: 8px; padding: 6px 8px; font-size: 11px; font-weight: 700; cursor: pointer; text-align: center;">
            ⏳ Past Images
          </button>
        </div>
      </div>
    `;

    layer.bindPopup(popupHtml, { maxWidth: 250 });

    layer.on({
      popupopen: (e) => {
        const el = e.popup.getElement();
        if (!el) return;
        const liveBtn = el.querySelector('.leaflet-popup-cell-live-btn');
        const pastBtn = el.querySelector('.leaflet-popup-cell-past-btn');
        if (liveBtn) {
          liveBtn.onclick = (evt) => {
            evt.stopPropagation();
            handlePointClick(p.centroidLat, p.centroidLon, `1km Cell ${p.cellId}`, `${p.riskLevel} Risk Zone`);
          };
        }
        if (pastBtn) {
          pastBtn.onclick = (evt) => {
            evt.stopPropagation();
            openPatchHistory({
              lat: p.centroidLat,
              lon: p.centroidLon,
              patchId: `CELL_${p.cellId}`,
              category: `${p.riskLevel} Risk Zone`
            });
          };
        }
      }
    });

    layer.bindTooltip(
      `<strong>${p.cellId}</strong> (${p.riskLevel} Risk)<br/>Probability: ${(p.riskProb * 100).toFixed(0)}%`,
      { sticky: true }
    );
  };

  const rectBounds = [
    [bbox[1], bbox[0]],
    [bbox[3], bbox[2]]
  ];

  return (
    <div className={`w-full ${height} rounded-2xl overflow-hidden border border-forest-border shadow-xl relative bg-forest-dark`}>
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full"
        scrollWheelZoom={true}
        zoomControl={false}
      >
        <MapController center={center} zoom={zoom} />
        <MapZoomControl rectBounds={rectBounds} />
        <MapEventsHandler
          onMapClick={(lat, lon) => {
            setClickedPoint({ lat, lon });
            handlePointClick(lat, lon, 'Custom Selected Coordinate', 'User Inspected Location');
          }}
        />

        {/* Esri World Imagery Basemap */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Esri World Imagery, Maxar, Earthstar Geographics"
          maxZoom={19}
        />

        {/* Esri Boundaries & Labels Overlay */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
        />

        {/* Target AOI Bounding Box */}
        <Rectangle
          bounds={rectBounds}
          pathOptions={{
            color: '#E63946',
            weight: 2,
            dashArray: '6, 6',
            fillColor: '#2D6A4F',
            fillOpacity: 0.12
          }}
        />

        {/* Click Marker & Popup */}
        {clickedPoint && (
          <Marker position={[clickedPoint.lat, clickedPoint.lon]}>
            <Popup>
              <div style={{ minWidth: 200, fontFamily: 'system-ui, sans-serif', fontSize: 12, color: '#FFFFFF' }}>
                <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 2 }}>
                  Selected Coordinate
                </div>
                <div style={{ color: '#94A3B8', fontSize: 11, marginBottom: 6 }}>
                  {clickedPoint.lat.toFixed(4)}, {clickedPoint.lon.toFixed(4)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <button
                    onClick={() => handlePointClick(clickedPoint.lat, clickedPoint.lon, 'Map Selection', 'User Inspected Location')}
                    style={{ background: '#2D6A4F', color: 'white', border: '1px solid #52B788', borderRadius: 8, padding: '5px 6px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                  >
                    🛰️ Live View
                  </button>
                  <button
                    onClick={() => {
                      analyzeCoordinate(clickedPoint.lat, clickedPoint.lon, `AOI (${clickedPoint.lat.toFixed(2)}, ${clickedPoint.lon.toFixed(2)})`);
                    }}
                    style={{ background: '#0B1E13', color: '#52B788', border: '1px solid #1F452E', borderRadius: 8, padding: '5px 6px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                  >
                    🔬 Analyze
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 1km Risk Heatmap Grid Layer */}
        {layers.riskGrid && analysisData?.gridGeoJSON && (
          <GeoJSON
            key={`risk_grid_${jobId}_${layers.riskGrid}`}
            data={analysisData.gridGeoJSON}
            style={gridStyle}
            onEachFeature={onEachGridCell}
          />
        )}

        {/* Disturbance Segmentation Polygons */}
        {analysisData?.polygonsGeoJSON && (
          <GeoJSON
            key={`polys_${jobId}_${JSON.stringify(layers)}_${layerOpacity}`}
            data={analysisData.polygonsGeoJSON}
            style={polygonStyle}
            onEachFeature={onEachPolygon}
          />
        )}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-[400] bg-forest-card/90 backdrop-blur-md border border-forest-border/80 px-3 py-2.5 rounded-xl shadow-lg text-[11px] space-y-1.5 pointer-events-auto">
        <span className="font-bold text-white block uppercase tracking-wider text-[10px]">
          Canopy Disturbance Classes
        </span>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-200">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#E63946]"></span> Severe Loss
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#F4A261]"></span> Thinning
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#3D1308] border border-orange-500"></span> Burn Scar
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#2A9D8F]"></span> Regrowth
          </span>
        </div>
      </div>
    </div>
  );
}
