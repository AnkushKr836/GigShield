import random
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.ride import Ride
from app.services.chennai_locations import nearby_location_pairs, display_location
from app.services.demo_disruptions import seed_claim_scenario_disruptions

# Restricted to the last 2 days so a real, no-card, free-tier weather API
# (current conditions only, no historical lookup) can meaningfully check
# conditions close to when the ride actually happened.
MAX_HOURS_AGO = 48
MAX_DEMO_RIDE_MINUTES = 20


def simulate_rides_for_rider(db: Session, rider, count: int = 6) -> list[Ride]:
    """
    Creates `count` fabricated completed rides for a rider, using real named
    Chennai restaurants (pickup) and hotels, campuses or universities (drop)
    with approximate venue coordinates, spread over the last 48 hours. A
    portion of each batch receives matched weather/civic evidence; the rest
    intentionally have no matching disruption event.
    """
    now = datetime.now(timezone.utc)
    rides = []

    for i in range(count):
        start = now - timedelta(hours=random.uniform(0, MAX_HOURS_AGO))
        duration_minutes = random.randint(5, MAX_DEMO_RIDE_MINUTES)
        end = start + timedelta(minutes=duration_minutes)

        pickup, drop = random.choice(nearby_location_pairs())

        ride = Ride(
            rider_id=rider.rider_id,
            company_id=rider.company_id,
            zone_id=rider.zone_id,
            pickup_location=display_location(pickup),
            pickup_lat=pickup["lat"],
            pickup_lng=pickup["lng"],
            drop_location=display_location(drop),
            drop_lat=drop["lat"],
            drop_lng=drop["lng"],
            start_time=start,
            end_time=end,
            fare_amount=Decimal(random.randint(80, 350)),
            status="completed",
        )
        db.add(ride)
        rides.append(ride)

    db.flush()  # assigns ride_ids without committing yet

    # Create evidence for a portion of the new batch. Other rides have no
    # matching event, so submitted claims enter ordinary manual review.
    seed_claim_scenario_disruptions(db, rides)
    db.commit()
    for r in rides:
        db.refresh(r)
    return rides
