import { create } from 'zustand'

// ─── Atlantic Canada scenarios — grounded in real events ─────────────────────
const PRESETS = {
  fiona_nl_ns: {
    source_province:      'Newfoundland',
    destination_province: 'Nova Scotia',
    population_size:      28000,
    migration_reason:     'climate_displacement',
    duration_months:      18,
    label:                'NL → NS · Hurricane Fiona',
    description:          'Post-Tropical Storm Fiona 2022 — coastal flooding forces NL displacement to Halifax',
  },
  nb_ns_economic: {
    source_province:      'New Brunswick',
    destination_province: 'Nova Scotia',
    population_size:      45000,
    migration_reason:     'economic_opportunity',
    duration_months:      24,
    label:                'NB → NS · Economic',
    description:          'Ongoing rural NB → Halifax economic migration as manufacturing declines',
  },
  pei_nb_housing: {
    source_province:      'Prince Edward Island',
    destination_province: 'New Brunswick',
    population_size:      18000,
    migration_reason:     'housing_affordability',
    duration_months:      24,
    label:                'PEI → NB · Housing',
    description:          'PEI housing costs surged 60% post-COVID, pushing residents to Moncton',
  },
  ns_nb_storm: {
    source_province:      'Nova Scotia',
    destination_province: 'New Brunswick',
    population_size:      35000,
    migration_reason:     'climate_displacement',
    duration_months:      12,
    label:                'NS → NB · Storm Surge',
    description:          'Coastal NS communities displaced inland after intensified storm seasons',
  },
}

export const useSimulationStore = create((set, get) => ({
  source_province:      'Newfoundland',
  destination_province: 'Nova Scotia',
  population_size:      28000,
  migration_reason:     'climate_displacement',
  duration_months:      18,

  result: null,
  isLoading: false,
  error: null,
  pendingAutoRun: false,

  setInput: (key, value) => set({ [key]: value }),

  loadPreset: (key) => {
    const preset = PRESETS[key]
    if (preset) set({ ...preset, result: null, error: null, pendingAutoRun: true })
  },

  loadCustom: (params) => set({ ...params, result: null, error: null, pendingAutoRun: true }),

  clearPendingAutoRun: () => set({ pendingAutoRun: false }),

  setResult: (result) => set({ result, isLoading: false, error: null }),
  setLoading: (v) => set({ isLoading: v }),
  setError: (e) => set({ error: e, isLoading: false }),
  reset: () => set({ result: null, error: null }),
}))

export const PRESETS_LIST = Object.entries(PRESETS).map(([key, val]) => ({ key, ...val }))

// Atlantic Canada province names for filtering
export const ATLANTIC_PROVINCES = ['New Brunswick', 'Nova Scotia', 'Prince Edward Island', 'Newfoundland']
