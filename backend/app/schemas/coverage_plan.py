from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict


class CoveragePlanCreate(BaseModel):
    company_id: str
    tier_name: Literal["Basic", "Standard", "Premium"]
    payout_per_day: Decimal


class CoveragePlanUpdate(BaseModel):
    tier_name: Optional[Literal["Basic", "Standard", "Premium"]] = None
    payout_per_day: Optional[Decimal] = None


class CoveragePlanOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    plan_id: str
    company_id: str
    tier_name: str
    payout_per_day: Decimal
    active: bool
