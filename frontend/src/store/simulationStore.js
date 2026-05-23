import { create } from 'zustand'

const PRESETS = {
  nb_alberta: {
    source_province: 'New Brunswick',
    destination_province: 'Alberta',
    population_size: 200000,
    migration_reason: 'resource_industry',
    duration_months: 24,
    label: 'New Brunswick → Alberta',
    description: 'Atlantic forest to oil-sands province',
  },
  quebec_ontario: {
    source_province: 'Quebec',
    destination_province: 'Ontario',
    population_size: 350000,
    migration_reason: 'economic_opportunity',
    duration_months: 24,
    label: 'Quebec → Ontario',
    description: 'Low-emission hydro province to industrial hub',
  },
  ns_bc: {
    source_province: 'Nova Scotia',
    destination_province: 'British Columbia',
    population_size: 80000,
    migration_reason: 'climate_amenity',
    duration_months: 24,
    label: 'Nova Scotia → BC',
    description: 'Acadian forest to temperate rainforest coast',
  },
  alberta_quebec: {
    source_province: 'Alberta',
    destination_province: 'Quebec',
    population_size: 150000,
    migration_reason: 'climate_displacement',
    duration_months: 24,
    label: 'Alberta → Quebec',
    description: 'Carbon-reducing migration from oil province to hydro province',
  },
}

export const useSimulationStore = create((set, get) => ({
  source_province: 'New Brunswick',
  destination_province: 'Alberta',
  population_size: 200000,
  migration_reason: 'resource_industry',
  duration_months: 24,

  result: null,
  isLoading: false,
  error: null,

  setInput: (key, value) => set({ [key]: value }),

  loadPreset: (key) => {
    const preset = PRESETS[key]
    if (preset) set({ ...preset, result: null, error: null })
  },

  setResult: (result) => set({ result, isLoading: false, error: null }),
  setLoading: (v) => set({ isLoading: v }),
  setError: (e) => set({ error: e, isLoading: false }),
  reset: () => set({ result: null, error: null }),
}))

export const PRESETS_LIST = Object.entries(PRESETS).map(([key, val]) => ({ key, ...val }))
