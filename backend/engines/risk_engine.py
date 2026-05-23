import math


def water_stress_score(baseline: float, influx_pop: float, city_pop: float, duration_months: int) -> float:
    influx_ratio = influx_pop / city_pop
    demand_multiplier = 1 + (influx_ratio * 2.4)
    # Some relief over time as city adapts, but limited
    time_factor = 1 - (0.03 * min(duration_months, 12)) * 0.2
    raw = baseline * demand_multiplier * time_factor
    return min(round(raw, 1), 100.0)


def aqi_score(baseline_aqi: float, influx_pop: float, city_pop: float, infrastructure_shock: float) -> float:
    density_pressure = (influx_pop / city_pop) * 35
    disaster_shock = (infrastructure_shock - 1) * 20
    return min(round(baseline_aqi + density_pressure + disaster_shock, 1), 100.0)


def land_pressure_score(land_available_km2: float, influx_pop: float) -> float:
    if land_available_km2 <= 0:
        return 100.0
    density = influx_pop / land_available_km2
    score = (density / 300) * 10
    return min(round(score, 1), 100.0)


def waste_overflow_score(baseline_capacity_pct: float, influx_pop: float, city_pop: float) -> float:
    influx_ratio = influx_pop / city_pop
    saturation = baseline_capacity_pct + (influx_ratio * 60)
    overflow_multiplier = 1.3 if saturation > 85 else 1.0
    return min(round(saturation * overflow_multiplier, 1), 100.0)


def infrastructure_load_score(baseline_load: float, influx_pop: float, city_pop: float, infrastructure_shock: float) -> float:
    load_increase = (influx_pop / city_pop) * 45 * infrastructure_shock
    return min(round(baseline_load + load_increase, 1), 100.0)


def compute_all_scores(city: dict, influx_pop: float, disaster: dict, duration_months: int) -> dict:
    city_pop = city["population"]
    shock = disaster["infrastructure_shock"]

    water = water_stress_score(city["water_stress_baseline"], influx_pop, city_pop, duration_months)
    aqi = aqi_score(city["aqi_baseline"], influx_pop, city_pop, shock)
    land = land_pressure_score(city["land_available_km2"], influx_pop)
    waste = waste_overflow_score(city["waste_capacity_pct"], influx_pop, city_pop)
    infra = infrastructure_load_score(city["infrastructure_load_pct"], influx_pop, city_pop, shock)

    return {
        "water": water,
        "aqi": aqi,
        "land": land,
        "waste": waste,
        "infra": infra,
    }
