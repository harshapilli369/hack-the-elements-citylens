import { create } from 'zustand'

const INITIAL_CITIES = [
  { 
    id: 'port-haven', 
    name: 'Port Haven', 
    x: 20, y: 35, 
    basePop: 318000, 
    pop: 318000, 
    stress: 52, 
    status: 'warning', 
    resources: { housing: 8, water: 60, waste: 44, air: 100, health: 86, energy: 12 }, 
    capacities: { housing: 400000, water: 400000, waste: 400000, air: 400000, health: 400000, energy: 400000 },
    baseResources: { housing: 8, water: 40, waste: 30, air: 50, health: 60, energy: 12 },
    isDisasterActive: false, 
    disasterType: null,
    disasterTimer: 0,
    history: []
  },
  { 
    id: 'verde-springs', 
    name: 'Verde Springs', 
    x: 65, y: 25, 
    basePop: 350000, 
    pop: 350000, 
    stress: 26, 
    status: 'healthy', 
    resources: { housing: 15, water: 30, waste: 20, air: 10, health: 15, energy: 10 }, 
    capacities: { housing: 500000, water: 500000, waste: 500000, air: 500000, health: 500000, energy: 500000 },
    baseResources: { housing: 15, water: 30, waste: 20, air: 10, health: 15, energy: 10 },
    isDisasterActive: false, 
    disasterType: null,
    disasterTimer: 0,
    history: []
  },
  { 
    id: 'atlas-city', 
    name: 'Atlas City', 
    x: 45, y: 65, 
    basePop: 720000, 
    pop: 720000, 
    stress: 51, 
    status: 'warning', 
    resources: { housing: 40, water: 50, waste: 50, air: 40, health: 50, energy: 40 }, 
    capacities: { housing: 1000000, water: 1000000, waste: 1000000, air: 1000000, health: 1000000, energy: 1000000 },
    baseResources: { housing: 40, water: 50, waste: 50, air: 40, health: 50, energy: 40 },
    isDisasterActive: false, 
    disasterType: null,
    disasterTimer: 0,
    history: []
  },
  { 
    id: 'solara', 
    name: 'Solara', 
    x: 80, y: 75, 
    basePop: 220000, 
    pop: 220000, 
    stress: 24, 
    status: 'healthy', 
    resources: { housing: 10, water: 20, waste: 20, air: 10, health: 10, energy: 10 }, 
    capacities: { housing: 300000, water: 300000, waste: 300000, air: 300000, health: 300000, energy: 300000 },
    baseResources: { housing: 10, water: 20, waste: 20, air: 10, health: 10, energy: 10 },
    isDisasterActive: false, 
    disasterType: null,
    disasterTimer: 0,
    history: []
  }
]

const ROUTES = [
  { id: 'ph-vs', from: 'port-haven', to: 'verde-springs', cpX: 40, cpY: 10 },
  { id: 'ph-ac', from: 'port-haven', to: 'atlas-city', cpX: 20, cpY: 55 },
  { id: 'ph-s', from: 'port-haven', to: 'solara', cpX: 50, cpY: 40 },
  { id: 'vs-ac', from: 'verde-springs', to: 'atlas-city', cpX: 65, cpY: 45 },
  { id: 'ac-s', from: 'atlas-city', to: 'solara', cpX: 65, cpY: 85 }
]

const getStatus = (stress) => {
  if (stress < 40) return 'healthy'
  if (stress < 60) return 'warning'
  if (stress < 80) return 'stressed'
  return 'critical'
}

export const useCityFlowStore = create((set, get) => ({
  cities: JSON.parse(JSON.stringify(INITIAL_CITIES)),
  routes: ROUTES,
  migrants: [],
  events: [],
  sim: {
    isRunning: true,
    speed: 1.0,
    selectedCity: 'port-haven',
    totalInTransit: 0,
    activeDisasters: 0
  },

  addEvent: (msg, severity = 'info') => {
    set(state => ({
      events: [{ id: Date.now() + Math.random(), msg, severity, time: new Date() }, ...state.events].slice(0, 50)
    }))
  },

  triggerDisaster: (cityId, type) => {
    set(state => {
      const city = state.cities.find(c => c.id === cityId)
      if (!city || city.isDisasterActive) return state

      const newCities = state.cities.map(c => {
        if (c.id === cityId) {
          return { ...c, isDisasterActive: true, disasterType: type, disasterTimer: 1000 } // approx 16 seconds at 60fps
        }
        return c
      })

      return {
        cities: newCities,
        sim: { ...state.sim, activeDisasters: state.sim.activeDisasters + 1 },
        events: [{ id: Date.now(), msg: `${type.toUpperCase()} struck ${city.name}`, severity: 'critical', time: new Date() }, ...state.events].slice(0, 50)
      }
    })
  },

  tick: () => {
    const state = get()
    if (!state.sim.isRunning) return

    set(prev => {
      let updatedCities = [...prev.cities]
      let newMigrants = [...prev.migrants]
      let newEvents = [...prev.events]
      let activeDisasters = 0
      let totalInTransit = 0

      // Process Disasters & Generate Migrants
      updatedCities = updatedCities.map(city => {
        if (city.isDisasterActive) {
          activeDisasters++
          let updatedCity = { ...city, disasterTimer: city.disasterTimer - prev.sim.speed }
          
          if (updatedCity.disasterTimer <= 0) {
            updatedCity.isDisasterActive = false
            updatedCity.disasterType = null
            newEvents.unshift({ id: Date.now() + Math.random(), msg: `${city.name} disaster has subsided`, severity: 'info', time: new Date() })
          } else {
            // Generate migrants randomly
            if (Math.random() < 0.1 * prev.sim.speed) {
              const connectedRoutes = prev.routes.filter(r => r.from === city.id || r.to === city.id)
              if (connectedRoutes.length > 0) {
                const route = connectedRoutes[Math.floor(Math.random() * connectedRoutes.length)]
                const targetId = route.from === city.id ? route.to : route.from
                
                const count = Math.floor(500 + Math.random() * 1500)
                
                if (updatedCity.pop > count) {
                   updatedCity.pop -= count
                   newMigrants.push({
                     id: Math.random().toString(),
                     from: city.id,
                     to: targetId,
                     routeId: route.id,
                     progress: 0,
                     count,
                     speed: (0.001 + Math.random() * 0.001) * prev.sim.speed,
                     reverse: route.to === city.id // if we are moving from "to" to "from", progress goes 1 -> 0
                   })
                }
              }
            }

            // Spike resources
            updatedCity.resources = {
               housing: Math.min(100, updatedCity.resources.housing + 0.1),
               water: Math.min(100, updatedCity.resources.water + 0.2),
               waste: Math.min(100, updatedCity.resources.waste + 0.15),
               air: Math.min(100, updatedCity.resources.air + 0.3),
               health: Math.min(100, updatedCity.resources.health + 0.25),
               energy: Math.min(100, updatedCity.resources.energy + 0.1)
            }
          }
          return updatedCity
        } else {
           // Slow recovery or recalculate based on pop
           let updatedCity = { ...city }
           const popRatio = updatedCity.pop / updatedCity.basePop
           const targetHousing = Math.min(100, updatedCity.baseResources.housing * popRatio)
           const targetWater = Math.min(100, updatedCity.baseResources.water * Math.pow(popRatio, 1.2))
           const targetWaste = Math.min(100, updatedCity.baseResources.waste * popRatio)
           const targetAir = Math.min(100, updatedCity.baseResources.air * Math.pow(popRatio, 1.5))
           const targetHealth = Math.min(100, updatedCity.baseResources.health * Math.pow(popRatio, 1.1))
           const targetEnergy = Math.min(100, updatedCity.baseResources.energy * popRatio)

           updatedCity.resources = {
               housing: updatedCity.resources.housing + (targetHousing - updatedCity.resources.housing) * 0.01 * prev.sim.speed,
               water: updatedCity.resources.water + (targetWater - updatedCity.resources.water) * 0.01 * prev.sim.speed,
               waste: updatedCity.resources.waste + (targetWaste - updatedCity.resources.waste) * 0.01 * prev.sim.speed,
               air: updatedCity.resources.air + (targetAir - updatedCity.resources.air) * 0.01 * prev.sim.speed,
               health: updatedCity.resources.health + (targetHealth - updatedCity.resources.health) * 0.01 * prev.sim.speed,
               energy: updatedCity.resources.energy + (targetEnergy - updatedCity.resources.energy) * 0.01 * prev.sim.speed,
           }
           return updatedCity
        }
      })

      // Process Migrants
      let arrivedCount = 0
      const remainingMigrants = []
      newMigrants.forEach(m => {
         m.progress += m.speed
         totalInTransit += m.count
         if (m.progress >= 1) {
             const destIndex = updatedCities.findIndex(c => c.id === m.to)
             if (destIndex !== -1) {
                 updatedCities[destIndex].pop += m.count
             }
             arrivedCount++
         } else {
             remainingMigrants.push(m)
         }
      })

      // Cascade Effect (Overload)
      updatedCities = updatedCities.map(city => {
          let updatedCity = { ...city }
          updatedCity.stress = (
              updatedCity.resources.housing * 0.2 + 
              updatedCity.resources.water * 0.2 + 
              updatedCity.resources.waste * 0.15 + 
              updatedCity.resources.air * 0.15 + 
              updatedCity.resources.health * 0.15 + 
              updatedCity.resources.energy * 0.15
          )
          updatedCity.status = getStatus(updatedCity.stress)
          
          if (updatedCity.stress > 85 && Math.random() < 0.05 * prev.sim.speed) {
              // Cascade!
              const connectedRoutes = prev.routes.filter(r => r.from === updatedCity.id || r.to === updatedCity.id)
              if (connectedRoutes.length > 0) {
                const route = connectedRoutes[Math.floor(Math.random() * connectedRoutes.length)]
                const targetId = route.from === updatedCity.id ? route.to : route.from
                const count = Math.floor(1000 + Math.random() * 3000)
                
                if (updatedCity.pop > count) {
                   updatedCity.pop -= count
                   remainingMigrants.push({
                     id: Math.random().toString(),
                     from: updatedCity.id,
                     to: targetId,
                     routeId: route.id,
                     progress: 0,
                     count,
                     speed: (0.001 + Math.random() * 0.001) * prev.sim.speed,
                     reverse: route.to === updatedCity.id
                   })
                }
              }
          }
          return updatedCity
      })

      if (newEvents.length > 50) newEvents = newEvents.slice(0, 50)

      return {
          cities: updatedCities,
          migrants: remainingMigrants,
          events: newEvents,
          sim: { ...prev.sim, activeDisasters, totalInTransit }
      }
    })
  },

  pause: () => set(state => ({ sim: { ...state.sim, isRunning: false } })),
  resume: () => set(state => ({ sim: { ...state.sim, isRunning: true } })),
  togglePlay: () => set(state => ({ sim: { ...state.sim, isRunning: !state.sim.isRunning } })),
  setSpeed: (speed) => set(state => ({ sim: { ...state.sim, speed } })),
  selectCity: (cityId) => set(state => ({ sim: { ...state.sim, selectedCity: cityId } })),
  reset: () => set(state => ({
    cities: JSON.parse(JSON.stringify(INITIAL_CITIES)),
    migrants: [],
    events: [{ id: Date.now(), msg: 'Simulation reset', severity: 'info', time: new Date() }],
    sim: { ...state.sim, activeDisasters: 0, totalInTransit: 0, isRunning: true }
  }))
}))
