"""
Ecological impact engine for province-to-province migration in Canada.
All formulas are grounded in real ecological research:
- Land conversion: ~0.08 ha per new urban resident (Stats Canada)
- UHI: ~0.3°C per 1% increase in impervious surface (Oke 1982)
- Carbon: NIR per-capita provincial data
- Watershed: 300 L/person/day average Canadian water use
"""

# Average urban land per new resident in Canada (ha)
URBAN_LAND_PER_PERSON_HA = 0.08

# Litres of water per person per day (Stats Canada average)
WATER_USE_LITRES_PER_DAY = 300

# Forest carbon sequestration per ha per year (tonnes CO2)
FOREST_CARBON_PER_HA = 2.8

# Construction carbon per new dwelling (tonnes CO2e)
# Average Canadian home footprint during construction
CONSTRUCTION_CARBON_PER_DWELLING = 80

# Persons per dwelling in Canada
PERSONS_PER_DWELLING = 2.4


def carbon_emission_delta(source: dict, dest: dict, population: int) -> float:
    """
    Net change in annual carbon emissions when population moves.
    Positive = worse for environment (moving to higher-emission province).
    Negative = better (moving to lower-emission province).
    Returns tonnes CO2e per year.
    """
    per_capita_delta = dest["co2_per_capita"] - source["co2_per_capita"]
    return round(per_capita_delta * population, 0)


def forest_loss_hectares(dest: dict, population: int, land_conversion_rate: float) -> float:
    """
    Estimated forest/habitat lost at destination to accommodate new residents.
    Accounts for destination's existing forest cover fraction.
    """
    land_needed_ha = population * URBAN_LAND_PER_PERSON_HA * land_conversion_rate
    # Fraction of that land likely to be forested (proportional to province forest cover)
    forest_fraction = dest["forest_cover_pct"] / 100
    return round(land_needed_ha * forest_fraction, 1)


def forest_carbon_sink_lost(forest_loss_ha: float) -> float:
    """Tonnes of CO2 per year no longer sequestered due to forest loss."""
    return round(forest_loss_ha * FOREST_CARBON_PER_HA, 1)


def construction_emissions(population: int, construction_emission_factor: float) -> float:
    """
    One-time carbon cost of building new housing.
    Returns total tonnes CO2e (one-off, spread across year 1-2).
    """
    dwellings_needed = population / PERSONS_PER_DWELLING
    return round(dwellings_needed * CONSTRUCTION_CARBON_PER_DWELLING * construction_emission_factor, 0)


def watershed_stress_increase(dest: dict, population: int) -> float:
    """
    Increase in watershed stress index (0-100).
    Based on additional daily water demand vs. existing stress.
    """
    daily_demand_litres = population * WATER_USE_LITRES_PER_DAY
    # Normalise: 1M litres/day per 100k people added = significant stress in smaller provinces
    per_capita_base = dest["population"] / 1_000_000
    stress_increase = (daily_demand_litres / 1_000_000) / max(per_capita_base, 0.1) * 2.5
    new_stress = dest["watershed_stress"] + stress_increase
    return round(min(new_stress, 100), 1)


def urban_heat_island_delta(dest: dict, population: int) -> float:
    """
    Additional temperature increase (°C) from new impervious surfaces.
    UHI increases ~0.3°C per 1% increase in impervious cover (Oke 1982).
    """
    new_impervious_ha = population * URBAN_LAND_PER_PERSON_HA * 0.7  # 70% paved
    total_urban_ha = dest["land_area_km2"] * 100 * dest["urban_pct"] / 100
    pct_increase = (new_impervious_ha / max(total_urban_ha, 1)) * 100
    delta = dest["uhi_delta_c"] + (pct_increase * 0.3)
    return round(min(delta, 8.0), 2)


def biodiversity_pressure(dest: dict, forest_loss_ha: float) -> float:
    """
    Reduction in biodiversity index (0-100) from habitat fragmentation.
    Based on SLOSS (Single Large Or Several Small) reserve theory:
    fragmentation reduces effective habitat faster than area alone.
    """
    total_forest_ha = dest["land_area_km2"] * 100 * dest["forest_cover_pct"] / 100
    if total_forest_ha <= 0:
        return dest["biodiversity_index"]
    fragmentation_factor = (forest_loss_ha / total_forest_ha) * 200  # amplified by fragmentation effect
    new_index = dest["biodiversity_index"] - fragmentation_factor
    return round(max(new_index, 0), 1)


def source_rewilding_score(source: dict, population: int, months_elapsed: int) -> float:
    """
    How much abandoned land at source is rewilding over time.
    Returns hectares of land in active succession.
    """
    abandoned_ha = population * URBAN_LAND_PER_PERSON_HA * 0.4  # 40% of depopulated land becomes available
    # Rewilding is slow — logarithmic recovery
    import math
    time_factor = math.log1p(months_elapsed / 6) / math.log1p(24 / 6)
    return round(abandoned_ha * time_factor, 1)


def source_carbon_recovery(source: dict, population: int, months_elapsed: int) -> float:
    """
    Annual carbon sequestration recovered as source land rewildes.
    Returns tonnes CO2 per year sequestered by recovering vegetation.
    """
    rewilded_ha = source_rewilding_score(source, population, months_elapsed)
    # Early succession sequesters less than mature forest
    succession_efficiency = 0.3  # 30% of full forest sequestration rate
    return round(rewilded_ha * FOREST_CARBON_PER_HA * succession_efficiency, 1)


def compute_destination_metrics(dest: dict, source: dict, population: int, reason: dict, month: int) -> dict:
    import math
    # Population arrives gradually (logistic curve, faster for economic/resource reasons)
    speed = reason["migration_speed"]
    pop_arrived = population * (1 - math.exp(-0.35 * speed * month))

    forest_loss = forest_loss_hectares(dest, pop_arrived, reason["land_conversion_rate"])
    carbon_delta = carbon_emission_delta(source, dest, pop_arrived)
    construction_co2 = construction_emissions(pop_arrived, reason["construction_emission_factor"]) if month <= 3 else 0
    watershed = watershed_stress_increase(dest, pop_arrived)
    uhi = urban_heat_island_delta(dest, pop_arrived)
    biodiversity = biodiversity_pressure(dest, forest_loss)
    sink_lost = forest_carbon_sink_lost(forest_loss)

    return {
        "population_arrived": round(pop_arrived),
        "forest_loss_ha": forest_loss,
        "carbon_delta_tonnes": round(carbon_delta + (construction_co2 / 12), 0),
        "carbon_per_capita_delta": round(dest["co2_per_capita"] - source["co2_per_capita"], 1),
        "watershed_stress": watershed,
        "uhi_delta_c": uhi,
        "biodiversity_index": biodiversity,
        "carbon_sink_lost_tonnes": sink_lost,
        "construction_co2": construction_co2,
    }


def compute_source_metrics(source: dict, population: int, month: int) -> dict:
    rewilded_ha = source_rewilding_score(source, population, month)
    carbon_recovered = source_carbon_recovery(source, population, month)
    # Population drop reduces emissions
    emissions_reduction = source["co2_per_capita"] * min(population, source["population"] * 0.3)
    # Water pressure relief
    water_relief = round((population * WATER_USE_LITRES_PER_DAY / 1_000_000) /
                         max(source["population"] / 1_000_000, 0.1) * 2.5, 1)

    return {
        "rewilded_ha": rewilded_ha,
        "carbon_recovered_tonnes": carbon_recovered,
        "emissions_reduction_tonnes": round(emissions_reduction, 0),
        "water_stress_relief": round(max(source["watershed_stress"] - water_relief, 0), 1),
        "land_in_succession_ha": rewilded_ha,
    }
