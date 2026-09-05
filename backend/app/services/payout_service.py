import uuid

from sqlalchemy.orm import Session

from app.models.payout import Payout


def create_payout_for_claim(db: Session, claim) -> Payout:
    """
    Simulated, instant payout — no real payment gateway. Matches the same
    'fabricated but structurally real' pattern used by the ride simulator:
    a real Payout row is created, just backed by a fake gateway reference
    instead of an actual API call.
    """
    payout = Payout(
        token_id=claim.token_id,
        amount=claim.approved_amount,
        channel="mock_wallet",
        gateway_ref=f"DEMO-{uuid.uuid4().hex[:10].upper()}",
        status="completed",
    )
    db.add(payout)
    db.commit()
    db.refresh(payout)
    return payout
