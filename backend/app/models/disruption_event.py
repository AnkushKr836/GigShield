from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import gen_uuid


class DisruptionEvent(Base):
    __tablename__ = "disruption_event"

    event_id = Column(String(36), primary_key=True, default=gen_uuid)
    zone_id = Column(String(36), ForeignKey("zone.zone_id"), nullable=False)
    disruption_type = Column(String(30), nullable=False)  # environmental | social
    subtype = Column(String(50), nullable=True)  # e.g. heavy_rain, curfew, flood
    severity = Column(String(20), nullable=False, default="moderate")
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)
    source = Column(String(50), nullable=False)  # openweathermap | mock_traffic | admin_seed
    raw_payload = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    zone = relationship("Zone", back_populates="disruption_events")
    claim_tokens = relationship("ClaimToken", back_populates="disruption_event")
