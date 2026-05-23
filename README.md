# ⚡ Chain Reaction

> **Predicting cascading environmental crises caused by sudden human displacement.**

Chain Reaction is an integrated predictive environmental intelligence platform that models how sudden population influx from conflict, flooding, drought, or economic collapse triggers interconnected failures across water, air, land, waste, and infrastructure systems.

---

## The Problem

When 750,000 people flee conflict and arrive in a single city overnight, they don't just need shelter. They trigger **cascading environmental failures** across:

- 💧 Water supply systems
- 🌫️ Air quality (AQI)
- 🌍 Land use and encroachment
- ♻️ Waste management overflow
- 🏗️ Infrastructure grid load

These systems reinforce each other. Waste overflow spikes AQI. Water stress clusters populations near water sources, increasing land pressure. Infrastructure overload cascades into secondary displacement.

**Existing monitoring systems track these independently and reactively.** Chain Reaction models them as an interconnected web — predicting the cascade before it becomes irreversible.

---

## Features

| Feature | Description |
|---------|-------------|
| ⚡ Cascade Simulation Engine | Formula-based multi-system stress modeling |
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

| Scenario | Source | Destination | Population | Cause |
|----------|--------|-------------|------------|-------|
| Nairobi Crisis | South Sudan | Nairobi | 750K | Armed Conflict |
| Jordan Strain | Syria | Amman | 1.2M | Armed Conflict |
| Bangladesh Flood | Bangladesh Coast | Cox's Bazar | 900K | Flooding |

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

Built at Hack The Elements · 36 hours · 2024
