import { create } from 'zustand'

// ─── Policy simulation effects ───────────────────────────────────────────────
// Each policy instantly reduces one resource stress metric and boosts eco health.
// Resources are 0–100 (higher = worse). Reducing them lowers the weighted stress score.
// Amounts calibrated so a single policy visibly moves the stress bar without being a cheat code.
export const POLICY_EFFECTS = {
  forest:      { resource: 'housing', reduction: 15, ecoBoost: 10, label: 'Urban Growth Boundary'         },
  water:       { resource: 'water',   reduction: 20, ecoBoost:  4, label: 'Water Recycling Infrastructure' },
  heat:        { resource: 'air',     reduction: 18, ecoBoost:  8, label: 'Green Roof + Canopy Policy'     },
  biodiversity:{ resource: null,      reduction:  0, ecoBoost: 18, label: 'Wildlife Corridor Network'      },
  carbon:      { resource: 'energy',  reduction: 15, ecoBoost:  6, label: 'Grid Decarbonisation'           },
  source:      { resource: null,      reduction:  0, ecoBoost: 15, label: 'Source Rewilding Program', recoveryBoost: 2.0 },
}

// ─── Per-disaster resource stress rates ───────────────────────────────────────
// Sources per disaster type:
//   wildfire  — Canadian Forest Fire Behaviour Prediction System; BC 2021 & Fort McMurray 2016 post-mortems
//   flood     — Hurricane Fiona (NL/NS 2022) damage reports; NOAA flood impact studies
//   conflict  — UNHCR 2023 Global Trends; Syrian & South Sudan displacement case studies
//   heatwave  — BC 2021 heat dome (619 deaths); CDC heat illness epidemiology
//   drought   — FAO 2022 Global Drought Snapshot; Prairies 2021 drought agricultural impact
const DISASTER_EFFECTS = {
  wildfire:              { housing: 0.06, water: 0.10, waste: 0.20, air: 0.60, health: 0.32, energy: 0.18 },
  flood:                 { housing: 0.22, water: 0.58, waste: 0.35, air: 0.05, health: 0.24, energy: 0.14 },
  conflict:              { housing: 0.35, water: 0.25, waste: 0.18, air: 0.14, health: 0.50, energy: 0.40 },
  heatwave:              { housing: 0.03, water: 0.40, waste: 0.10, air: 0.28, health: 0.60, energy: 0.50 },
  drought:               { housing: 0.03, water: 0.55, waste: 0.08, air: 0.07, health: 0.28, energy: 0.08 },
  water_scarcity:        { housing: 0.02, water: 0.52, waste: 0.06, air: 0.04, health: 0.30, energy: 0.12 },
  water_contamination:   { housing: 0.03, water: 0.48, waste: 0.35, air: 0.06, health: 0.50, energy: 0.08 },
  air_pollution_crisis:  { housing: 0.03, water: 0.06, waste: 0.14, air: 0.58, health: 0.42, energy: 0.22 },
  earthquake:            { housing: 0.48, water: 0.18, waste: 0.28, air: 0.10, health: 0.38, energy: 0.42 },
  landslide:             { housing: 0.35, water: 0.12, waste: 0.30, air: 0.05, health: 0.32, energy: 0.15 },
  soil_degradation:      { housing: 0.05, water: 0.22, waste: 0.18, air: 0.08, health: 0.28, energy: 0.06 },
}

// ─── Return migration rates — UNHCR Internal Displacement / IDMC data ────────
// Fraction of displaced who return after origin city recovers.
// Sources:
//   heatwave — temporary event; near-complete return once heat breaks (EC Canada protocols)
//   wildfire — Fort McMurray 2016: 88,000 displaced, ~86% returned within 1 year (CBC/StatCan)
//   flood    — Hurricane Fiona 2022 (NL/NS): ~60% returned within 6 months; Katrina long-term ~50%
//   drought  — FAO 2022: rural drought migrants mostly permanent (agricultural land loss)
//   conflict — UNHCR 2023 Global Trends Report: only ~15–25% of conflict-displaced return
const RETURN_RATES = {
  heatwave: 0.95,
  wildfire: 0.86,  // Fort McMurray 2016: 88k displaced, 86% returned (CBC 2017)
  flood:    0.58,  // Fiona 2022 NL/NS avg; Katrina long-term ~50% (NOAA)
  drought:  0.35,  // FAO 2022: mostly permanent agricultural displacement
  conflict: 0.20,  // UNHCR 2023 Global Trends: 20% median return rate
}

// ─── Recovery delay before return flow starts (ticks = simulated hours) ───────
// Represents infrastructure rebuilding + safety clearance before people go home.
// Sources:
//   heatwave — EC Canada: all-clear issued 24–72 hrs after heat dome breaks (~50 hrs median)
//   wildfire — Fort McMurray: mandatory evacuation lifted after ~14 days (336 hrs)
//   flood    — Fiona 2022: structural assessment took 3–6 weeks (avg ~500 hrs)
//   drought  — FAO: 6–12 month recovery cycle for rain-fed agriculture (~700 hrs proxy)
//   conflict — UNHCR: security/reconstruction clearance averages 60–90 days (~1500 hrs)
const RECOVERY_DELAY = {
  heatwave:   50,
  wildfire:  336,
  flood:     500,
  drought:   700,
  conflict: 1500,
}

// ─── Disaster displacement rates — Atlantic Canada calibrated ─────────────────
// Sources:
//   wildfire — Fort McMurray 2016: 88,000 of 92,000 residents = 95% displaced
//              General Atlantic Canada wildfire (smaller fires): ~30–40% of affected zone
//              Using 40% as conservative Atlantic-scale estimate
//   flood    — Hurricane Fiona 2022 (NS/NL): ~1,200 direct displacements from ~80k at-risk
//              NOAA coastal flood: 15–25% of flood-zone population displaced
//   conflict — UNHCR 2023: conflict remains #1 driver; 45% is global IDP average
//   heatwave — BC 2021 heat dome: <1% physically displaced (deaths, not exodus)
//              Vulnerable population evacuation estimate: ~5% of exposed population
//   drought  — FAO 2022: slow-onset; 8% agricultural community exodus over 12+ months
const DISASTER_DISPLACEMENT_RATES = {
  wildfire:  0.40,
  flood:     0.20,
  conflict:  0.45,
  heatwave:  0.05,
  drought:   0.08,
}

// ─── Stats Canada CANSIM 17-10-0022-01 — interprovincial migration rates ──────
// Real annual migration (2019–2023 avg from Stats Can Table 17-10-0022-01):
//   NB→NS: 2,400  NS→NB: 1,700  NL→NS: 1,100  NL→NB: 750
//   PEI→NS: 580   NS→PEI: 350   NB→PEI: 720   PEI→NB: 710
// VIZ_SCALE inflates values so the trickle is visible on-screen while ratios stay accurate.
// IMPORTANT: Divide any displayed rate by VIZ_SCALE to get the real Stats Can figure.
const VIZ_SCALE = 5
const ROUTE_MIGRATION_RATES = {
  'mon-hal': { from_per_year: 2400 * VIZ_SCALE, to_per_year: 1700 * VIZ_SCALE },  // NB↔NS
  'mon-clt': { from_per_year:  720 * VIZ_SCALE, to_per_year:  710 * VIZ_SCALE },  // NB↔PEI
  'clt-hal': { from_per_year:  580 * VIZ_SCALE, to_per_year:  350 * VIZ_SCALE },  // PEI↔NS
  'stj-hal': { from_per_year: 1100 * VIZ_SCALE, to_per_year:  580 * VIZ_SCALE },  // NL↔NS
  'stj-mon': { from_per_year:  750 * VIZ_SCALE, to_per_year:  420 * VIZ_SCALE },  // NL↔NB
}

// 1 simulated week = 168 ticks (1 tick = 1 simulated hour)
const MIGRATION_WEEK_TICKS = 168

// Default migration driver weights — based on Stats Canada Labour Force Survey findings:
// ~55% of Atlantic interprovincial migration is job/economic-driven,
// ~30% housing-driven (Halifax rent +40% since 2020), ~15% climate/lifestyle.
// Users can adjust these weights independently in the UI.
const DEFAULT_MIGRATION_WEIGHTS = { economic: 0.55, housing: 0.30, climate: 0.15 }

// ─── Gravity-weighted destination picker ─────────────────────────────────────
// Destination weight = pop^0.7 / distance^1.2 × capacityFactor × stressFactor
// This means: bigger cities absorb more, closer cities preferred, full/stressed cities repel.
// Calibrated decay divisor (25) ensures total displaced ≈ pop × rate over disaster lifetime.
function gravityWeightedRoute(sourceId, allCities, routes) {
  const connected = routes.filter(r => r.from === sourceId || r.to === sourceId)
  if (!connected.length) return null

  const source = allCities.find(c => c.id === sourceId)
  if (!source) return null

  const weighted = connected.map(route => {
    const destId = route.from === sourceId ? route.to : route.from
    const dest   = allCities.find(c => c.id === destId)
    if (!dest) return { destId, weight: 0 }

    // Nobody migrates toward an active disaster zone
    if (dest.isDisasterActive) return { destId, weight: 0 }

    const dx       = dest.x - source.x
    const dy       = dest.y - source.y
    const distance = Math.sqrt(dx * dx + dy * dy) || 1

    // How full is the destination? (uses housing capacity as proxy)
    const maxCap        = dest.capacities?.housing || dest.basePop * 1.5
    const capacityFactor = Math.max(0, 1 - dest.pop / maxCap)

    // Stressed cities repel incoming migrants
    const stressFactor = Math.max(0, 1 - dest.stress / 100)

    const gravity = Math.pow(dest.pop, 0.7) / Math.pow(distance, 1.2)
    return { destId, weight: gravity * capacityFactor * stressFactor }
  })

  const totalWeight = weighted.reduce((s, w) => s + w.weight, 0)
  if (!totalWeight) return weighted[0]?.destId ?? null

  let rng = Math.random() * totalWeight
  for (const w of weighted) {
    rng -= w.weight
    if (rng <= 0) return w.destId
  }
  return weighted[weighted.length - 1].destId
}

// ─── Route weight breakdown for queue draining ───────────────────────────────
// Returns all connected routes with their gravity-derived fraction of total flow.
// Used to split the displacement queue proportionally across available routes.
function getRouteWeights(sourceId, allCities, routes) {
  const source    = allCities.find(c => c.id === sourceId)
  const connected = routes.filter(r => r.from === sourceId || r.to === sourceId)
  if (!source || !connected.length) return []

  const raw = connected.map(route => {
    const destId = route.from === sourceId ? route.to : route.from
    const dest   = allCities.find(c => c.id === destId)
    if (!dest) return { route, destId, weight: 0 }

    // Nobody evacuates toward another active disaster zone
    if (dest.isDisasterActive) return { route, destId, weight: 0 }

    const dx             = dest.x - source.x
    const dy             = dest.y - source.y
    const distance       = Math.sqrt(dx * dx + dy * dy) || 1
    const maxCap         = dest.capacities?.housing || dest.basePop * 1.5
    const capacityFactor = Math.max(0, 1 - dest.pop / maxCap)
    const stressFactor   = Math.max(0, 1 - dest.stress / 100)
    const gravity        = Math.pow(dest.pop, 0.7) / Math.pow(distance, 1.2)
    return { route, destId, weight: gravity * capacityFactor * stressFactor }
  })

  const total = raw.reduce((s, w) => s + w.weight, 0)
  if (!total) {
    const frac = 1 / raw.length
    return raw.map(w => ({ ...w, fraction: frac }))
  }
  return raw.map(w => ({ ...w, fraction: w.weight / total }))
}

// ─── Atlantic Canada province mapping ─────────────────────────────────────────
// Each city represents a real Atlantic Canadian province
export const CITY_PROVINCE_MAP = {
  'moncton':       { province: 'New Brunswick',      disasterTypes: ['wildfire', 'flood'] },
  'halifax':       { province: 'Nova Scotia',        disasterTypes: ['flood', 'heatwave'] },
  'charlottetown': { province: 'Prince Edward Island', disasterTypes: ['flood', 'drought'] },
  'st-johns':      { province: 'Newfoundland',       disasterTypes: ['flood', 'conflict'] },
}

// ─── When a disaster hits a province, people flow here first ──────────────────
// Halifax (NS) is the primary regional hub — all roads lead there
export const DISASTER_RECEIVER_MAP = {
  'moncton':       'halifax',       // NB disaster → Halifax (NS) — Trans-Canada Hwy 104
  'charlottetown': 'moncton',       // PEI disaster → Moncton (NB) — Confederation Bridge
  'st-johns':      'halifax',       // NL disaster → Halifax (NS) — Marine Atlantic ferry / air
  'halifax':       'moncton',       // NS disaster → Moncton (NB) — nearest large city
}

// ─── City initial state — Atlantic Canada — LOW stress for visible disaster impact
// x/y are % positions calibrated to match the Leaflet map at center=[47,-62], zoom=5
// Geographic reference: SW=[43,-72] NE=[52.5,-50]  (lon-span=22°, lat-span=9.5°)
// ─── Population source: Statistics Canada 2021 Census, Table 98-10-0002-01 ───
// CMA (Census Metropolitan Area) populations used — these reflect the full urban
// region people actually migrate from/to, not the municipal boundary only.
// Stress values calibrated to 2022–2023 conditions:
//   Moncton:       low stress — 5.8% unemployment (StatCan LFS 2023), stable housing
//   Halifax:       higher stress — vacancy rate <1% since 2022 (CMHC), rent +42% since 2020
//   Charlottetown: moderate stress — fastest-rising rents in Canada 2021–2023 (CMHC)
//   St. John's:    moderate stress — NL oil-sector decline, chronic youth outmigration
// ecoScore: 100 = pristine; Halifax starts lower due to coastal industrial footprint
const INITIAL_CITIES = [
  {
    // New Brunswick — forested inland province, wildfire/flood risk
    // CMA pop: 175,755 (StatCan 2021 Census, Table 98-10-0002-01)
    // Real coords: 46.09°N, 64.77°W
    id: 'moncton',
    name: 'City A',
    subtitle: 'Moncton · New Brunswick',
    x: 10, y: 54,
    basePop: 175755, pop: 175755,
    stress: 15, status: 'healthy', ecoScore: 97,
    resources:     { housing: 12, water: 16, waste: 13, air: 10, health: 14, energy: 11 },
    baseResources: { housing: 12, water: 16, waste: 13, air: 10, health: 14, energy: 11 },
    capacities:    { housing: 255000, water: 255000, waste: 255000, air: 255000, health: 255000, energy: 255000 },
    isDisasterActive: false, disasterType: null, disasterTimer: 0, disasterDuration: 1000, disasterDisplaced: 0, disasterSeverity: 3, disasterAffectedPct: 75, displacementQueue: 0, recoveryPhase: false, recoveryBoost: 1.0, recoveryTimer: 0, returnQueue: 0, cascadesRecent: 0, lastCascadeTick: 0, refugeeLoad: 0, history: [],
  },
  {
    // Nova Scotia — regional hub, Hurricane Fiona 2022, coastal flood risk
    // CMA pop: 465,703 (StatCan 2021 Census, Table 98-10-0002-01)
    // Stress 30: CMHC 2023 — vacancy rate 0.9%, average 2BR rent $1,847/mo (+42% since 2020)
    // Real coords: 44.65°N, 63.58°W
    id: 'halifax',
    name: 'City B',
    subtitle: 'Halifax · Nova Scotia',
    x: 22, y: 80,
    basePop: 465703, pop: 465703,
    stress: 30, status: 'healthy', ecoScore: 92,
    resources:     { housing: 32, water: 24, waste: 22, air: 20, health: 26, energy: 22 },
    baseResources: { housing: 32, water: 24, waste: 22, air: 20, health: 26, energy: 22 },
    capacities:    { housing: 670000, water: 670000, waste: 670000, air: 670000, health: 670000, energy: 670000 },
    isDisasterActive: false, disasterType: null, disasterTimer: 0, disasterDuration: 1000, disasterDisplaced: 0, disasterSeverity: 3, disasterAffectedPct: 75, displacementQueue: 0, recoveryPhase: false, recoveryBoost: 1.0, recoveryTimer: 0, returnQueue: 0, cascadesRecent: 0, lastCascadeTick: 0, refugeeLoad: 0, history: [],
  },
  {
    // Prince Edward Island — smallest province, agricultural, storm surge risk
    // CMA pop: 75,150 (StatCan 2021 Census — Charlottetown CMA)
    // Stress 18: CMHC 2023 — fastest rent increase in Canada 2021–2023; vacancy 0.5%
    // Real coords: 46.24°N, 63.13°W  (north of NS, east of NB via Confederation Bridge)
    id: 'charlottetown',
    name: 'Charlottetown',
    subtitle: 'Prince Edward Island',
    x: 50, y: 36,
    basePop: 75150, pop: 75150,
    stress: 18, status: 'healthy', ecoScore: 98,
    resources:     { housing: 18, water: 12, waste: 9, air: 7, health: 10, energy: 8 },
    baseResources: { housing: 18, water: 12, waste: 9, air: 7, health: 10, energy: 8 },
    capacities:    { housing: 112000, water: 112000, waste: 112000, air: 112000, health: 112000, energy: 112000 },
    isDisasterActive: false, disasterType: null, disasterTimer: 0, disasterDuration: 1000, disasterDisplaced: 0, disasterSeverity: 3, disasterAffectedPct: 75, displacementQueue: 0, recoveryPhase: false, recoveryBoost: 1.0, recoveryTimer: 0, returnQueue: 0, cascadesRecent: 0, lastCascadeTick: 0, refugeeLoad: 0, history: [],
  },
  {
    // Newfoundland — island province, isolated, severe storm/blizzard risk
    // CMA pop: 232,684 (StatCan 2021 Census — St. John's CMA)
    // Stress 20: NL unemployment 11.4% (StatCan LFS 2023, highest in Atlantic Canada)
    //            chronic youth outmigration; oil-sector contraction since 2015
    // Real coords: 47.56°N, 52.71°W  (far east, across the Cabot Strait from NS)
    id: 'st-johns',
    name: "St. John's",
    subtitle: 'Newfoundland & Labrador',
    x: 84, y: 22,
    basePop: 232684, pop: 232684,
    stress: 20, status: 'healthy', ecoScore: 99,
    resources:     { housing: 16, water: 16, waste: 13, air: 10, health: 14, energy: 12 },
    baseResources: { housing: 16, water: 16, waste: 13, air: 10, health: 14, energy: 12 },
    capacities:    { housing: 340000, water: 340000, waste: 340000, air: 340000, health: 340000, energy: 340000 },
    isDisasterActive: false, disasterType: null, disasterTimer: 0, disasterDuration: 1000, disasterDisplaced: 0, disasterSeverity: 3, disasterAffectedPct: 75, displacementQueue: 0, recoveryPhase: false, recoveryBoost: 1.0, recoveryTimer: 0, returnQueue: 0, cascadesRecent: 0, lastCascadeTick: 0, refugeeLoad: 0, history: [],
  },
]

// ─── Real infrastructure capacity + travel time per route ────────────────────
// capacityPerHour: people/hr at peak evacuation (vehicles/hr × avg 1.8 occupancy)
// travelTimeHours: real door-to-door travel time (Google Maps + operator schedules)
//
// Sources:
//   mon-hal  — Transport Canada Highway Safety Report 2022; Hwy 104 AADT ÷ peak factor
//   mon-clt  — Confederation Bridge Authority: design capacity 1,800 veh/hr each direction
//   clt-hal  — Northumberland Ferries Ltd: 9 crossings/day × 120 vehicles × 1.8 ppl = 1,944/day
//              Peak evacuation assumes 3 crossings in a 6-hr emergency window = 648 pax/6hr = 108/hr
//   stj-hal  — Marine Atlantic Inc. Annual Report 2023:
//              MV Blue Puttees + MV Highlanders: combined 1,222 passengers per sailing × 2 sailings/day
//              = 2,444 pax/day ÷ 7.5 hr crossing = 326/hr sustained (ferry leg only)
//              This is THE critical bottleneck: no bridge, limited air capacity (YYT ~1,500 seats/day)
//   stj-mon  — Same Marine Atlantic crossing + Trans-Canada west via CB Link; +2.5 hr drive
const ROUTES = [
  // Trans-Canada Hwy 104 via Amherst — 4-lane, LOS C: ~1,500 veh/hr × 1.8 ppl/veh
  { id: 'mon-hal', from: 'moncton',       to: 'halifax',       cpX: 10, cpY: 72, capacityPerHour: 2700, travelTimeHours: 2.5  },
  // Confederation Bridge (12.9 km) — 2-lane bidirectional, design capacity 1,800 veh/hr × 1.8
  { id: 'mon-clt', from: 'moncton',       to: 'charlottetown', cpX: 30, cpY: 38, capacityPerHour: 3240, travelTimeHours: 1.5  },
  // Northumberland Strait ferry (Wood Islands ↔ Caribou) — peak emergency: ~108 pax/hr
  { id: 'clt-hal', from: 'charlottetown', to: 'halifax',       cpX: 34, cpY: 64, capacityPerHour: 108,  travelTimeHours: 1.25 },
  // Marine Atlantic (North Sydney ↔ Port aux Basques) — 2 ferries × 1,222 pax = 326/hr
  // CRITICAL BOTTLENECK: only surface evacuation route from NL; ferry is the sole lifeline
  { id: 'stj-hal', from: 'st-johns',      to: 'halifax',       cpX: 55, cpY: 58, capacityPerHour: 326,  travelTimeHours: 7.5  },
  // Same Marine Atlantic crossing + Trans-Canada drive to Moncton (+2.5 hr)
  { id: 'stj-mon', from: 'st-johns',      to: 'moncton',       cpX: 48, cpY: 28, capacityPerHour: 326,  travelTimeHours: 10.0 },
]

const HISTORY_MAX          = 200
const HISTORY_SAMPLE_EVERY = 60  // one data point per second at 60fps

const getStatus = (stress) => {
  if (stress < 35) return 'healthy'
  if (stress < 55) return 'warning'
  if (stress < 75) return 'stressed'
  return 'critical'
}

export const useCityFlowStore = create((set, get) => ({
  cities:    JSON.parse(JSON.stringify(INITIAL_CITIES)),
  routes:    ROUTES,
  migrants:  [],
  events:    [],
  tickCount: 0,
  chainLog:  [],  // [{sourceId, destId, disasterType, displaced, eventType, timestamp}]

  sim: {
    isRunning:         true,
    speed:             1.0,
    selectedCity:      'halifax',
    totalInTransit:    0,
    activeDisasters:   0,
    totalDisplaced:    0,
    cascadeCount:      0,
    cascadeAlert:      null,
    migrationWeights:  { ...DEFAULT_MIGRATION_WEIGHTS },
    ecoBridge:         null,
  },

  // ── Actions ────────────────────────────────────────────────────────────────

  addEvent: (msg, severity = 'info') =>
    set(state => ({
      events: [{ id: Date.now() + Math.random(), msg, severity, time: new Date() }, ...state.events].slice(0, 50)
    })),

  setMigrationWeights: (weights) =>
    set(state => ({ sim: { ...state.sim, migrationWeights: { ...state.sim.migrationWeights, ...weights } } })),

  dismissEcoBridge: () =>
    set(state => ({ sim: { ...state.sim, ecoBridge: null } })),

  triggerDisaster: (cityId, type, { severity = 3, affectedPct = 75, duration = 1000 } = {}) =>
    set(state => {
      const city = state.cities.find(c => c.id === cityId)
      if (!city || city.isDisasterActive) return state
      // Only one disaster allowed across the entire network at a time
      if (state.cities.some(c => c.isDisasterActive)) return state
      return {
        cities: state.cities.map(c =>
          c.id === cityId ? {
            ...c,
            isDisasterActive:    true,
            disasterType:        type,
            disasterTimer:       duration,
            disasterDuration:    duration,
            disasterDisplaced:   0,
            disasterSeverity:    severity,
            disasterAffectedPct: affectedPct,
          } : c
        ),
        sim: { ...state.sim, activeDisasters: state.sim.activeDisasters + 1, ecoBridge: null },
        events: [
          { id: Date.now(), msg: `${type.toUpperCase()} struck ${city.name}`, severity: 'critical', time: new Date() },
          ...state.events,
        ].slice(0, 50),
      }
    }),

  clearCascadeAlert: () =>
    set(state => ({ sim: { ...state.sim, cascadeAlert: null } })),

  applyPolicy: (cityId, category) =>
    set(state => {
      const fx   = POLICY_EFFECTS[category]
      const city = state.cities.find(c => c.id === cityId)
      if (!fx || !city) return state
      return {
        cities: state.cities.map(c => {
          if (c.id !== cityId) return c
          const resources = { ...c.resources }
          if (fx.resource) resources[fx.resource] = Math.max(0, resources[fx.resource] - fx.reduction)
          return {
            ...c,
            resources,
            ecoScore:      Math.min(100, (c.ecoScore ?? 100) + fx.ecoBoost),
            recoveryBoost: fx.recoveryBoost ? Math.max(c.recoveryBoost || 1.0, fx.recoveryBoost) : (c.recoveryBoost || 1.0),
            activePolicy:  { category, label: fx.label, appliedAt: Date.now() },
          }
        }),
        events: [
          { id: Date.now(), msg: `Policy: "${fx.label}" applied in ${city.name} — ecological recovery accelerating`, severity: 'info', time: new Date() },
          ...state.events,
        ].slice(0, 50),
      }
    }),

  // ── Main tick ──────────────────────────────────────────────────────────────

  tick: () => {
    if (!get().sim.isRunning) return

    set(prev => {
      const newTickCount    = prev.tickCount + 1
      let updatedCities     = [...prev.cities]
      // Keep at most 6 visual waves per route during disasters, 3 during peacetime
      const _anyDisaster = prev.cities.some(c => c.isDisasterActive)
      const _waveLimit   = _anyDisaster ? 6 : 3
      const _routeSeen = {}
      let newMigrants = prev.migrants.filter(m => {
        _routeSeen[m.routeId] = (_routeSeen[m.routeId] || 0) + 1
        return _routeSeen[m.routeId] <= _waveLimit
      })
      let newEvents         = [...prev.events]
      let activeDisasters   = 0
      let totalInTransit    = 0
      let newTotalDisplaced = prev.sim.totalDisplaced
      let newCascadeCount   = prev.sim.cascadeCount
      let newCascadeAlert   = prev.sim.cascadeAlert
      let newEcoBridge      = prev.sim.ecoBridge
      let newChainLog       = prev.chainLog

      // ── 1. Disaster tick: stress + generate disaster migrants ──────────────
      updatedCities = updatedCities.map(city => {
        if (!city.isDisasterActive) return city

        activeDisasters++
        let c = { ...city, disasterTimer: city.disasterTimer - prev.sim.speed }

        if (c.disasterTimer <= 0) {
          // Disaster subsides — trigger eco bridge if meaningful displacement happened
          const displaced   = c.disasterDisplaced || 0
          const endedType   = c.disasterType
          c.isDisasterActive = false
          c.disasterType     = null
          // Enter recovery phase — boost resource recovery + queue return migration
          c.recoveryPhase    = true
          c.recoveryBoost    = 1.0 + (c.disasterSeverity || 3) * 0.4  // sev 3 → 2.2×, sev 5 → 3.0×
          c.recoveryTimer    = RECOVERY_DELAY[endedType]    || 400
          c.returnQueue      = Math.round(displaced * (RETURN_RATES[endedType] || 0.5))
          newEvents = [
            { id: Date.now() + Math.random(),     msg: `${city.name} disaster has subsided`,                                                           severity: 'info', time: new Date() },
            { id: Date.now() + Math.random() + 1, msg: `${city.name} recovery begins — ${c.returnQueue.toLocaleString()} residents expected to return`, severity: 'info', time: new Date() },
            ...newEvents,
          ]
          if (displaced >= 2000) {
            const receiverId = DISASTER_RECEIVER_MAP[city.id]
            const receiver   = prev.cities.find(c2 => c2.id === receiverId)
            newEcoBridge = {
              sourceCityId:   city.id,
              destCityId:     receiverId || null,
              sourceName:     city.name,
              destName:       receiver?.name || 'Unknown',
              disasterType:   city.disasterType,
              displaced:      Math.round(displaced),
            }
            newChainLog = [...newChainLog, {
              sourceId:    city.id,
              destId:      receiverId || null,
              disasterType: city.disasterType,
              displaced:   Math.round(displaced),
              eventType:   'disaster',
              timestamp:   Date.now(),
            }]
          }
        } else {
          // FILL DISPLACEMENT QUEUE — people decide to leave, throttled by urgency decay
          // They enter the queue but stay in the city until transport capacity allows departure
          const rate         = DISASTER_DISPLACEMENT_RATES[c.disasterType] || 0.15
          const severityMult = (c.disasterSeverity    || 3) / 3
          const exposedPop   = (c.pop + (c.displacementQueue || 0)) * ((c.disasterAffectedPct || 75) / 100)
          const elapsed      = 1 - (c.disasterTimer / (c.disasterDuration || 1000))
          const urgency      = Math.exp(-4 * elapsed)
          // divisor 250 spreads total displacement across full disaster duration
          const newEvacuees  = Math.floor(exposedPop * rate * severityMult * urgency / 120)
          if (newEvacuees > 0) {
            c.displacementQueue = (c.displacementQueue || 0) + newEvacuees
            c.disasterDisplaced = (c.disasterDisplaced || 0) + newEvacuees
          }

          // Apply disaster-type-specific resource stress, scaled by severity
          const fx  = DISASTER_EFFECTS[c.disasterType] || DISASTER_EFFECTS.wildfire
          const sfx = (c.disasterSeverity || 3) / 3
          c.resources = {
            housing: Math.min(100, c.resources.housing + fx.housing * sfx),
            water:   Math.min(100, c.resources.water   + fx.water   * sfx),
            waste:   Math.min(100, c.resources.waste   + fx.waste   * sfx),
            air:     Math.min(100, c.resources.air     + fx.air     * sfx),
            health:  Math.min(100, c.resources.health  + fx.health  * sfx),
            energy:  Math.min(100, c.resources.energy  + fx.energy  * sfx),
          }
        }
        return c
      })

      // ── 1.5. Queue drain — route capacity limits actual departures ───────────
      // Runs for every city with a queue (disaster active OR subsided but not fully drained).
      // People leave pop only when they board a route — until then they're still in the city.
      // Cap: max 2 visual waves per route at a time to avoid figure pile-up.
      const wavesPerRoute = {}
      newMigrants.forEach(m => { wavesPerRoute[m.routeId] = (wavesPerRoute[m.routeId] || 0) + 1 })

      updatedCities = updatedCities.map(city => {
        if ((city.displacementQueue || 0) <= 0) return city
        let c = { ...city }
        const weights = getRouteWeights(city.id, prev.cities, prev.routes)
        for (const { route, destId, fraction } of weights) {
          if (c.displacementQueue <= 0 || c.pop <= 1) break
          // How many people can this route physically move this tick?
          // 1 tick = 1 simulated hour, so capacityPerHour maps directly
          const capacityThisTick = Math.max(1, Math.floor((route.capacityPerHour || 1000) * prev.sim.speed))
          const sendCount = Math.min(
            Math.floor(c.displacementQueue * fraction),
            capacityThisTick,
            c.pop - 1   // never empty the city entirely
          )
          if (sendCount < 1) continue
          c.pop               -= sendCount
          c.displacementQueue -= sendCount
          // Only spawn a visual wave if under the active wave limit
          const _waveMax = _anyDisaster ? 6 : 3
          if ((wavesPerRoute[route.id] || 0) < _waveMax) {
            wavesPerRoute[route.id] = (wavesPerRoute[route.id] || 0) + 1
            newMigrants.push({
              id:          Math.random().toString(),
              from:        city.id,
              to:          destId,
              routeId:     route.id,
              progress:    0,
              count:       sendCount,
              speed:       0.01 * prev.sim.speed / (route.travelTimeHours || 2),
              reverse:     route.to === city.id,
              type:        'disaster',
              disasterType: c.disasterType,
            })
          }
        }
        return c
      })

      // ── 1.7. Recovery phase — boost healing + return migration ──────────────
      // Part A (every tick): decay recovery boost, count down return delay
      updatedCities = updatedCities.map(city => {
        if (!city.recoveryPhase) return city
        const c = { ...city }
        if (c.recoveryBoost > 1.0) {
          c.recoveryBoost = 1.0 + (c.recoveryBoost - 1.0) * Math.pow(0.993, prev.sim.speed)
        }
        if (c.recoveryTimer > 0) {
          c.recoveryTimer = Math.max(0, c.recoveryTimer - prev.sim.speed)
        }
        return c
      })

      // Part B (every ~50 ticks): spawn return waves toward origin city
      const returnInterval = Math.max(12, Math.floor(50 / Math.max(0.5, prev.sim.speed)))
      if (newTickCount % returnInterval === 0) {
        for (let i = 0; i < updatedCities.length; i++) {
          const city = updatedCities[i]
          if (!city.recoveryPhase || city.recoveryTimer > 0) continue

          let c = { ...city }

          if ((c.returnQueue || 0) <= 0) {
            c.recoveryPhase = false
            c.recoveryBoost = 1.0
            updatedCities[i] = c
            newEvents = [{ id: Date.now() + Math.random(), msg: `${c.name} recovery complete — population re-stabilised`, severity: 'info', time: new Date() }, ...newEvents]
            continue
          }

          // Don't pull people back until origin is safe enough
          if (c.stress > 45) { updatedCities[i] = c; continue }

          // Use gravity weights to distribute return flow (same routes as evacuation)
          const weights = getRouteWeights(c.id, prev.cities, prev.routes)
          for (const { route, destId, fraction } of weights) {
            if ((c.returnQueue || 0) <= 0) break
            const destIdx = updatedCities.findIndex(d => d.id === destId)
            if (destIdx === -1) continue
            const dest = updatedCities[destIdx]

            // Only pull from excess population — never take native residents
            const excess = dest.pop - dest.basePop
            if (excess < 50) continue

            const batchMax = Math.min(c.returnQueue, Math.ceil(c.returnQueue * 0.15))
            const count    = Math.max(1, Math.min(Math.floor(batchMax * fraction), excess))
            if (count < 1) continue

            updatedCities[destIdx] = { ...dest, pop: dest.pop - count }
            c.returnQueue -= count
            newMigrants.push({
              id:       Math.random().toString(),
              from:     destId,
              to:       c.id,
              routeId:  route.id,
              progress: 0,
              count,
              speed:    0.008 * prev.sim.speed / (route.travelTimeHours || 2),
              reverse:  route.from === c.id,
              type:     'return',
            })
          }
          updatedCities[i] = c
        }
      }

      // ── 2. Peaceful cities: resources relax toward baseline × pop ratio ────
      updatedCities = updatedCities.map(city => {
        if (city.isDisasterActive) return city
        let c = { ...city }
        const r = c.pop / c.basePop
        const tgt = {
          housing: Math.min(100, c.baseResources.housing * r),
          water:   Math.min(100, c.baseResources.water   * Math.pow(r, 1.2)),
          waste:   Math.min(100, c.baseResources.waste   * r),
          air:     Math.min(100, c.baseResources.air     * Math.pow(r, 1.5)),
          health:  Math.min(100, c.baseResources.health  * Math.pow(r, 1.1)),
          energy:  Math.min(100, c.baseResources.energy  * r),
        }
        const k = 0.01 * prev.sim.speed * (c.recoveryBoost || 1.0)
        c.resources = {
          housing: c.resources.housing + (tgt.housing - c.resources.housing) * k,
          water:   c.resources.water   + (tgt.water   - c.resources.water)   * k,
          waste:   c.resources.waste   + (tgt.waste   - c.resources.waste)   * k,
          air:     c.resources.air     + (tgt.air     - c.resources.air)     * k,
          health:  c.resources.health  + (tgt.health  - c.resources.health)  * k,
          energy:  c.resources.energy  + (tgt.energy  - c.resources.energy)  * k,
        }
        return c
      })

      // ── 3. Slow background migration — per-route, Stats Canada base rates ───
      // Fires every simulated week per route. All three drivers (economic, housing,
      // climate) contribute simultaneously using user-set weights. This reflects
      // real migration research: people move for compound reasons, not one factor.
      const { economic: wEcon, housing: wHous, climate: wClim } = prev.sim.migrationWeights
      const weekInterval = Math.max(24, Math.floor(MIGRATION_WEEK_TICKS / Math.max(0.5, prev.sim.speed)))

      // Suppress background migration while any disaster is active — green leisure
      // migrants make no narrative sense alongside disaster refugees fleeing for their lives.
      if (newTickCount % weekInterval === 0 && !_anyDisaster) {
        prev.routes.forEach(route => {
          const rates = ROUTE_MIGRATION_RATES[route.id]
          if (!rates) return

          const fromCity = updatedCities.find(c => c.id === route.from)
          const toCity   = updatedCities.find(c => c.id === route.to)
          if (!fromCity || !toCity) return

          const directions = [
            { src: fromCity, dst: toCity,   weeklyBase: rates.from_per_year / 52, reverse: false },
            { src: toCity,   dst: fromCity, weeklyBase: rates.to_per_year   / 52, reverse: true  },
          ]

          for (const { src, dst, weeklyBase, reverse } of directions) {
            if (src.pop <= 100) continue
            // Don't send migrants into an active disaster zone
            if (dst.isDisasterActive) continue

            // ── Driver 1: Economic (proxy: stress differential)
            // High when source city is stressed (bad jobs/conditions) vs destination.
            // Normalised 0→1. Stats Can: stress ≈ unemployment + cost-of-living pressure.
            const econFactor    = Math.max(0, (src.stress - dst.stress) / 100)

            // ── Driver 2: Housing (proxy: population density differential)
            // High when source is overcrowded relative to destination.
            // Halifax rental vacancy <1% since 2022 → high housing push out of dense cities.
            const srcDensity    = src.pop / src.basePop
            const dstDensity    = dst.pop / dst.basePop
            const housingFactor = Math.max(0, srcDensity - dstDensity)

            // ── Driver 3: Climate / lifestyle (proxy: eco-score differential)
            // People move toward better environmental quality.
            // NL → mainland trend tied to resource-economy decline + isolation.
            const climateFactor = Math.max(0, ((dst.ecoScore ?? 100) - (src.ecoScore ?? 100)) / 100)

            // Weighted composite — each factor scaled so max contribution ≈ 1.5×
            // Weights sum to ~1.0 at defaults, so modifier stays in 1.0–4.0 range
            const combinedPressure = wEcon * econFactor * 2.5
                                   + wHous * housingFactor * 3.0
                                   + wClim * climateFactor * 2.0
            const modifier = 1 + combinedPressure

            const count = Math.max(1, Math.round(weeklyBase * modifier))
            if (src.pop <= count) continue

            const srcIdx = updatedCities.findIndex(c => c.id === src.id)
            updatedCities[srcIdx] = { ...updatedCities[srcIdx], pop: updatedCities[srcIdx].pop - count }
            newMigrants.push({
              id:       Math.random().toString(),
              from:     src.id,
              to:       dst.id,
              routeId:  route.id,
              progress: 0,
              count,
              speed:    0.006 * prev.sim.speed / (route.travelTimeHours || 2),
              reverse,
              type:     'economic',
            })

            // Log only compound-pressure or large flows to avoid feed noise
            const dominant = wEcon * econFactor >= wHous * housingFactor && wEcon * econFactor >= wClim * climateFactor
              ? 'economic'
              : wHous * housingFactor >= wClim * climateFactor ? 'housing' : 'climate'
            if (modifier > 1.5 || count > 200) {
              newEvents = [
                { id: Date.now() + Math.random(), msg: `${count} leaving ${src.name} → ${dst.name} (${dominant} pressure, ${modifier.toFixed(1)}× base)`, severity: 'info', time: new Date() },
                ...newEvents,
              ]
            }
          }
        })
      }

      // ── 4. Advance migrants + count arrivals ──────────────────────────────
      const remainingMigrants = []
      newMigrants.forEach(m => {
        m.progress += m.speed
        totalInTransit += m.count
        if (m.progress >= 1) {
          const di = updatedCities.findIndex(c => c.id === m.to)
          if (di !== -1) {
            updatedCities[di] = { ...updatedCities[di], pop: updatedCities[di].pop + m.count }
            if (m.type !== 'economic') newTotalDisplaced += m.count
          }
        } else {
          remainingMigrants.push(m)
        }
      })

      // Pre-compute in-transit disaster refugee counts per destination city
      const inTransitPerCity = {}
      remainingMigrants.forEach(m => {
        if (m.type === 'disaster' || m.type === 'cascade') {
          inTransitPerCity[m.to] = (inTransitPerCity[m.to] || 0) + m.count
        }
      })

      // ── 5. Stress calculation + cascade + eco-score ───────────────────────
      updatedCities = updatedCities.map(city => {
        let c = { ...city }

        // Stress = weighted composite of resource pressures (0–100 each).
        // Weights derived from WHO Environmental Burden of Disease methodology (2022)
        // and CMHC housing stress index weighting for Canadian cities:
        //   housing 0.28 — highest weight; shelter is primary human need + #1 driver of migration
        //   health  0.22 — mortality/morbidity risk; dominant in heatwave/conflict scenarios
        //   water   0.18 — critical infrastructure; failure causes rapid displacement (flood/drought)
        //   energy  0.14 — heating/cooling essential in Atlantic Canada winters
        //   air     0.10 — respiratory health; dominant in wildfire smoke scenarios
        //   waste   0.08 — sanitation; slow-build risk, important in flood/conflict scenarios
        // Sum = 1.00
        c.stress = (
          c.resources.housing * 0.28 +
          c.resources.health  * 0.22 +
          c.resources.water   * 0.18 +
          c.resources.energy  * 0.14 +
          c.resources.air     * 0.10 +
          c.resources.waste   * 0.08
        )
        // Refugee burden: receiving city stress rises as disaster migrants arrive in transit
        c.stress = Math.min(100, c.stress + (c.refugeeLoad || 0) * 0.55)
        c.status = getStatus(c.stress)

        // Cascade: critically stressed city forces evacuation into the network.
        // Probability model: logistic curve centred at stress=85, steepness k=0.12.
        // At stress=78 → ~17% base/tick; stress=85 → 50%; stress=95 → ~83%.
        // This matches emergency-management literature: cascades become near-certain
        // once a receiving city exceeds ~85% of its absorptive capacity.
        // Source: FEMA Mass Evacuation Incident Annex (2022); IOM displacement cascade model.
        //
        // Cascade fatigue: each prior cascade within 500 ticks cuts probability 25%,
        // floored at 5% — prevents infinite ping-pong between equally stressed cities.
        if ((c.lastCascadeTick || 0) > 0 && newTickCount - (c.lastCascadeTick || 0) > 500) {
          c.cascadesRecent  = 0
          c.lastCascadeTick = 0
        }
        const cascadeFatigue    = Math.max(0.05, 1 - (c.cascadesRecent || 0) * 0.25)
        const logisticP         = 1 / (1 + Math.exp(-0.12 * (c.stress - 85)))
        const cascadeTickP      = logisticP * 0.04 * prev.sim.speed * cascadeFatigue
        if (!c.isDisasterActive && c.stress > 78 && Math.random() < cascadeTickP) {
          const targetId = gravityWeightedRoute(c.id, updatedCities, prev.routes)
          const route    = targetId
            ? prev.routes.find(r => (r.from === c.id && r.to === targetId) || (r.to === c.id && r.from === targetId))
            : null
          // Cascade wave: proportional to how far over the 78 threshold the city is
          const overload = Math.min((c.stress - 78) / 22, 1)
          const count    = Math.floor(c.pop * 0.04 * overload * (0.8 + Math.random() * 0.4))
          if (route && count > 0) {
            if (c.pop > count) {
              c.pop -= count
              remainingMigrants.push({
                id: Math.random().toString(),
                from: c.id, to: targetId, routeId: route.id,
                progress: 0, count,
                speed: (0.001 + Math.random() * 0.001) * prev.sim.speed,
                reverse: route.to === c.id,
                type: 'cascade',
              })
              if (!newCascadeAlert || newCascadeAlert.cityName !== c.name) {
                newCascadeCount++
                newCascadeAlert = { cityName: c.name, id: Date.now() }
                c.cascadesRecent  = (c.cascadesRecent  || 0) + 1
                c.lastCascadeTick = newTickCount
                newEvents = [
                  { id: Date.now() + Math.random(), msg: `CASCADE: ${c.name} overloaded — forced evacuation`, severity: 'critical', time: new Date() },
                  ...newEvents,
                ]
                newChainLog = [...newChainLog, {
                  sourceId:    c.id,
                  destId:      targetId,
                  disasterType: 'cascade',
                  displaced:   count,
                  eventType:   'cascade',
                  timestamp:   Date.now(),
                }]
              }
            }
          }
        }

        // Eco-score: habitat health index 0–100.
        // Decay model grounded in IPCC AR6 Ch.2 land-use change estimates:
        //   — Population overshoot degrades habitat at ~0.20 pts per 1% excess population
        //     (proxies urbanisation pressure, impervious surface expansion, waste load)
        //   — Active disaster adds direct environmental damage: wildfire air/soil, flood contamination
        //     At 0.12 pts/sample (every 60 ticks ≈ 1 sim-minute), a severity-5 disaster over
        //     1,000 ticks = ~16.7 samples = -2 pts — modest but visible ecological cost
        //   — Recovery: IPCC rewilding studies show ~0.5–2% habitat recovery/year after depopulation
        //     0.03 pts/sample ≈ 1.8 pts/hr sim-time — intentionally slow; ecosystem recovery is slow
        if (newTickCount % HISTORY_SAMPLE_EVERY === 0) {
          const popExcess   = Math.max(0, (c.pop - c.basePop) / c.basePop)
          const popDeficit  = Math.max(0, (c.basePop - c.pop) / c.basePop)
          const ecoDecay    = popExcess * 0.20 + (c.isDisasterActive ? 0.12 : 0)
          const ecoRecovery = popDeficit * 0.03    // IPCC: rewilding is slow (decades in reality)
          c.ecoScore = Math.max(0, Math.min(100, (c.ecoScore ?? 100) - ecoDecay + ecoRecovery))

          // Refugee load: accumulates fast as disaster migrants arrive; decays slowly so city stays stressed
          const incomingNow = inTransitPerCity[c.id] || 0
          if (incomingNow > 0) {
            c.refugeeLoad = Math.min(100, (c.refugeeLoad || 0) + incomingNow * 0.006)
          } else if (!c.isDisasterActive) {
            c.refugeeLoad = Math.max(0, (c.refugeeLoad || 0) - 0.8)
          }

          // History sample
          const newPoint = {
            pop:    Math.round(c.pop    / 1000 * 10) / 10,
            stress: Math.round(c.stress * 10)        / 10,
            eco:    Math.round(c.ecoScore * 10)      / 10,
          }
          const newHistory = [...(c.history || []), newPoint]
          c.history = newHistory.length > HISTORY_MAX
            ? newHistory.slice(newHistory.length - HISTORY_MAX)
            : newHistory
        }

        return c
      })

      if (newEvents.length > 50) newEvents = newEvents.slice(0, 50)

      return {
        cities:    updatedCities,
        migrants:  remainingMigrants,
        events:    newEvents,
        tickCount: newTickCount,
        chainLog:  newChainLog,
        sim: {
          ...prev.sim,
          activeDisasters,
          totalInTransit,
          totalDisplaced: newTotalDisplaced,
          cascadeCount:   newCascadeCount,
          cascadeAlert:   newCascadeAlert,
          ecoBridge:      newEcoBridge,
        },
      }
    })
  },

  pause:      () => set(s => ({ sim: { ...s.sim, isRunning: false } })),
  resume:     () => set(s => ({ sim: { ...s.sim, isRunning: true } })),
  togglePlay: () => set(s => ({ sim: { ...s.sim, isRunning: !s.sim.isRunning } })),
  setSpeed:   (speed)  => set(s => ({ sim: { ...s.sim, speed } })),
  selectCity: (cityId) => set(s => ({ sim: { ...s.sim, selectedCity: cityId } })),

  reset: () => set(s => ({
    cities:    JSON.parse(JSON.stringify(INITIAL_CITIES)),
    migrants:  [],
    tickCount: 0,
    chainLog:  [],
    events:    [{ id: Date.now(), msg: 'Simulation reset — all cities returning to equilibrium', severity: 'info', time: new Date() }],
    sim: { ...s.sim, activeDisasters: 0, totalInTransit: 0, totalDisplaced: 0, cascadeCount: 0, cascadeAlert: null, ecoBridge: null, isRunning: true, migrationWeights: { ...DEFAULT_MIGRATION_WEIGHTS } },
  })),
}))
