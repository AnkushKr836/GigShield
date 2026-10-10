from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_rider
from app.models.rider import Rider
from app.models.payout import Payout

router = APIRouter(prefix="/payouts", tags=["payouts"])


@router.get("/me")
def list_my_payouts(db: Session = Depends(get_db), rider: Rider = Depends(get_current_rider)):
    rows = (db.query(Payout).join(Payout.claim_token)
            .filter(Payout.claim_token.has(rider_id=rider.rider_id))
            .order_by(Payout.processed_at.desc()).all())
    return [{
        "payout_id": row.payout_id,
        "token_id": row.token_id,
        "amount": row.amount,
        "channel": row.channel,
        "gateway_ref": row.gateway_ref,
        "status": row.status,
        "processed_at": row.processed_at,
        "disruption_type": row.claim_token.disruption_type,
        "claim_status": row.claim_token.status,
        "ride_id": row.claim_token.ride_id,
    } for row in rows]
