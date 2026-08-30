from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_rider
from app.models.rider import Rider
from app.models.ride import Ride
from app.models.claim_token import ClaimToken
from app.schemas.claim import ClaimCreate, ClaimOut
from app.services.claim_engine import assess_claim

router = APIRouter(prefix="/claims", tags=["claims"])


@router.post("/", response_model=ClaimOut, status_code=status.HTTP_201_CREATED)
def raise_claim(
    payload: ClaimCreate,
    db: Session = Depends(get_db),
    current_rider: Rider = Depends(get_current_rider),
):
    ride = (
        db.query(Ride)
        .filter(Ride.ride_id == payload.ride_id, Ride.rider_id == current_rider.rider_id)
        .first()
    )
    if not ride:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ride not found.")

    existing = db.query(ClaimToken).filter(ClaimToken.ride_id == ride.ride_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A claim has already been raised for this ride.",
        )

    decision = assess_claim(db, ride, payload.disruption_type)

    claim = ClaimToken(
        rider_id=current_rider.rider_id,
        ride_id=ride.ride_id,
        event_id=decision["event_id"],
        disruption_type=payload.disruption_type,
        description=payload.description,
        claimed_amount=payload.claimed_amount,
        approved_amount=decision["approved_amount"],
        status=decision["status"],
        decided_at=datetime.now(timezone.utc) if decision["status"] != "pending" else None,
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)
    return claim


@router.get("/me", response_model=list[ClaimOut])
def list_my_claims(
    db: Session = Depends(get_db),
    current_rider: Rider = Depends(get_current_rider),
):
    return (
        db.query(ClaimToken)
        .filter(ClaimToken.rider_id == current_rider.rider_id)
        .order_by(ClaimToken.raised_at.desc())
        .all()
    )
