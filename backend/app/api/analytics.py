from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.rider import Rider
from app.models.ride import Ride
from app.models.claim_token import ClaimToken
from app.models.company import Company
from app.schemas.analytics import AnalyticsSummary, CompanyStat

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary", response_model=AnalyticsSummary)
def get_analytics_summary(db: Session = Depends(get_db)):
    total_riders = db.query(Rider).count()
    total_rides = db.query(Ride).count()
    all_claims = db.query(ClaimToken).all()
    total_claims = len(all_claims)
    total_approved_payout = sum((c.approved_amount for c in all_claims if c.approved_amount), Decimal("0"))
    fraud_flagged_count = len([c for c in all_claims if c.fraud_flag])

    claims_by_status = {}
    for c in all_claims:
        claims_by_status[c.status] = claims_by_status.get(c.status, 0) + 1

    companies = db.query(Company).all()
    by_company = []
    for company in companies:
        company_claims = [c for c in all_claims if c.ride and c.ride.company_id == company.company_id]
        if not company_claims:
            continue
        payout_sum = sum((c.approved_amount for c in company_claims if c.approved_amount), Decimal("0"))
        by_company.append(CompanyStat(company_name=company.name, claim_count=len(company_claims), total_payout=payout_sum))

    return AnalyticsSummary(
        total_riders=total_riders,
        total_rides=total_rides,
        total_claims=total_claims,
        total_approved_payout=total_approved_payout,
        fraud_flagged_count=fraud_flagged_count,
        claims_by_status=claims_by_status,
        by_company=by_company,
    )
