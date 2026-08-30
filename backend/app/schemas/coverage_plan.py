from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict


class CoveragePlanCreate(BaseModel):
    company_id: str
    tier_name: Literal["Basic", "Standard", "Premium"]
    payout_per_day: Decimal


class CoveragePlanOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    plan_id: str
    company_id: str
    tier_name: str
    payout_per_day: Decimal
    active: bool
