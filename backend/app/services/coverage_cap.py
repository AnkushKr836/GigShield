from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.claim_token import ClaimToken
from app.models.company import Company


def compute_capped_payout(db: Session, rider_id: str, company_id: str, payout_rate: Decimal, claimed_amount: Decimal) -> dict:
    """
    Enforces the coverage plan's payout_per_day as a genuine daily ceiling
    per rider, not just a flat per-claim amount. If a rider has already
    had ₹180 approved today against a ₹250/day plan and raises a new
    ₹100 claim, only ₹70 gets awarded — with a written explanation on the
    claim itself, not a silent partial payout.
    """
    today = datetime.now(timezone.utc).date()

    already_decided_today = (
        db.query(ClaimToken)
        .filter(
            ClaimToken.rider_id == rider_id,
            ClaimToken.status == "approved",
            ClaimToken.approved_amount.isnot(None),
        )
        .all()
    )
    already_approved_today = sum(
        (c.approved_amount for c in already_decided_today if c.decided_at and c.decided_at.date() == today),
        Decimal("0"),
    )

    remaining = max(Decimal("0"), payout_rate - already_approved_today)
    approved_amount = min(claimed_amount, remaining)

    payout_note = None
    if approved_amount < claimed_amount:
        company = db.query(Company).filter(Company.company_id == company_id).first()
        company_name = company.name if company else "your company"
        if approved_amount == 0:
            payout_note = (
                f"{company_name}'s daily coverage limit of ₹{payout_rate} has already been fully used today "
                f"(₹{already_approved_today} approved so far). No further amount can be awarded today for this claim."
            )
        else:
            payout_note = (
                f"{company_name}'s daily coverage limit is ₹{payout_rate}. ₹{already_approved_today} was already "
                f"approved for you today, so only ₹{approved_amount} of this ₹{claimed_amount} claim was awarded."
            )

    return {"approved_amount": approved_amount, "payout_note": payout_note}
