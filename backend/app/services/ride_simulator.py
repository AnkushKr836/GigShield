import random
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.ride import Ride
from app.models.disruption_event import DisruptionEvent

LOCATIONS = [
    "MG Road", "Anna Nagar", "T Nagar", "Velachery", "Adyar",
    "Nungambakkam", "Guindy", "Porur", "Tambaram", "Mylapore",
]


def simulate_rides_for_rider(db: Session, rider, count: int = 14) -> list[Ride]:
    """
    Creates `count` fabricated completed rides for a rider, spread over the
    past 10 days, plus one fabricated disruption event overlapping the
    earliest ride's window — so at least one ride has a real (if fabricated)
    disruption to claim against in the demo.
    """
    now = datetime.now(timezone.utc)
    rides = []

    for i in range(count):
        days_ago = random.randint(0, 9)
        start = now - timedelta(days=days_ago, hours=random.randint(0, 20))
        duration_minutes = random.randint(20, 75)
        end = start + timedelta(minutes=duration_minutes)
        pickup, drop = random.sample(LOCATIONS, 2)

        ride = Ride(
            rider_id=rider.rider_id,
            company_id=rider.company_id,
            zone_id=rider.zone_id,
            pickup_location=pickup,
            drop_location=drop,
            start_time=start,
            end_time=end,
            fare_amount=Decimal(random.randint(80, 350)),
            status="completed",
        )
        db.add(ride)
        rides.append(ride)

    db.flush()  # assigns ride_ids without committing yet

    # Seed one fabricated disruption event overlapping the earliest ride,
    # so the demo can show at least one claim auto-approve.
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
