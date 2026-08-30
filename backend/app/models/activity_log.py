from sqlalchemy import Column, String, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import gen_uuid


class ActivityLog(Base):
    __tablename__ = "activity_log"

    log_id = Column(String(36), primary_key=True, default=gen_uuid)
    rider_id = Column(String(36), ForeignKey("rider.rider_id"), nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    gps_lat = Column(Float, nullable=False)
    gps_lng = Column(Float, nullable=False)
    order_status = Column(String(20), nullable=False, default="idle")  # idle | en_route | delivered | cancelled
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    rider = relationship("Rider", back_populates="activity_logs")
