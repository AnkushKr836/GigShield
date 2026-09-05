from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional

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
    raised_at: datetime
    decided_at: Optional[datetime]


class ClaimDecision(BaseModel):
    decision: Literal["approved", "rejected"]
    approved_amount: Optional[Decimal] = None
