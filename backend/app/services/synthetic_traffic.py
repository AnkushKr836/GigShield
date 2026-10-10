"""Reproducible, explicitly synthetic traffic observations for prototype workflows."""
import random
from datetime import datetime, timedelta, timezone

from app.models.traffic_analysis import TrafficSnapshot, RideTrafficAssessment
from app.models.ride import Ride
from app.services.chennai_locations import nearby_location_pairs, display_location, distance_km


def _features(rng, zone, pickup, drop, timestamp):
    hour = timestamp.hour
    weekday = timestamp.weekday()
    weekday_peak = hour in range(8, 11) or hour in range(17, 21)
    lunch_peak = hour in range(12, 15)
    weekend = weekday >= 5
    peak = 0.28 if weekday_peak and not weekend else 0.12 if lunch_peak else -0.1 if hour < 7 or hour >= 22 else 0.0
    tier = {"low": 0.08, "medium": 0.16, "high": 0.25}.get((zone.risk_tier or "medium").casefold(), 0.16)
    distance = distance_km(pickup, drop)
    score = max(0.02, min(0.96, tier + peak + min(distance / 50, 0.12) + rng.uniform(-0.16, 0.16)))
    free_flow = round(rng.uniform(32, 42), 1)
    average = round(max(5, free_flow * (1 - score)), 1)
    trip_count = max(5, round(rng.gauss(90 + score * 230 + (35 if weekday_peak else 0), 24)))
    label = "high" if score >= 0.55 else "moderate" if score >= 0.30 else "low"
    features = {
        "dataset_version": "gigshield-traffic-v1",
        "synthetic": True,
        "seed": None,
        "hour": hour,
        "day_of_week": weekday,
        "is_weekend": weekend,
        "is_commute_peak": weekday_peak,
        "zone_risk_tier": (zone.risk_tier or "medium").casefold(),
        "route_distance_km": round(distance, 3),
        "traffic_volume": trip_count,
        "congestion_score": round(score, 4),
        "average_speed_kmh": average,
        "free_flow_speed_kmh": free_flow,
        "traffic_label": label,
        "label_source": "synthetic_rule_with_noise",
    }
    return features, trip_count, average, free_flow, score


def make_snapshot(zone, pickup, drop, start, end, rng, seed, index, generated_for=None, record_type="training_sample"):
    features, trips, avg_speed, free_speed, score = _features(rng, zone, pickup, drop, start)
    features["seed"] = seed
    features["record_type"] = record_type
    if generated_for:
        features["generated_for_rider_id"] = generated_for
    analysis_id = (f"SYN-V1-{seed}-{index:05d}" if record_type == "training_sample"
                   else f"SYN-V1-{seed}-R-{index}")
    return TrafficSnapshot(
        zone_id=zone.zone_id,
        analysis_id=analysis_id,
        origin_region=display_location(pickup),
        destination_region=display_location(drop),
        period_start=start,
        period_end=end,
        trip_count=trips,
        average_speed_kmh=avg_speed,
        free_flow_speed_kmh=free_speed,
        congestion_score=score,
        source="synthetic_dataset",
        raw_payload=features,
    )


def generate_dataset(db, rider, zone, sample_count: int, seed: int) -> int:
    rng = random.Random(seed)
    pairs = nearby_location_pairs()
    # Fixed anchor ensures rerunning the same seed reproduces the same dates,
    # feature values and labels instead of shifting the training distribution.
    anchor = datetime(2026, 1, 1, tzinfo=timezone.utc)
    created = []
    for index in range(sample_count):
        pickup, drop = pairs[index % len(pairs)]
        day_offset = rng.randint(0, 59)
        slot_hour = rng.randint(6, 22)
        slot_minute = rng.choice((0, 30))
        start = (anchor - timedelta(days=day_offset)).replace(hour=slot_hour, minute=slot_minute, second=0, microsecond=0)
        end = start + timedelta(minutes=30)
        created.append(make_snapshot(zone, pickup, drop, start, end, rng, seed, index, rider.rider_id))

    # Keep one stable aligned record for every actual ride in this zone,
    # including older seeded history that predates the synthetic time window.
    rides = (db.query(Ride).filter(Ride.zone_id == zone.zone_id)
             .order_by(Ride.start_time.asc(), Ride.ride_id.asc()).all())
    reverse_pairs = {(display_location(p), display_location(d)): (p, d) for p, d in pairs}
    for ride in rides:
        pair = reverse_pairs.get((ride.pickup_location, ride.drop_location))
        if not pair:
            continue
        created.append(make_snapshot(zone, pair[0], pair[1], ride.start_time, ride.end_time, rng, seed, ride.ride_id, ride.rider_id, "ride_aligned"))

    # Stable analysis IDs make regeneration a replace/upsert. Repeated clicks
    # refresh the same dataset rather than accumulating duplicate samples.
    existing = (db.query(TrafficSnapshot)
                .filter(TrafficSnapshot.zone_id == zone.zone_id,
                        TrafficSnapshot.source == "synthetic_dataset").all())
    desired_ids = {row.analysis_id for row in created}
    by_analysis_id = {}
    for old in existing:
        if old.analysis_id not in desired_ids or old.analysis_id in by_analysis_id:
            keep = by_analysis_id.get(old.analysis_id)
            query = db.query(RideTrafficAssessment).filter(RideTrafficAssessment.snapshot_id == old.snapshot_id)
            if keep:
                query.update({RideTrafficAssessment.snapshot_id: keep.snapshot_id}, synchronize_session=False)
            else:
                query.update({RideTrafficAssessment.snapshot_id: None}, synchronize_session=False)
            db.delete(old)
        else:
            by_analysis_id[old.analysis_id] = old

    for row in created:
        stored = by_analysis_id.get(row.analysis_id)
        if stored is None:
            db.add(row)
            continue
        for field in ("origin_region", "destination_region", "period_start", "period_end", "trip_count", "average_speed_kmh", "free_flow_speed_kmh", "congestion_score", "raw_payload"):
            setattr(stored, field, getattr(row, field))
    db.commit()
    return len(created)
