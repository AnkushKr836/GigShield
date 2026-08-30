from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.company import Company
from app.models.coverage_plan import CoveragePlan
from app.schemas.coverage_plan import CoveragePlanCreate, CoveragePlanOut

router = APIRouter(prefix="/coverage-plans", tags=["coverage-plans"])


@router.get("/", response_model=list[CoveragePlanOut])
def list_coverage_plans(company_id: str | None = None, db: Session = Depends(get_db)):
    query = db.query(CoveragePlan).filter(CoveragePlan.active == True)  # noqa: E712
    if company_id:
        query = query.filter(CoveragePlan.company_id == company_id)
    return query.all()


@router.post("/", response_model=CoveragePlanOut, status_code=status.HTTP_201_CREATED)
def create_coverage_plan(payload: CoveragePlanCreate, db: Session = Depends(get_db)):
    """No admin auth — demo/seed step, matches the pattern used for /companies and /zones."""
    company = db.query(Company).filter(Company.company_id == payload.company_id).first()
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found.")

    plan = CoveragePlan(
        company_id=payload.company_id,
        tier_name=payload.tier_name,
        payout_per_day=payload.payout_per_day,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan
