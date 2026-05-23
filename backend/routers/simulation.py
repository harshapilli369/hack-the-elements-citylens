import json
import uuid
from pathlib import Path
from fastapi import APIRouter, HTTPException
from models.schemas import SimulationRequest, SimulationResult
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
