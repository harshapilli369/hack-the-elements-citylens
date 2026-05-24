import json
import uuid
from pathlib import Path
from fastapi import APIRouter, HTTPException
from models.schemas import (
    SimulationRequest, SimulationResult,
    ChainReactionRequest, ChainReactionResult, ChainGroupResult, ChainAggregated,
)
from engines.chain_engine import generate_timeline, generate_recommendations
from engines.eco_engine import compute_destination_metrics, compute_source_metrics
from engines.score_engine import compute_ecological_scorecard

router = APIRouter()

DATA_DIR = Path(__file__).parent.parent / "data"

with open(DATA_DIR / "provinces.json", encoding="utf-8") as f:
    PROVINCES = json.load(f)

with open(DATA_DIR / "migration_reasons.json", encoding="utf-8") as f:
    MIGRATION_REASONS = json.load(f)

CACHE: dict = {}


@router.post("/simulate", response_model=SimulationResult)
def run_simulation(req: SimulationRequest):
    if req.source_province not in PROVINCES:
        raise HTTPException(404, f"Province '{req.source_province}' not found")
    if req.destination_province not in PROVINCES:
        raise HTTPException(404, f"Province '{req.destination_province}' not found")
    if req.source_province == req.destination_province:
        raise HTTPException(400, "Source and destination must differ")
    if req.migration_reason not in MIGRATION_REASONS:
        raise HTTPException(400, f"Unknown migration reason '{req.migration_reason}'")

    source = PROVINCES[req.source_province]
    dest   = PROVINCES[req.destination_province]
    reason = MIGRATION_REASONS[req.migration_reason]

    timelines = generate_timeline(source, dest, req.population_size, reason, req.duration_months)
    dest_tl = timelines["destination"]
    src_tl  = timelines["source"]

    final_dest = dest_tl[-1]
    final_src  = src_tl[-1]

    scorecard = compute_ecological_scorecard(final_dest, final_src, source, dest, req.population_size)

    # Build final dest metrics for recommendations
    final_dest_metrics = compute_destination_metrics(dest, source, req.population_size, reason, req.duration_months)
    recs = generate_recommendations(final_dest_metrics, source, dest, req.population_size, reason)

    sim_id = str(uuid.uuid4())[:8]
    result = SimulationResult(
        id=sim_id,
        source_province=req.source_province,
        destination_province=req.destination_province,
        source_info={
            "name": req.source_province,
            "co2_per_capita": source["co2_per_capita"],
            "forest_cover_pct": source["forest_cover_pct"],
            "biodiversity_index": source["biodiversity_index"],
            "dominant_biome": source["dominant_biome"],
            "coords": source["coords"],
            "capital": source["capital"],
            "region": source["region"],
            "species_at_risk": source["species_at_risk"],
            "watershed_stress": source["watershed_stress"],
        },
        dest_info={
            "name": req.destination_province,
            "co2_per_capita": dest["co2_per_capita"],
            "forest_cover_pct": dest["forest_cover_pct"],
            "biodiversity_index": dest["biodiversity_index"],
            "dominant_biome": dest["dominant_biome"],
            "coords": dest["coords"],
            "capital": dest["capital"],
            "region": dest["region"],
            "species_at_risk": dest["species_at_risk"],
            "watershed_stress": dest["watershed_stress"],
        },
        population_size=req.population_size,
        migration_reason=req.migration_reason,
        duration_months=req.duration_months,
        scorecard=scorecard,
        destination_timeline=dest_tl,
        source_timeline=src_tl,
        recommendations=recs,
    )

    CACHE[sim_id] = result
    return result


@router.post("/simulate/chain", response_model=ChainReactionResult)
def run_chain_simulation(req: ChainReactionRequest):
    if not req.events:
        raise HTTPException(400, "No events provided")

    reason = MIGRATION_REASONS.get("climate_displacement")
    if not reason:
        raise HTTPException(500, "climate_displacement reason not found")

    # Validate all provinces and group by (source, dest) pair, summing population
    grouped: dict = {}
    for ev in req.events:
        if ev.source_province not in PROVINCES:
            raise HTTPException(404, f"Province '{ev.source_province}' not found")
        if ev.destination_province not in PROVINCES:
            raise HTTPException(404, f"Province '{ev.destination_province}' not found")
        if ev.source_province == ev.destination_province:
            continue
        key = (ev.source_province, ev.destination_province)
        if key not in grouped:
            grouped[key] = {"population": 0, "event_count": 0, "event_types": set()}
        grouped[key]["population"] += ev.population_size
        grouped[key]["event_count"] += 1
        grouped[key]["event_types"].add(ev.disaster_type)

    if not grouped:
        raise HTTPException(400, "No valid province pairs found in events")

    group_results = []
    all_scorecards = []
    all_recs = []

    for (src_name, dest_name), g in grouped.items():
        source = PROVINCES[src_name]
        dest   = PROVINCES[dest_name]
        pop    = g["population"]

        timelines  = generate_timeline(source, dest, pop, reason, req.duration_months)
        dest_tl    = timelines["destination"]
        src_tl     = timelines["source"]
        final_dest = dest_tl[-1]
        final_src  = src_tl[-1]
        scorecard  = compute_ecological_scorecard(final_dest, final_src, source, dest, pop)

        final_dest_metrics = compute_destination_metrics(dest, source, pop, reason, req.duration_months)
        recs = generate_recommendations(final_dest_metrics, source, dest, pop, reason)
        all_recs.extend(recs)
        all_scorecards.append(scorecard)

        group_results.append(ChainGroupResult(
            source_province=src_name,
            destination_province=dest_name,
            total_population=pop,
            event_count=g["event_count"],
            event_types=list(g["event_types"]),
            scorecard=scorecard,
            destination_timeline=dest_tl,
            source_timeline=src_tl,
        ))

    # Aggregate across all groups
    total_pop     = sum(gr.total_population for gr in group_results)
    total_carbon  = sum(s["total_carbon_delta_tonnes"] for s in all_scorecards)
    total_forest  = sum(s["forest_loss_ha"] for s in all_scorecards)
    total_rewild  = sum(s["source_rewilded_ha"] for s in all_scorecards)
    max_stress    = max(s["ecological_stress"] for s in all_scorecards)
    max_recovery  = max(s["recovery_years_estimate"] for s in all_scorecards)

    severity_order = ["MINIMAL", "LOW", "MODERATE", "HIGH", "CRITICAL"]
    max_sev = max(
        (s["severity"] for s in all_scorecards),
        key=lambda x: severity_order.index(x) if x in severity_order else 0,
    )

    provinces = list({p for gr in group_results for p in (gr.source_province, gr.destination_province)})
    cascade_count = sum(1 for ev in req.events if ev.event_type == "cascade")

    # Deduplicate recommendations by (category, priority), keep highest-priority per category
    priority_order = ["critical", "high", "moderate", "positive", "low"]
    all_recs.sort(key=lambda r: priority_order.index(r["priority"]) if r["priority"] in priority_order else 99)
    seen: set = set()
    deduped_recs = []
    for rec in all_recs:
        key = (rec["category"], rec["priority"])
        if key not in seen:
            seen.add(key)
            deduped_recs.append(rec)

    aggregated = ChainAggregated(
        total_population_displaced=total_pop,
        total_carbon_delta_tonnes=total_carbon,
        total_forest_loss_ha=total_forest,
        total_source_rewilded_ha=total_rewild,
        max_ecological_stress=max_stress,
        max_severity=max_sev,
        provinces_affected=provinces,
        recovery_years_estimate=max_recovery,
        event_count=len(req.events),
        cascade_count=cascade_count,
    )

    sim_id = str(uuid.uuid4())[:8]
    result = ChainReactionResult(
        id=sim_id,
        groups=group_results,
        aggregated=aggregated,
        recommendations=deduped_recs[:6],
        duration_months=req.duration_months,
    )

    CACHE[f"chain_{sim_id}"] = result
    return result


@router.get("/simulate/{sim_id}")
def get_simulation(sim_id: str):
    if sim_id not in CACHE:
        raise HTTPException(404, "Simulation not found")
    return CACHE[sim_id]


@router.get("/provinces")
def get_provinces():
    return [
        {
            "name": name,
            "co2_per_capita": p["co2_per_capita"],
            "forest_cover_pct": p["forest_cover_pct"],
            "biodiversity_index": p["biodiversity_index"],
            "dominant_biome": p["dominant_biome"],
            "coords": p["coords"],
            "capital": p["capital"],
            "region": p["region"],
            "population": p["population"],
            "species_at_risk": p["species_at_risk"],
            "watershed_stress": p["watershed_stress"],
        }
        for name, p in PROVINCES.items()
    ]



@router.get("/migration-reasons")
def get_migration_reasons():
    return [
        {"id": k, "label": v["label"], "icon": v["icon"], "description": v["description"]}
        for k, v in MIGRATION_REASONS.items()
    ]
