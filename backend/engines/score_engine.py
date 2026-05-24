"""
Ecological scorecard computation for the Canada migration model.
"""


def compute_ecological_scorecard(final_dest: dict, final_src: dict, source: dict, dest: dict, population: int) -> dict:
    carbon_delta_per_capita = dest["co2_per_capita"] - source["co2_per_capita"]
    total_carbon_delta = round(carbon_delta_per_capita * population, 0)
    carbon_is_negative = total_carbon_delta < 0  # beneficial migration

    # Net ecological impact score (0 = pristine, 100 = severe degradation)
    ecological_stress = final_dest["ecological_stress"]

    # Severity
    severity_levels = [
        (80, "CRITICAL"),
        (60, "HIGH"),
        (40, "MODERATE"),
        (20, "LOW"),
        (0,  "MINIMAL"),
    ]
    severity = "MINIMAL"
    for threshold, label in severity_levels:
        if ecological_stress >= threshold:
            severity = label
            break

    # Equivalent trees lost (1 tonne CO2 sequestered per tree per 40 years ≈ 0.025 t/yr)
    carbon_sink_lost = final_dest["carbon_sink_lost"]
    trees_equivalent = round(carbon_sink_lost / 0.025)

    # Years to ecosystem recovery if migration stops (rough estimate)
    recovery_years = round(final_dest["forest_loss_ha"] / max(source["rewilding_rate_pct_per_year"] / 100 * source["land_area_km2"] * 100, 1))
    recovery_years = max(1, min(recovery_years, 200))

    return {
        "ecological_stress": ecological_stress,
        "severity": severity,
        "total_carbon_delta_tonnes": total_carbon_delta,
        "carbon_per_capita_delta": round(carbon_delta_per_capita, 1),
        "carbon_is_beneficial": carbon_is_negative,
        "forest_loss_ha": final_dest["forest_loss_ha"],
        "trees_equivalent_lost": trees_equivalent,
        "biodiversity_index_final": final_dest["biodiversity_index"],
        "watershed_stress_final": final_dest["watershed_stress"],
        "uhi_delta_final_c": final_dest["uhi_delta_c"],
        "source_rewilded_ha": final_src["rewilded_ha"],
        "source_carbon_recovered": final_src["carbon_recovered"],
        "recovery_years_estimate": recovery_years,
    }
