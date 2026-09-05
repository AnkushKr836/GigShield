from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_rider
from app.models.rider import Rider
from app.models.ride import Ride
from app.schemas.ride import RideOut
from app.services.ride_simulator import simulate_rides_for_rider

router = APIRouter(prefix="/rides", tags=["rides"])


@router.post("/simulate", response_model=list[RideOut], status_code=status.HTTP_201_CREATED)
def simulate_rides(
    db: Session = Depends(get_db),
    current_rider: Rider = Depends(get_current_rider),
):
    """
    Demo-only: generates fabricated completed rides for the current rider,
    plus one fabricated disruption event so at least one ride has something
    real to claim against. Not a real ride/trip integration.
    """
    return simulate_rides_for_rider(db, current_rider)


@router.get("/me", response_model=list[RideOut])
def list_my_rides(
    limit: int = 5,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_rider: Rider = Depends(get_current_rider),
):
    return (
        db.query(Ride)
        .filter(Ride.rider_id == current_rider.rider_id)
        .order_by(Ride.start_time.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


@router.get("/{ride_id}", response_model=RideOut)
def get_ride(
    ride_id: str,
    db: Session = Depends(get_db),
    current_rider: Rider = Depends(get_current_rider),
):
    ride = (
        db.query(Ride)
        .filter(Ride.ride_id == ride_id, Ride.rider_id == current_rider.rider_id)
        .first()
    )
    if not ride:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ride not found.")
    return ride
