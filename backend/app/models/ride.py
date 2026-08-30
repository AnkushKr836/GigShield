from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import gen_uuid


class Ride(Base):
    __tablename__ = "ride"

    ride_id = Column(String(36), primary_key=True, default=gen_uuid)
    rider_id = Column(String(36), ForeignKey("rider.rider_id"), nullable=False)
    company_id = Column(String(36), ForeignKey("company.company_id"), nullable=False)
    zone_id = Column(String(36), ForeignKey("zone.zone_id"), nullable=False)
    pickup_location = Column(String(150), nullable=False)
    drop_location = Column(String(150), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    fare_amount = Column(Numeric(10, 2), nullable=False)
    status = Column(String(20), nullable=False, default="completed")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    rider = relationship("Rider", back_populates="rides")
    company = relationship("Company")
    zone = relationship("Zone")
    claim_tokens = relationship("ClaimToken", back_populates="ride")
