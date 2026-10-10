"""Train and persist a prototype classifier over explicitly synthetic traffic rows."""
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, balanced_accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sqlalchemy.orm import Session

from app.models.traffic_analysis import TrafficSnapshot

MODEL_DIR = Path(__file__).resolve().parents[2] / "data"
NUMERIC_FEATURES = [
    "hour", "day_of_week", "is_weekend", "is_commute_peak", "route_distance_km",
    "traffic_volume", "average_speed_kmh", "free_flow_speed_kmh",
]
CATEGORICAL_FEATURES = ["zone_risk_tier"]
TARGET = "traffic_label"


def _model_path(zone_id: str | None = None) -> Path:
    suffix = f"_{zone_id}" if zone_id else ""
    return MODEL_DIR / f"traffic_classifier{suffix}.joblib"


def model_status(zone_id: str | None = None) -> dict:
    model_path = _model_path(zone_id)
    if not model_path.exists():
        return {"trained": False, "model_name": "Random Forest traffic classifier", "zone_id": zone_id, "note": "No saved model yet. Generate synthetic records, then train it from the admin page."}
    try:
        artifact = joblib.load(model_path)
        return {"trained": True, **artifact["metadata"]}
    except Exception as exc:
        return {"trained": False, "model_name": "Random Forest traffic classifier", "error": str(exc), "note": "The saved model could not be loaded. Train it again from the admin page."}


def train_model(db: Session, zone_id: str | None = None) -> dict:
    query = db.query(TrafficSnapshot).filter(TrafficSnapshot.source == "synthetic_dataset")
    if zone_id:
        query = query.filter(TrafficSnapshot.zone_id == zone_id)
    rows = query.all()
    usable = []
    for row in rows:
        payload = row.raw_payload or {}
        if payload.get("synthetic") is not True or payload.get("record_type") != "training_sample" or payload.get(TARGET) not in {"low", "moderate", "high"}:
            continue
        sample = {feature: payload.get(feature) for feature in NUMERIC_FEATURES + CATEGORICAL_FEATURES}
        sample[TARGET] = payload[TARGET]
        if all(value is not None for value in sample.values()):
            usable.append(sample)

    if len(usable) < 30:
        raise ValueError(f"Need at least 30 labeled synthetic rows to train; found {len(usable)}.")
    counts = Counter(item[TARGET] for item in usable)
    if len(counts) < 2 or min(counts.values()) < 2:
        raise ValueError("Need at least two traffic classes with multiple rows each. Generate a larger synthetic dataset.")

    dataset = pd.DataFrame(usable)
    X = dataset[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y = dataset[TARGET]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y,
    )
    prep = ColumnTransformer([
        ("numeric", "passthrough", NUMERIC_FEATURES),
        ("categorical", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
    ])
    pipeline = Pipeline([
        ("features", prep),
        ("classifier", RandomForestClassifier(
            n_estimators=180, min_samples_leaf=2, class_weight="balanced", random_state=42,
        )),
    ])
    pipeline.fit(X_train, y_train)
    predictions = pipeline.predict(X_test)
    labels = ["low", "moderate", "high"]
    metrics = {
        "accuracy": round(float(accuracy_score(y_test, predictions)), 4),
        "balanced_accuracy": round(float(balanced_accuracy_score(y_test, predictions)), 4),
        "classification_report": classification_report(y_test, predictions, labels=labels, output_dict=True, zero_division=0),
        "confusion_matrix": confusion_matrix(y_test, predictions, labels=labels).tolist(),
        "class_order": labels,
    }
    metadata = {
        "model_name": "Random Forest traffic classifier",
        "dataset_version": "gigshield-traffic-v1",
        "training_data": "fabricated synthetic prototype records",
        "zone_id": zone_id,
        "sample_count": len(usable),
        "train_count": len(X_train),
        "test_count": len(X_test),
        "class_counts": dict(counts),
        "metrics": metrics,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "warning": "Holdout metrics measure fit to synthetic labels only; they do not estimate real-world traffic accuracy.",
    }
    model_path = _model_path(zone_id)
    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"pipeline": pipeline, "metadata": metadata}, model_path)
    return {"trained": True, **metadata}


def predict_snapshot(snapshot: TrafficSnapshot, zone_id: str | None = None) -> dict | None:
    model_path = _model_path(zone_id)
    if not model_path.exists():
        model_path = _model_path()
    if not model_path.exists():
        return None
    artifact = joblib.load(model_path)
    metadata = artifact["metadata"]
    if metadata.get("zone_id") and zone_id and metadata["zone_id"] != zone_id:
        return None
    features = snapshot.raw_payload or {}
    values = {key: features.get(key) for key in NUMERIC_FEATURES + CATEGORICAL_FEATURES}
    if any(value is None for value in values.values()):
        return None
    frame = pd.DataFrame([values])
    pipeline = artifact["pipeline"]
    label = str(pipeline.predict(frame)[0])
    probability_values = pipeline.predict_proba(frame)[0]
    classes = pipeline.named_steps["classifier"].classes_
    return {
        "label": label,
        "probabilities": {str(name): round(float(prob), 4) for name, prob in zip(classes, probability_values)},
        "model_name": metadata["model_name"],
        "dataset_version": metadata["dataset_version"],
        "trained_on_synthetic_data": True,
    }
