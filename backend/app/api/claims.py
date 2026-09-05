from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_rider
from app.models.rider import Rider
from app.models.ride import Ride
from app.models.claim_token import ClaimToken
from app.schemas.claim import ClaimCreate, ClaimOut, ClaimDecision
from app.services.claim_engine import assess_claim
from app.services.payout_service import create_payout_for_claim
from app.services.credibility_engine import compute_credibility
from app.services.fraud_service import check_claim_frequency

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
    is_frequent = check_claim_frequency(db, current_rider.rider_id)

    # A frequency flag downgrades an auto-approval to manual review rather
    # than silently approving — it never auto-rejects, matching the
    # "flag, don't punish" pattern used for unmatched disruptions.
    final_status = decision["status"]
    final_approved_amount = decision["approved_amount"]
    if is_frequent and final_status == "approved":
        final_status = "manual_review"
        final_approved_amount = None

    claim = ClaimToken(
        rider_id=current_rider.rider_id,
        ride_id=ride.ride_id,
        event_id=decision["event_id"],
        disruption_type=payload.disruption_type,
        description=payload.description,
        claimed_amount=payload.claimed_amount,
        approved_amount=final_approved_amount,
        status=final_status,
        fraud_flag=is_frequent,
        decided_at=datetime.now(timezone.utc) if final_status not in ("pending", "manual_review") else None,
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)

    if claim.status == "approved":
        create_payout_for_claim(db, claim)

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


@router.get("/manual-review", response_model=list[ClaimOut])
def list_manual_review_claims(db: Session = Depends(get_db)):
    """
    Admin queue. No auth yet (matches the rest of the admin surface for this
    prototype). Sorted so the LOWEST-credibility riders' claims surface
    first — credibility does not affect the original auto-decision, only
    review priority, per the project roadmap.
    """
    claims = (
        db.query(ClaimToken)
        .filter(ClaimToken.status == "manual_review")
        .order_by(ClaimToken.raised_at.asc())
        .all()
    )

    def sort_key(c):
        result = compute_credibility(db, c.rider)
        return result["score"]

    return sorted(claims, key=sort_key)


@router.patch("/{token_id}/decision", response_model=ClaimOut)
def decide_claim(
    token_id: str,
    payload: ClaimDecision,
    db: Session = Depends(get_db),
):
    """Admin manually approves or rejects a claim currently in manual_review."""
    claim = db.query(ClaimToken).filter(ClaimToken.token_id == token_id).first()
    if not claim:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found.")
    if claim.status != "manual_review":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only claims currently in manual review can be manually decided.",
        )

    claim.status = payload.decision
    claim.decided_at = datetime.now(timezone.utc)
    if payload.decision == "approved":
        claim.approved_amount = payload.approved_amount or claim.claimed_amount

    db.commit()
    db.refresh(claim)

    if claim.status == "approved":
        create_payout_for_claim(db, claim)

    return claim
