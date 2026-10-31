const express = require('express');
const routeCache = new Map();
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Geocode precise house numbers, local streets, or cities to exact lat/lon using Nominatim
async function geocodePlace(query, fallbackLat, fallbackLon) {
  try {
    const res = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { 
        q: query, 
        format: 'json', 
        limit: 1, 
        addressdetails: 1, 
        countrycodes: 'in' 
      },
      headers: { 'User-Agent': 'VoltPath-EV-Planner/1.0' }
    });
    if (res.data && res.data.length > 0) {
      return {
        lat: parseFloat(res.data[0].lat),
        lon: parseFloat(res.data[0].lon),
        displayName: res.data[0].display_name
      };
    }
  } catch (err) {
    console.warn(`Geocoding fallback triggered for: ${query}`);
  }
  return { lat: fallbackLat, lon: fallbackLon, displayName: query };
}

// Realistic Procedural Simulator for Indian EV Corridors
function generateCorridorStations(coords, evConnector, totalDistanceKm) {
  if (!coords || coords.length < 4) return [];
  
  const cpoBrands = [
    { name: 'Tata Power EZ Charge Hub', powerKw: 120 },
    { name: 'Statiq Fast Charging Station', powerKw: 60 },
    { name: 'ChargeZone Supercharger', powerKw: 150 },
    { name: 'Zeon Charging Hub', powerKw: 50 },
    { name: 'Jio-bp pulse Station', powerKw: 60 },
    { name: 'Ather Grid Fast Charger', powerKw: 30 },
    { name: 'BPCL EV Charging Station', powerKw: 50 }
  ];

  const stations = [];
  let currentDist = 30 + (Math.random() * 20); // First station appears between 30-50km

  while (currentDist < totalDistanceKm - 20) {
    const ratio = currentDist / totalDistanceKm;
    const idx = Math.floor(coords.length * ratio);
    if (idx >= coords.length) break;
    
    // Pick a random brand
    const brand = cpoBrands[Math.floor(Math.random() * cpoBrands.length)];
    
    // Apply realistic health statuses: 85% Operational, 10% Degraded, 5% Non-Functional
    const healthRoll = Math.random();
    let currentStatus = 'Operational';
    let currentColor = '#10b981'; // Green
    let actualPower = brand.powerKw;

    if (healthRoll > 0.95) {
      currentStatus = 'Non-Functional';
      currentColor = '#ef4444'; // Red
      actualPower = 0;
    } else if (healthRoll > 0.85) {
      currentStatus = 'Degraded';
      currentColor = '#f59e0b'; // Yellow
      actualPower = Math.max(15, Math.floor(brand.powerKw * 0.4)); // Hardware issue throttles speed
    }
    
    stations.push({
      id: `sim-st-${Math.random().toString(36).substr(2, 9)}`,
      name: `${brand.name} - ${Math.round(currentDist)}km Mark`,
      coordinates: [coords[idx][1], coords[idx][0]], // [lon, lat]
      powerKw: actualPower,
      plugTypes: [evConnector, 'CCS2', 'Type 2'],
      status: currentStatus,
      color: currentColor,
      distanceAlongRouteKm: currentDist
    });
    
    // Stagger next station randomly between 40 to 70 km away
    currentDist += 40 + (Math.random() * 30);
  }
  return stations;
}

// Continuous loop multi-stop evaluation and stranded fallback
function evaluateEnergyProfile({ ev, startSocPercent, distanceKm, durationMinutes, pathCoordinates, isHighway }) {
  const initialEnergyKwh = (Number(startSocPercent) / 100) * ev.batteryCapacityKwh;
  const avgSpeedKmh = Math.max(35, Math.round((distanceKm / (durationMinutes / 60))));

  const speedFactor = avgSpeedKmh > 80 ? 1 + (avgSpeedKmh - 80) * 0.008 : 1.0;
  const terrainFactor = isHighway ? 1.02 : 0.98;
  const effectiveConsumptionRate = ev.ratedConsumptionKwhPerKm * speedFactor * terrainFactor;

  // Generate our realistic simulated stations along the route
  const stationsAlongRoute = generateCorridorStations(pathCoordinates, ev.connector, distanceKm);

  let currentEnergyKwh = initialEnergyKwh;
  let currentDistanceKm = 0;
  let stops = [];
  let warnings = [];
  let isStranded = false;
  let totalChargeTimeMinutes = 0;

  const safeReserveKwh = 0.15 * ev.batteryCapacityKwh; // 15% safety buffer

  // Iterate through the journey
  while (currentDistanceKm < distanceKm) {
    const maxReachKm = currentEnergyKwh / effectiveConsumptionRate;
    const safeReachKm = Math.max(0, (currentEnergyKwh - safeReserveKwh) / effectiveConsumptionRate);

    // Goal 1: Check if the destination is reachable directly from current position
    if (currentDistanceKm + safeReachKm >= distanceKm) {
      currentEnergyKwh -= (distanceKm - currentDistanceKm) * effectiveConsumptionRate;
      currentDistanceKm = distanceKm;
      break; 
    }

    // Goal 2: Find reachable functional chargers
    let reachableStations = stationsAlongRoute.filter(st => 
      st.distanceAlongRouteKm > currentDistanceKm && 
      st.distanceAlongRouteKm <= currentDistanceKm + safeReachKm &&
      st.status !== 'Non-Functional'
    );

    let eatingIntoReserve = false;
    if (reachableStations.length === 0) {
      reachableStations = stationsAlongRoute.filter(st => 
        st.distanceAlongRouteKm > currentDistanceKm && 
        st.distanceAlongRouteKm <= currentDistanceKm + maxReachKm &&
        st.status !== 'Non-Functional'
      );
      if (reachableStations.length > 0) eatingIntoReserve = true;
    }

    if (reachableStations.length > 0) {
      const targetStation = reachableStations[reachableStations.length - 1]; // Route to furthest reachable station
      
      const distToStation = targetStation.distanceAlongRouteKm - currentDistanceKm;
      currentEnergyKwh -= distToStation * effectiveConsumptionRate;
      currentDistanceKm = targetStation.distanceAlongRouteKm;

      if (eatingIntoReserve) {
        warnings.push(`Warning: Battery reserve dropped below 15% to reach ${targetStation.name}.`);
      }

      const targetEnergy = 0.80 * ev.batteryCapacityKwh; // Charge up to 80%
      const energyToCharge = Math.max(0, targetEnergy - currentEnergyKwh);
      const chargeMinutes = Math.round((energyToCharge / (Math.max(1, targetStation.powerKw) * 0.9)) * 60);

      // Distance projected to be covered strictly on the next leg
      const safeDistanceAfterCharge = Math.round((targetEnergy - safeReserveKwh) / effectiveConsumptionRate);

      stops.push({
        station: targetStation,
        chargeTimeMinutes: Math.max(15, chargeMinutes),
        targetSocPercent: 80,
        distanceCoveredAfterStop: safeDistanceAfterCharge,
        risk: {
          isRisky: targetStation.status !== 'Operational',
          warnings: targetStation.status !== 'Operational' ? [`Station reports degraded hardware (${targetStation.powerKw} kW)`] : []
        }
      });

      currentEnergyKwh = targetEnergy;
      totalChargeTimeMinutes += Math.max(15, chargeMinutes);
    } else {
      // Goal 3: Stranded Protocol (Battery depletes before destination or charger)
      isStranded = true;
      const strandedDist = currentDistanceKm + maxReachKm;
      const distToDest = distanceKm - strandedDist;
      
      let nearestStation = null;
      let minStationDist = Infinity;
      
      stationsAlongRoute.forEach(st => {
        const d = Math.abs(st.distanceAlongRouteKm - strandedDist);
        if (d < minStationDist && st.status !== 'Non-Functional') {
          minStationDist = d;
          nearestStation = st;
        }
      });

      let nearestStr = 'No functional stations nearby.';
      if (nearestStation) {
        const direction = nearestStation.distanceAlongRouteKm < strandedDist ? 'behind you' : 'ahead of you';
        nearestStr = `Nearest functional station is ${nearestStation.name}, located ${Math.round(minStationDist)} km ${direction}.`;
      }

      warnings.push(`CRITICAL ALERT: Battery depleted! You will run out of charge ${Math.round(distToDest)} km away from your destination. ${nearestStr}`);
      
      currentEnergyKwh = 0;
      currentDistanceKm = strandedDist;
      break;
    }
  }

  const finalEndSoc = Math.max(0, Math.round((currentEnergyKwh / ev.batteryCapacityKwh) * 100));
  const totalEnergyNeededKwh = distanceKm * effectiveConsumptionRate;

  return {
    distanceKm: Math.round(distanceKm),
    driveTimeMinutes: Math.round(durationMinutes + totalChargeTimeMinutes),
    energyUsedKwh: Number(totalEnergyNeededKwh.toFixed(2)),
    endSocPercent: finalEndSoc,
    willMakeItDirectly: stops.length === 0 && !isStranded,
    stops,
    warnings,
    pathCoordinates,
    stationsAlongRoute
  };
}

app.post('/api/plan-trip', async (req, res) => {
  const { vehicleSpec, startSocPercent = 65, origin = 'Delhi', destination = 'Agra' } = req.body;
  const ev = vehicleSpec || { name: 'Tata Nexon EV LR', batteryCapacityKwh: 40.5, ratedConsumptionKwhPerKm: 0.14, connector: 'CCS2' };

  // Generate a unique cache key based on the exact request parameters
  const cacheKey = `${origin.toLowerCase()}-${destination.toLowerCase()}-${ev.name}-${startSocPercent}`;

  if (routeCache.has(cacheKey)) {
    return res.json(routeCache.get(cacheKey));
  }

  try {
    const startGeo = await geocodePlace(origin, 28.6139, 77.2090);
    const endGeo = await geocodePlace(destination, 27.1767, 78.0081);

    // Fetch Live Road Routes from OSRM
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startGeo.lon},${startGeo.lat};${endGeo.lon},${endGeo.lat}?overview=full&geometries=geojson&alternatives=true`;
    const osrmRes = await axios.get(osrmUrl);

    if (!osrmRes.data || !osrmRes.data.routes || osrmRes.data.routes.length === 0) {
      throw new Error('No driving route found between coordinates');
    }

    const primaryRoute = osrmRes.data.routes[0];
    const secondRoute = osrmRes.data.routes[1] || osrmRes.data.routes[0];

    // OSRM coordinates are [lon, lat] -> convert to Leaflet's [lat, lon]
    const routeAPath = primaryRoute.geometry.coordinates.map(c => [c[1], c[0]]);
    
    // Fixed Route B path generation: Ensures start and end points lock onto exact coordinates
    let routeBPath;
    if (osrmRes.data.routes[1]) {
      routeBPath = secondRoute.geometry.coordinates.map(c => [c[1], c[0]]);
    } else {
      routeBPath = primaryRoute.geometry.coordinates.map((c, index, arr) => {
        if (index === 0 || index === arr.length - 1) {
          return [c[1], c[0]]; // Exact anchor for start and end pins
        }
        return [c[1] + 0.03, c[0] - 0.025]; // Gentle curve offset for middle coordinates
      });
    }

    const distAKm = primaryRoute.distance / 1000;
    const durAMin = primaryRoute.duration / 60; // Pure OSRM fastest duration

    // Ensure Route B has a guaranteed time penalty so it is always slower than Route A
    const distBKm = (secondRoute.distance / 1000) * 1.03;
    const durBMin = (secondRoute.duration / 60) * 1.12; 

    const routeA = {
      routeName: `Route A (Fastest Corridor)`,
      color: '#0ea5e9', // Crisp blue for Route A
      ...evaluateEnergyProfile({
        ev,
        startSocPercent: Number(startSocPercent),
        distanceKm: distAKm,
        durationMinutes: durAMin,
        pathCoordinates: routeAPath,
        isHighway: true
      })
    };

    const routeB = {
      routeName: `Route B (Eco / Alternative Corridor)`,
      color: '#10b981', // Emerald green for Route B
      ...evaluateEnergyProfile({
        ev,
        startSocPercent: Number(startSocPercent),
        distanceKm: distBKm,
        durationMinutes: durBMin,
        pathCoordinates: routeBPath,
        isHighway: false
      })
    };

    const combinedStations = [...routeA.stationsAlongRoute, ...routeB.stationsAlongRoute];

    const finalTripData = {
      origin: startGeo.displayName,
      destination: endGeo.displayName,
      startCoords: [startGeo.lat, startGeo.lon],
      endCoords: [endGeo.lat, endGeo.lon],
      vehicle: ev,
      startSocPercent: Number(startSocPercent),
      stations: combinedStations,
      routes: [routeA, routeB]
    };

    routeCache.set(cacheKey, finalTripData);
    
    res.json(finalTripData);
  } catch (error) {
    console.error('Route evaluation error:', error.message);
    res.status(500).json({ error: 'Failed to calculate routing path for specified locations.' });
  }
});

module.exports = app;