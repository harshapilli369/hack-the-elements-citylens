import { create } from 'zustand'

// ─── Atlantic Canada scenarios — grounded in real events & Statistics Canada ──
// Sources: StatCan CANSIM 17-10-0022-01 (interprovincial migration),
//          CMHC Housing Market Outlook 2023, UNHCR/IOM displacement reports,
//          Environment Canada post-Fiona damage assessment (2022)
const PRESETS = {
  fiona_nl_ns: {
    source_province:      'Newfoundland',
    destination_province: 'Nova Scotia',
    // Hurricane Fiona (Sept 2022): ~1,200 households displaced in NL/NS combined.
    // This scenario models the broader 6-month displacement wave including voluntary
    // relocations triggered by infrastructure damage. 4,800 is the high-end CMHC estimate
    // for storm-driven housing instability in the affected zone.
    population_size:      4800,
    migration_reason:     'climate_displacement',
    duration_months:      6,
    label:                'NL → NS · Hurricane Fiona 2022',
    description:          'Post-Tropical Storm Fiona — coastal infrastructure damage displaces NL households to Halifax (CMHC 2022 estimate)',
  },
  nb_ns_economic: {
    source_province:      'New Brunswick',
    destination_province: 'Nova Scotia',
    // StatCan CANSIM 17-10-0022-01 (2019–2023 avg): NB→NS ~2,400/yr × 5yr trend = 12,000
    // Includes knock-on effect of NB manufacturing decline (Irving Pulp curtailments 2021–2023)
    population_size:      12000,
    migration_reason:     'economic_opportunity',
    duration_months:      24,
    label:                'NB → NS · Economic Migration',
    description:          'Structural NB → Halifax migration: ~2,400/yr (StatCan 2019–2023 avg) driven by manufacturing decline and Halifax labour market growth',
  },
  pei_nb_housing: {
    source_province:      'Prince Edward Island',
    destination_province: 'New Brunswick',
    // CMHC 2023: PEI average rent increased 67% from 2019–2023 (fastest in Canada).
    // StatCan LFS: PEI net outmigration to NB was 710 in 2022 — scenario models 2-yr cumulative
    population_size:      1500,
    migration_reason:     'housing_affordability',
    duration_months:      24,
    label:                'PEI → NB · Housing Crisis',
    description:          'PEI rents rose 67% from 2019–2023 (fastest in Canada, CMHC). StatCan: ~710 PEI→NB annually; scenario models 24-month cumulative',
  },
  ns_nb_storm: {
    source_province:      'Nova Scotia',
    destination_province: 'New Brunswick',
    // Environment Canada: Atlantic Canada has seen 3.2× increase in major storm events
    // since 2000 (ECCC 2023 Climate Trends). NS coastal communities at-risk population ~42,000.
    // Scenario models a moderate coastal surge event displacing ~8% of at-risk population.
    population_size:      3400,
    migration_reason:     'climate_displacement',
    duration_months:      12,
    label:                'NS → NB · Coastal Storm Surge',
    description:          'NS coastal displacement: 3.2× increase in major Atlantic storms since 2000 (ECCC 2023). Models 8% displacement of ~42k at-risk coastal residents',
  },
  // ─── Cross-Canada scenarios (Landing page) ──────────────────────────────────
  nb_alberta: {
    source_province:      'New Brunswick',
    destination_province: 'Alberta',
    population_size:      120000,
    migration_reason:     'resource_industry',
    duration_months:      24,
    label:                'NB → AB · Oil & Gas',
    description:          'Atlantic Canadians migrating west for oil & gas jobs — massive carbon footprint shift',
  },
  alberta_quebec: {
    source_province:      'Alberta',
    destination_province: 'Quebec',
    population_size:      95000,
    migration_reason:     'climate_displacement',
    duration_months:      24,
    label:                'AB → QC · Climate',
    description:          'Wildfire & drought forcing Albertans eastward — rare carbon-reducing migration',
  },
  quebec_ontario: {
    source_province:      'Quebec',
    destination_province: 'Ontario',
    population_size:      179000,
    migration_reason:     'economic_opportunity',
    duration_months:      24,
    label:                'QC → ON · Economic',
    description:          'Quebec → Ontario economic migration for Toronto job market — moderate carbon increase',
  },
}

// ─── Disaster type → migration reason mapping (used by CityFlow bridge) ──────
export const DISASTER_TO_REASON = {
  wildfire:              'climate_displacement',
  flood:                 'climate_displacement',
  conflict:              'climate_displacement',
  heatwave:              'climate_displacement',
  drought:               'climate_displacement',
  water_scarcity:        'climate_displacement',
  water_contamination:   'climate_displacement',
  air_pollution_crisis:  'climate_displacement',
  earthquake:            'climate_displacement',
  landslide:             'climate_displacement',
  soil_degradation:      'climate_displacement',
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
