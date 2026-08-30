from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.zone import Zone
from app.schemas.policy import ZoneCreate, ZoneOut

router = APIRouter(prefix="/zones", tags=["zones"])


@router.get("/", response_model=list[ZoneOut])
def list_zones(db: Session = Depends(get_db)):
    """Public — the registration form needs this to populate the zone picker."""
    return db.query(Zone).all()


@router.post("/", response_model=ZoneOut, status_code=status.HTTP_201_CREATED)
def create_zone(payload: ZoneCreate, db: Session = Depends(get_db)):
    """
    No admin auth yet — fine for hackathon/demo seeding, but flag this before
    any real deployment: this endpoint should be admin-only in Phase 3.
    """
    zone = Zone(name=payload.name, risk_tier=payload.risk_tier)
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return zone
