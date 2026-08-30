from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.disruption_event import DisruptionEvent
from app.models.coverage_plan import CoveragePlan


def find_matching_disruption(db: Session, ride, disruption_type: str) -> DisruptionEvent | None:
    """
    A claim is considered verified if there's a Disruption_Event in the
    ride's zone, of the claimed type, whose time window overlaps the ride's
    time window. This is the parametric-verification core of the product —
    kept intentionally simple for the prototype (no fraud/credibility
    scoring layered on top yet).
    """
    return (
        db.query(DisruptionEvent)
        .filter(
            DisruptionEvent.zone_id == ride.zone_id,
            DisruptionEvent.disruption_type == disruption_type,
            DisruptionEvent.start_time <= ride.end_time,
            (DisruptionEvent.end_time.is_(None)) | (DisruptionEvent.end_time >= ride.start_time),
        )
        .first()
    )


def get_company_payout_rate(db: Session, company_id: str) -> Decimal | None:
    """
    Prototype simplification: a company may have several tiers on paper,
    but for this demo we use its lowest active tier as the default payout
    rate, since riders aren't individually assigned a specific tier yet.
    """
    plan = (
        db.query(CoveragePlan)
        .filter(CoveragePlan.company_id == company_id, CoveragePlan.active == True)  # noqa: E712
        .order_by(CoveragePlan.payout_per_day.asc())
        .first()
    )
    return plan.payout_per_day if plan else None


def assess_claim(db: Session, ride, disruption_type: str) -> dict:
    """Returns the decision: status, matched event (if any), and approved amount (if any)."""
    event = find_matching_disruption(db, ride, disruption_type)

    if event is None:
        return {"status": "manual_review", "event_id": None, "approved_amount": None}

    payout_rate = get_company_payout_rate(db, ride.company_id)
    if payout_rate is None:
        # Verified disruption, but the rider's company has no active coverage plan —
        # can't compute a payout amount, so this also goes to manual review.
        return {"status": "manual_review", "event_id": event.event_id, "approved_amount": None}

    return {"status": "approved", "event_id": event.event_id, "approved_amount": payout_rate}
