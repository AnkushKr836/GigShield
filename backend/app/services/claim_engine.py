from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.disruption_event import DisruptionEvent
from app.models.coverage_plan import CoveragePlan
from app.services.weather_service import get_current_weather


def find_matching_disruption(db: Session, ride, disruption_type: str) -> DisruptionEvent | None:
    """
    A claim is considered verified if there's a Disruption_Event in the
    ride's zone, of the claimed type, whose time window overlaps the ride's
    time window. Checked FIRST because it's deterministic and needs no
    network call — the real-weather check below is a secondary signal.
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


def check_real_weather(ride, disruption_type: str) -> dict | None:
    """
    Real, live OpenWeatherMap check at the ride's pickup coordinates.
    Only applies to environmental claims (weather has no bearing on a
    social/civic disruption claim), and only if the ride has coordinates
    at all (older fabricated history may not).

    Important honesty note: this checks CURRENT conditions, not conditions
    at the time of the ride — a real limitation of the free, no-card
    OpenWeatherMap tier (see weather_service.py). It is a supporting
    signal, not a substitute for the fabricated disruption-event check.
    """
    if disruption_type != "environmental":
        return None
    if ride.pickup_lat is None or ride.pickup_lng is None:
        return None
    return get_current_weather(ride.pickup_lat, ride.pickup_lng)


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
    """
    Returns the decision: status, matched event (if any), approved amount
    (if any), which source verified it, and the raw weather data (if a
    real check was made) for transparency on the claim record.
    """
    event = find_matching_disruption(db, ride, disruption_type)
    verification_source = "fabricated_disruption" if event else None
    weather_result = None

    if event is None:
        # No fabricated match — try a real, live weather check as a
        # secondary signal before falling back to manual review.
        weather_result = check_real_weather(ride, disruption_type)
        if weather_result and weather_result["is_disruptive"]:
            verification_source = "real_weather"

    if verification_source is None:
        return {
            "status": "manual_review",
            "event_id": None,
            "approved_amount": None,
            "verification_source": None,
            "weather_snapshot": weather_result,
        }

    payout_rate = get_company_payout_rate(db, ride.company_id)
    if payout_rate is None:
        # Verified, but the rider's company has no active coverage plan —
        # can't compute a payout amount, so this also goes to manual review.
        return {
            "status": "manual_review",
            "event_id": event.event_id if event else None,
            "approved_amount": None,
            "verification_source": verification_source,
            "weather_snapshot": weather_result,
        }

    return {
        "status": "approved",
        "event_id": event.event_id if event else None,
        "approved_amount": payout_rate,
        "verification_source": verification_source,
        "weather_snapshot": weather_result,
    }
