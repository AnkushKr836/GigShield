from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.claim_token import ClaimToken

FREQUENCY_WINDOW_DAYS = 30
FREQUENCY_THRESHOLD = 3  # claims within the window that trigger a flag


def check_claim_frequency(db: Session, rider_id: str) -> bool:
    """
    Rule-based, not ML — flags a rider if this would be their 4th+ claim
    within a 30-day window. This does not block or auto-reject the claim;
    it only sets a visible flag for the admin reviewing it, since a
    legitimate rider can genuinely have several claims in a bad-weather month.
    """
    window_start = datetime.now(timezone.utc) - timedelta(days=FREQUENCY_WINDOW_DAYS)
    recent_count = (
        db.query(ClaimToken)
        .filter(ClaimToken.rider_id == rider_id, ClaimToken.raised_at >= window_start)
        .count()
    )
    # recent_count is claims BEFORE the one being raised now, so >= threshold - 1
    # means this new claim would be the (threshold)-th or later
    return recent_count >= FREQUENCY_THRESHOLD - 1
