"""Prototype-only disruption fixtures attached to generated rides.

These events are deliberately labelled as demo data. They make traffic and
curfew flows demonstrable without presenting fabricated values as live feeds.
"""

from datetime import timedelta

from sqlalchemy.orm import Session

from app.models.disruption_event import DisruptionEvent

DEMO_CASES = (
    {
        "disruption_type": "environmental",
        "subtype": "heavy_rain",
        "severity": "high",
        "source": "demo_weather",
        "label": "Heavy rain",
        "note": "Prototype weather disruption fixture; this is not a live weather observation.",
        "details": {"rainfall_mm_per_hour": 18.6, "wind_gust_kmh": 38},
    },
    {
        "disruption_type": "social",
        "subtype": "traffic_gridlock",
        "severity": "high",
        "source": "demo_traffic",
        "label": "Traffic gridlock",
        "note": "Prototype traffic fixture; congestion values are simulated for the demo.",
        "details": {"congestion": "Severe", "estimated_delay_minutes": 38, "average_speed_kmh": 8},
    },
    {
        "disruption_type": "social",
        "subtype": "curfew",
        "severity": "high",
        "source": "demo_curfew",
        "label": "Local curfew",
        "note": "Prototype curfew fixture; this is not a live government or emergency alert.",
        "details": {"status": "Active (simulated)", "area": "Rider service zone", "authority_feed": "Demo fixture only"},
    },
)

DEMO_EVENT_BUFFER = timedelta(minutes=5)


def seed_demo_disruptions(db: Session, rides: list) -> list[DisruptionEvent]:
    """Attach a weather and a civic fixture to every generated demo ride."""
    if not rides:
        return []

    ride_ids = {ride.ride_id for ride in rides}
    existing_demo_events = (
        db.query(DisruptionEvent)
        .filter(DisruptionEvent.zone_id == rides[0].zone_id)
        .all()
    )
    existing_by_ride = {}
    for event in existing_demo_events:
        payload = event.raw_payload or {}
        ride_id = payload.get("ride_id")
        if ride_id in ride_ids and payload.get("demo"):
            existing_by_ride.setdefault(ride_id, set()).add(event.source)

    events = []
    weather_case, traffic_case, curfew_case = DEMO_CASES
    for index, ride in enumerate(rides):
        # Each simulated ride gets both claim categories, so the prototype
        # can demonstrate auto-validation regardless of which ride is chosen.
        civic_case = traffic_case if index % 2 == 0 else curfew_case
        for case in (weather_case, civic_case):
            existing_sources = existing_by_ride.get(ride.ride_id, set())
            if case["source"] == "demo_weather" and "demo_weather" in existing_sources:
                continue
            if case["source"] in {"demo_traffic", "demo_curfew"} and existing_sources.intersection({"demo_traffic", "demo_curfew"}):
                continue
            event = DisruptionEvent(
                zone_id=ride.zone_id,
                disruption_type=case["disruption_type"],
                subtype=case["subtype"],
                severity=case["severity"],
                start_time=ride.start_time - DEMO_EVENT_BUFFER,
                end_time=ride.end_time + DEMO_EVENT_BUFFER,
                source=case["source"],
                raw_payload={
                    "demo": True,
                    "label": case["label"],
                    "note": case["note"],
                    "details": case["details"],
                    "ride_id": ride.ride_id,
                },
            )
            db.add(event)
            events.append(event)
            existing_by_ride.setdefault(ride.ride_id, set()).add(case["source"])

    db.flush()
    return events


def seed_claim_scenario_disruptions(db: Session, rides: list) -> list[DisruptionEvent]:
    """Create evidence-supported and evidence-absent rides for claim walkthroughs.

    The first half of a generated batch receives ride-scoped weather/civic
    evidence. The remaining rides receive no disruption event. No claim or
    approval/rejection outcome is created here; the normal claim engine
    derives the outcome when the rider submits a claim.
    """
    if not rides:
        return []

    evidence_cases = (DEMO_CASES[0], DEMO_CASES[1], DEMO_CASES[2])
    supported_count = max(1, len(rides) // 2)
    events = []
    for index, ride in enumerate(rides[:supported_count]):
        case = evidence_cases[index % len(evidence_cases)]
        events.append(DisruptionEvent(
            zone_id=ride.zone_id,
            disruption_type=case["disruption_type"],
            subtype=case["subtype"],
            severity=case["severity"],
            start_time=ride.start_time - DEMO_EVENT_BUFFER,
            end_time=ride.end_time + DEMO_EVENT_BUFFER,
            source=case["source"],
            raw_payload={
                "demo": True,
                "label": case["label"],
                "note": case["note"],
                "details": case["details"],
                "ride_id": ride.ride_id,
            },
        ))

    db.add_all(events)
    db.flush()
    return events


def list_disruptions_for_ride(db: Session, ride) -> list[DisruptionEvent]:
    """Return ride-specific demo evidence and genuine overlapping zone events."""
    candidates = (
        db.query(DisruptionEvent)
        .filter(
            DisruptionEvent.zone_id == ride.zone_id,
            DisruptionEvent.start_time <= ride.end_time,
            (DisruptionEvent.end_time.is_(None)) | (DisruptionEvent.end_time >= ride.start_time),
        )
        .order_by(DisruptionEvent.start_time.asc())
        .all()
    )
    return [
        event for event in candidates
        if not (event.raw_payload or {}).get("demo")
        or (event.raw_payload or {}).get("ride_id") == ride.ride_id
    ]
