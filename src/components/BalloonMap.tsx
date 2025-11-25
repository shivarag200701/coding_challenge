import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import { Icon, LatLngBounds } from 'leaflet';
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

// Style function for GeoJSON alerts
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
    weight: 3,
    opacity: 0.8,
    fillOpacity: 0.35,
  };
}

// Get hover style for alerts
function getAlertHoverStyle(feature: any) {
  const baseStyle = getAlertStyle(feature);
  return {
    ...baseStyle,
    weight: 4,
    opacity: 1,
    fillOpacity: 0.5,
  };
}

export default function BalloonMap({ balloons, alerts, loading, loadingAlerts }: BalloonMapProps) {
  // Filter alerts to only show those with valid geometry
  const validAlerts = useMemo(() => {
    return alerts.filter(alert => {
      const geom = alert?.geometry;
      return geom && (geom.type === 'Polygon' || geom.type === 'MultiPolygon' || geom.type === 'Point');
    });
  }, [alerts]);

  // Calculate center point from balloons or default
  const center: [number, number] = useMemo(() => {
    if (balloons.length > 0) {
      const avgLat = balloons.reduce((sum, b) => sum + b.lat, 0) / balloons.length;
      const avgLon = balloons.reduce((sum, b) => sum + b.lon, 0) / balloons.length;
      return [avgLat, avgLon];
    }
    return [20, 0]; // Default center (equator, prime meridian)
  }, [balloons]);

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
      <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg border" style={{ zIndex: 1000 }}>
        <h1 className="text-xl font-bold mb-2">Windborne Balloon & Hazard Tracker</h1>
        <div className="text-sm space-y-1">
          <p>
            <span className="font-semibold">Balloons:</span> {balloons.length}
          </p>
          <p>
            <span className="font-semibold">Active Hazards:</span> {validAlerts.length}
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

        {/* Display alerts/hazards */}
        {validAlerts.map((alert, idx) => (
          <GeoJSON
            key={alert?.properties?.id || idx}
            data={alert.geometry}
            style={getAlertStyle(alert)}
            onEachFeature={(_feature, layer) => {
              if (alert?.properties) {
                const popupContent = document.createElement('div');
                const props = alert.properties;
                const headline = props.headline || props.event || 'Weather Alert';
                const severity = props.severity || 'Unknown';
                const urgency = props.urgency || 'Unknown';
                const areaDesc = props.areaDesc || '';
                const description = props.description || '';
                const event = props.event || '';
                
                // Get severity color
                const severityLower = severity.toLowerCase();
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

