from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_rider
from app.models.rider import Rider
from app.models.ride import Ride
from app.schemas.ride import RideOut
from app.services.ride_simulator import simulate_rides_for_rider
from app.services.weather_service import get_current_weather

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


@router.get("/{ride_id}/weather")
def get_ride_weather(
    ride_id: str,
    db: Session = Depends(get_db),
    current_rider: Rider = Depends(get_current_rider),
):
    """
    Real, live current-conditions check at the ride's pickup location —
    shown proactively on the ride detail page, independent of whether a
    claim has been raised yet. Returns null fields if the API key isn't
    configured or the request fails; this is informational only, never a
    hard requirement for using the app.
    """
    ride = (
        db.query(Ride)
        .filter(Ride.ride_id == ride_id, Ride.rider_id == current_rider.rider_id)
        .first()
    )
    if not ride:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ride not found.")
    if ride.pickup_lat is None or ride.pickup_lng is None:
        return {"available": False, "reason": "No coordinates recorded for this ride."}

    weather = get_current_weather(ride.pickup_lat, ride.pickup_lng)
    if weather is None:
        return {"available": False, "reason": "Live weather check unavailable right now."}
    return {"available": True, **weather}
