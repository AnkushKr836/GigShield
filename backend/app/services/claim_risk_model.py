from math import asin, cos, radians, sin, sqrt

import numpy as np
from sklearn.ensemble import IsolationForest
from sqlalchemy.orm import Session

from app.models.ride import Ride


def _features(ride):
    duration = max(1.0, (ride.end_time - ride.start_time).total_seconds() / 60)
    distance = 0.0
    if None not in (ride.pickup_lat, ride.pickup_lng, ride.drop_lat, ride.drop_lng):
        lat1, lat2 = radians(float(ride.pickup_lat)), radians(float(ride.drop_lat))
        dlat = lat2 - lat1
        dlng = radians(float(ride.drop_lng) - float(ride.pickup_lng))
        a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlng / 2) ** 2
        distance = 6371 * 2 * asin(sqrt(max(0, min(1, a))))
    return [duration, float(ride.fare_amount or 0), distance]


def analyze_claim_risk(db: Session, ride: Ride) -> dict:
    """Unsupervised ride-pattern signal. It never asserts fraud or guilt."""
    rides = db.query(Ride).filter(Ride.rider_id == ride.rider_id).all()
    if len(rides) < 8:
        return {"method": "isolation_forest", "available": False, "reason": "cold_start", "history_count": len(rides), "risk": "unavailable", "note": "At least 8 rides are needed for a useful within-account baseline. This signal did not affect the claim decision."}
    matrix = np.asarray([_features(item) for item in rides], dtype=float)
    model = IsolationForest(n_estimators=100, contamination=0.15, random_state=42)
    model.fit(matrix)
    scores = model.decision_function(matrix)
    index = next((i for i, item in enumerate(rides) if item.ride_id == ride.ride_id), len(rides) - 1)
    score = float(scores[index])
    cutoff = float(np.quantile(scores, 0.15))
    anomalous = score <= cutoff
    return {
        "method": "isolation_forest",
        "available": True,
        "history_count": len(rides),
        "score": round(score, 4),
        "risk": "elevated" if anomalous else "ordinary",
        "features": {"ride_minutes": round(matrix[index][0], 1), "fare_amount": round(matrix[index][1], 2), "straight_line_km": round(matrix[index][2], 2)},
        "note": "An outlier is a prompt for human review, not evidence of fraud. The model uses only the account's ride duration, fare and endpoint distance history.",
    }
