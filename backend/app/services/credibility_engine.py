from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.claim_token import ClaimToken
from app.models.credibility_score import CredibilityScore

BASELINE = Decimal("0.75")
TENURE_BONUS_CAP = Decimal("0.15")  # up to +0.15 for a long-standing rider
POOR_HISTORY_PENALTY_CAP = Decimal("0.35")  # up to -0.35 for a bad claim history


def compute_credibility(db: Session, rider) -> dict:
    """
    Transparent, rule-based score (0.000-1.000) — no ML involved. This does
    NOT gate claim approval; per the project roadmap it is used only to
    prioritize the admin's manual-review queue (lower score surfaces first).
    """
    claims = db.query(ClaimToken).filter(ClaimToken.rider_id == rider.rider_id).all()
    total = len(claims)
    rejected_or_review = len([c for c in claims if c.status in ("rejected", "manual_review")])

    if total == 0:
        history_penalty = Decimal("0")
    else:
        bad_ratio = Decimal(rejected_or_review) / Decimal(total)
        history_penalty = bad_ratio * POOR_HISTORY_PENALTY_CAP

    tenure_days = (date.today() - rider.joined_on).days if rider.joined_on else 0
    tenure_factor = min(Decimal(tenure_days) / Decimal(180), Decimal("1"))  # caps at ~6 months
    tenure_bonus = tenure_factor * TENURE_BONUS_CAP

    score = BASELINE - history_penalty + tenure_bonus
    score = max(Decimal("0"), min(Decimal("1"), score)).quantize(Decimal("0.001"))

    factors = {
        "baseline": float(BASELINE),
        "total_claims": total,
        "rejected_or_review_claims": rejected_or_review,
        "history_penalty": float(history_penalty.quantize(Decimal("0.001"))),
        "tenure_days": tenure_days,
        "tenure_bonus": float(tenure_bonus.quantize(Decimal("0.001"))),
    }
    return {"score": score, "factors": factors}


def compute_and_store_credibility(db: Session, rider) -> CredibilityScore:
    result = compute_credibility(db, rider)
    record = CredibilityScore(
        rider_id=rider.rider_id,
        score_value=result["score"],
        factors=result["factors"],
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record
