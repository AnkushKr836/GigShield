from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class SyntheticDatasetCreate(BaseModel):
    sample_count: int = Field(default=600, ge=100, le=5000)
    seed: int = Field(default=42, ge=0, le=2_147_483_647)


class TrafficSnapshotOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    snapshot_id: str
    zone_id: str
    analysis_id: str
    origin_region: str
    destination_region: str
    period_start: datetime
    period_end: datetime
    trip_count: int
    average_speed_kmh: float | None
    free_flow_speed_kmh: float | None
    congestion_score: float | None
    source: str
    raw_payload: dict[str, Any] | None = None
    imported_at: datetime | None = None


class RideTrafficAssessmentOut(BaseModel):
    assessment_id: str
    run_id: str
    ride_id: str
    status: str
    traffic_level: str | None
    confidence: str
    summary: dict[str, Any] | None
    analyzed_at: datetime | None
    pickup_location: str
    drop_location: str
    start_time: datetime
    end_time: datetime


class TrafficAnalysisRunOut(BaseModel):
    run_id: str
    rider_id: str
    rider_name: str
    rides_analyzed: int
    rides_matched: int
    assessments: list[RideTrafficAssessmentOut]
