# ⚡ VoltPath Intelligence

An advanced, full-stack EV Route & Energy Predictor designed for long-distance highway travel. VoltPath goes beyond simple routing by integrating real-world topographical parameters, aerodynamic drag at highway speeds, and live charging-station telemetry to eliminate range anxiety.

### 🌐 Live Application
- **Frontend Demo:** (https://volt-path-intelligence.vercel.app/)
- **Backend API:** (https://voltpath-api.vercel.app)
 
### 🚀 Key Features
- **Dynamic Geocoding & Live Routing:** Uses OSM Nominatim and OSRM to generate exact, curved highway geometries rather than straight-line approximations.
- **Corridor Comparison:** Evaluates high-speed Expressways against alternative Eco-corridors side-by-side.
- **Smart Energy Profiling:** Adjusts kWh consumption based on vehicle architecture, speed thresholds, and a strict 15% safety arrival reserve.
- **Infrastructure Telemetry & Stranded Protocol:** Automatically interpolates DC Fast Chargers, calculates multi-stop range boosts, and triggers critical alerts if the battery depletes before reaching a functional station.
- **Glassmorphism UI:** Premium, interactive Leaflet mapping with real-time SVG discharge trajectory curves.

### ⚠️ Data Disclaimer: Simulated Charging Infrastructure
The EV charging stations displayed on the map (e.g., Tata Power, Statiq, Zeon) are **procedurally generated simulations**, not live real-world endpoints. 

To demonstrate the application's multi-stop routing algorithms and failure protocols without requiring a paid live-aggregator API connection, the engine forcefully injects mocked stations every 40–70 km along the route's geometry. These simulated stations are assigned weighted, randomized health statuses (85% Operational, 10% Degraded, 5% Non-Functional) to rigorously test the algorithm's 15% safety floor and emergency rerouting logic.

### 🛠️ Technology Stack
- **Frontend:** React.js, Vite, Leaflet (Maps), Lucide React (Icons), Custom SVG charting.
- **Backend:** Node.js, Express.js, Axios.
- **External APIs:** OSRM (Open Source Routing Machine), OpenStreetMap (Tiles & Geocoding).

### 💻 Local Installation

1. **Clone the repository**
   ```bash
   git clone [https://github.com/keshavthesharma/VoltPath-Intelligence.git](https://github.com/keshavthesharma/VoltPath-Intelligence.git)
   cd VoltPath-Intelligence
   ```

2. **Start the Backend Server**
   ```bash
   cd server
   npm install
   npm run dev
   ```
   *(Runs on http://localhost:5000)*

3. **Start the Frontend Client**
   Open a new terminal window:
   ```bash
   cd client
   npm install
   npm run dev
   ```
   *(Runs on http://localhost:5173 or 5174)*