from decimal import Decimal

BASE_WEEKLY_RATE = Decimal("100.00")  # INR, placeholder — tune against real actuarial input later

ZONE_RISK_MULTIPLIER = {
    "low": Decimal("0.85"),
    "medium": Decimal("1.00"),
    "high": Decimal("1.25"),
}


def compute_weekly_premium(risk_tier: str, credibility_score: Decimal | None = None) -> Decimal:
    """
    Rule-based weekly premium (Phase 2 baseline per the WBS — an ML-driven
    regression model is a Phase 3 enhancement, not a dependency for this to work).

    - Higher zone risk tier -> higher premium.
    - Higher credibility score -> small discount, rewarding a clean claim history.
      New riders have no score yet, so they pay the undiscounted rate.
    """
    multiplier = ZONE_RISK_MULTIPLIER.get(risk_tier, Decimal("1.00"))
    premium = BASE_WEEKLY_RATE * multiplier

    if credibility_score is not None:
        # up to a 10% discount at a perfect 1.000 score
        discount = Decimal("1.00") - (Decimal("0.10") * credibility_score)
        premium *= discount

    return premium.quantize(Decimal("0.01"))
