from sqlalchemy import Column, String, DateTime, Integer, Float, ForeignKey, JSON, func
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import gen_uuid


class TrafficSnapshot(Base):
    """Precomputed zone/route traffic observation; raw_payload stores ML features and label."""

    __tablename__ = "traffic_snapshot"

    snapshot_id = Column(String(36), primary_key=True, default=gen_uuid)
    zone_id = Column(String(36), ForeignKey("zone.zone_id"), nullable=False)
    analysis_id = Column(String(100), nullable=False)
    origin_region = Column(String(120), nullable=False)
    destination_region = Column(String(120), nullable=False)
    period_start = Column(DateTime(timezone=True), nullable=False)
    period_end = Column(DateTime(timezone=True), nullable=False)
    trip_count = Column(Integer, nullable=False, default=0)
    average_speed_kmh = Column(Float, nullable=True)
    free_flow_speed_kmh = Column(Float, nullable=True)
    congestion_score = Column(Float, nullable=True)
    source = Column(String(40), nullable=False, default="synthetic_dataset")
    raw_payload = Column(JSON, nullable=True)
    imported_at = Column(DateTime(timezone=True), server_default=func.now())

    zone = relationship("Zone")
    assessments = relationship("RideTrafficAssessment", back_populates="snapshot")


class RideTrafficAssessment(Base):
    """Saved regional context match for one ride in one admin analysis run."""

    __tablename__ = "ride_traffic_assessment"

    assessment_id = Column(String(36), primary_key=True, default=gen_uuid)
    run_id = Column(String(36), nullable=False, index=True)
    ride_id = Column(String(36), ForeignKey("ride.ride_id"), nullable=False, index=True)
    snapshot_id = Column(String(36), ForeignKey("traffic_snapshot.snapshot_id"), nullable=True)
    status = Column(String(24), nullable=False)  # matched | no_matching_data
    traffic_level = Column(String(20), nullable=True)  # low | moderate | high
    confidence = Column(String(24), nullable=False, default="regional_context")
    summary = Column(JSON, nullable=True)
    analyzed_at = Column(DateTime(timezone=True), server_default=func.now())

    ride = relationship("Ride")
    snapshot = relationship("TrafficSnapshot", back_populates="assessments")
