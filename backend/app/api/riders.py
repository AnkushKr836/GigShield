from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, get_current_rider
from app.models.rider import Rider
from app.models.zone import Zone
from app.models.company import Company
from app.schemas.rider import RiderCreate, RiderOut, RiderLogin, Token
from app.schemas.credibility import CredibilityOut
from app.services.credibility_engine import compute_credibility

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
