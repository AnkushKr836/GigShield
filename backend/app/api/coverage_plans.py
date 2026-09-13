from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.company import Company
from app.models.coverage_plan import CoveragePlan
from app.schemas.coverage_plan import CoveragePlanCreate, CoveragePlanUpdate, CoveragePlanOut

router = APIRouter(prefix="/coverage-plans", tags=["coverage-plans"])


@router.get("/", response_model=list[CoveragePlanOut])
def list_coverage_plans(company_id: str | None = None, db: Session = Depends(get_db), _admin: str = Depends(get_current_admin)):
    query = db.query(CoveragePlan).filter(CoveragePlan.active == True)  # noqa: E712
    if company_id:
        query = query.filter(CoveragePlan.company_id == company_id)
    return query.all()


@router.post("/", response_model=CoveragePlanOut, status_code=status.HTTP_201_CREATED)
def create_coverage_plan(payload: CoveragePlanCreate, db: Session = Depends(get_db), _admin: str = Depends(get_current_admin)):
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


@router.patch("/{plan_id}", response_model=CoveragePlanOut)
def update_coverage_plan(plan_id: str, payload: CoveragePlanUpdate, db: Session = Depends(get_db), _admin: str = Depends(get_current_admin)):
    plan = db.query(CoveragePlan).filter(CoveragePlan.plan_id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coverage plan not found.")
    if payload.tier_name is not None:
        plan.tier_name = payload.tier_name
    if payload.payout_per_day is not None:
        plan.payout_per_day = payload.payout_per_day
    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_coverage_plan(plan_id: str, db: Session = Depends(get_db), _admin: str = Depends(get_current_admin)):
    plan = db.query(CoveragePlan).filter(CoveragePlan.plan_id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coverage plan not found.")
    plan.active = False
    db.commit()
