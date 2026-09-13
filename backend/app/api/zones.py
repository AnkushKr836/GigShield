from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.zone import Zone
from app.schemas.zone import ZoneCreate, ZoneUpdate, ZoneOut

router = APIRouter(prefix="/zones", tags=["zones"])


@router.get("/", response_model=list[ZoneOut])
def list_zones(db: Session = Depends(get_db)):
    """Public — the registration form needs this to populate the zone picker."""
    return db.query(Zone).filter(Zone.active == True).all()  # noqa: E712


@router.post("/", response_model=ZoneOut, status_code=status.HTTP_201_CREATED)
def create_zone(payload: ZoneCreate, db: Session = Depends(get_db), _admin: str = Depends(get_current_admin)):
    zone = Zone(name=payload.name, risk_tier=payload.risk_tier)
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return zone


@router.patch("/{zone_id}", response_model=ZoneOut)
def update_zone(zone_id: str, payload: ZoneUpdate, db: Session = Depends(get_db), _admin: str = Depends(get_current_admin)):
    zone = db.query(Zone).filter(Zone.zone_id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found.")
    if payload.name is not None:
        zone.name = payload.name
    if payload.risk_tier is not None:
        zone.risk_tier = payload.risk_tier
    db.commit()
    db.refresh(zone)
    return zone


@router.delete("/{zone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_zone(zone_id: str, db: Session = Depends(get_db), _admin: str = Depends(get_current_admin)):
    """Soft delete — riders and disruption events already reference this zone_id."""
    zone = db.query(Zone).filter(Zone.zone_id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found.")
    zone.active = False
    db.commit()
