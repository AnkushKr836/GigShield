"""Seed explicit auto-claim examples for the prototype ride simulator."""

from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.claim_token import ClaimToken
from app.services.claim_engine import assess_claim, get_company_payout_rate
from app.services.payout_service import create_payout_for_claim


DEMO_CLAIM_CASES = (
    ("environmental", "Prototype auto-claim: simulated heavy rain affected this delivery."),
    ("social", "Prototype auto-claim: simulated traffic disruption delayed this delivery."),
)


def seed_demo_auto_claims(db: Session, rider, rides: list) -> list[ClaimToken]:
    """Create one weather and one civic claim example when the employer has cover."""
    if len(rides) < len(DEMO_CLAIM_CASES):
        return []
    existing_examples = (
        db.query(ClaimToken)
        .filter(
            ClaimToken.rider_id == rider.rider_id,
            ClaimToken.description.like("Prototype auto-claim:%"),
        )
        .count()
    )
    if existing_examples >= len(DEMO_CLAIM_CASES):
        return []
    remaining_examples = len(DEMO_CLAIM_CASES) - existing_examples
    if get_company_payout_rate(db, rider.company_id) is None:
        return []

    seeded = []
    for ride, (disruption_type, description) in zip(rides[:remaining_examples], DEMO_CLAIM_CASES[:remaining_examples]):
        if db.query(ClaimToken).filter(ClaimToken.ride_id == ride.ride_id).first():
            continue
        decision = assess_claim(db, ride, disruption_type, Decimal("100"))
        if decision["status"] != "approved":
            continue

        claim = ClaimToken(
            rider_id=rider.rider_id,
            ride_id=ride.ride_id,
            event_id=decision["event_id"],
            disruption_type=disruption_type,
            description=description,
            claimed_amount=Decimal("100"),
            approved_amount=decision["approved_amount"],
            status="approved",
            fraud_flag=False,
            verification_source=decision["verification_source"],
            weather_snapshot=decision["weather_snapshot"],
            payout_note=decision["payout_note"],
            decided_at=datetime.now(timezone.utc),
        )
        db.add(claim)
        db.commit()
        db.refresh(claim)
        create_payout_for_claim(db, claim)
        seeded.append(claim)

    return seeded
