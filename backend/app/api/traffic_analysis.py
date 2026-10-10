from datetime import datetime, timezone
import re
import csv
import io
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.rider import Rider
from app.models.ride import Ride
from app.models.zone import Zone
from app.models.traffic_analysis import TrafficSnapshot, RideTrafficAssessment
from app.schemas.traffic_analysis import (
    TrafficSnapshotOut,
    TrafficAnalysisRunOut,
    RideTrafficAssessmentOut,
    SyntheticDatasetCreate,
)
from app.services.tomtom_routing import get_historical_route
from app.services.synthetic_traffic import generate_dataset
from app.services.traffic_model import model_status, train_model, predict_snapshot
from app.services.employee_seeder import ensure_minimum_demo_rides

router = APIRouter(prefix="/admin/traffic-analysis", tags=["admin traffic analysis"])


@router.get("/model/status")
def get_traffic_model_status(zone_id: str | None = None, _admin: str = Depends(get_current_admin)):
    return model_status(zone_id)


@router.post("/model/train")
def train_traffic_model(
    zone_id: str | None = None,
    db: Session = Depends(get_db),
    _admin: str = Depends(get_current_admin),
):
    try:
        return train_model(db, zone_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/rides/{ride_id}/route")
def get_admin_ride_route(
    ride_id: str,
    db: Session = Depends(get_db),
    _admin: str = Depends(get_current_admin),
):
    ride = db.query(Ride).filter(Ride.ride_id == ride_id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found.")
    return get_historical_route(ride)


@router.get("/snapshots", response_model=list[TrafficSnapshotOut])
def list_snapshots(db: Session = Depends(get_db), _admin: str = Depends(get_current_admin)):
    return (db.query(TrafficSnapshot)
            .filter(TrafficSnapshot.source == "synthetic_dataset")
            .order_by(TrafficSnapshot.imported_at.desc()).all())


@router.post("/employees/{rider_id}/generate-dataset")
def generate_employee_traffic_dataset(
    rider_id: str,
    payload: SyntheticDatasetCreate,
    db: Session = Depends(get_db),
    _admin: str = Depends(get_current_admin),
):
    rider = db.query(Rider).filter(Rider.rider_id == rider_id).first()
    if not rider:
        raise HTTPException(status_code=404, detail="Employee not found.")
    zone = db.query(Zone).filter(Zone.zone_id == rider.zone_id, Zone.active.is_(True)).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Active delivery zone not found.")
    total = generate_dataset(db, rider, zone, payload.sample_count, payload.seed)
    return {
        "rider_id": rider.rider_id,
        "rider_name": rider.name,
        "zone_id": zone.zone_id,
        "zone_name": zone.name,
        "seed": payload.seed,
        "records_upserted": total,
        "training_records": payload.sample_count,
        "ride_aligned_records": total - payload.sample_count,
        "dataset_version": "gigshield-traffic-v1",
        "label": "traffic_label (low/moderate/high)",
        "note": "All records are synthetic prototype data; train the traffic classifier separately from the admin page.",
    }


@router.get("/dataset/export.csv")
def export_synthetic_dataset(
    zone_id: str | None = None,
    db: Session = Depends(get_db),
    _admin: str = Depends(get_current_admin),
):
    query = db.query(TrafficSnapshot).filter(TrafficSnapshot.source == "synthetic_dataset")
    if zone_id:
        query = query.filter(TrafficSnapshot.zone_id == zone_id)
    records = query.order_by(TrafficSnapshot.period_start.asc()).all()
    output = io.StringIO()
    fields = ["snapshot_id", "dataset_version", "zone_id", "origin_region", "destination_region", "period_start", "period_end", "hour", "day_of_week", "is_weekend", "is_commute_peak", "zone_risk_tier", "route_distance_km", "traffic_volume", "average_speed_kmh", "free_flow_speed_kmh", "congestion_score", "traffic_label", "label_source", "seed"]
    writer = csv.DictWriter(output, fieldnames=fields)
    writer.writeheader()
    for item in records:
        features = item.raw_payload or {}
        writer.writerow({
            "snapshot_id": item.snapshot_id,
            "dataset_version": features.get("dataset_version"),
            "zone_id": item.zone_id,
            "origin_region": item.origin_region,
            "destination_region": item.destination_region,
            "period_start": item.period_start.isoformat(),
            "period_end": item.period_end.isoformat(),
            **{key: features.get(key, "") for key in fields[7:]},
        })
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=gigshield-synthetic-traffic-v1.csv"})


@router.get("/employees/{rider_id}/rides")
def list_employee_rides(
    rider_id: str,
    db: Session = Depends(get_db),
    _admin: str = Depends(get_current_admin),
):
    rider = db.query(Rider).filter(Rider.rider_id == rider_id).first()
    if not rider:
        raise HTTPException(status_code=404, detail="Employee not found.")
    if rider.email.casefold().endswith("@example.com"):
        ensure_minimum_demo_rides(db, rider, minimum=6)
    rides = (
        db.query(Ride)
        .filter(Ride.rider_id == rider_id)
        .order_by(Ride.start_time.desc())
        .all()
    )
    return {
        "rider_id": rider.rider_id,
        "rider_name": rider.name,
        "rides": [
            {
                "ride_id": ride.ride_id,
                "pickup_location": ride.pickup_location,
                "drop_location": ride.drop_location,
                "start_time": ride.start_time,
                "end_time": ride.end_time,
                "duration_minutes": max(
                    1, int((ride.end_time - ride.start_time).total_seconds() // 60)
                ),
                "status": ride.status,
            }
            for ride in rides
        ],
    }


def _matches_region(region: str, location: str) -> bool:
    normalized_region = " ".join(re.sub(r"[^a-z0-9]+", " ", region.casefold()).split())
    normalized_location = " ".join(re.sub(r"[^a-z0-9]+", " ", location.casefold()).split())
    return normalized_region in normalized_location


def _traffic_level(snapshot: TrafficSnapshot) -> str | None:
    score = snapshot.congestion_score
    if score is None and snapshot.average_speed_kmh is not None and snapshot.free_flow_speed_kmh:
        score = max(0.0, min(1.0, 1 - snapshot.average_speed_kmh / snapshot.free_flow_speed_kmh))
    if score is None:
        return None
    if score >= 0.55:
        return "high"
    if score >= 0.30:
        return "moderate"
    return "low"


@router.post("/employees/{rider_id}/run", response_model=TrafficAnalysisRunOut)
def analyze_employee_rides(
    rider_id: str,
    db: Session = Depends(get_db),
    _admin: str = Depends(get_current_admin),
):
    """Match saved synthetic traffic observations to this employee's rides.

    Fabricated traffic observations are demonstration context, not individual
    rider GPS evidence. This operation never changes a claim decision.
    """
    rider = db.query(Rider).filter(Rider.rider_id == rider_id).first()
    if not rider:
        raise HTTPException(status_code=404, detail="Employee not found.")

    rides = (
        db.query(Ride)
        .filter(Ride.rider_id == rider_id)
        .order_by(Ride.start_time.desc())
        .all()
    )
    snapshots = (db.query(TrafficSnapshot)
                 .filter(TrafficSnapshot.zone_id == rider.zone_id, TrafficSnapshot.source == "synthetic_dataset")
                 .all())
    run_id = str(uuid4())
    now = datetime.now(timezone.utc)
    assessments = []

    for ride in rides:
        candidates = [
            snapshot
            for snapshot in snapshots
            if snapshot.period_start <= ride.end_time
            and snapshot.period_end >= ride.start_time
            and _matches_region(snapshot.origin_region, ride.pickup_location)
            and _matches_region(snapshot.destination_region, ride.drop_location)
        ]
        snapshot = max(
            candidates,
            key=lambda item: min(item.period_end, ride.end_time).timestamp()
            - max(item.period_start, ride.start_time).timestamp(),
            default=None,
        )
        prediction = predict_snapshot(snapshot, rider.zone_id) if snapshot else None
        assessment = RideTrafficAssessment(
            run_id=run_id,
            ride_id=ride.ride_id,
            snapshot_id=snapshot.snapshot_id if snapshot else None,
            status="matched" if snapshot else "no_matching_data",
            traffic_level=prediction.get("label") if prediction else (_traffic_level(snapshot) if snapshot else None),
            confidence="synthetic_model_prediction" if prediction else "synthetic_rule_label",
            summary=(
                {
                    "analysis_id": snapshot.analysis_id,
                    "origin_region": snapshot.origin_region,
                    "destination_region": snapshot.destination_region,
                    "period_start": snapshot.period_start.isoformat(),
                    "period_end": snapshot.period_end.isoformat(),
                    "trip_count": snapshot.trip_count,
                    "average_speed_kmh": snapshot.average_speed_kmh,
                    "free_flow_speed_kmh": snapshot.free_flow_speed_kmh,
                    "congestion_score": snapshot.congestion_score,
                    "features": snapshot.raw_payload or {},
                    "model_prediction": prediction,
                    "note": "Synthetic zone/route traffic context; not observed traffic or an individual ride trace.",
                }
                if snapshot
                else {"note": "No saved synthetic traffic record matched this ride's region and time. Generate a dataset for this employee first."}
            ),
            analyzed_at=now,
        )
        db.add(assessment)
        assessments.append((assessment, ride))

    db.commit()
    for assessment, _ride in assessments:
        db.refresh(assessment)

    return TrafficAnalysisRunOut(
        run_id=run_id,
        rider_id=rider.rider_id,
        rider_name=rider.name,
        rides_analyzed=len(assessments),
        rides_matched=sum(1 for assessment, _ride in assessments if assessment.status == "matched"),
        assessments=[
            RideTrafficAssessmentOut(
                assessment_id=assessment.assessment_id,
                run_id=assessment.run_id,
                ride_id=assessment.ride_id,
                status=assessment.status,
                traffic_level=assessment.traffic_level,
                confidence=assessment.confidence,
                summary=assessment.summary,
                analyzed_at=assessment.analyzed_at,
                pickup_location=ride.pickup_location,
                drop_location=ride.drop_location,
                start_time=ride.start_time,
                end_time=ride.end_time,
            )
            for assessment, ride in assessments
        ],
    )


@router.get("/runs/{run_id}", response_model=TrafficAnalysisRunOut)
def get_analysis_run(
    run_id: str,
    db: Session = Depends(get_db),
    _admin: str = Depends(get_current_admin),
):
    assessments = (
        db.query(RideTrafficAssessment)
        .filter(RideTrafficAssessment.run_id == run_id)
        .order_by(RideTrafficAssessment.analyzed_at.asc())
        .all()
    )
    if not assessments:
        raise HTTPException(status_code=404, detail="Traffic analysis run not found.")
    rider = assessments[0].ride.rider
    return TrafficAnalysisRunOut(
        run_id=run_id,
        rider_id=rider.rider_id,
        rider_name=rider.name,
        rides_analyzed=len(assessments),
        rides_matched=sum(1 for item in assessments if item.status == "matched"),
        assessments=[
            RideTrafficAssessmentOut(
                assessment_id=item.assessment_id,
                run_id=item.run_id,
                ride_id=item.ride_id,
                status=item.status,
                traffic_level=item.traffic_level,
                confidence=item.confidence,
                summary=item.summary,
                analyzed_at=item.analyzed_at,
                pickup_location=item.ride.pickup_location,
                drop_location=item.ride.drop_location,
                start_time=item.ride.start_time,
                end_time=item.ride.end_time,
            )
            for item in assessments
        ],
    )
