# ⚡ VoltPath Intelligence

An advanced, full-stack EV Route & Energy Predictor designed for long-distance highway travel. VoltPath goes beyond simple routing by integrating real-world topographical parameters, aerodynamic drag at highway speeds, and live charging-station telemetry to eliminate range anxiety.

### 🌐 Live Application
- **Frontend Demo:** (https://volt-path-intelligence.vercel.app/)
- **Backend API:** (https://voltpath-api.vercel.app)
 
### 🚀 Key Features
- **Dynamic Geocoding & Live Routing:** Uses OSM Nominatim and OSRM to generate exact, curved highway geometries rather than straight-line approximations.
- **Corridor Comparison:** Evaluates high-speed Expressways against alternative Eco-corridors side-by-side.
- **Smart Energy Profiling:** Adjusts kWh consumption based on vehicle architecture, speed thresholds, and a strict 15% safety arrival reserve.
- **Infrastructure Telemetry:** Automatically interpolates DC Fast Chargers along the route and flags degraded or offline stations.
- **Glassmorphism UI:** Premium, interactive Leaflet mapping with real-time SVG discharge trajectory curves.

### 🛠️ Technology Stack
* **Frontend:** React.js, Vite, Leaflet (Maps), Lucide React (Icons), Custom SVG charting.
* **Backend:** Node.js, Express.js, Axios.
* **External APIs:** OSRM (Open Source Routing Machine), OpenStreetMap (Tiles & Geocoding).

### 💻 Local Installation

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/keshavthesharma/VoltPath-Intelligence.git
   cd VoltPath-Intelligence
   \`\`\`

2. **Start the Backend Server**
   \`\`\`bash
   cd server
   npm install
   npm run dev
   \`\`\`
   *(Runs on http://localhost:5000)*

3. **Start the Frontend Client**
   Open a new terminal window:
   \`\`\`bash
   cd client
   npm install
   npm run dev
   \`\`\`
   *(Runs on http://localhost:5173 or 5174)*

---
