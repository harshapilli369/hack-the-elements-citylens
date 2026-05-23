from pydantic import BaseModel
from typing import Optional, List, Any


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
