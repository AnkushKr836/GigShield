from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class PolicyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    policy_id: str
    rider_id: str
    weekly_premium: Decimal
    start_date: date
    end_date: date
    status: str


class ZoneCreate(BaseModel):
    name: str
    risk_tier: str = "medium"


class ZoneOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    zone_id: str
    name: str
    risk_tier: str
