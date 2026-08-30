from sqlalchemy import Column, String, DateTime, func
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import gen_uuid


class Zone(Base):
    __tablename__ = "zone"

    zone_id = Column(String(36), primary_key=True, default=gen_uuid)
    name = Column(String(100), nullable=False)
    risk_tier = Column(String(20), nullable=False, default="medium")  # low | medium | high
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    riders = relationship("Rider", back_populates="zone")
    disruption_events = relationship("DisruptionEvent", back_populates="zone")
