import { create } from 'zustand'

// ─── Per-disaster resource stress rates ───────────────────────────────────────
const DISASTER_EFFECTS = {
  wildfire:  { housing: 0.04, water: 0.08, waste: 0.18, air: 0.55, health: 0.28, energy: 0.16 },
  flood:     { housing: 0.18, water: 0.55, waste: 0.32, air: 0.04, health: 0.20, energy: 0.12 },
  conflict:  { housing: 0.32, water: 0.22, waste: 0.15, air: 0.12, health: 0.45, energy: 0.35 },
  heatwave:  { housing: 0.04, water: 0.35, waste: 0.12, air: 0.22, health: 0.52, energy: 0.45 },
  drought:   { housing: 0.04, water: 0.48, waste: 0.09, air: 0.09, health: 0.26, energy: 0.09 },
}

// ─── How often (in ticks) background economic migration fires ─────────────────
const PRESSURE_INTERVALS = {
  economic_opportunity: 120,  // fast — jobs drive constant movement
  housing_affordability: 180, // moderate — gradual market pressure
  climate_amenity: 260,       // slow — lifestyle decisions take longer
}

// ─── Count range (people) per background migration event ─────────────────────
const PRESSURE_COUNTS = {
  economic_opportunity: [200, 700],
  housing_affordability: [120, 420],
  climate_amenity: [50, 220],
}

// ─── Pick which city people leave and which they move to ─────────────────────
function selectMigrationPair(cities, pressure) {
  if (cities.length < 2) return {}

  let sourceCity, destCity

  if (pressure === 'economic_opportunity') {
    // People flee the highest-stress city toward the lowest-stress city
    const sorted = [...cities].sort((a, b) => b.stress - a.stress)
    sourceCity = sorted[0]
    destCity   = sorted[sorted.length - 1]
  } else if (pressure === 'housing_affordability') {
    // People flee the most overcrowded city toward the most under-populated
    const sorted = [...cities].sort((a, b) => (b.pop / b.basePop) - (a.pop / a.basePop))
    sourceCity = sorted[0]
    destCity   = sorted[sorted.length - 1]
  } else if (pressure === 'climate_amenity') {
    // People flee worst eco-health toward best eco-health
    const sorted = [...cities].sort((a, b) => (a.ecoScore ?? 100) - (b.ecoScore ?? 100))
    sourceCity = sorted[0]
    destCity   = sorted[sorted.length - 1]
  }

  if (!sourceCity || !destCity || sourceCity.id === destCity.id) return {}

  const [min, max] = PRESSURE_COUNTS[pressure] || [100, 400]
  const count = Math.floor(min + Math.random() * (max - min))

  return { sourceId: sourceCity.id, destId: destCity.id, count }
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
const INITIAL_CITIES = [
  {
    // New Brunswick — forested inland province, wildfire/flood risk
    // Real coords: 46.09°N, 64.77°W
    id: 'moncton',
    name: 'Moncton',
    subtitle: 'New Brunswick',
    x: 32, y: 56,
    basePop: 180000, pop: 180000,
    stress: 16, status: 'healthy', ecoScore: 100,
    resources:     { housing: 14, water: 18, waste: 15, air: 12, health: 16, energy: 12 },
    baseResources: { housing: 14, water: 18, waste: 15, air: 12, health: 16, energy: 12 },
    capacities:    { housing: 260000, water: 260000, waste: 260000, air: 260000, health: 260000, energy: 260000 },
    isDisasterActive: false, disasterType: null, disasterTimer: 0, disasterDisplaced: 0, history: [],
  },
  {
    // Nova Scotia — regional hub, Hurricane Fiona 2022, coastal flood risk
    // Real coords: 44.65°N, 63.58°W
    id: 'halifax',
    name: 'Halifax',
    subtitle: 'Nova Scotia',
    x: 38, y: 70,
    basePop: 460000, pop: 460000,
    stress: 28, status: 'healthy', ecoScore: 95,
    resources:     { housing: 28, water: 24, waste: 22, air: 18, health: 26, energy: 22 },
    baseResources: { housing: 28, water: 24, waste: 22, air: 18, health: 26, energy: 22 },
    capacities:    { housing: 650000, water: 650000, waste: 650000, air: 650000, health: 650000, energy: 650000 },
    isDisasterActive: false, disasterType: null, disasterTimer: 0, disasterDisplaced: 0, history: [],
  },
  {
    // Prince Edward Island — smallest province, agricultural, storm surge risk
    // Real coords: 46.24°N, 63.13°W  (north of NS, east of NB via Confederation Bridge)
    id: 'charlottetown',
    name: 'Charlottetown',
    subtitle: 'Prince Edward Island',
    x: 46, y: 50,
    basePop: 72000, pop: 72000,
    stress: 10, status: 'healthy', ecoScore: 100,
    resources:     { housing: 8, water: 12, waste: 9, air: 7, health: 10, energy: 8 },
    baseResources: { housing: 8, water: 12, waste: 9, air: 7, health: 10, energy: 8 },
    capacities:    { housing: 110000, water: 110000, waste: 110000, air: 110000, health: 110000, energy: 110000 },
    isDisasterActive: false, disasterType: null, disasterTimer: 0, disasterDisplaced: 0, history: [],
  },
  {
    // Newfoundland — island province, isolated, severe storm/blizzard risk
    // Real coords: 47.56°N, 52.71°W  (far east, across the Cabot Strait from NS)
    id: 'st-johns',
    name: "St. John's",
    subtitle: 'Newfoundland & Labrador',
    x: 78, y: 44,
    basePop: 215000, pop: 215000,
    stress: 14, status: 'healthy', ecoScore: 100,
    resources:     { housing: 12, water: 16, waste: 13, air: 10, health: 14, energy: 10 },
    baseResources: { housing: 12, water: 16, waste: 13, air: 10, health: 14, energy: 10 },
    capacities:    { housing: 310000, water: 310000, waste: 310000, air: 310000, health: 310000, energy: 310000 },
    isDisasterActive: false, disasterType: null, disasterTimer: 0, disasterDisplaced: 0, history: [],
  },
]

const ROUTES = [
  // NB ↔ NS — Trans-Canada Highway 104 via Amherst, primary land corridor
  { id: 'mon-hal', from: 'moncton',       to: 'halifax',       cpX: 33, cpY: 65 },
  // NB ↔ PEI — Confederation Bridge (12.9 km fixed link)
  { id: 'mon-clt', from: 'moncton',       to: 'charlottetown', cpX: 39, cpY: 49 },
  // PEI ↔ NS — Northumberland Strait ferry (Wood Islands → Caribou)
  { id: 'clt-hal', from: 'charlottetown', to: 'halifax',       cpX: 44, cpY: 62 },
  // NL ↔ NS — Marine Atlantic ferry / air corridor (North Sydney → Port aux Basques)
  { id: 'stj-hal', from: 'st-johns',      to: 'halifax',       cpX: 60, cpY: 62 },
  // NL ↔ NB — indirect route (ferry to NS, then Trans-Canada west)
  { id: 'stj-mon', from: 'st-johns',      to: 'moncton',       cpX: 55, cpY: 44 },
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

  sim: {
    isRunning:        true,
    speed:            1.0,
    selectedCity:     'halifax',
    totalInTransit:   0,
    activeDisasters:  0,
    totalDisplaced:   0,
    cascadeCount:     0,
    cascadeAlert:     null,          // { cityName, id }
    migrationPressure: 'economic_opportunity',
    ecoBridge:        null,          // { sourceCity, destCity, disasterType, displaced } — set when bridge should show
  },

  // ── Actions ────────────────────────────────────────────────────────────────

  addEvent: (msg, severity = 'info') =>
    set(state => ({
      events: [{ id: Date.now() + Math.random(), msg, severity, time: new Date() }, ...state.events].slice(0, 50)
    })),

  setMigrationPressure: (pressure) =>
    set(state => ({ sim: { ...state.sim, migrationPressure: pressure } })),

  dismissEcoBridge: () =>
    set(state => ({ sim: { ...state.sim, ecoBridge: null } })),

  triggerDisaster: (cityId, type) =>
    set(state => {
      const city = state.cities.find(c => c.id === cityId)
      if (!city || city.isDisasterActive) return state
      return {
        cities: state.cities.map(c =>
          c.id === cityId ? { ...c, isDisasterActive: true, disasterType: type, disasterTimer: 1000, disasterDisplaced: 0 } : c
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

  // ── Main tick ──────────────────────────────────────────────────────────────

  tick: () => {
    if (!get().sim.isRunning) return

    set(prev => {
      const newTickCount    = prev.tickCount + 1
      let updatedCities     = [...prev.cities]
      let newMigrants       = [...prev.migrants]
      let newEvents         = [...prev.events]
      let activeDisasters   = 0
      let totalInTransit    = 0
      let newTotalDisplaced = prev.sim.totalDisplaced
      let newCascadeCount   = prev.sim.cascadeCount
      let newCascadeAlert   = prev.sim.cascadeAlert
      let newEcoBridge      = prev.sim.ecoBridge

      // ── 1. Disaster tick: stress + generate disaster migrants ──────────────
      updatedCities = updatedCities.map(city => {
        if (!city.isDisasterActive) return city

        activeDisasters++
        let c = { ...city, disasterTimer: city.disasterTimer - prev.sim.speed }

        if (c.disasterTimer <= 0) {
          // Disaster subsides — trigger eco bridge if meaningful displacement happened
          const displaced = c.disasterDisplaced || 0
          c.isDisasterActive = false
          c.disasterType     = null
          newEvents = [
            { id: Date.now() + Math.random(), msg: `${city.name} disaster has subsided`, severity: 'info', time: new Date() },
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
          }
        } else {
          // Generate fleeing migrants + accumulate displaced count
          if (Math.random() < 0.1 * prev.sim.speed) {
            const connected = prev.routes.filter(r => r.from === city.id || r.to === city.id)
            if (connected.length > 0) {
              const route    = connected[Math.floor(Math.random() * connected.length)]
              const targetId = route.from === city.id ? route.to : route.from
              const count    = Math.floor(500 + Math.random() * 1500)
              if (c.pop > count) {
                c.pop -= count
                c.disasterDisplaced = (c.disasterDisplaced || 0) + count
                newMigrants.push({
                  id: Math.random().toString(),
                  from: city.id, to: targetId, routeId: route.id,
                  progress: 0, count,
                  speed: (0.001 + Math.random() * 0.001) * prev.sim.speed,
                  reverse: route.to === city.id,
                  type: 'disaster',
                })
              }
            }
          }
          // Apply disaster-type-specific resource stress
          const fx = DISASTER_EFFECTS[c.disasterType] || DISASTER_EFFECTS.wildfire
          c.resources = {
            housing: Math.min(100, c.resources.housing + fx.housing),
            water:   Math.min(100, c.resources.water   + fx.water),
            waste:   Math.min(100, c.resources.waste   + fx.waste),
            air:     Math.min(100, c.resources.air     + fx.air),
            health:  Math.min(100, c.resources.health  + fx.health),
            energy:  Math.min(100, c.resources.energy  + fx.energy),
          }
        }
        return c
      })

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
        const k = 0.01 * prev.sim.speed
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

      // ── 3. Background economic migration (slow, always running) ───────────
      const pressure    = prev.sim.migrationPressure
      const bgInterval  = Math.max(60, Math.floor((PRESSURE_INTERVALS[pressure] || 150) / Math.max(0.5, prev.sim.speed)))

      if (newTickCount % bgInterval === 0) {
        const { sourceId, destId, count } = selectMigrationPair(updatedCities, pressure)
        if (sourceId && destId && count) {
          const route = prev.routes.find(r =>
            (r.from === sourceId && r.to === destId) ||
            (r.to   === sourceId && r.from === destId)
          )
          const srcIdx = updatedCities.findIndex(c => c.id === sourceId)
          if (route && srcIdx !== -1 && updatedCities[srcIdx].pop > count) {
            updatedCities[srcIdx] = { ...updatedCities[srcIdx], pop: updatedCities[srcIdx].pop - count }
            newMigrants.push({
              id: Math.random().toString(),
              from: sourceId, to: destId, routeId: route.id,
              progress: 0, count,
              speed: (0.0005 + Math.random() * 0.0004) * prev.sim.speed, // slower than disaster
              reverse: route.to === sourceId,
              type: 'economic',
            })
            // Log only 1-in-3 economic events to avoid spamming the feed
            if (Math.random() < 0.33) {
              const srcName  = updatedCities[srcIdx].name
              const destName = updatedCities.find(c => c.id === destId)?.name
              const pressureLabel = {
                economic_opportunity:  'economic opportunity',
                housing_affordability: 'housing pressure',
                climate_amenity:       'climate amenity',
              }[pressure] || 'economic factors'
              newEvents = [
                {
                  id: Date.now() + Math.random(),
                  msg: `${count} people leaving ${srcName} for ${destName} (${pressureLabel})`,
                  severity: 'info',
                  time: new Date(),
                },
                ...newEvents,
              ]
            }
          }
        }
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

      // ── 5. Stress calculation + cascade + eco-score ───────────────────────
      updatedCities = updatedCities.map(city => {
        let c = { ...city }

        c.stress = (
          c.resources.housing * 0.20 +
          c.resources.water   * 0.20 +
          c.resources.waste   * 0.15 +
          c.resources.air     * 0.15 +
          c.resources.health  * 0.15 +
          c.resources.energy  * 0.15
        )
        c.status = getStatus(c.stress)

        // Cascade: critically stressed city forces evacuation
        if (c.stress > 78 && Math.random() < 0.05 * prev.sim.speed) {
          const connected = prev.routes.filter(r => r.from === c.id || r.to === c.id)
          if (connected.length > 0) {
            const route    = connected[Math.floor(Math.random() * connected.length)]
            const targetId = route.from === c.id ? route.to : route.from
            const count    = Math.floor(1000 + Math.random() * 3000)
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
                newEvents = [
                  { id: Date.now() + Math.random(), msg: `CASCADE: ${c.name} overloaded — forced evacuation`, severity: 'critical', time: new Date() },
                  ...newEvents,
                ]
              }
            }
          }
        }

        // Eco-score: degrades with overcrowding + disasters, recovers slowly when depopulated
        if (newTickCount % HISTORY_SAMPLE_EVERY === 0) {
          const popExcess   = Math.max(0, (c.pop - c.basePop) / c.basePop)
          const popDeficit  = Math.max(0, (c.basePop - c.pop) / c.basePop)
          const ecoDecay    = popExcess * 0.25 + (c.isDisasterActive ? 0.15 : 0)
          const ecoRecovery = popDeficit * 0.04    // rewilding is slow
          c.ecoScore = Math.max(0, Math.min(100, (c.ecoScore ?? 100) - ecoDecay + ecoRecovery))

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
    events:    [{ id: Date.now(), msg: 'Simulation reset — all cities returning to equilibrium', severity: 'info', time: new Date() }],
    sim: { ...s.sim, activeDisasters: 0, totalInTransit: 0, totalDisplaced: 0, cascadeCount: 0, cascadeAlert: null, ecoBridge: null, isRunning: true },
  })),
}))
