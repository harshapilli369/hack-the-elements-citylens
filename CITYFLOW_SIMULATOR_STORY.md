# CityFlow Simulator — Complete Technical & Story Guide

> *"Displacement happens in days. Recovery takes decades. That asymmetry is the chain reaction."*

---

## Table of Contents
1. [What Is the CityFlow Simulator?](#what-is-the-cityflow-simulator)
2. [The People on the Map — What Do the Colors Mean?](#the-people-on-the-map)
3. [The Four Cities of Atlantic Canada](#the-four-cities)
4. [The Three Types of Movement](#the-three-types-of-movement)
5. [How Disasters Work — The Cascade Engine](#how-disasters-work)
6. [Infrastructure Stress — The Six Systems](#infrastructure-stress)
7. [Ecological Health — The Hidden Cost](#ecological-health)
8. [The Chain Reaction — When Cities Break](#the-chain-reaction)
9. [The Dashboard — What Every Number Means](#the-dashboard)
10. [The Ecological Bridge — From Simulation to Science](#the-ecological-bridge)
11. [Backend — The Science Behind the Numbers](#backend-the-science)
12. [The Full Story — A Crisis Unfolding](#the-full-story)

---

## What Is the CityFlow Simulator?

The CityFlow Simulator is a **real-time, agent-based urban displacement simulation** set across **Atlantic Canada** — four provinces (New Brunswick, Nova Scotia, Prince Edward Island, and Newfoundland & Labrador) connected by real transportation corridors.

It models **three forces simultaneously**:

| Force | What It Models |
|---|---|
| **Economic migration** | People voluntarily moving for jobs, housing, or climate reasons — always running in the background |
| **Disaster displacement** | A wildfire, flood, heatwave, or drought forcing mass evacuation in hours |
| **Cascade evacuation** | A receiving city becomes overwhelmed by refugees and begins forcing *its own* population out |

The key insight the simulator demonstrates: **every disaster creates a second disaster downstream**. When 50,000 people flee a wildfire in New Brunswick, they don't disappear — they arrive in Nova Scotia. Halifax's water, housing, and health systems spike. If Halifax can't absorb them, it starts pushing people further, into Charlottetown. The chain reaction propagates.

---

## The People on the Map

The walking stick figures you see on screen are individual **migrant groups** animated along curved routes between cities. Each group has a type, and the type determines color, speed, count, and walk animation.

### Orange/Red Walkers — Disaster Refugees

```
figureColor = rgba(255, 90, 20, 0.78)   ← wildfire  (orange-red)
figureColor = rgba(30, 130, 255, 0.78)  ← flood     (blue)
figureColor = rgba(220, 30, 30, 0.78)   ← conflict  (deep red)
figureColor = rgba(255, 200, 0, 0.78)   ← heatwave  (yellow)
figureColor = rgba(200, 140, 50, 0.78)  ← drought   (amber)
```

**These are people forcibly evacuated by an active disaster.** The color matches the disaster striking their origin city:

- **Orange/fire-colored walkers** = fleeing a **wildfire** (as seen in Moncton in the screenshot)
- **Blue walkers** = fleeing a **flood** (as seen from St. John's in the screenshot)

They move **fast** (speed 0.001–0.002 per tick), in groups of **2–8 figures**, and carry **500–2,000 people** per group. When a disaster is active, the city generates new refugee groups every few ticks at random — 10% chance per tick × simulation speed.

The orange glow around the city, the pulsing halo, and the orbiting sparks are all visual cues that an **active disaster** is in progress there.

### Green Walkers — Economic Migrants

```
figureColor = rgba(46, 213, 115, 0.75)  ← always green/teal
```

**These are people moving voluntarily** — for jobs, cheaper housing, or a better climate. They are the quiet background force that runs constantly even when there are no disasters.

- Move **slowly** (half the speed of disaster refugees)
- Walk in smaller clusters (1–4 figures)
- Carry **50–700 people** per group depending on migration pressure type
- Driven by one of three configured pressures:
  - **Economic Opportunity**: highest-stress city → lowest-stress city (fast, every 120 ticks)
  - **Housing Affordability**: most overcrowded → most under-populated (moderate, every 180 ticks)
  - **Climate Amenity**: worst eco-health → best eco-health (slow, every 260 ticks)

### Red/White Walkers — Cascade Evacuees

```
figureColor = rgba(255, 100, 80, 0.92)  ← red-white, brightest
```

**These are people forced out of a city that was already absorbing refugees and has now itself hit breaking point.** This is the cascade — the second-order disaster.

- Fastest walkers (speed 0.001–0.002), most frantic (8 figures, walk speed 0.22)
- Triggered when a city's **stress exceeds 78%** — a 5% chance per tick at max speed
- Each cascade event pushes **1,000–4,000 more people** out of the overwhelmed city
- They go to any connected city via any available route

The legend at the bottom-right of the map shows all three types with their colors.

---

## The Four Cities

The simulator models **four real Atlantic Canadian cities**, each representing its province and positioned at real geographic coordinates.

### Moncton — New Brunswick
- **Population**: 180,000 base
- **Role**: Western gateway; the Trans-Canada hub connecting all three Atlantic provinces by land
- **Disaster risks**: Wildfire (83% forest cover, inland), Flood (Bay of Fundy tides)
- **Primary receiver**: Halifax, NS (via Trans-Canada Highway 104)
- **Character**: Medium-sized, moderate stress baseline (16%), most forested city in the network

### Halifax — Nova Scotia
- **Population**: 460,000 base — the largest city and regional capital
- **Role**: The primary absorption node. Every disaster in the network eventually sends people to Halifax. It is the hub — all roads lead here.
- **Disaster risks**: Flood (coastal, Hurricane Fiona 2022), Heatwave (urban heat island)
- **Primary receiver**: Moncton, NB (when Halifax itself overloads)
- **Character**: Highest capacity (650,000), highest baseline stress (28%), the first city to feel the pressure from any regional disaster

### Charlottetown — Prince Edward Island
- **Population**: 72,000 base — smallest city in the network
- **Role**: The vulnerable node — tiny capacity, but connected to Moncton via the Confederation Bridge
- **Disaster risks**: Flood (storm surge, sea level rise), Drought (agricultural island, 43% farmland)
- **Primary receiver**: Moncton, NB (Confederation Bridge is the only fixed link to the mainland)
- **Character**: Lowest capacity (110,000), lowest baseline stress (10%), can be overwhelmed quickly

### St. John's — Newfoundland & Labrador
- **Population**: 215,000 base
- **Role**: The isolated island — connected only via Marine Atlantic ferry or air, making displacement expensive and slow
- **Disaster risks**: Flood (extreme Atlantic storms), Conflict
- **Primary receiver**: Halifax, NS (ferry route)
- **Character**: Geographically isolated, relatively low stress (14%), but when it evacuates — people travel a very long way

---

## The Three Types of Movement

All movement in the simulator follows **Bézier curves** — curved paths that represent the real transportation corridors between cities.

| Route | Mode | Real Infrastructure |
|---|---|---|
| Moncton ↔ Halifax | Highway | Trans-Canada Highway 104 via Amherst, NS |
| Moncton ↔ Charlottetown | Bridge | Confederation Bridge (12.9 km fixed link) |
| Charlottetown ↔ Halifax | Ferry | Northumberland Strait: Wood Islands → Caribou, NS |
| St. John's ↔ Halifax | Ferry/Air | Marine Atlantic: North Sydney → Port aux Basques |
| St. John's ↔ Moncton | Indirect | Ferry to NS + Trans-Canada west |

**The dotted lines** on the map represent these routes. Their brightness increases as more people use them. A count badge appears in the middle of a route when more than 400 people are in transit on it.

---

## How Disasters Work — The Cascade Engine

### Triggering a Disaster

Disasters are triggered manually (via the Disasters panel) or automatically in demo mode. When a disaster hits a city:

1. The city's `isDisasterActive` flag flips to `true`
2. A **disaster timer** counts down from **1000 ticks** (about 16 seconds at 60fps, or faster at higher simulation speed)
3. The city starts generating **refugee groups** every few ticks
4. Infrastructure stress rates spike based on disaster type

### Disaster-Specific Stress Rates (per tick)

| Disaster | Housing | Water | Waste | Air | Health | Energy |
|---|---|---|---|---|---|---|
| **Wildfire** | +4% | +8% | +18% | +55% | +28% | +16% |
| **Flood** | +18% | +55% | +32% | +4% | +20% | +12% |
| **Conflict** | +32% | +22% | +15% | +12% | +45% | +35% |
| **Heatwave** | +4% | +35% | +12% | +22% | +52% | +45% |
| **Drought** | +4% | +48% | +9% | +9% | +26% | +9% |

**A wildfire destroys air quality first** — smoke fills the region. **A flood destroys water supply and housing** — infrastructure gets physically damaged. **A heatwave collapses health and energy systems** as people crank air conditioning while hospitals overflow. This is real-world data translated into simulation parameters.

### Population Hemorrhage

While the disaster is active, the city loses **500–2,000 people per refugee batch**, every few ticks. The `pop` counter on the city card drops in real time. These people appear as colored walkers heading outward along the available routes.

### After the Disaster Subsides

When the timer hits zero:
- The disaster flag clears
- A **Disaster Resolution Card** appears with four metrics:
  - **Stress %** — how battered the city's systems are
  - **Displaced** — total people who fled
  - **Land Lost** — hectares of habitat destroyed (displaced × 0.08 ha per person)
  - **CO₂** — carbon added from displacement (displaced × 1.2 / 1000 kt)
- An **Eco Bridge prompt** appears inviting you to model the displacement ecologically (the full scientific simulation)

---

## Infrastructure Stress — The Six Systems

Each city tracks **six infrastructure systems**. Stress in each system accumulates from:
1. **Population ratio**: more people than baseline → more stress on all systems
2. **Active disaster**: each disaster type spikes specific systems (see table above)
3. **Natural decay**: when things calm down, systems relax back toward a baseline × population-ratio target

### The Six Systems and Their Formulas

| System | Weight in Stress Score | Why It Matters |
|---|---|---|
| **Housing** | 20% | Physical shelter capacity — first to fail in floods and conflict |
| **Water** | 20% | Supply infrastructure — collapses in floods and droughts |
| **Waste** | 15% | Sanitation — overwhelmed by sudden population spikes |
| **Air** | 15% | Air quality — devastated by wildfires |
| **Health** | 15% | Medical system — overwhelmed in heatwaves and conflict |
| **Energy** | 15% | Power grid — overloaded in heatwaves, damaged in storms |

**Overall Stress Score** = `housing×0.20 + water×0.20 + waste×0.15 + air×0.15 + health×0.15 + energy×0.15`

### Stress Status Thresholds

| Stress % | Status | Color | Meaning |
|---|---|---|---|
| < 35% | Healthy | Green | Systems operating normally |
| 35–55% | Warning | Yellow | Early pressure, manageable |
| 55–75% | Stressed | Orange | Systems strained, services degrading |
| > 75% | Critical | Red | Near collapse, cascade risk |

The **stress bar** under each city name and the **inner arc** around the city node both show this value live.

---

## Ecological Health — The Hidden Cost

Each city has an **Eco Score** from 0 to 100. This is the slow, quiet number — the one that doesn't scream for attention but is the most important.

### How Eco Score Changes

**Eco Decay** (happens when a city receives more people than its base population):
```
ecoDecay = popExcess × 0.25 + (isDisasterActive ? 0.15 : 0)
```
Every 60 ticks (about 1 second at 60fps), if the city's population exceeds its baseline, the eco score drops. Overcrowding converts habitat to urban land, increases waste, pollutes water, raises the urban heat island.

**Eco Recovery** (happens when a city's population drops below baseline):
```
ecoRecovery = popDeficit × 0.04  ← rewilding is slow
```
When people leave, land slowly rewildes. But recovery is 6× slower than decay. This is the core asymmetry: **habitat is destroyed in weeks, recovered over years**.

### Eco Score Color Scale

| Score | Color | Meaning |
|---|---|---|
| > 80 | Green | Thriving — healthy ecosystem |
| 60–80 | Yellow | Warning — habitat under pressure |
| 40–60 | Orange | Degraded — biodiversity loss underway |
| < 40 | Red | Critical — irreversible damage risk |

The **outer ring** around each city node and the **green bar** inside the label card both display eco score. The right panel shows detailed text about what's happening ecologically.

---

## The Chain Reaction — When Cities Break

This is the heart of the simulator's name. The cascade is what transforms a **local disaster** into a **regional crisis**.

### The Cascade Trigger

Every tick, after stress is recalculated, the engine checks:

```javascript
if (city.stress > 78% && Math.random() < 0.05 × speed) {
  // Cascade fires: push 1,000–4,000 people to a connected city
}
```

At 78% stress, a critically overwhelmed city has a 5% chance per tick to begin **forced evacuation of its own residents** — not because a disaster struck it, but because it can no longer support the population it has absorbed.

### The Banner

When a cascade fires, the red banner at the top of the screen appears:
> **CHAIN REACTION — [CityName]** overloaded, forcing evacuation into the network

And the situation report at the bottom updates to:
> "Chain reaction active — wildfire in Moncton has pushed neighbouring cities past capacity, triggering forced evacuation"

### Why Cascades Are Dangerous

A single wildfire in Moncton sends orange refugees to Halifax. Halifax's stress rises. Halifax reaches 78% and begins pushing its own residents into Moncton and Charlottetown. Now Charlottetown — with a capacity of only 110,000 — receives refugees from both directions. Charlottetown cascades. The entire network destabilizes from a single ignition point.

The header stat **Cascades: N** counts how many cascade events have fired in the session. **Disasters: N** counts active disasters at this moment.

---

## The Dashboard — What Every Number Means

### Header Statistics

| Stat | What It Counts |
|---|---|
| **Transit** | People currently mid-journey on any route (in all active migrant groups) |
| **Displaced** | Cumulative total of non-economic migrants who have arrived at a destination |
| **Cascades** | How many cascade evacuation events have fired since session start |
| **Disasters** | Number of currently active natural disasters |
| **Eco %** | Average eco score across all four cities |

### City Panel (right sidebar, City tab)

When you click a city, you see:

| Field | Meaning |
|---|---|
| **Population** | Current live population (drops during disasters, rises when receiving refugees) |
| **base X** | Original baseline population |
| **X departed** | People who have left since the session started |
| **STRESSED / HEALTHY / WARNING / CRITICAL** | Current status badge |
| **Housing / Water / Waste / Air / Health / Energy** | Individual resource stress % (0–100) |
| **Ecological Health** | Current eco score with status label (Thriving / Warning / Degraded) |
| **Land Pressure** | Hectares of habitat under pressure from excess population |
| **Eco Lost** | Points of eco score lost from baseline |
| **Recovery** | Whether the city is in active disaster (degrading) or recovering |
| **Chart** | 3-line chart: Population (thousands), Stress %, Eco Score over time |

---

## The Ecological Bridge — From Simulation to Science

The **Analyse button** (top-right) and the **Eco Bridge card** (appears after a disaster resolves) bridge the visual simulator to the **full ecological simulation** — a FastAPI-powered scientific model.

When you click "Model this displacement ecologically →", the app:

1. Identifies the **source city** (where people fled from)
2. Identifies the **destination city** (where they went)
3. Maps them to their real Canadian provinces
4. Passes `displaced` count and `climate_displacement` reason to the backend
5. Navigates to `/simulate` with those parameters pre-filled, running the simulation automatically

The backend then runs the full ecological timeline model — habitat loss, carbon delta, watershed stress, urban heat island, biodiversity fragmentation — across 24 months of simulated time.

---

## Backend — The Science Behind the Numbers

The backend is a FastAPI application with three engines:

### Eco Engine (`eco_engine.py`)

Built on peer-reviewed Canadian ecological data:

| Metric | Formula | Source |
|---|---|---|
| **Urban land per person** | 0.08 ha/resident | Stats Canada |
| **Water use** | 300 L/person/day | Stats Canada average |
| **Forest carbon sequestration** | 2.8 t CO₂/ha/year | Canadian forestry data |
| **Construction carbon** | 80 t CO₂e per dwelling | Average Canadian home |
| **Urban Heat Island** | +0.3°C per 1% impervious surface increase | Oke (1982) |
| **Biodiversity fragmentation** | SLOSS reserve theory — fragmentation amplifies area loss ×2 | Conservation biology |

### Chain Engine (`chain_engine.py`)

Generates a **month-by-month timeline** (up to 24 months) of what happens at both the source city (rewilding) and destination city (urbanization):

**Destination milestones:**
- Month 1: Population influx — housing demand spikes
- Month 2: Construction starts, first forest clearing
- Month 3: Impervious surfaces expand, watersheds disrupted
- Month 6: Urban heat island measurable
- Month 9: Biodiversity corridor fragmentation
- Month 12: New carbon baseline locked in
- Month 18: Full ecological footprint realized
- Month 24: Climate feedback loop detectable

**Source city recovery (what happens where people *left*):**
- Month 3: Farmland beginning to idle
- Month 6: First shrubland succession on abandoned land
- Month 9: Wildlife returning
- Month 12: Measurable carbon recovery
- Month 18: Early forest succession underway
- Month 24: Watershed pressure significantly reduced

### Score Engine (`score_engine.py`)

Produces a single composite **ecological stress score** (0–100) weighted as:
- Carbon shift: **35%** (most impactful factor)
- Biodiversity: **25%**
- Watershed: **20%**
- Urban Heat Island: **20%**

The stress score maps to severity labels: MINIMAL → LOW → MODERATE → HIGH → CRITICAL

### Province Data (`provinces.json`)

13 Canadian provinces/territories modeled with real statistics:
- CO₂ per capita (t/year) — Alberta at 68.1t is the worst; PEI at 10.1t is the best
- Forest cover % — NB at 83% is most forested; Saskatchewan at 12% is least
- Biodiversity index (0–100) — BC at 88 leads; Saskatchewan at 52 is lowest
- Species at risk count — BC at 362; NWT at 14
- Watershed stress (0–100) — Alberta at 66 most stressed; NWT at 6 least
- Rewilding rate %/year — NB at 0.9%/yr recovers fastest; NWT at 0.15%/yr slowest

---

## The Full Story — A Crisis Unfolding

Here is the narrative that plays out when you run the demo (Press "Watch Demo" on startup):

---

### Act I — Equilibrium (0:00–0:02)

The simulation opens to Atlantic Canada at rest. Four cities, four provinces. Halifax hums along at 28% stress — the regional hub absorbing the normal background pressure of being the largest city. Moncton is calm at 16%. Charlottetown, tiny and agricultural, sits at 10%.

Green walkers trickle along the routes — economic migrants, a few hundred at a time, quietly redistributing population the way markets always have. People leave Halifax for Moncton when housing gets expensive. People arrive in Halifax from Charlottetown for the jobs. The network breathes.

The eco scores are all near 100. The land is healthy. The forests are intact. Birds still nest in the Acadian forest that covers 83% of New Brunswick.

---

### Act II — Ignition (0:02 — Wildfire hits Moncton)

A wildfire ignites in New Brunswick.

The city of Moncton glows orange. Air quality collapses — air stress jumps to 55% per tick. Health systems are overwhelmed by smoke inhalation cases. People start fleeing.

The first orange walkers appear, moving fast along the Trans-Canada corridor toward Halifax. Then more. Batches of 500, then 1,500. Moncton's population counter begins falling. 180,000 → 178,000 → 175,000.

Halifax's population rises. Halifax's housing stress ticks up. Water ticks up. The quiet city that was at 28% stress starts climbing.

The situation report changes:
> *"Wildfire striking Moncton — disaster refugees flooding connected cities"*

---

### Act III — Pressure (0:02–0:11)

The wildfire burns for 16 seconds of real time (1000 simulation ticks). During that time, 30,000–50,000 people flee Moncton. Some take the Trans-Canada to Halifax. Some cross the Confederation Bridge to Charlottetown. Routes light up.

Halifax, now receiving thousands of refugees, climbs past 50% stress. Its water infrastructure — never designed for sudden population spikes — starts showing strain. Its waste system backs up. The eco score, as the city's footprint expands to house newcomers, begins quietly falling from 95 toward 85.

The route count badge over the Moncton-Halifax highway shows: **32.0k in transit**.

---

### Act IV — The Second Disaster (0:11 — Flood hits St. John's)

While Moncton burns, a flood strikes Newfoundland.

Blue walkers emerge from St. John's, slower than the orange ones — the Marine Atlantic ferry route to Halifax is long. But they come. Thousands of them.

Now Halifax is receiving refugees from two directions simultaneously. Its stress climbs past 60%, into the orange zone. The situation report flashes:
> *"Multi-city crisis — 2 simultaneous disasters destabilising the entire regional network"*

The header shows: **Disasters: 2**

Halifax's water stress hits 100% — the tap is dry. Housing is at 77%. Waste at 100%. The city is in distress.

---

### Act V — The Chain Reaction (variable timing)

Halifax crosses 78% overall stress.

The cascade engine fires. 2,400 Halifax residents — people who've lived there all their lives, who never asked to be part of any crisis — are forced to leave. Red-white cascade walkers appear on the routes, running fast, fanning out toward Moncton (which is still recovering from its wildfire) and Charlottetown (which has 38,000 extra people from Moncton's evacuation).

The banner blazes at the top of the screen:
> **CHAIN REACTION — Halifax** overloaded, forcing evacuation into the network

Charlottetown, tiny Charlottetown, with its capacity of 110,000 and its starting population of 72,000, is now receiving migrants from both Moncton (wildfire) and Halifax (cascade). Its stress climbs. 30% → 48% → 64%.

The Cascade counter in the header ticks: **1 → 2 → 3**

The network is no longer moving people toward safety. It is moving people away from danger, into other danger.

---

### Act VI — Resolution & The True Cost (after disasters subside)

The wildfires in Moncton eventually exhaust themselves. The flood in St. John's recedes. The disaster timers hit zero.

The Disaster Resolution Card appears for Moncton:

```
Stress:    91%
Displaced: 47,200 people
Land Lost: 3,776 ha
CO₂:       57 kt
```

And at the bottom, in red:
> **38 ecological health points lost**
> *Displaced in days. Recovery takes 15–30 years of natural rewilding. That asymmetry is the chain reaction.*

The total displaced counter in the header: **13,000+ people in transit**, **tens of thousands arrived at destinations**, converting habitat to housing, raising temperatures, fragmenting forests.

Halifax's eco score, which started at 95, is now at 72. Charlottetown's, which was 100, is 81. The forests around these cities will be a little smaller. The species that lived in them will have a little less habitat. The carbon that those trees would have sequestered will instead be in the atmosphere.

The wildfire that started in Moncton — a local, contained event — has reshaped the ecology of four provinces.

---

### The Bridge to Reality

Click **"Model this displacement ecologically →"**

The ecological simulation runs. The backend computes what actually happens when 47,000 people move from New Brunswick to Nova Scotia:

- **3,776 hectares** of Acadian Forest cleared for housing
- **700,000 tonnes CO₂/year** added from carbon footprint shift
- **Watershed stress** in Nova Scotia rises by 18 points
- **Biodiversity index** drops from 65 to 47 (below the fragmentation threshold)
- **Urban heat island**: +1.4°C additional warming in Halifax

Back in New Brunswick, the abandoned land begins its slow recovery:
- **Month 6**: Shrubland succession begins on 1,500 ha
- **Month 12**: Carbon recovery of 450 tonnes/year
- **Month 24**: 3,200 ha in active succession

But full forest recovery — the kind that restores biodiversity corridors and carbon sink capacity — will take **15–30 years**. The displacement took days.

**That asymmetry is the chain reaction.**

---

## Summary Cheat Sheet

| What you see | What it means |
|---|---|
| Orange walkers | Wildfire refugees fleeing their city |
| Blue walkers | Flood refugees (or other disaster-colored) |
| Green walkers | Voluntary economic migrants |
| Red-white walkers | Cascade evacuees (second-order crisis) |
| Glowing orange halo around city | Active wildfire at that location |
| Blue glow around city | Active flood |
| Inner arc around city node | Infrastructure stress (green→red) |
| Outer ring around city node | Ecological health (green→red) |
| Red dot on Events tab | Unread critical events |
| CHAIN REACTION banner | A cascade has just fired |
| Situation report (bottom bar) | Plain-English summary of the current crisis state |
| Analyse button (green, pulsing) | Click to run the full ecological science model |

---

*CityFlow Simulator was built for Hack the Elements 2025. The simulation data is grounded in real Canadian ecological research, provincial statistics, and climate displacement science.*
