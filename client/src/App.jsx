import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import { 
  Zap, BatteryCharging, AlertTriangle, Clock, Gauge, Compass, 
  MapPin, Activity, RotateCcw, Navigation, Car
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// CSS injected directly for guaranteed premium styling without touching index.css
const premiumStyles = `
  .voltpath-app {
    min-height: 100vh;
    background-color: #020617;
    background-image: radial-gradient(circle at 50% -20%, #1e3a8a 0%, #020617 70%);
    color: #f8fafc;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  }
  .glass-panel {
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
    border-radius: 16px;
  }
  .route-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: rgba(15, 23, 42, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }
  .route-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px -10px rgba(0, 0, 0, 0.5);
    background: rgba(15, 23, 42, 0.8);
  }
  .data-box {
    background: rgba(2, 6, 23, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.03);
    transition: all 0.2s;
  }
  .data-box:hover {
    border-color: rgba(255, 255, 255, 0.15);
  }
  .neon-text-blue {
    background: linear-gradient(135deg, #38bdf8, #818cf8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .neon-text-green {
    background: linear-gradient(135deg, #34d399, #10b981);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .svg-glow-blue { filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.6)); }
  .svg-glow-green { filter: drop-shadow(0 0 6px rgba(52, 211, 153, 0.6)); }
  
  /* Custom Scrollbar for Dropdown */
  .custom-scroll::-webkit-scrollbar { width: 6px; }
  .custom-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
  .custom-scroll::-webkit-scrollbar-thumb { background: rgba(56,189,248,0.3); border-radius: 10px; }
  .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(56,189,248,0.6); }
  .dark-map-tiles { filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%); }

  /* Pitch-Dark Absolute Dropdown */
  .ev-dropdown-list {
    position: absolute !important;
    top: calc(100% + 8px) !important;
    left: 0 !important;
    width: 100% !important;
    background-color: #020617 !important;
    opacity: 1 !important;
    z-index: 9999 !important;
    border: 1px solid #38bdf8 !important;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.98), 0 0 30px rgba(56, 189, 248, 0.35) !important;
  }

  /* Custom Leaflet Dark Popups */
  .leaflet-popup-content-wrapper {
    background-color: #0f172a !important;
    color: #f8fafc !important;
    border: 1px solid rgba(56, 189, 248, 0.3) !important;
    border-radius: 12px !important;
    box-shadow: 0 10px 25px rgba(0,0,0,0.8) !important;
  }
  .leaflet-popup-tip {
    background-color: #0f172a !important;
    border: 1px solid rgba(56, 189, 248, 0.3) !important;
  }

  /* Custom Origin White Dot Marker */
  .origin-marker-icon {
    background: #ffffff !important;
    border: 3px solid #0f172a !important;
    border-radius: 50% !important;
    box-shadow: 0 0 12px rgba(255, 255, 255, 0.9) !important;
  }

  /* Custom Destination Red Pin Marker */
  .destination-pin-icon {
    background: transparent !important;
    border: none !important;
  }
  .pin-shape {
    width: 24px;
    height: 24px;
    background-color: #ef4444;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    position: absolute;
    left: 50%;
    top: 50%;
    margin: -12px 0 0 -12px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
    border: 2px solid #ffffff;
  }
`;

// Expanded Database of EVs
const EV_DATABASE = [
  { name: 'Tata Nexon EV LR (40.5 kWh)', batteryCapacityKwh: 40.5, ratedConsumptionKwhPerKm: 0.14, connector: 'CCS2' },
  { name: 'Tata Curvv EV (55.0 kWh)', batteryCapacityKwh: 55.0, ratedConsumptionKwhPerKm: 0.145, connector: 'CCS2' },
  { name: 'Tata Punch EV LR (35.0 kWh)', batteryCapacityKwh: 35.0, ratedConsumptionKwhPerKm: 0.12, connector: 'CCS2' },
  { name: 'Tata Tiago EV LR (24.0 kWh)', batteryCapacityKwh: 24.0, ratedConsumptionKwhPerKm: 0.11, connector: 'CCS2' },
  { name: 'MG ZS EV (50.3 kWh)', batteryCapacityKwh: 50.3, ratedConsumptionKwhPerKm: 0.155, connector: 'CCS2' },
  { name: 'MG Windsor EV (38.0 kWh)', batteryCapacityKwh: 38.0, ratedConsumptionKwhPerKm: 0.135, connector: 'CCS2' },
  { name: 'Mahindra XUV400 (39.4 kWh)', batteryCapacityKwh: 39.4, ratedConsumptionKwhPerKm: 0.15, connector: 'CCS2' },
  { name: 'BYD Atto 3 (60.48 kWh)', batteryCapacityKwh: 60.48, ratedConsumptionKwhPerKm: 0.15, connector: 'CCS2' },
  { name: 'BYD Seal Premium (82.5 kWh)', batteryCapacityKwh: 82.5, ratedConsumptionKwhPerKm: 0.17, connector: 'CCS2' },
  { name: 'Hyundai Ioniq 5 (72.6 kWh)', batteryCapacityKwh: 72.6, ratedConsumptionKwhPerKm: 0.16, connector: 'CCS2' },
  { name: 'Kia EV6 GT-Line (77.4 kWh)', batteryCapacityKwh: 77.4, ratedConsumptionKwhPerKm: 0.165, connector: 'CCS2' },
  { name: 'Volvo XC40 Recharge (78.0 kWh)', batteryCapacityKwh: 78.0, ratedConsumptionKwhPerKm: 0.20, connector: 'CCS2' },
  { name: 'Mercedes-Benz EQE (90.5 kWh)', batteryCapacityKwh: 90.5, ratedConsumptionKwhPerKm: 0.19, connector: 'CCS2' }
];

function ChangeMapView({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 1.5 });
    }
  }, [coords, map]);
  return null;
}

const createPinIcon = (color) => {
  return L.divIcon({
    className: 'custom-pin-wrapper',
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 0 12px ${color}80;"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

const originIcon = L.divIcon({
  className: 'origin-marker-icon',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const destinationIcon = L.divIcon({
  className: 'destination-pin-icon',
  html: '<div class="pin-shape"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 24]
});

export default function App() {
  const [evSearch, setEvSearch] = useState('Tata Nexon EV LR (40.5 kWh)');
  const [showEvDropdown, setShowEvDropdown] = useState(false);
  const [startSoc, setStartSoc] = useState(100);
  const [origin, setOrigin] = useState('Connaught Place, New Delhi');
  const [destination, setDestination] = useState('Taj Mahal, Agra');
  const [activeRouteIndex, setActiveRouteIndex] = useState(0);
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(false);

  const activeEV = EV_DATABASE.find(v => v.name === evSearch) || EV_DATABASE[0];

  const fetchRoutePlan = async (overrideSoc = null, overrideVehicle = null) => {
    setLoading(true);
    const soc = overrideSoc !== null ? overrideSoc : startSoc;
    const vehicle = overrideVehicle !== null ? overrideVehicle : activeEV;
    try {
      const response = await fetch('https://voltpath-api.vercel.app/api/plan-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleSpec: vehicle, startSocPercent: Number(soc), origin, destination })
      });
      const data = await response.json();
      if (data.routes) setTripData(data);
    } catch (err) {
      console.error('API connection failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoutePlan(); }, []);

  const setScenario = (soc) => { setStartSoc(soc); fetchRoutePlan(soc); };

  const selectedRoute = tripData?.routes?.[activeRouteIndex] || tripData?.routes?.[0];
  const maxSafeRange = tripData ? Math.round(((startSoc / 100) * tripData.vehicle.batteryCapacityKwh) / tripData.vehicle.ratedConsumptionKwhPerKm) : 0;
  
  const filteredEVs = EV_DATABASE.filter(ev => 
    ev.name.toLowerCase().includes((evSearch || '').toLowerCase())
  );

  // Helper Function: Scaled crisp mapping generation for SVG
  const generateGraphData = (route) => {
    if (!route || !tripData) return { pointsString: "", stopsData: [], endX: 1150 };
    
    const totalWidth = 1100; // Expands across the massive 1200 viewBox
    const startX = 50;
    const batCap = tripData.vehicle.batteryCapacityKwh;
    const avgKwhPerKm = route.energyUsedKwh / route.distanceKm; 
    
    let currSoc = startSoc;
    let currDist = 0;
    
    // Formula: Map SOC (0-100) linearly to SVG Y-coordinates (170 bottom to 20 top)
    // 100% = Y:20 | 0% = Y:170 => Y = 170 - (SOC * 1.5)
    const getPointY = (soc) => 170 - (soc * 1.5);
    
    const points = [[startX, getPointY(currSoc)]];
    const stopsData = [];
    
    if (route.stops && route.stops.length > 0) {
      route.stops.forEach((stop, idx) => {
        const stopDist = stop.station.distanceAlongRouteKm;
        const distTraveled = stopDist - currDist;
        const kwhUsed = distTraveled * avgKwhPerKm;
        const arrivalSoc = Math.max(0, currSoc - (kwhUsed / batCap) * 100);
        
        const x = startX + (stopDist / route.distanceKm) * totalWidth;
        
        points.push([x, getPointY(arrivalSoc)]); // Plunge down to arrival SOC
        points.push([x, getPointY(stop.targetSocPercent)]); // Spike up to target charging SOC
        
        stopsData.push({ x, idx: idx + 1 });
        
        currSoc = stop.targetSocPercent;
        currDist = stopDist;
      });
    }
    
    const endX = startX + totalWidth;
    points.push([endX, getPointY(route.endSocPercent)]);
    
    return {
      pointsString: points.map(p => p.join(',')).join(' '),
      stopsData,
      endX
    };
  };

  const graphData = selectedRoute ? generateGraphData(selectedRoute) : null;

  return (
    <div className="voltpath-app" style={{ padding: '1.5rem 2.5rem' }}>
      <style>{premiumStyles}</style>
      
      {/* Top Navbar */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)', padding: '0.75rem', borderRadius: '14px', boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)' }}>
            <Zap size={26} color="#ffffff" />
          </div>
          <div>
            <h1 className="neon-text-blue" style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>
              VoltPath Intelligence
            </h1>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500, letterSpacing: '0.02em' }}>
              Multi-Stop EV Range, Elevation & Corridor Telemetry Engine
            </p>
          </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', borderRadius: '12px' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', padding: '0 0.5rem' }}>Presets</span>
          <button onClick={() => setScenario(100)} style={{ background: startSoc === 100 ? 'rgba(56,189,248,0.2)' : 'transparent', color: startSoc === 100 ? '#38bdf8' : '#f8fafc', border: startSoc === 100 ? '1px solid rgba(56,189,248,0.5)' : '1px solid transparent', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}>100% Full</button>
          <button onClick={() => setScenario(50)} style={{ background: startSoc === 50 ? 'rgba(56,189,248,0.2)' : 'transparent', color: startSoc === 50 ? '#38bdf8' : '#f8fafc', border: startSoc === 50 ? '1px solid rgba(56,189,248,0.5)' : '1px solid transparent', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}>50% Mid</button>
          <button onClick={() => setScenario(20)} style={{ background: startSoc === 20 ? 'rgba(239,68,68,0.2)' : 'transparent', color: startSoc === 20 ? '#ef4444' : '#f8fafc', border: startSoc === 20 ? '1px solid rgba(239,68,68,0.5)' : '1px solid transparent', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}>20% Critical</button>
        </div>
      </nav>

      {/* Control Inputs Container (zIndex 100 overlaps Route A block seamlessly) */}
      <div className="glass-panel" style={{ position: 'relative', zIndex: 100, padding: '1.5rem', marginBottom: '2rem', display: 'grid', gridTemplateColumns: '1.4fr 1.6fr 1.2fr 1.2fr auto', gap: '1.25rem', alignItems: 'center' }}>
        
        {/* Dynamic EV Model Search Input Wrapper */}
        <div style={{ position: 'relative' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Vehicle Architecture</label>
          <div className="data-box" style={{ display: 'flex', alignItems: 'center', padding: '0.6rem 0.8rem', gap: '0.5rem', borderRadius: '10px' }}>
            <Car size={16} color="#818cf8" />
            <input 
              type="text" 
              value={evSearch} 
              onChange={(e) => { setEvSearch(e.target.value); setShowEvDropdown(true); }} 
              onFocus={() => setShowEvDropdown(true)}
              onBlur={() => setTimeout(() => setShowEvDropdown(false), 200)}
              placeholder="Search EV database..."
              style={{ background: 'transparent', border: 'none', color: '#f8fafc', width: '100%', fontSize: '0.9rem', outline: 'none', fontWeight: 500 }} 
            />
          </div>
          
          {showEvDropdown && (
            <div className="glass-panel custom-scroll ev-dropdown-list" style={{ maxHeight: '280px', overflowY: 'auto', padding: '0.5rem' }}>
              {filteredEVs.length > 0 ? (
                filteredEVs.map((ev, i) => (
                  <div 
                    key={i}
                    onMouseDown={() => { setEvSearch(ev.name); setShowEvDropdown(false); fetchRoutePlan(startSoc, ev); }}
                    style={{ padding: '0.75rem', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#f8fafc' }}>{ev.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.2rem' }}>{ev.batteryCapacityKwh} kWh Capacity • {ev.ratedConsumptionKwhPerKm} kWh/km</div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '0.75rem', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center' }}>
                  No matching models found.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Battery Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>State of Charge</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: startSoc > 30 ? '#38bdf8' : '#ef4444' }}>
              {startSoc}% <span style={{ color: '#64748b', fontWeight: 500 }}>({maxSafeRange} km)</span>
            </span>
          </div>
          <input 
            type="range" min="10" max="100" value={startSoc} 
            onChange={(e) => setStartSoc(Number(e.target.value))}
            onMouseUp={() => fetchRoutePlan(startSoc)}
            onTouchEnd={() => fetchRoutePlan(startSoc)}
            style={{ width: '100%', height: '6px', borderRadius: '4px', cursor: 'pointer', accentColor: startSoc > 30 ? '#38bdf8' : '#ef4444' }} 
          />
        </div>

        {/* Origin */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Origin</label>
          <div className="data-box" style={{ display: 'flex', alignItems: 'center', padding: '0.6rem 0.8rem', gap: '0.5rem', borderRadius: '10px' }}>
            <MapPin size={16} color="#38bdf8" />
            <input type="text" value={origin} onChange={(e) => setOrigin(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#f8fafc', width: '100%', fontSize: '0.9rem', outline: 'none' }} />
          </div>
        </div>

        {/* Destination */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Destination</label>
          <div className="data-box" style={{ display: 'flex', alignItems: 'center', padding: '0.6rem 0.8rem', gap: '0.5rem', borderRadius: '10px' }}>
            <Navigation size={16} color="#34d399" />
            <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#f8fafc', width: '100%', fontSize: '0.9rem', outline: 'none' }} />
          </div>
        </div>

        {/* Optimize Button */}
        <div>
          <button 
            onClick={() => fetchRoutePlan(startSoc)} disabled={loading}
            style={{ 
              background: 'linear-gradient(135deg, #0ea5e9, #2563eb)', color: '#fff', border: 'none', 
              padding: '0.85rem 1.5rem', borderRadius: '10px', fontWeight: 800, fontSize: '0.9rem', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', 
              boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)', transition: 'all 0.2s', marginTop: '1.2rem'
            }}
          >
            {loading ? <RotateCcw className="animate-spin" size={16} /> : <Activity size={16} />}
            Execute Route
          </button>
        </div>
      </div>

      {/* Main Grid: Comparison Cards & Leaflet Map */}
      {tripData && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.3fr', gap: '2rem', marginBottom: '2rem' }}>
          
          {/* Left: Dual Route Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Corridor Trajectories
              </span>
            </div>

            {tripData.routes.map((r, idx) => {
              const isSelected = activeRouteIndex === idx;
              return (
                <div 
                  key={idx} 
                  onClick={() => setActiveRouteIndex(idx)}
                  className={`route-card ${isSelected ? 'glass-panel' : ''}`}
                  style={{ 
                    borderRadius: '16px', padding: '1.5rem', cursor: 'pointer',
                    border: isSelected ? `1px solid ${r.color}80` : '',
                    boxShadow: isSelected ? `0 0 30px ${r.color}20` : ''
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: r.color, boxShadow: `0 0 10px ${r.color}` }}></div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>{r.routeName}</h3>
                    </div>
                    <span style={{ 
                      fontSize: '0.75rem', padding: '0.35rem 0.8rem', borderRadius: '999px', fontWeight: 800,
                      background: r.willMakeItDirectly ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
                      color: r.willMakeItDirectly ? '#34d399' : '#f87171',
                      border: r.willMakeItDirectly ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                    }}>
                      {r.willMakeItDirectly ? 'Direct Arrival' : 'Charging Required'}
                    </span>
                  </div>

                  {/* Metrics */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div className="data-box" style={{ padding: '0.75rem', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}><Compass size={13}/> Dist</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{r.distanceKm} km</div>
                    </div>
                    <div className="data-box" style={{ padding: '0.75rem', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}><Clock size={13}/> Time</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{Math.floor(r.driveTimeMinutes / 60)}h {r.driveTimeMinutes % 60}m</div>
                    </div>
                    <div className="data-box" style={{ padding: '0.75rem', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}><Gauge size={13}/> Energy</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{r.energyUsedKwh} kWh</div>
                    </div>
                    <div className="data-box" style={{ padding: '0.75rem', borderRadius: '10px', textAlign: 'center', border: r.endSocPercent < 15 && r.endSocPercent > 0 ? '1px solid rgba(239,68,68,0.4)' : '' }}>
                      <div style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}><BatteryCharging size={13}/> End SoC</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: r.endSocPercent === 0 ? '#ef4444' : r.endSocPercent < 15 ? '#f59e0b' : '#10b981' }}>{r.endSocPercent}%</div>
                    </div>
                  </div>

                  {/* Multi-Stop Iteration & Range Boost Rendering */}
                  {r.stops && r.stops.length > 0 && r.stops.map((stop, sIdx) => (
                    <div key={sIdx} style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '0.85rem 1.2rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38bdf8' }}>
                          ⚡ Stop {sIdx + 1}: {stop.station.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                          {stop.station.powerKw} kW DC Fast Charger
                        </div>
                        {stop.distanceCoveredAfterStop && (
                          <div style={{ fontSize: '0.7rem', color: '#34d399', marginTop: '0.2rem', fontWeight: 600 }}>
                            Provides ~{stop.distanceCoveredAfterStop} km of onward highway range
                          </div>
                        )}
                      </div>
                      <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800, color: '#38bdf8', border: '1px solid #334155', textAlign: 'center' }}>
                        +{stop.chargeTimeMinutes} <br /><span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>mins</span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Warnings (including stranded protocol) */}
                  {r.warnings && r.warnings.length > 0 && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '10px', padding: '0.75rem 1rem', marginTop: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f87171', fontSize: '0.8rem', fontWeight: 800 }}>
                        <AlertTriangle size={15} /> Navigation Warning
                      </div>
                      {r.warnings.map((w, wIdx) => <div key={wIdx} style={{ fontSize: '0.75rem', color: '#fca5a5', marginTop: '0.4rem', lineHeight: '1.4' }}>{w}</div>)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right: Map */}
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', height: '650px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live Topographic Radar</span>
            </div>

            <div style={{ flex: 1, borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
              <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
                <TileLayer 
                  attribution='&copy; OpenStreetMap contributors' 
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                  className="dark-map-tiles"
                />
                <ChangeMapView coords={selectedRoute ? selectedRoute.pathCoordinates : null} />

                <Polyline 
                  positions={tripData.routes[0].pathCoordinates} 
                  color="#38bdf8" 
                  weight={6} 
                  opacity={1} 
                />

                <Polyline 
                  positions={tripData.routes[1].pathCoordinates.map(([lat, lon]) => [lat - 0.006, lon + 0.006])} 
                  color="#34d399" 
                  weight={6} 
                  opacity={1} 
                />

                {tripData.startCoords && (
                  <Marker position={tripData.startCoords} icon={originIcon}>
                    <Popup>
                      <div style={{ color: '#020617', fontWeight: 'bold' }}>Origin: {tripData.origin}</div>
                    </Popup>
                  </Marker>
                )}
                {tripData.endCoords && (
                  <Marker position={tripData.endCoords} icon={destinationIcon}>
                    <Popup>
                      <div style={{ color: '#020617', fontWeight: 'bold' }}>Destination: {tripData.destination}</div>
                    </Popup>
                  </Marker>
                )}

                {/* Charging Station Markers with Custom Styled Dark Popups */}
                {tripData.stations && tripData.stations.map((st) => (
                  <Marker key={st.id} position={[st.coordinates[1], st.coordinates[0]]} icon={createPinIcon(st.color || (st.status === 'Operational' ? '#10b981' : st.status === 'Degraded' ? '#f59e0b' : '#ef4444'))}>
                    <Popup>
                      <div style={{ fontSize: '0.85rem', lineHeight: '1.5', minWidth: '150px' }}>
                        <strong style={{ color: '#38bdf8', display: 'block', fontSize: '0.9rem', marginBottom: '4px' }}>{st.name}</strong>
                        <span style={{ color: '#cbd5e1' }}>{st.powerKw > 0 ? `${st.powerKw} kW DC Fast Charging` : 'Standard Charging'}</span><br />
                        <span style={{ fontWeight: 700, display: 'inline-block', marginTop: '4px', color: st.status === 'Operational' ? '#34d399' : st.status === 'Degraded' ? '#f59e0b' : '#ef4444' }}>
                          Status: {st.status}
                        </span>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        </div>
      )}

      {/* Battery Curve */}
      {tripData && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>Discharge Telemetry Vector ({selectedRoute?.distanceKm} km)</h3>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', fontWeight: 700 }}>
              <span className="neon-text-blue" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: '12px', height: '3px', background: '#38bdf8' }}></div> Active Route Profile</span>
              <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: '12px', height: '3px', background: '#ef4444', borderStyle: 'dashed' }}></div> 15% Safety Floor</span>
            </div>
          </div>

          <div className="data-box" style={{ padding: '1.25rem', borderRadius: '12px' }}>
            {/* 1200px ViewBox creates a massive internal canvas that prevents the graph from looking squished */}
            <svg viewBox="0 0 1200 210" style={{ width: '100%', height: '180px', overflow: 'visible' }}>
              
              {/* Geometric Guide Lines expanding edge-to-edge */}
              <line x1="50" y1="50" x2="1150" y2="50" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
              <line x1="50" y1="95" x2="1150" y2="95" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
              <line x1="50" y1="147.5" x2="1150" y2="147.5" stroke="rgba(239, 68, 68, 0.5)" strokeDasharray="5 5" strokeWidth="2" />

              {/* Y-Axis Metrics */}
              <text x="10" y="54" fill="#94a3b8" fontSize="12" fontWeight="700">80%</text>
              <text x="10" y="99" fill="#94a3b8" fontSize="12" fontWeight="700">50%</text>
              <text x="10" y="151.5" fill="#ef4444" fontSize="12" fontWeight="700">15%</text>

              {graphData && (
                <>
                  {/* Dynamic Discharge Polyline */}
                  <polyline
                    fill="none"
                    stroke={selectedRoute?.color || '#38bdf8'}
                    strokeWidth="3.5"
                    className={activeRouteIndex === 0 ? 'svg-glow-blue' : 'svg-glow-green'}
                    points={graphData.pointsString}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />

                  {/* Crisp Origin Label */}
                  <text x="50" y="195" fill="#64748b" fontSize="13" fontWeight="800" textAnchor="start">Origin</text>
                  
                  {/* Crisp Numbered Stop Bubbles (Infinitely scalable without text overlap) */}
                  {graphData.stopsData.map((stop, idx) => (
                    <g key={idx}>
                      <circle cx={stop.x} cy="190" r="10" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
                      <text x={stop.x} y="194.5" fill="#94a3b8" fontSize="11" fontWeight="800" textAnchor="middle">{stop.idx}</text>
                      <line x1={stop.x} y1="170" x2={stop.x} y2="180" stroke="#64748b" strokeDasharray="2 2" />
                    </g>
                  ))}
                  
                  {/* Crisp Destination Label */}
                  <text x={graphData.endX} y="195" fill="#64748b" fontSize="13" fontWeight="800" textAnchor="end">Destination</text>
                </>
              )}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}