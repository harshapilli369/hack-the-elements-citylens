"""
Ecological cascade timeline engine.
Models how ecological impacts at source and destination evolve month by month.
"""

import math
from engines.eco_engine import (
    compute_destination_metrics,
    compute_source_metrics,
    carbon_emission_delta,
)

DESTINATION_EVENTS = {
    1:  "Population influx begins — land scouting & housing demand spike",
    2:  "Construction phase starts — first forest clearing detected",
    3:  "Impervious surfaces expanding — watershed recharge disrupted",
    6:  "Urban heat island measurable — local temperature rising",
    9:  "Biodiversity corridor fragmentation — species range contraction",
    12: "New emission baseline established — carbon footprint locked in",
    18: "Full ecological footprint realized",
    24: "Climate feedback loop detectable",
}

SOURCE_EVENTS = {
    3:  "Agricultural activity declining — farmland beginning to idle",
    6:  "First shrubland succession on abandoned land",
    9:  "Wildlife returning to depopulated zones",
    12: "Measurable carbon recovery from vegetation regrowth",
    18: "Early forest succession underway",
    24: "Watershed pressure significantly reduced",
}

SEVERITY_LEVELS = [
    (80, "CRITICAL"),
    (60, "HIGH"),
    (40, "MODERATE"),
    (20, "LOW"),
    (0,  "MINIMAL"),
]


def ecological_stress_score(dest_metrics: dict, source_co2: float, dest_co2: float) -> float:
    """
    Composite ecological stress score 0–100.
    Weights: carbon shift 35%, biodiversity 25%, watershed 20%, UHI 20%
    """
    # Carbon stress: normalize delta relative to Canada's worst case (~68t Alberta)
    carbon_delta = dest_co2 - source_co2
    carbon_stress = max(0, min((carbon_delta / 60) * 100, 100))

    # Biodiversity stress: inverted (lower index = worse)
    bio_stress = max(0, 100 - dest_metrics["biodiversity_index"])

    # Watershed stress is already 0–100
    watershed_stress = dest_metrics["watershed_stress"]

    # UHI stress: normalize against worst-case 6°C delta
    uhi_stress = min((dest_metrics["uhi_delta_c"] / 6) * 100, 100)

    composite = (
        carbon_stress   * 0.35 +
        bio_stress      * 0.25 +
        watershed_stress * 0.20 +
        uhi_stress      * 0.20
    )
    return round(composite, 1)


def get_severity(score: float) -> str:
    for threshold, label in SEVERITY_LEVELS:
        if score >= threshold:
            return label
    return "MINIMAL"


def get_event(month: int, events_dict: dict) -> str:
    if month in events_dict:
        return events_dict[month]
    # Find nearest past milestone
    past = [k for k in events_dict if k < month]
    if past:
        return f"Month {month} — continued ecological change"
    return f"Month {month}"


def generate_timeline(source: dict, dest: dict, population: int, reason: dict, duration_months: int) -> dict:
    destination_timeline = []
    source_timeline = []

    for month in range(1, duration_months + 1):
        dest_m = compute_destination_metrics(dest, source, population, reason, month)
        src_m = compute_source_metrics(source, population, month)
        stress = ecological_stress_score(dest_m, source["co2_per_capita"], dest["co2_per_capita"])

        destination_timeline.append({
            "month": month,
            "event": get_event(month, DESTINATION_EVENTS),
            "severity": get_severity(stress),
            "ecological_stress": stress,
            "forest_loss_ha": dest_m["forest_loss_ha"],
            "carbon_delta": dest_m["carbon_delta_tonnes"],
            "watershed_stress": dest_m["watershed_stress"],
            "uhi_delta_c": dest_m["uhi_delta_c"],
            "biodiversity_index": dest_m["biodiversity_index"],
            "carbon_sink_lost": dest_m["carbon_sink_lost_tonnes"],
            "population_arrived": dest_m["population_arrived"],
        })

        source_timeline.append({
            "month": month,
            "event": get_event(month, SOURCE_EVENTS),
            "rewilded_ha": src_m["rewilded_ha"],
            "carbon_recovered": src_m["carbon_recovered_tonnes"],
            "emissions_reduction": src_m["emissions_reduction_tonnes"],
            "water_stress_relief": src_m["water_stress_relief"],
            "land_in_succession_ha": src_m["land_in_succession_ha"],
        })

    return {
        "destination": destination_timeline,
        "source": source_timeline,
    }


def generate_recommendations(dest_metrics: dict, source: dict, dest: dict, population: int, reason: dict) -> list:
    recs = []
    carbon_delta = dest["co2_per_capita"] - source["co2_per_capita"]

    if carbon_delta > 20:
        recs.append({
            "priority": "critical",
            "category": "carbon",
            "action": f"Mandate renewable energy transition at destination — grid mix shift could offset {round(carbon_delta * 0.4 * population / 1000, 0):.0f}K tonnes CO₂/year",
            "impact": f"Moving {population:,} people from {source['dominant_biome']} to {dest['dominant_biome']} adds {round(abs(carbon_delta) * population / 1e6, 2)}M tonnes CO₂/year",
            "icon": "🌿",
        })
    elif carbon_delta < -10:
        recs.append({
            "priority": "positive",
            "category": "carbon",
            "action": f"This migration is carbon-reducing — support and accelerate it with incentive programs",
            "impact": f"Net carbon reduction of {round(abs(carbon_delta) * population / 1e6, 2)}M tonnes CO₂/year from grid mix improvement",
            "icon": "✅",
        })

    if dest_metrics["forest_loss_ha"] > 500:
        recs.append({
            "priority": "critical" if dest_metrics["forest_loss_ha"] > 5000 else "high",
            "category": "forest",
            "action": f"Enforce urban growth boundaries — restrict greenfield development, mandate infill housing",
            "impact": f"Prevents up to {round(dest_metrics['forest_loss_ha'] * 0.6, 0):.0f} ha of {dest['dominant_biome']} habitat loss",
            "icon": "🌲",
        })

    if dest_metrics["watershed_stress"] > 60:
        recs.append({
            "priority": "high",
            "category": "water",
            "action": "Invest in water recycling infrastructure and stormwater capture systems",
            "impact": f"Reduces watershed draw by up to 30% — critical for {dest['dominant_biome']} water table recovery",
            "icon": "💧",
        })

    if dest_metrics["uhi_delta_c"] > 2.5:
        recs.append({
            "priority": "high",
            "category": "heat",
            "action": "Mandatory green roof policy + urban tree canopy targets (30% canopy cover minimum)",
            "impact": f"Green infrastructure can offset {round(dest_metrics['uhi_delta_c'] * 0.4, 1)}°C of urban heat island effect",
            "icon": "🌡️",
        })

    if dest_metrics["biodiversity_index"] < 50:
        recs.append({
            "priority": "critical",
            "category": "biodiversity",
            "action": f"Establish wildlife corridor network around {dest['capital']} — connect fragmented {dest['dominant_biome']} patches",
            "impact": f"Prevents further contraction of {dest['species_at_risk']} species at risk habitat in {dest['capital'].split(',')[0]} region",
            "icon": "🦋",
        })

    recs.append({
        "priority": "moderate",
        "category": "source",
        "action": f"Fund active rewilding program at source — accelerate land succession in {source['dominant_biome']}",
        "impact": f"Managed succession can triple natural rewilding rate — recovering {round(population * 0.08 * 0.4, 0):.0f} ha within 5 years",
        "icon": "🌱",
    })

    priority_order = ["critical", "high", "moderate", "positive", "low"]
    recs.sort(key=lambda r: priority_order.index(r["priority"]) if r["priority"] in priority_order else 99)
    return recs
