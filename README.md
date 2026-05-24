# Chain Reaction — CityFlow Simulator

> **A wildfire displaces 47,000 people in 3 days. The ecological damage at the receiving city takes 30 years to reverse. This platform makes both visible at once.**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Zustand](https://img.shields.io/badge/State-Zustand-FF6B6B?style=flat-square)](https://zustand-demo.pmnd.rs)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)](https://docker.com)
[![Data](https://img.shields.io/badge/Data-StatCan%20%7C%20UNHCR%20%7C%20Marine%20Atlantic-green?style=flat-square)](https://statcan.gc.ca)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

---

<!-- HERO IMAGE PLACEHOLDER -->
<!-- Recommended: animated GIF of the CityFlow map showing orange wildfire walkers streaming from Moncton to Halifax, with cascading red CHAIN REACTION banner firing -->
<!-- Path: docs/demo.gif (1200×675px recommended) -->

**Chain Reaction** is a real-time, data-driven disaster cascade simulator built for Atlantic Canada. It models how a single climate event — a wildfire, flood, heatwave, or drought — propagates through a network of four interconnected cities, triggering secondary crises downstream, and permanently degrading the ecosystems where displaced people land.

Every constant in this simulation has a citation. Every infrastructure bottleneck is measured. Every ecological formula traces to peer-reviewed science.

---

## The Problem

**When regions experience sudden large-scale population displacement, destination environments undergo rapid multi-system degradation across land, water, and air — and existing disaster systems cannot see it coming.**

### What current tools miss

| What existing tools do | What Chain Reaction does |
|---|---|
| Model the hazard at origin | Model what the destination absorbs |
| Count people displaced | Show multi-system ecological stress at receiving cities |
| Static maps of at-risk zones | Live cascade propagating through a connected city network |
| Separate pipelines: migration / land-use / water | One integrated view of the full chain reaction |
| Assess damage after it's irreversible | Predict cascade collapse before it fires |

### The evidence is consistent

**Fort McMurray 2016** — 88,000 people displaced by wildfire to Calgary and Edmonton. Neither city had any ecological impact assessment of the influx. Only humanitarian bed counts.

**California Camp Fire 2018** — 50,000 displaced to Chico and Sacramento. Chico's homelessness tripled in 18 months. Water demand exceeded watershed capacity. None of this was in any disaster plan.

**Atlantic Canada today** — Newfoundland loses population to Nova Scotia every year. Halifax has a 0.9% housing vacancy rate and the fastest-rising rents outside PEI. A single major storm would push both cities past their absorption limits — and no tool currently shows where that breaking point is.

---

## The Solution

Chain Reaction integrates three things that have never been connected before:

1. **A physics-based displacement simulator** — real populations, real infrastructure capacity, real gravity-weighted routing
2. **A live weather feed** — actual current conditions trigger real disasters automatically using Environment Canada thresholds
3. **A peer-reviewed ecological impact engine** — 24-month month-by-month models of what happens to forests, watersheds, biodiversity, and carbon baselines when people arrive

The result: a 30-year ecological consequence made visible in 60 seconds.

---

## Demo Story — A Crisis Unfolding

### Act I: Equilibrium

The simulation opens on Atlantic Canada. Four real cities, four provinces. **Halifax** hums at 30% infrastructure stress — the regional hub absorbing normal background pressure. **Moncton** sits at 16%. **Charlottetown**, tiny and agricultural, at 18%. **St. John's**, geographically isolated on an island, at 20%.

Green walkers trickle along the routes — economic migrants, a few hundred at a time, quietly following patterns from Statistics Canada's interprovincial migration data. People leave Newfoundland for Nova Scotia at 5,500 per year. More leave New Brunswick for Nova Scotia than the reverse. The network breathes.

### Act II: Ignition

A wildfire strikes Moncton. The city glows orange.

Air quality collapses — air stress jumps first, driven by smoke. Then health. Then housing as evacuation orders go out. Using UNHCR data, **40% of the affected population** decides to flee. Front-loaded urgency: most leave in the first hours.

Orange stick-figure walkers appear on the Trans-Canada corridor toward Halifax. Batches of 500, then 1,500. Moncton's population counter drops. **175,000 → 172,000 → 168,000.**

Halifax begins rising. The city that was absorbing normal migration is now absorbing a crisis.

### Act III: Pressure

For 16 real seconds — 1,000 simulation ticks — the wildfire burns. 30,000 to 50,000 people leave Moncton. The Trans-Canada Highway (Transport Canada capacity: 2,700 people/hour) carries them. The route badge shows: **32,000 in transit**.

Halifax crosses 50% stress. Water infrastructure buckles. The eco score — quietly falling as the city's footprint expands — drops from 95 toward 83.

Then the flood hits St. John's. Blue walkers emerge — slower, because the Marine Atlantic ferry (Marine Atlantic Annual Report 2023: **326 people/hour**) is the only way out. Now Halifax receives from two directions at once.

### Act IV: The Chain Reaction

Halifax crosses 78% overall stress.

The cascade engine fires. Using a logistic probability curve from FEMA's Mass Evacuation model, Halifax begins forcing its own residents out. The red banner blazes:

> **CHAIN REACTION — Halifax** overloaded, forcing evacuation into the network

Cascade evacuees — bright red-white figures, the fastest walkers — fan toward Moncton (still recovering) and Charlottetown (capacity: 110,000, receiving migrants from two directions).

Charlottetown climbs: 30% → 48% → 67%.

The network is no longer moving people toward safety. It is moving people away from danger, into other danger.

### Act V: Resolution — and the True Cost

The fires exhaust themselves. The Disaster Resolution Card appears:

```
Moncton
  Stress:    91%
  Displaced: 47,200 people
  Land Lost: 3,776 ha
  CO₂:       57 kt added
  Eco lost:  38 points
```

One click — **"Model this displacement ecologically →"**

The backend runs the full 24-month ecological timeline. 47,000 people moving from New Brunswick to Nova Scotia:

- **3,776 hectares** of Acadian Forest cleared for housing
- **Urban heat island**: +1.4°C additional warming in Halifax
- **Watershed stress**: +18 points in Nova Scotia
- **Biodiversity index**: drops below the fragmentation threshold

Back in Moncton, the land slowly rewildes — but full forest recovery takes **15–30 years**. The displacement took days.

**That asymmetry is the chain reaction.**

---

## Key Features

### Real-Time Simulation Engine

- **Agent-based movement** — each migrant wave carries 500–2,000 real people, routed via a gravity model (population attraction × distance penalty × stress repulsion)
- **Infrastructure queue mechanics** — people don't teleport; they fill a displacement queue that drains only as fast as real roads and ferries allow
- **Cascade fatigue** — after 3 cascade events, probability drops 10×, modeling real depletion of social networks and savings
- **Return migration** — UNHCR-calibrated return rates (wildfire: 86%, conflict: 20%) with realistic delays before anyone goes home

### Live Weather Integration

The simulation connects to **OpenMeteo** (real live weather, no API key required) every few minutes and checks actual current conditions against Environment Canada public alert thresholds:

| Weather condition | Threshold | Disaster auto-triggered |
|---|---|---|
| Heavy rain / thunderstorm | WMO codes 63–67, 95–99 | Flood |
| Hot + dry + windy | >28°C, humidity <35%, wind >25 km/h | Wildfire |
| Extreme heat | >32°C | Heatwave |
| Chronic dryness | humidity <20%, precip <0.5mm | Drought |

If it's genuinely a wildfire-risk day in Moncton right now, the simulation knows — and triggers automatically.

### Real Infrastructure Bottlenecks

The most important insight in the system: **people don't evacuate at the same speed from all cities.**

| Route | Infrastructure | Capacity |
|---|---|---|
| Moncton → Halifax | Trans-Canada Highway 104 | 2,700 people/hr |
| Moncton → Charlottetown | Confederation Bridge | 3,240 people/hr |
| Charlottetown → Halifax | Northumberland Strait Ferry | 108 people/hr |
| St. John's → Halifax | Marine Atlantic Ferry | 326 people/hr |

**St. John's, 30% displaced = 69,805 people wanting to leave.** At 326 people/hour, full evacuation takes **8+ days**. The same disaster in Moncton (Highway 104) clears in **24 hours**.

Same disaster. Same severity. Same percentage displaced. The only difference is the infrastructure. This is a documented real vulnerability of Newfoundland's island geography — and this simulation makes it visible.

### Configurable Disaster Triggers

Before confirming a disaster, the panel shows estimated displacement live:

- **Severity 1–5** — like hurricane categories; multiplies displacement rate and stress rates
- **Affected population 25–100%** — flood may only hit low-lying areas; hurricane hits everyone
- **Duration: short / medium / long** — 400, 1,000, or 2,000 simulation ticks

Increase severity from 3 to 5: see displaced jump from 40,000 to 67,000 before you commit.

### Chain Analysis Dashboard

After any chain reaction, the ecological analysis dashboard provides:

- **Cascade timeline** — the event-by-event story of which disaster triggered which cascade, in what order, with how many people at each step
- **Sparklines per receiving city** — tiny SVG charts of ecological stress trajectory; red = ended badly, green = recovering
- **Full drilldown charts** — click any city to expand a 3-line chart: ecological stress, watershed stress, biodiversity index across 24 months
- **Re-analyse** — snapshots current live city state and re-runs the full backend analysis instantly
- **Policy simulation** — "→ Apply in Simulator" navigates directly to the most critical receiving city with the relevant policy parameter highlighted

### Ecological Science Engine

Six metrics modeled month by month using peer-reviewed Canadian data:

| Metric | Formula basis | Source |
|---|---|---|
| Urban land conversion | 0.08 ha per new resident | Statistics Canada |
| Carbon footprint shift | Provincial per-capita CO₂ delta | NIR National Inventory Report |
| Forest carbon sink lost | 2.8 t CO₂/ha/year | Canadian forestry data |
| Urban heat island | +0.3°C per 1% impervious surface increase | Oke (1982) |
| Biodiversity fragmentation | SLOSS reserve theory (fragmentation amplifies area loss ×2) | Conservation biology |
| Watershed stress | 300 L/person/day × provincial baseline | Statistics Canada |

Composite ecological stress weights: carbon shift 35%, biodiversity 25%, watershed 20%, urban heat island 20%.

Ecological decay is calibrated to IPCC AR6: **decay at 0.20 points/sample, recovery at 0.03** — six times slower. Habitat destroyed in weeks. Recovered over years.

### Real Data Foundation

Every constant has a source. Every number is auditable. During development, the team performed a full data audit and caught its own errors:

- Marine Atlantic capacity was initially off by 4×. The 2023 Annual Report shows 326 people/hour. It was corrected.
- Charlottetown ferry corrected down to 108/hour based on actual crossing schedules.
- Hurricane Fiona displaced count corrected from 28,000 → 4,800 (CMHC 2022 actual estimate).
- All four city starting stress levels now reflect documented 2022–2023 conditions (CMHC, StatCan LFS).
- Cascade probability replaced with a logistic curve from FEMA's Mass Evacuation Incident Annex.

---

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                     │
│                                                      │
│  Pages: Landing | CityFlow | Simulate | ChainAnalysis│
│                                                      │
│  ┌──────────────────┐  ┌──────────────────────────┐ │
│  │  CityFlow Engine  │  │  Ecological Calculator   │ │
│  │                   │  │                          │ │
│  │  SimulationMap    │  │  SimulationForm           │ │
│  │  MigrantWalkers   │  │  RiskScorecard            │ │
│  │  CityNode         │  │  CascadeTimeline          │ │
│  │  DisasterTriggers │  │  RecommendationCards      │ │
│  │  SimControls      │  │  ChainAnalysis            │ │
│  │  EcoBridge        │  │                          │ │
│  └─────────┬─────────┘  └────────────┬─────────────┘ │
│            │                         │               │
│  ┌─────────┴─────────────────────────┴─────────────┐ │
│  │              Zustand State Layer                  │ │
│  │  cityflowStore │ chainStore │ simulationStore     │ │
│  │  realtimeStore │ useWeatherAutoTrigger (hook)     │ │
│  └─────────────────────────┬───────────────────────┘ │
└────────────────────────────┼────────────────────────┘
                             │ axios / TanStack Query
                             │ POST /api/simulate
                             │ POST /api/simulate/chain
                             ▼
┌─────────────────────────────────────────────────────┐
│                  FastAPI Backend                      │
│                                                      │
│  Routers: simulation.py | realtime.py               │
│                                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────┐ │
│  │ eco_engine   │ │ chain_engine │ │ score_engine│ │
│  │              │ │              │ │             │ │
│  │ Carbon delta │ │ Month-by-    │ │ Composite   │ │
│  │ Forest loss  │ │ month cascade│ │ stress score│ │
│  │ UHI formula  │ │ timeline     │ │ Severity    │ │
│  │ Watershed    │ │ Events       │ │ Recovery yrs│ │
│  │ Biodiversity │ │ Milestones   │ │             │ │
│  └──────────────┘ └──────────────┘ └─────────────┘ │
│                                                      │
│  Data: provinces.json (13 Canadian provinces)        │
│        migration_reasons.json | disaster_factors.json│
│        baselines.json | sources.json                 │
└─────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────┐
│              External Live Data                      │
│                                                      │
│  OpenMeteo API — Real weather for 4 cities          │
│  (no API key required, checked every 10 minutes)    │
└─────────────────────────────────────────────────────┘
```

### The Simulation Loop (CityFlow Engine)

The core tick loop runs at 60fps via `requestAnimationFrame` with 7 sequential steps:

| Step | What it does |
|---|---|
| 1 | Disaster pulse: generate refugee waves from active disasters using UNHCR displacement rates × urgency decay |
| 1.5 | Queue drain: drain displacement queues at real infrastructure capacity per tick |
| 1.7 | Return migration: check recovery conditions, spawn return waves at UNHCR-calibrated rates |
| 2 | Resource recovery: stress decays toward target × `recoveryBoost` (government aid multiplier) |
| 3 | Background migration: fire per-route bidirectional StatCan migration every 168 ticks (1 simulated week) |
| 4 | Eco score: decay from overcrowding (IPCC AR6 calibrated), recovery from underpopulation |
| 5 | Cascade check: logistic probability curve fires if stress > 78%, with cascade fatigue suppression |

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | 8 | Build tooling |
| TailwindCSS | 4 | Utility-first styling |
| Framer Motion | 12 | Animated transitions, expandable panels |
| Zustand | 5 | Client-side simulation state |
| TanStack Query | 5 | API data fetching and caching |
| Recharts | 3 | Sparklines, timeline charts, radar charts |
| Leaflet / React-Leaflet | 1.9 / 5 | Interactive map layer |
| Axios | 1.x | HTTP client |
| Canvas API | native | MigrantWalkers stick-figure animation |

### Backend

| Technology | Purpose |
|---|---|
| FastAPI | REST API framework |
| Pydantic | Request/response schema validation |
| Python 3.10+ | Runtime |
| Uvicorn | ASGI server |

### Data & Science

| Source | What it powers |
|---|---|
| Statistics Canada 2021 Census (CMA) | Exact city populations |
| StatCan CANSIM 17-10-0022-01 | Interprovincial migration rates |
| UNHCR 2023 Global Trends | Displacement rates and return migration |
| Marine Atlantic Annual Report 2023 | Ferry capacity: 326 people/hour |
| Transport Canada | Highway capacity: 2,700 people/hour |
| CMHC 2023 | City-level housing stress baselines |
| Fort McMurray 2016 (CBC/StatCan) | Wildfire displacement & return calibration |
| Hurricane Fiona 2022 | Flood displacement & return calibration |
| Oke (1982) | Urban Heat Island formula (+0.3°C per 1% impervious) |
| IPCC AR6 | Ecological decay/recovery asymmetry calibration |
| FEMA Mass Evacuation Annex | Cascade logistic probability curve |
| FAO 2022 | Drought displacement and permanence |
| OpenMeteo API | Live weather for 4 Atlantic cities |
| Environment Canada | Weather → disaster classification thresholds |

### Deployment

| Technology | Purpose |
|---|---|
| Docker + Docker Compose | Container orchestration |
| Nginx | Frontend static serving |
| Port 80 (frontend) / 8001 (backend) | Service ports |

---

## Project Structure

```bash
hack-the-elements-citylens/
├── docker-compose.yml            # One-command production deployment
├── start-frontend.bat            # Windows quick-start
├── start-backend.bat             # Windows quick-start
│
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── App.jsx               # Router (Landing, CityFlow, Simulate, ChainAnalysis)
│       ├── pages/
│       │   ├── Landing.jsx       # Hero + entry point
│       │   ├── CityFlowSimulator.jsx  # Main simulation view
│       │   ├── Simulate.jsx      # Ecological calculator (province-to-province)
│       │   └── ChainAnalysis.jsx # Chain reaction dashboard + sparklines + drilldown
│       ├── components/
│       │   ├── cityflow/
│       │   │   ├── SimulationMap.jsx     # Canvas + city nodes + route lines
│       │   │   ├── MigrantWalkers.js     # Stick-figure column animation engine
│       │   │   ├── CityNode.jsx          # Pulsing city indicator with stress rings
│       │   │   ├── DisasterTriggers.jsx  # Severity / affected% / duration UI
│       │   │   ├── SimControls.jsx       # Speed + 3-factor migration weight sliders
│       │   │   ├── EcoBridge.jsx         # Post-disaster bridge to ecological model
│       │   │   ├── CityDetailView.jsx    # City panel: resources + eco + 3-line chart
│       │   │   ├── CityChart.jsx         # Live population/stress/eco chart
│       │   │   ├── EventFeed.jsx         # Event log with timestamps
│       │   │   └── OnboardingOverlay.jsx # First-visit guided walkthrough
│       │   ├── charts/
│       │   │   ├── CascadeTimeline.jsx   # Month-by-month area chart
│       │   │   ├── EnvironmentGauges.jsx # Animated circular resource gauges
│       │   │   ├── RiskRadar.jsx         # Spider chart of system balance
│       │   │   └── AtlanticIndicatorsPanel.jsx
│       │   ├── insights/
│       │   │   ├── RecommendationCards.jsx  # Priority-ranked policies + simulator buttons
│       │   │   ├── AIInsightPanel.jsx        # Typewriter narrative analysis
│       │   │   └── InterventionPanel.jsx     # Before/after intervention comparison
│       │   ├── simulation/
│       │   │   ├── SimulationForm.jsx    # Province pair + population + reason selector
│       │   │   └── RiskScorecard.jsx     # Composite score output card
│       │   ├── map/
│       │   │   └── CrisisMap.jsx         # Leaflet dark map
│       │   └── ui/
│       │       ├── AnimatedCounter.jsx
│       │       ├── PulseIndicator.jsx
│       │       ├── RiskGauge.jsx
│       │       └── SeverityBadge.jsx
│       ├── store/
│       │   ├── cityflowStore.js    # Core simulation engine (tick loop, displacement, routing)
│       │   ├── chainStore.js       # Chain analysis state (events, last request, results)
│       │   ├── simulationStore.js  # Ecological simulation state + presets
│       │   └── realtimeStore.js    # Live data state
│       ├── hooks/
│       │   └── useWeatherAutoTrigger.js  # OpenMeteo → disaster auto-trigger
│       └── utils/
│           ├── api.js              # Backend client
│           └── formatters.js       # Number/label formatting
│
└── backend/
    ├── Dockerfile
    ├── main.py                    # FastAPI app + CORS + router mounting
    ├── engines/
    │   ├── eco_engine.py          # Ecological impact formulas (Oke, SLOSS, StatCan)
    │   ├── chain_engine.py        # Month-by-month timeline + milestone events + recommendations
    │   ├── score_engine.py        # Composite stress score + severity labels + recovery years
    │   └── risk_engine.py         # Real-time resource stress calculations
    ├── routers/
    │   ├── simulation.py          # POST /simulate + POST /simulate/chain + GET /provinces
    │   └── realtime.py            # Live data endpoints
    ├── models/
    │   └── schemas.py             # Pydantic models: SimulationRequest, ChainReactionResult
    └── data/
        ├── provinces.json         # 13 Canadian provinces: CO₂, forest cover, biodiversity, watersheds
        ├── migration_reasons.json # Disaster type parameters: speed, land conversion, construction factor
        ├── disaster_factors.json  # Disaster-specific constants
        ├── baselines.json         # City baseline conditions
        └── sources.json           # Data source citations
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- Docker (optional, for one-command deployment)

### With Docker (recommended)

```bash
git clone https://github.com/your-org/hack-the-elements-citylens
cd hack-the-elements-citylens
docker-compose up --build
```

Open [http://localhost](http://localhost)

### Manual Setup

**Backend**

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Mac/Linux
# venv\Scripts\activate         # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## API Reference

```
POST /api/simulate
     — Province-to-province ecological impact simulation
     — Body: { source_province, destination_province, population_size, migration_reason, duration_months }
     — Returns: scorecard, 24-month timeline, recommendations

POST /api/simulate/chain
     — Multi-event chain reaction ecological analysis
     — Body: { events: [{ source_province, destination_province, population_size, disaster_type, event_type }], duration_months }
     — Returns: per-group timelines, aggregated stats, deduplicated recommendations

GET  /api/provinces
     — All 13 Canadian provinces with ecological baselines

GET  /api/migration-reasons
     — Available displacement reason types with parameters

GET  /api/health
     — Service liveness check
```

### Example: Single Simulation

```bash
curl -X POST http://localhost:8001/api/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "source_province": "New Brunswick",
    "destination_province": "Nova Scotia",
    "population_size": 47200,
    "migration_reason": "climate_displacement",
    "duration_months": 24
  }'
```

Response includes: `forest_loss_ha`, `carbon_delta_tonnes`, `watershed_stress`, `biodiversity_index`, `uhi_delta_c`, `recovery_years_estimate`, and prioritized policy recommendations.

---

## Real-World Impact

### Who would use this

- **Emergency management agencies** — running pre-disaster scenario planning to understand where the breaking points are before a storm season
- **NGOs (Red Cross, UNHCR field teams)** — pre-positioning aid along the likeliest cascade routes before evacuation orders go out
- **Climate adaptation ministries** — justifying infrastructure investment ("investing in Halifax water capacity now reduces cascade risk during the next Fiona-scale flood")
- **Infrastructure investors and insurers** — pricing receiving-end risk that current models cannot see

### The specific gap this fills

Current tools model **origin risk** (where disasters strike) and **displacement counts** (how many people leave). No current tool integrates those numbers with **destination system stress** and **ecological consequence** across a connected network in real time. Chain Reaction fills that gap for Atlantic Canada — and the architecture generalizes to any bounded regional migration system with documented corridors.

---

## Simulation Data Audit

Every constant was audited against its claimed source. Errors caught and corrected during development:

| Constant | Was | Corrected to | Source |
|---|---|---|---|
| Marine Atlantic capacity | 83 people/hr | **326 people/hr** | Marine Atlantic Annual Report 2023 |
| Charlottetown ferry | 480 people/hr | **108 people/hr** | Actual crossing schedule calculation |
| Hurricane Fiona displaced | 28,000 people | **4,800 people** | CMHC 2022 housing instability estimate |
| Wildfire displacement rate | 30% | **40%** | Fort McMurray 2016 Atlantic-scale calibration |
| Wildfire return rate | 75% | **86%** | Fort McMurray 2016: 86% returned within 1 year |
| Flood return rate | 55% | **58%** | Fiona 2022 NL/NS + Katrina long-term average |
| Drought return rate | 55% | **35%** | FAO 2022: mostly permanent agricultural displacement |
| Cascade probability | Flat 5% | **Logistic curve** | FEMA Mass Evacuation Incident Annex (2022) |
| Halifax starting stress | 28% | **30%** | CMHC 2023: 0.9% vacancy, rent +42% since 2020 |
| Charlottetown starting stress | 10% | **18%** | CMHC 2023: fastest-rising rents in Canada |

---

## Future Scope

- **Seasonal risk profiles** — historical probability of disaster type by month, enabling autonomous disaster generation even in mild weather
- **Hospital capacity integration** — real ICU-per-capita data per city to model health system overload more precisely
- **Federal emergency database export** — chain analysis output formatted for actual government planning documents
- **CMIP6 climate projection coupling** — future disaster frequency/severity driven by AR6 regional climate models
- **UNHCR live displacement feed** — real IDP data integrated as simulation seed events
- **Satellite land-use validation** — Sentinel-2 change detection to validate ecological impact model against observed post-disaster urbanization

---

## Hackathon Theme Alignment

This project addresses **Earth, Water, and Air** simultaneously — not as separate domains, but as the interconnected systems they actually are:

- **Earth** — land-use conversion, habitat fragmentation, urban sprawl from population concentration (0.08 ha per new resident, Statistics Canada)
- **Water** — groundwater depletion, watershed stress, waste contamination of water systems (300 L/person/day; Oke 1982 UHI cascades into watershed temperature)
- **Air** — carbon footprint shift (provincial per-capita CO₂ delta from NIR), urban heat island intensification, construction and traffic emissions

The hackathon challenge: *"Earth's systems are interconnected across water, earth, air, and fire, where changes in one can impact all."*

That is exactly what population displacement does to a receiving city. Chain Reaction makes that interconnection measurable, city by city, month by month.

---

## One-Liner for the Judges

> "We built a simulation of Atlantic Canadian disaster response grounded entirely in real data — StatCan populations, UNHCR displacement rates, Marine Atlantic ferry schedules, Environment Canada weather thresholds — so when St. John's takes 8 days to evacuate what Moncton clears in 24 hours, that's not a design choice. That's the infrastructure."

---

*Built for **Hack The Elements 2025** — Earth · Water · Air · Fire*
