from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.rider import Rider
from app.models.credibility_score import CredibilityScore
from app.schemas.employee_seed import SeedEmployeesRequest, SeededEmployeeOut, EmployeeListItem
from app.services.employee_seeder import seed_demo_employees

router = APIRouter(prefix="/admin/employees", tags=["admin"])


@router.get("/", response_model=list[EmployeeListItem])
def list_employees(db: Session = Depends(get_db), _admin: str = Depends(get_current_admin)):
    """All riders with their most recently computed credibility score, if any."""
    riders = db.query(Rider).order_by(Rider.created_at.desc()).all()
    results = []
    for r in riders:
        latest_score = (
            db.query(CredibilityScore)
            .filter(CredibilityScore.rider_id == r.rider_id)
            .order_by(CredibilityScore.computed_at.desc())
            .first()
        )
        results.append(EmployeeListItem(
            rider_id=r.rider_id,
            name=r.name,
            email=r.email,
            phone=r.phone,
            persona_type=r.persona_type,
            company_name=r.company.name if r.company else "—",
            zone_name=r.zone.name if r.zone else "—",
            joined_on=str(r.joined_on),
            credibility_score=float(latest_score.score_value) if latest_score else None,
        ))
    return results


@router.post("/seed", response_model=list[SeededEmployeeOut], status_code=status.HTTP_201_CREATED)
def seed_employees(payload: SeedEmployeesRequest, db: Session = Depends(get_db), _admin: str = Depends(get_current_admin)):
    """
    Demo-only: creates fabricated riders with backdated, varied claim
    histories so credibility scores and the admin views have realistic
    spread to demonstrate against, instead of one freshly-registered
    test rider. No admin auth yet, matching the rest of this prototype's
    admin surface.
    """
    if payload.count < 1 or payload.count > 50:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="count must be between 1 and 50.")
    try:
        return seed_demo_employees(db, payload.count, payload.company_id, payload.zone_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
