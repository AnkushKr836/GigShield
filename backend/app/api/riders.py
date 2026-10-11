from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, get_current_rider
from app.models.rider import Rider
from app.models.ride import Ride
from app.models.zone import Zone
from app.models.company import Company
from app.models.claim_token import ClaimToken
from app.models.payout import Payout
from app.models.claim_review import ClaimReviewJob, ClaimReviewCheckpoint
from app.models.claim_risk_analysis import ClaimRiskAnalysis
from app.schemas.rider import RiderCreate, RiderOut, RiderLogin, Token
from app.schemas.credibility import CredibilityOut
from app.services.credibility_engine import compute_credibility, compute_and_store_credibility

router = APIRouter(prefix="/riders", tags=["riders"])


@router.post("/register", response_model=RiderOut, status_code=status.HTTP_201_CREATED)
def register_rider(payload: RiderCreate, db: Session = Depends(get_db)):
    existing = db.query(Rider).filter(
        (Rider.email == payload.email) | (Rider.phone == payload.phone)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A rider with this email or phone number already exists.",
        )

    zone = db.query(Zone).filter(Zone.zone_id == payload.zone_id).first()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found.")

    company = db.query(Company).filter(Company.company_id == payload.company_id).first()
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found.")

    rider = Rider(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        persona_type=payload.persona_type,
        company_id=payload.company_id,
        zone_id=payload.zone_id,
    )
    db.add(rider)
    db.commit()
    db.refresh(rider)
    # Persist an initial credibility record so the admin employee list and
    # rider account both show the new account's 90% starting score.
    compute_and_store_credibility(db, rider)
    return rider


@router.post("/login", response_model=Token)
def login_rider(payload: RiderLogin, db: Session = Depends(get_db)):
    rider = db.query(Rider).filter(Rider.email == payload.email).first()
    if not rider or not verify_password(payload.password, rider.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(rider_id=rider.rider_id)
    return Token(access_token=access_token)


@router.get("/me", response_model=RiderOut)
def read_current_rider(current_rider: Rider = Depends(get_current_rider)):
    return current_rider


@router.get("/me/credibility", response_model=CredibilityOut)
def read_my_credibility(
    db: Session = Depends(get_db),
    current_rider: Rider = Depends(get_current_rider),
):
    result = compute_credibility(db, current_rider)
    return CredibilityOut(score=result["score"], factors=result["factors"])


@router.delete("/me/claim-history")
def reset_my_claim_history(
    db: Session = Depends(get_db),
    current_rider: Rider = Depends(get_current_rider),
):
    """Clear only the signed-in rider's claims and their derived records.

    Rides, disruption evidence, company coverage, and the rider account are
    retained so the same rides can be used for another claim walkthrough.
    """
    claims = db.query(ClaimToken).filter(ClaimToken.rider_id == current_rider.rider_id).all()
    token_ids = [claim.token_id for claim in claims]
    deleted_claims = len(token_ids)
    deleted_payouts = 0

    if token_ids:
        deleted_payouts = db.query(Payout).filter(Payout.token_id.in_(token_ids)).delete(synchronize_session=False)
        db.query(ClaimReviewJob).filter(ClaimReviewJob.token_id.in_(token_ids)).delete(synchronize_session=False)
        db.query(ClaimReviewCheckpoint).filter(ClaimReviewCheckpoint.token_id.in_(token_ids)).delete(synchronize_session=False)
        db.query(ClaimRiskAnalysis).filter(ClaimRiskAnalysis.token_id.in_(token_ids)).delete(synchronize_session=False)
        db.query(ClaimToken).filter(ClaimToken.token_id.in_(token_ids)).delete(synchronize_session=False)

    db.commit()
    score = compute_and_store_credibility(db, current_rider)
    return {
        "deleted_claims": deleted_claims,
        "deleted_payouts": deleted_payouts,
        "rides_retained": db.query(Ride).filter_by(rider_id=current_rider.rider_id).count(),
        "credibility_score": float(score.score_value),
        "message": "Claim history cleared. Rides and coverage were kept so you can demonstrate them again.",
    }
