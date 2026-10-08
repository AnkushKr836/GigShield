from datetime import datetime
from decimal import Decimal
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class ClaimCreate(BaseModel):
    ride_id: str
    disruption_type: Literal["environmental", "social"]
    description: str = Field(min_length=10, max_length=1000)
    claimed_amount: Decimal


class ClaimOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    token_id: str
    rider_id: str
    ride_id: str
    event_id: Optional[str]
    disruption_type: str
    description: str
    claimed_amount: Decimal
    approved_amount: Optional[Decimal]
    status: str
    fraud_flag: bool
    verification_source: Optional[str] = None
    weather_snapshot: Optional[dict] = None
    payout_note: Optional[str] = None
    raised_at: datetime
    decided_at: Optional[datetime]


class ClaimDecision(BaseModel):
    decision: Literal["approved", "rejected"]
    approved_amount: Optional[Decimal] = None


class RideSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ride_id: str
    pickup_location: str
    pickup_lat: Optional[float] = None
    pickup_lng: Optional[float] = None
    drop_location: str
    drop_lat: Optional[float] = None
    drop_lng: Optional[float] = None
    start_time: datetime
    end_time: datetime
    fare_amount: Decimal


class ClaimDetailOut(ClaimOut):
    ride: RideSummary
    rider_name: str
    rider_email: str
    rider_credibility_score: Optional[float] = None
    disruption_signals: list[dict[str, Any]] = Field(default_factory=list)
