from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.claim_token import ClaimToken

FREQUENCY_WINDOW_DAYS = 30
FREQUENCY_THRESHOLD = 4  # the fourth and later claim within the window is flagged


def check_claim_frequency(db: Session, rider_id: str) -> bool:
    """
    Rule-based, not ML — flags a rider if this would be their 4th+ claim
    within a 30-day window. This does not block or auto-reject the claim;
    it only sets a visible flag for the admin reviewing it, since a
    legitimate rider can genuinely have several claims in a bad-weather month.
    """
    window_start = datetime.now(timezone.utc) - timedelta(days=FREQUENCY_WINDOW_DAYS)
    recent_claims = (
        db.query(ClaimToken)
        .filter(ClaimToken.rider_id == rider_id, ClaimToken.raised_at >= window_start)
        .all()
    )
    # Synthetic fixture claims are repeated deliberately during prototyping;
    # they should not make later demo approval scenarios look like fraud.
    recent_count = 0
    for claim in recent_claims:
        event_source = claim.disruption_event.source if claim.disruption_event else ""
        is_demo_claim = (
            (claim.verification_source or "").startswith("demo_")
            or event_source.startswith("demo_")
            or claim.description.startswith("Prototype auto-claim:")
        )
        if not is_demo_claim:
            recent_count += 1
    # recent_count is claims BEFORE the one being raised now, so threshold - 1
    # prior claims means this new claim is the threshold-th or later.
    return recent_count >= FREQUENCY_THRESHOLD - 1
