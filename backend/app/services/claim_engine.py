from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.disruption_event import DisruptionEvent
from app.models.coverage_plan import CoveragePlan
from app.services.weather_service import get_current_weather
from app.services.coverage_cap import compute_capped_payout


def find_matching_disruption(db: Session, ride, disruption_type: str) -> DisruptionEvent | None:
    """
    A claim is considered verified if there's a Disruption_Event in the
    ride's zone, of the claimed type, whose time window overlaps the ride's
    time window. The deterministic event is checked alongside a live weather
    signal for environmental claims.
    """
    candidates = (
        db.query(DisruptionEvent)
        .filter(
            DisruptionEvent.zone_id == ride.zone_id,
            DisruptionEvent.disruption_type == disruption_type,
            DisruptionEvent.start_time <= ride.end_time,
            (DisruptionEvent.end_time.is_(None)) | (DisruptionEvent.end_time >= ride.start_time),
        )
        .all()
    )
    # Demo signals are explicitly attached to one synthetic ride. Do not let
    # a nearby ride's fixture validate this ride just because their windows
    # overlap in the same zone.
    for event in candidates:
        payload = event.raw_payload or {}
        if payload.get("demo") and payload.get("ride_id") == ride.ride_id:
            return event
    for event in candidates:
        if not (event.raw_payload or {}).get("demo"):
            return event
    return None


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


def assess_claim(db: Session, ride, disruption_type: str, claimed_amount: Decimal) -> dict:
    """
    Returns the decision: status, matched event (if any), approved amount
    (if any, after applying the daily coverage cap), a written note when
    the cap reduced the payout, which source verified it, and the raw
    weather data (if a real check was made) for transparency.
    """
    event = find_matching_disruption(db, ride, disruption_type)
    # Check live weather for every environmental claim, even when a demo or
    # admin-seeded event overlaps. This records the current signal for
    # transparency; demo events remain a deterministic fallback when the
    # real provider is unavailable or conditions are not disruptive.
    weather_result = check_real_weather(ride, disruption_type)
    simulated_weather = None
    if event and event.source == "demo_weather":
        simulated_weather = {
            "condition_code": 502,
            "description": "heavy rain",
            "temp_c": 23.4,
            "is_disruptive": True,
            "simulated": True,
            "source": "prototype_fixture",
            "details": (event.raw_payload or {}).get("details", {}),
            "live_check": weather_result,
        }

    if weather_result and weather_result["is_disruptive"]:
        verification_source = "real_weather"
    elif event and event.source in {"demo_weather", "demo_traffic", "demo_curfew"}:
        verification_source = event.source
    elif event:
        verification_source = "fabricated_disruption"
    else:
        verification_source = None

    # Preserve the real provider result when it confirms disruption. When it
    # is clear or unavailable, retain the matched demo weather as the claim's
    # explicit prototype evidence instead of making weather look absent.
    claim_weather_snapshot = weather_result
    if simulated_weather:
        if weather_result and weather_result["is_disruptive"]:
            claim_weather_snapshot = {**weather_result, "demo_fixture": simulated_weather}
        else:
            claim_weather_snapshot = simulated_weather

    if verification_source is None:
        return {
            "status": "manual_review",
            "event_id": event.event_id if event else None,
            "approved_amount": None,
            "payout_note": None,
            "verification_source": None,
            "weather_snapshot": claim_weather_snapshot,
        }

    payout_rate = get_company_payout_rate(db, ride.company_id)
    if payout_rate is None:
        # Verified, but the rider's company has no active coverage plan —
        # can't compute a payout amount, so this also goes to manual review.
        return {
            "status": "manual_review",
            "event_id": event.event_id if event else None,
            "approved_amount": None,
            "payout_note": None,
            "verification_source": verification_source,
            "weather_snapshot": claim_weather_snapshot,
        }

    cap_result = compute_capped_payout(db, ride.rider_id, ride.company_id, payout_rate, claimed_amount)

    return {
        "status": "approved",
        "event_id": event.event_id if event else None,
        "approved_amount": cap_result["approved_amount"],
        "payout_note": cap_result["payout_note"],
        "verification_source": verification_source,
        "weather_snapshot": claim_weather_snapshot,
    }
