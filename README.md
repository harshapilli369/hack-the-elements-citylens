# ⚡ Chain Reaction

> **Visualizing how climate disasters trigger cascading urban migration crises.**

Chain Reaction is an integrated predictive environmental intelligence platform that models how sudden population influx from conflict, flooding, drought, or economic collapse triggers interconnected failures across water, air, land, waste, and infrastructure systems.

---

## The Problem

A climate disaster or conflict in one region does not stay isolated.

When thousands of displaced people suddenly move into a nearby city, the city’s infrastructure begins to absorb enormous pressure:

- housing fills rapidly,
- water demand spikes,
- waste systems overflow,
- pollution increases,
- public infrastructure becomes unstable.

As one city becomes overloaded, people begin moving again - creating a cascading chain reaction across multiple connected cities.

Existing systems monitor these environmental and humanitarian issues separately and react only after damage becomes visible.

Chain Reaction simulates these crises as interconnected systems in motion, helping visualize how human displacement can destabilize entire urban networks before collapse occurs.

---

## Features

| Feature | Description |
|---------|-------------|
| ⚡ Cascade Simulation Engine | Formula-based multi-system stress modeling |
| 👥 Live Migration Simulation | Animated human movement between connected cities |
| 🌡️ Resource Saturation Engine | Housing, water, waste, AQI, and infrastructure dynamically fill toward critical thresholds |
| 🔁 Cascade Spillover Logic | Overloaded cities trigger secondary migration into nearby cities |
| 🗺️ Interactive Crisis Map | Dark Leaflet map with animated migration routes and heatmaps |
| 📊 Cascade Timeline | Month-by-month area chart showing system degradation |
| 🎯 Risk Gauges | 5 animated circular gauges — Water, Air, Land, Waste, Infra |
| 🕷️ Risk Radar | Spider chart showing environmental balance |
| 🤖 AI Crisis Briefing | Typewriter narrative with intelligent analysis |
| 🎛️ Intervention Simulator | Compare proactive vs reactive outcomes |
| 📋 Recommendation Cards | Priority-ranked actionable interventions |
| 🎭 Preset Scenarios | One-click load: Nairobi, Amman, Cox's Bazar |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite |
| Styling | TailwindCSS + custom dark design system |
| Animations | Framer Motion |
| Charts | Recharts (AreaChart, RadarChart, BarChart) |
| Maps | Leaflet.js + CartoDB Dark Tiles (no API key needed) |
| State | Zustand |
| Data Fetching | TanStack Query |
| Backend | FastAPI (Python) |
| Data | JSON baselines + environmental stress formulas |
| APIs | WAQI (optional), OpenWeather (optional) |

---

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+

### Backend

```bash
cd backend
python -m venv venv
source venv/Scripts/activate   # Windows
# source venv/bin/activate     # Linux/Mac
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## API Endpoints

```
POST /api/simulate     — Run a new simulation
GET  /api/cities       — List destination cities
GET  /api/sources      — List source regions
GET  /api/interventions — List available interventions
GET  /api/health       — Health check
```

---

## Environmental Modeling

Chain Reaction models cities as interconnected systems where population influx dynamically impacts the water demand, air quality, housing pressure, waster generation etc.

As resource usage approaches capacity:

cities transition from stable → stressed → critical,
environmental degradation accelerates,
and secondary migration events can occur.

### Core Formulas

**Water Stress:**
```
water = baseline × (1 + influx_ratio × 2.4)
```

**AQI Score:**
```
aqi = baseline_aqi + (influx/city_pop × 35) + (disaster_shock × 20)
```

**Waste Overflow:**
```
waste = baseline_capacity + (influx_ratio × 60)
if waste > 85: waste × 1.3  (overflow multiplier)
```

**Cascade Triggers:**
- Waste > 75% → AQI bleeds up (methane/particulates)
- Water > 70% → Land pressure increases (clustering near water)
- Infrastructure > 88% → Secondary displacement risk

**Composite Risk:**
```
risk = water×0.28 + aqi×0.18 + land×0.14 + waste×0.20 + infra×0.20
```

---

## Preset Scenarios

| Scenario | Trigger | Cascade Path | 
|----------|---------|--------------|
| Atlantic Wildfire | Halifax wildfire | Halifax → Truro → Moncton |
| Coastal Flooding | Sea level rise | Moncton → Saint John |
| Drought Pressure | Water scarcity | Rural NS → Halifax |


---

## Architecture

```
React Frontend (Vite)
    │
    ├── SimulationForm → Zustand store
    ├── CrisisMap (Leaflet)
    ├── CascadeTimeline (Recharts AreaChart)
    ├── EnvironmentGauges (SVG animated)
    ├── RiskRadar (Recharts RadarChart)
    ├── AIInsightPanel (typewriter narrative)
    └── InterventionPanel (before/after comparison)
         │
         ▼ axios → /api
FastAPI Backend
    │
    ├── risk_engine.py    — 5-system stress formulas
    ├── chain_engine.py   — cascade logic + timeline
    └── score_engine.py   — composite scoring + recommendations
         │
    JSON baselines (cities, disaster factors, source regions)
```

---

## Simulation Flow
A disaster or pressure event is triggered.
Populations begin migrating toward connected cities.
Destination cities absorb incoming population pressure.
Resource systems dynamically fill toward capacity.
Environmental conditions worsen in real time.
Overloaded cities trigger secondary migration.
Cascading regional instability emerges across the network.

---

## Future Scope

- Satellite integration (Sentinel-2 land change detection)
- UNHCR live displacement feed
- Multi-city cascade spillover modeling
- Historical validation against Syria, Yemen, Bangladesh events
- NGO field-officer dashboard
- Climate model coupling (CMIP6 projections)
- UN OCHA / WFP integration API

---

## Team
This is a simulation and scenario-modeling platform, not a predictive forecasting system.

Built at Hack The Elements 
