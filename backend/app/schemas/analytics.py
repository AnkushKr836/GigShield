from decimal import Decimal
from typing import Dict, List

from pydantic import BaseModel


class CompanyStat(BaseModel):
    company_name: str
    claim_count: int
    total_payout: Decimal


class AnalyticsSummary(BaseModel):
    total_riders: int
    total_rides: int
    total_claims: int
    total_approved_payout: Decimal
    fraud_flagged_count: int
    claims_by_status: Dict[str, int]
    by_company: List[CompanyStat]
