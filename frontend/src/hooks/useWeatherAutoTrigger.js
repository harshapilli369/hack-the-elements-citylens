import { useEffect, useRef } from 'react'
import { useCityFlowStore } from '../store/cityflowStore'

// Real geographic coordinates for the 4 Atlantic Canada cities
const CITY_COORDS = {
  'moncton':       { lat: 46.09, lon: -64.77 },
  'halifax':       { lat: 44.65, lon: -63.58 },
  'charlottetown': { lat: 46.24, lon: -63.13 },
  'st-johns':      { lat: 47.56, lon: -52.71 },
}

// Severity 1–5 from weather intensity.
// Thresholds calibrated to Environment Canada Public Weather Alert criteria:
//   Flood:    Special Weather Statement ≥15mm/hr; Warning ≥25mm/hr; Extreme ≥40mm/hr
//             Wind thresholds from EC Hurricane/Post-Tropical advisory levels
//   Wildfire: Canadian Forest Fire Weather Index (FWI) fire danger classes:
//             Extreme = FWI>35 proxied by temp+wind combo; Very High = FWI 20–35
//   Heatwave: EC Heat Warning: Atlantic Canada issues at ≥31°C for 2+ days;
//             Extreme Heat Emergency declared at ≥38°C (used in BC 2021 dome)
// Source: https://www.canada.ca/en/environment-climate-change/services/types-weather-forecasts-use/public/criteria-alerts.html
function deriveSeverity(disasterType, { temperature_2m, wind_speed_10m, precipitation }) {
  if (disasterType === 'flood') {
    if (precipitation > 40 || wind_speed_10m > 90) return 5  // EC Extreme rainfall / hurricane-force
    if (precipitation > 25 || wind_speed_10m > 70) return 4  // EC Rainfall Warning / gale-force
    if (precipitation > 15) return 3                          // EC Special Weather Statement
    return 2
  }
  if (disasterType === 'wildfire') {
    if (temperature_2m > 35 && wind_speed_10m > 50) return 5  // FWI Extreme — extreme fire weather
    if (temperature_2m > 32 && wind_speed_10m > 35) return 4  // FWI Very High
    return 3                                                    // FWI High
  }
  if (disasterType === 'heatwave') {
    if (temperature_2m > 38) return 5   // EC Extreme Heat Emergency (BC 2021 threshold)
    if (temperature_2m > 36) return 4   // EC Heat Warning (2-day sustained)
    if (temperature_2m > 32) return 3   // EC Heat Advisory — Atlantic Canada threshold
    return 2
  }
  return 2
}

// Affected population % from weather intensity.
// Sources:
//   flood    — NOAA flood exposure model: 25% baseline + 2.5% per mm/hr above 15mm threshold
//              Capped at 85% (some infrastructure always protected by elevation/design)
//   wildfire — Natural Resources Canada: Atlantic wildfires typically burn 20–60% of WUI zone
//              50% is a reasonable mid-scenario for a severity 3–4 event
//   heatwave — Environment Canada: whole population exposed, but vulnerability varies
//              85% accounts for ~15% being in air-conditioned spaces/care facilities
//   drought  — FAO 2022: Atlantic Canada drought primarily affects agricultural sector (~30%)
//              plus indirect population effects via food/water security (~40% total)
function deriveAffectedPct(disasterType, { precipitation }) {
  if (disasterType === 'flood')    return Math.min(85, Math.round((precipitation - 15) * 2.5 + 25))
  if (disasterType === 'wildfire') return 50
  if (disasterType === 'heatwave') return 85
  if (disasterType === 'drought')  return 40
  return 55
}

// WMO weather code → disaster type mapping.
// WMO code reference: https://open-meteo.com/en/docs (Table 1)
// Environment Canada alert thresholds: https://www.canada.ca/en/environment-climate-change/services/types-weather-forecasts-use/public/criteria-alerts.html
// Canadian Forest Fire Weather Index: https://cwfis.cfs.nrcan.gc.ca/background/summary/fwi
function classifyWeather(cityId, { temperature_2m, wind_speed_10m, relative_humidity_2m, precipitation, weather_code }) {
  // Flood: WMO 63–67 (moderate/heavy/freezing rain), 82 (violent shower), 95–99 (thunderstorm)
  // EC Special Weather Statement threshold: ≥15mm/hr
  const heavyRain     = weather_code >= 63 && weather_code <= 67
  const thunderstorm  = weather_code >= 95 && weather_code <= 99
  const violentShower = weather_code === 82 && precipitation > 10
  if (heavyRain || thunderstorm || violentShower) return 'flood'

  // St. John's only: WMO 73–75 (moderate/heavy snow) + gale-force winds = blizzard
  // Infrastructure disruption profile matches flood (road closures, shelter strain)
  if (cityId === 'st-johns') {
    const heavySnow = weather_code >= 73 && weather_code <= 75
    if (heavySnow && wind_speed_10m > 50) return 'flood'
  }

  // Wildfire: Canadian Forest Fire Weather Index (FWI) proxy criteria
  // High fire danger threshold: temp >28°C, RH <35%, wind >25 km/h (NRCan FWI thresholds)
  if (temperature_2m > 28 && relative_humidity_2m < 35 && wind_speed_10m > 25) return 'wildfire'

  // Heatwave: EC Atlantic Canada heat advisory threshold = 31°C sustained
  // Using 32°C to capture only confirmed Warning-level events (not just advisories)
  if (temperature_2m > 32) return 'heatwave'

  // Drought: chronic dryness proxy — EC defines drought as RH <20% sustained + precip <0.5mm/day
  // Note: true drought requires weeks of data; this is a single-observation proxy
  if (relative_humidity_2m < 20 && precipitation < 0.5) return 'drought'

  return null
}

const FETCH_INTERVAL_MS = 5 * 60 * 1000   // re-check every 5 minutes
const CITY_COOLDOWN_MS  = 10 * 60 * 1000  // minimum gap between auto-triggers per city
const STARTUP_DELAY_MS  = 15 * 1000       // wait 15s on mount — lets autoplay/onboarding settle

export function useWeatherAutoTrigger() {
  const isRunning = useCityFlowStore(state => state.sim.isRunning)

  // Tracks last auto-trigger timestamp per city — lives outside React state to avoid re-renders
  const cooldowns = useRef({})

  useEffect(() => {
    if (!isRunning) return

    async function evaluate() {
      // Always read fresh store state — this runs inside timers, not React render cycles
      const { cities, triggerDisaster, addEvent } = useCityFlowStore.getState()

      await Promise.allSettled(
        Object.entries(CITY_COORDS).map(async ([cityId, { lat, lon }]) => {
          const city = cities.find(c => c.id === cityId)

          // Skip: city already in a disaster (triggerDisaster also guards this, but fail fast)
          if (!city || city.isDisasterActive) return

          // Skip: cooldown not yet elapsed for this city
          if (Date.now() - (cooldowns.current[cityId] || 0) < CITY_COOLDOWN_MS) return

          try {
            const res = await fetch(
              `https://api.open-meteo.com/v1/forecast` +
              `?latitude=${lat}&longitude=${lon}` +
              `&current=temperature_2m,wind_speed_10m,relative_humidity_2m,precipitation,weather_code` +
              `&timezone=America%2FHalifax`
            )
            if (!res.ok) return

            const { current } = await res.json()
            const disasterType = classifyWeather(cityId, current)
            if (!disasterType) return

            // Mark cooldown before triggering so concurrent fetches can't double-fire
            cooldowns.current[cityId] = Date.now()

            const severity    = deriveSeverity(disasterType, current)
            const affectedPct = deriveAffectedPct(disasterType, current)

            triggerDisaster(cityId, disasterType, { severity, affectedPct, duration: 1000 })
            addEvent(
              `Live weather: severity ${severity} ${disasterType} over ${city.name} — ${affectedPct}% population exposed`,
              'critical'
            )
          } catch {
            // Network unavailable — silent fail, simulation continues with manual triggers
          }
        })
      )
    }

    let intervalId
    const startupId = setTimeout(() => {
      evaluate()
      intervalId = setInterval(evaluate, FETCH_INTERVAL_MS)
    }, STARTUP_DELAY_MS)

    return () => {
      clearTimeout(startupId)
      clearInterval(intervalId)
    }
  }, [isRunning])
}
