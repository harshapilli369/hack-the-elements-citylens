from pydantic import BaseModel
from typing import Optional, List, Any, Dict


class SimulationRequest(BaseModel):
    source_province: str
    destination_province: str
    population_size: int
    migration_reason: str
    duration_months: int = 24


class DestinationTimelinePoint(BaseModel):
    month: int
    event: str
    severity: str
    ecological_stress: float
    forest_loss_ha: float
    carbon_delta: float
    watershed_stress: float
    uhi_delta_c: float
    biodiversity_index: float
    carbon_sink_lost: float
    population_arrived: int


class SourceTimelinePoint(BaseModel):
    month: int
    event: str
    rewilded_ha: float
    carbon_recovered: float
    emissions_reduction: float
    water_stress_relief: float
    land_in_succession_ha: float


class EcologicalScorecard(BaseModel):
    ecological_stress: float
    severity: str
    total_carbon_delta_tonnes: float
    carbon_per_capita_delta: float
    carbon_is_beneficial: bool
    forest_loss_ha: float
    trees_equivalent_lost: int
    biodiversity_index_final: float
    watershed_stress_final: float
    uhi_delta_final_c: float
    source_rewilded_ha: float
    source_carbon_recovered: float
    recovery_years_estimate: int


class Recommendation(BaseModel):
    priority: str
    category: str
    action: str
    impact: str
    icon: str


class ProvinceInfo(BaseModel):
    name: str
    co2_per_capita: float
    forest_cover_pct: float
    biodiversity_index: float
    dominant_biome: str
    coords: List[float]
    capital: str
    region: str
    species_at_risk: int
    watershed_stress: float


class SimulationResult(BaseModel):
    id: str
    source_province: str
    destination_province: str
    source_info: ProvinceInfo
    dest_info: ProvinceInfo
    population_size: int
    migration_reason: str
    duration_months: int
    scorecard: EcologicalScorecard
    destination_timeline: List[DestinationTimelinePoint]
    source_timeline: List[SourceTimelinePoint]
    recommendations: List[Recommendation]


# ── Chain reaction schemas ────────────────────────────────────────────────────

class ChainEvent(BaseModel):
    source_province: str
    destination_province: str
    population_size: int
    disaster_type: str   # wildfire, flood, cascade, etc.
    event_type: str      # "disaster" or "cascade"


class ChainReactionRequest(BaseModel):
    events: List[ChainEvent]
    duration_months: int = 24


class ChainGroupResult(BaseModel):
    source_province: str
    destination_province: str
    total_population: int
    event_count: int
    event_types: List[str]
    scorecard: EcologicalScorecard
    destination_timeline: List[DestinationTimelinePoint]
    source_timeline: List[SourceTimelinePoint]


class ChainAggregated(BaseModel):
    total_population_displaced: int
    total_carbon_delta_tonnes: float
    total_forest_loss_ha: float
    total_source_rewilded_ha: float
    max_ecological_stress: float
    max_severity: str
    provinces_affected: List[str]
    recovery_years_estimate: int
    event_count: int
    cascade_count: int


class ChainReactionResult(BaseModel):
    id: str
    groups: List[ChainGroupResult]
    aggregated: ChainAggregated
    recommendations: List[Recommendation]
    duration_months: int
