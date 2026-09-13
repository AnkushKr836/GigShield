import random
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.ride import Ride
from app.models.disruption_event import DisruptionEvent
from app.services.chennai_locations import RESTAURANTS, DROP_LOCATIONS

# Restricted to the last 2 days so a real, no-card, free-tier weather API
# (current conditions only, no historical lookup) can meaningfully check
# conditions close to when the ride actually happened.
MAX_HOURS_AGO = 48


def simulate_rides_for_rider(db: Session, rider, count: int = 14) -> list[Ride]:
    """
    Creates `count` fabricated completed rides for a rider, using real named
    Chennai restaurants (pickup) and real named neighborhoods (drop) with
    real coordinates — spread over the last 48 hours — plus one fabricated
    disruption event overlapping the earliest ride's window, so at least
    one ride has something to claim against even before any real weather
    check is layered on top.
    """
    now = datetime.now(timezone.utc)
    rides = []

    for i in range(count):
        start = now - timedelta(hours=random.uniform(0, MAX_HOURS_AGO))
        duration_minutes = random.randint(20, 75)
        end = start + timedelta(minutes=duration_minutes)

        pickup = random.choice(RESTAURANTS)
        drop = random.choice(DROP_LOCATIONS)

        ride = Ride(
            rider_id=rider.rider_id,
            company_id=rider.company_id,
            zone_id=rider.zone_id,
            pickup_location=pickup["name"],
            pickup_lat=pickup["lat"],
            pickup_lng=pickup["lng"],
            drop_location=drop["name"],
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

    # Seed one fabricated disruption event overlapping the earliest ride,
    # so the demo can show at least one claim auto-approve even without
    # depending on real, live weather at the moment of verification.
    earliest = min(rides, key=lambda r: r.start_time)
    event = DisruptionEvent(
        zone_id=rider.zone_id,
        disruption_type="environmental",
        subtype="heavy_rain",
        severity="high",
        start_time=earliest.start_time - timedelta(minutes=15),
        end_time=earliest.end_time + timedelta(minutes=15),
        source="demo_seed",
        raw_payload={"note": "Fabricated for prototype demonstration — not a real weather reading."},
    )
    db.add(event)

    db.commit()
    for r in rides:
        db.refresh(r)
    return rides
