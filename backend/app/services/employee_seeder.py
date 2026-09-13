import random
from datetime import datetime, timedelta, timezone, date
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.rider import Rider
from app.models.ride import Ride
from app.models.claim_token import ClaimToken
from app.models.company import Company
from app.models.zone import Zone
from app.services.credibility_engine import compute_and_store_credibility
from app.services.chennai_locations import RESTAURANTS, DROP_LOCATIONS

FIRST_NAMES = [
    "Arjun", "Priya", "Vikram", "Ananya", "Rahul", "Sneha", "Karthik", "Divya",
    "Suresh", "Meera", "Rohan", "Kavya", "Arun", "Pooja", "Vijay", "Nisha",
    "Sanjay", "Anjali", "Manoj", "Deepa",
]
LAST_NAMES = [
    "Kumar", "Sharma", "Reddy", "Iyer", "Nair", "Rao", "Menon", "Pillai",
    "Krishnan", "Raman", "Subramaniam", "Chandran", "Murthy", "Balan",
]
PERSONAS = ["food_delivery", "ecommerce", "grocery_qcommerce"]
DEMO_PASSWORD = "demo12345"  # fixed, documented, so any seeded employee can be logged into for demo purposes

# Weighted claim outcomes: mostly approved/rejected-cleanly, some in review —
# deliberately skewed so credibility scores end up genuinely spread out
# rather than clustering near the baseline.
CLAIM_OUTCOME_WEIGHTS = [("approved", 5), ("rejected", 2), ("manual_review", 2)]


def _weighted_choice(pairs):
    total = sum(w for _, w in pairs)
    r = random.uniform(0, total)
    upto = 0
    for value, weight in pairs:
        upto += weight
        if upto >= r:
            return value
    return pairs[-1][0]


def _fabricate_history_for_rider(db: Session, rider, num_rides: int, num_claims: int):
    """Backdated rides + claims with deliberately varied outcomes, so the
    resulting credibility score reflects a real-looking history rather than
    a freshly-registered rider with nothing behind them."""
    rides = []
    for _ in range(num_rides):
        days_ago = random.randint(1, 120)
        start = datetime.now(timezone.utc) - timedelta(days=days_ago, hours=random.randint(0, 20))
        end = start + timedelta(minutes=random.randint(20, 75))
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
    db.flush()

    for _ in range(min(num_claims, len(rides))):
        ride = random.choice(rides)
        already_claimed = db.query(ClaimToken).filter(ClaimToken.ride_id == ride.ride_id).first()
        if already_claimed:
            continue
        outcome = _weighted_choice(CLAIM_OUTCOME_WEIGHTS)
        claimed_amount = Decimal(random.randint(100, 400))
        claim = ClaimToken(
            rider_id=rider.rider_id,
            ride_id=ride.ride_id,
            event_id=None,
            disruption_type=random.choice(["environmental", "social"]),
            description="Fabricated historical claim, generated for demo credibility variety.",
            claimed_amount=claimed_amount,
            approved_amount=claimed_amount if outcome == "approved" else None,
            status=outcome,
            fraud_flag=False,
            raised_at=ride.start_time + timedelta(hours=random.randint(1, 48)),
            decided_at=ride.start_time + timedelta(hours=random.randint(49, 96)) if outcome != "pending" else None,
        )
        db.add(claim)
    db.commit()


def seed_demo_employees(db: Session, count: int, company_id: str | None, zone_id: str | None) -> list[dict]:
    company = db.query(Company).filter(Company.company_id == company_id).first() if company_id else db.query(Company).first()
    zone = db.query(Zone).filter(Zone.zone_id == zone_id).first() if zone_id else db.query(Zone).first()
    if not company or not zone:
        raise ValueError("At least one Company and one Zone must exist before seeding employees.")

    results = []
    for i in range(count):
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        suffix = random.randint(1000, 9999)
        joined_days_ago = random.randint(10, 300)

        rider = Rider(
            name=f"{first} {last}",
            email=f"{first.lower()}.{last.lower()}{suffix}@example.com",
            phone=f"9{random.randint(100000000, 999999999)}",
            password_hash=hash_password(DEMO_PASSWORD),
            persona_type=random.choice(PERSONAS),
            company_id=company.company_id,
            zone_id=zone.zone_id,
            joined_on=date.today() - timedelta(days=joined_days_ago),
        )
        db.add(rider)
        db.commit()
        db.refresh(rider)

        _fabricate_history_for_rider(
            db, rider,
            num_rides=random.randint(3, 12),
            num_claims=random.randint(0, 6),
        )

        score_record = compute_and_store_credibility(db, rider)
        results.append({
            "rider_id": rider.rider_id,
            "name": rider.name,
            "email": rider.email,
            "credibility_score": float(score_record.score_value),
            "demo_password": DEMO_PASSWORD,
        })

    return results
