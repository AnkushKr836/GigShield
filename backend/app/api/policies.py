from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_rider
from app.models.rider import Rider
from app.models.policy import Policy
from app.schemas.policy import PolicyOut
from app.services.premium_engine import compute_weekly_premium

router = APIRouter(prefix="/policies", tags=["policies"])


@router.post("/", response_model=PolicyOut, status_code=status.HTTP_201_CREATED)
def create_weekly_policy(
    db: Session = Depends(get_db),
    current_rider: Rider = Depends(get_current_rider),
):
    # REQ-4.1.4 — only one active, non-expired policy per rider at a time
    today = date.today()
    active_policy = (
        db.query(Policy)
        .filter(
            Policy.rider_id == current_rider.rider_id,
            Policy.status == "active",
            Policy.end_date >= today,
        )
        .first()
    )
    if active_policy:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Rider already has an active policy for this week.",
        )

    premium = compute_weekly_premium(risk_tier=current_rider.zone.risk_tier)

    policy = Policy(
        rider_id=current_rider.rider_id,
        weekly_premium=premium,
        start_date=today,
        end_date=today + timedelta(days=7),
        status="active",
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy


@router.get("/me", response_model=list[PolicyOut])
def list_my_policies(
    db: Session = Depends(get_db),
    current_rider: Rider = Depends(get_current_rider),
):
    return db.query(Policy).filter(Policy.rider_id == current_rider.rider_id).all()
