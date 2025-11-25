import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import { Icon, LatLngBounds, LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { BalloonPosition } from '../utils/balloonData';

// Fix for default marker icons in React-Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import markerRetina from 'leaflet/dist/images/marker-icon-2x.png';

const DefaultIcon = new Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconRetinaUrl: markerRetina,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface BalloonMapProps {
  balloons: BalloonPosition[];
  alerts: any[]; // GeoJSON features
  loading: boolean;
  loadingAlerts: boolean;
}

// Component to fit map bounds to show all balloons
function FitBounds({ balloons }: { balloons: BalloonPosition[] }) {
  const map = useMap();

  useEffect(() => {
    if (balloons.length > 0) {
      const bounds = new LatLngBounds(
        balloons.map(b => [b.lat, b.lon] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, balloons]);

  return null;
}

// Component to handle map navigation (exposed via ref)
function MapController({ targetAlert }: { targetAlert: any | null }) {
  const map = useMap();

  useEffect(() => {
    if (targetAlert && targetAlert.geometry) {
      const geom = targetAlert.geometry;
      let center: LatLng;
      let zoom = 10;

      if (geom.type === 'Point') {
        center = new LatLng(geom.coordinates[1], geom.coordinates[0]);
      } else if (geom.type === 'Polygon' && geom.coordinates[0]) {
        // Calculate center of polygon
        const coords = geom.coordinates[0];
        const latSum = coords.reduce((sum: number, coord: number[]) => sum + coord[1], 0);
        const lonSum = coords.reduce((sum: number, coord: number[]) => sum + coord[0], 0);
        center = new LatLng(latSum / coords.length, lonSum / coords.length);
        
        // Calculate bounds to fit polygon
        const bounds = new LatLngBounds(
          coords.map((coord: number[]) => [coord[1], coord[0]] as [number, number])
        );
        map.flyToBounds(bounds, { padding: [100, 100], maxZoom: 12 });
        return;
      } else if (geom.type === 'MultiPolygon') {
        // Use first polygon
        const coords = geom.coordinates[0][0];
        const latSum = coords.reduce((sum: number, coord: number[]) => sum + coord[1], 0);
        const lonSum = coords.reduce((sum: number, coord: number[]) => sum + coord[0], 0);
        center = new LatLng(latSum / coords.length, lonSum / coords.length);
        
        const bounds = new LatLngBounds(
          coords.map((coord: number[]) => [coord[1], coord[0]] as [number, number])
        );
        map.flyToBounds(bounds, { padding: [100, 100], maxZoom: 12 });
        return;
      } else {
        return;
      }

      map.flyTo(center, zoom, { duration: 1.5 });
    }
  }, [map, targetAlert]);

  return null;
}

// Style function for GeoJSON alerts - Enhanced visibility
function getAlertStyle(feature: any) {
  const severity = (feature?.properties?.severity || '').toLowerCase();
  const urgency = (feature?.properties?.urgency || '').toLowerCase();
  
  // Color based on severity and urgency (NWS uses: Extreme, Severe, Moderate, Minor, Unknown)
  let color = '#FF6B6B'; // Default red
  if (severity === 'extreme' || urgency === 'immediate') {
    color = '#C92A2A'; // Dark red - Extreme/Immediate
  } else if (severity === 'severe') {
    color = '#F76707'; // Orange - Severe
  } else if (severity === 'moderate') {
    color = '#FFD43B'; // Yellow - Moderate
  } else if (severity === 'minor' || severity === 'unknown') {
    color = '#51CF66'; // Green - Minor/Unknown
  } else if (urgency === 'expected') {
    color = '#F76707'; // Orange for expected urgency
  }

  return {
    fillColor: color,
    color: color,
    weight: 5, // Thicker border for better visibility
    opacity: 1.0, // Full opacity border
    fillOpacity: 0.5, // More visible fill
    dashArray: severity === 'extreme' || urgency === 'immediate' ? '10, 5' : undefined, // Dashed for extreme
  };
}

// Get hover style for alerts
function getAlertHoverStyle(feature: any) {
  const baseStyle = getAlertStyle(feature);
  return {
    ...baseStyle,
    weight: 7, // Even thicker on hover
    opacity: 1,
    fillOpacity: 0.65, // More visible on hover
  };
}

export default function BalloonMap({ balloons, alerts, loading, loadingAlerts }: BalloonMapProps) {
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  const [isHazardsPanelOpen, setIsHazardsPanelOpen] = useState(true);

  // Filter alerts to only show those with valid geometry
  const validAlerts = useMemo(() => {
    return alerts.filter(alert => {
      const geom = alert?.geometry;
      return geom && (geom.type === 'Polygon' || geom.type === 'MultiPolygon' || geom.type === 'Point');
    });
  }, [alerts]);

  // Sort alerts by severity (extreme first, then severe, etc.)
  const sortedAlerts = useMemo(() => {
    const severityOrder: { [key: string]: number } = {
      'extreme': 0,
      'severe': 1,
      'moderate': 2,
      'minor': 3,
      'unknown': 4,
    };
    
    return [...validAlerts].sort((a, b) => {
      const aSeverity = (a?.properties?.severity || 'unknown').toLowerCase();
      const bSeverity = (b?.properties?.severity || 'unknown').toLowerCase();
      return (severityOrder[aSeverity] ?? 99) - (severityOrder[bSeverity] ?? 99);
    });
  }, [validAlerts]);

  // Calculate center point from balloons or default
  const center: [number, number] = useMemo(() => {
    if (balloons.length > 0) {
      const avgLat = balloons.reduce((sum, b) => sum + b.lat, 0) / balloons.length;
      const avgLon = balloons.reduce((sum, b) => sum + b.lon, 0) / balloons.length;
      return [avgLat, avgLon];
    }
    return [39.8283, -98.5795]; // Default center (USA center)
  }, [balloons]);

  const handleNavigateToAlert = (alert: any) => {
    setSelectedAlert(alert);
    // Reset after animation completes
    setTimeout(() => setSelectedAlert(null), 2000);
  };

  const getSeverityColor = (severity: string): string => {
    const severityLower = severity.toLowerCase();
    if (severityLower === 'extreme') return '#C92A2A';
    if (severityLower === 'severe') return '#F76707';
    if (severityLower === 'moderate') return '#FFD43B';
    if (severityLower === 'minor' || severityLower === 'unknown') return '#51CF66';
    return '#64748b';
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading balloon data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen relative">
      {/* Main Info Panel */}
      <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg border" style={{ zIndex: 1000 }}>
        <h1 className="text-xl font-bold mb-2">Windborne Balloon & Hazard Tracker</h1>
        <div className="text-sm space-y-1">
          <p>
            <span className="font-semibold">Balloons:</span> {balloons.length}
          </p>
          <p>
            <span className="font-semibold">Active Hazards (US):</span> {validAlerts.length}
            {loadingAlerts && <span className="text-gray-500 ml-1">(updating...)</span>}
          </p>
        </div>
        <div className="mt-3 pt-3 border-t text-xs">
          <p className="font-semibold mb-2 text-gray-700">Legend:</p>
          <div className="space-y-1 text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#C92A2A' }}></div>
              <span>Extreme/Immediate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#F76707' }}></div>
              <span>Severe</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#FFD43B' }}></div>
              <span>Moderate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#51CF66' }}></div>
              <span>Minor/Unknown</span>
            </div>
          </div>
          <p className="mt-2 text-gray-500">🟦 Blue markers = Balloons</p>
        </div>
      </div>

      {/* Info Panel - Always Visible at Bottom Left */}
      <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg border max-w-md" style={{ zIndex: 1000 }}>
        <div className="text-xs text-gray-600 space-y-2">
          <div>
            <p className="font-semibold text-gray-800 mb-1">⚠️ Weather Hazards:</p>
            <p className="leading-relaxed">
              Weather hazards are currently only available for the United States (US) through the National Weather Service (NWS) API. Hazards for other regions are not displayed on this map.
            </p>
          </div>
          <div className="pt-2 border-t border-gray-200">
            <p className="font-semibold text-gray-800 mb-1">🎈 Balloon Display:</p>
            <p className="leading-relaxed">
              Only 100 balloons are displayed on the map for better UI performance and to prevent visual clutter. The full constellation contains many more balloons, but this limited view ensures a smooth and clear visualization experience.
            </p>
          </div>
        </div>
      </div>

      {/* Hazards List Panel */}
      {isHazardsPanelOpen && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border" style={{ zIndex: 1000, maxHeight: 'calc(100vh - 2rem)', width: '380px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div className="p-4 border-b bg-gradient-to-r from-red-50 to-orange-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">US Weather Hazards</h2>
              <button
                onClick={() => setIsHazardsPanelOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-xl leading-none"
                aria-label="Close panel"
              >
                ×
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-1">Click to navigate to hazard</p>
          </div>
          <div className="overflow-y-auto flex-1" style={{ maxHeight: 'calc(100vh - 120px)' }}>
            {loadingAlerts ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
                <p className="text-sm">Loading hazards...</p>
              </div>
            ) : sortedAlerts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-sm">No active hazards</p>
              </div>
            ) : (
              <div className="divide-y">
                {sortedAlerts.map((alert, idx) => {
                  const props = alert?.properties || {};
                  const headline = props.headline || props.event || 'Weather Alert';
                  const severity = props.severity || 'Unknown';
                  const urgency = props.urgency || 'Unknown';
                  const areaDesc = props.areaDesc || 'Unknown Area';
                  const event = props.event || '';
                  const severityColor = getSeverityColor(severity);
                  const isSelected = selectedAlert === alert;

                  return (
                    <div
                      key={alert?.properties?.id || idx}
                      className={`p-3 hover:bg-gray-50 cursor-pointer transition-all ${
                        isSelected ? 'bg-blue-50 border-l-4' : 'border-l-4'
                      }`}
                      style={{ borderLeftColor: severityColor }}
                      onClick={() => handleNavigateToAlert(alert)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: severityColor }}
                            ></div>
                            <h3 className="font-semibold text-sm text-gray-900 truncate">{headline}</h3>
                          </div>
                          {event && (
                            <p className="text-xs font-medium mb-1" style={{ color: severityColor }}>
                              {event.toUpperCase()}
                            </p>
                          )}
                          <p className="text-xs text-gray-600 mb-2 truncate" title={areaDesc}>
                            📍 {areaDesc}
                          </p>
                          <div className="flex gap-3 text-xs">
                            <span className="font-medium" style={{ color: severityColor }}>
                              {severity}
                            </span>
                            <span className="text-gray-500">{urgency}</span>
                          </div>
                        </div>
                        <button
                          className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavigateToAlert(alert);
                          }}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toggle button when panel is closed */}
      {!isHazardsPanelOpen && (
        <button
          onClick={() => setIsHazardsPanelOpen(true)}
          className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg font-semibold text-sm transition-colors"
          style={{ zIndex: 1000 }}
        >
          Show Hazards ({validAlerts.length})
        </button>
      )}

      <MapContainer
        center={center}
        zoom={balloons.length > 0 ? 3 : 2}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <FitBounds balloons={balloons} />
        <MapController targetAlert={selectedAlert} />

        {/* Display alerts/hazards */}
        {validAlerts.map((alert, idx) => (
          <GeoJSON
            key={alert?.properties?.id || idx}
            data={alert.geometry}
            style={getAlertStyle(alert)}
            onEachFeature={(_feature, layer) => {
              if (alert?.properties) {
                const props = alert.properties;
                const severity = props.severity || 'Unknown';
                const severityLower = severity.toLowerCase();
                
                // Add CSS class for animation on extreme/severe hazards
                if (severityLower === 'extreme' || severityLower === 'severe') {
                  layer.on('add', () => {
                    // Access the path element for styling
                    const path = (layer as any)._path;
                    if (path) {
                      path.classList.add(severityLower === 'extreme' ? 'hazard-extreme' : 'hazard-severe');
                    }
                  });
                }
                
                const popupContent = document.createElement('div');
                const headline = props.headline || props.event || 'Weather Alert';
                const urgency = props.urgency || 'Unknown';
                const areaDesc = props.areaDesc || '';
                const description = props.description || '';
                const event = props.event || '';
                
                // Get severity color
                let severityColor = '#64748b';
                if (severityLower === 'extreme') severityColor = '#C92A2A';
                else if (severityLower === 'severe') severityColor = '#F76707';
                else if (severityLower === 'moderate') severityColor = '#FFD43B';
                else if (severityLower === 'minor' || severityLower === 'unknown') severityColor = '#51CF66';
                
                // Escape HTML to prevent XSS
                const escapeHtml = (text: string) => {
                  const div = document.createElement('div');
                  div.textContent = text;
                  return div.innerHTML;
                };
                
                popupContent.innerHTML = `
                  <div style="padding: 12px; max-width: 400px; font-family: system-ui, -apple-system, sans-serif;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 2px solid ${severityColor};">
                      <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${severityColor};"></div>
                      <h3 style="font-weight: bold; font-size: 15px; margin: 0; color: #1e293b; line-height: 1.3;">${escapeHtml(headline)}</h3>
                    </div>
                    ${event ? `<p style="font-size: 12px; font-weight: 600; color: ${severityColor}; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">${escapeHtml(event)}</p>` : ''}
                    ${areaDesc ? `<p style="font-size: 12px; color: #64748b; margin-bottom: 8px;"><strong>📍 Area:</strong> ${escapeHtml(areaDesc)}</p>` : ''}
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; padding: 8px; background-color: #f8fafc; border-radius: 6px;">
                      <div>
                        <p style="font-size: 11px; color: #64748b; margin: 0 0 2px 0;">Severity</p>
                        <p style="font-size: 13px; font-weight: 600; color: ${severityColor}; margin: 0;">${escapeHtml(severity)}</p>
                      </div>
                      <div>
                        <p style="font-size: 11px; color: #64748b; margin: 0 0 2px 0;">Urgency</p>
                        <p style="font-size: 13px; font-weight: 600; color: #1e293b; margin: 0;">${escapeHtml(urgency)}</p>
                      </div>
                    </div>
                    ${description ? `<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e2e8f0;"><p style="font-size: 12px; line-height: 1.5; color: #475569; margin: 0;">${escapeHtml(description.substring(0, 400))}${description.length > 400 ? '...' : ''}</p></div>` : ''}
                  </div>
                `;
                layer.bindPopup(popupContent, {
                  maxWidth: 420,
                  className: 'alert-popup'
                });
                
                // Add hover effects
                layer.on({
                  mouseover: (e) => {
                    const layer = e.target;
                    layer.setStyle(getAlertHoverStyle(alert));
                    layer.openPopup();
                  },
                  mouseout: (e) => {
                    const layer = e.target;
                    layer.setStyle(getAlertStyle(alert));
                  }
                });
              }
            }}
          />
        ))}

        {/* Display balloons */}
        {balloons.map((balloon) => (
          <Marker
            key={balloon.id}
            position={[balloon.lat, balloon.lon]}
            icon={DefaultIcon}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-sm mb-1">Balloon {balloon.id}</h3>
                <p className="text-xs">
                  <strong>Position:</strong> {balloon.lat.toFixed(4)}, {balloon.lon.toFixed(4)}
                </p>
                {balloon.altitude !== null && balloon.altitude !== undefined && (
                  <p className="text-xs">
                    <strong>Altitude:</strong> {balloon.altitude.toFixed(0)} m
                  </p>
                )}
                {balloon.hourIndex !== undefined && (
                  <p className="text-xs">
                    <strong>Data from:</strong> {balloon.hourIndex === 0 ? 'Current hour' : `${balloon.hourIndex} hours ago`}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

