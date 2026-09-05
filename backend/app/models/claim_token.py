from sqlalchemy import Column, String, Text, Numeric, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import gen_uuid


class ClaimToken(Base):
    __tablename__ = "claim_token"

    token_id = Column(String(36), primary_key=True, default=gen_uuid)
    rider_id = Column(String(36), ForeignKey("rider.rider_id"), nullable=False)
    ride_id = Column(String(36), ForeignKey("ride.ride_id"), nullable=False)
    event_id = Column(String(36), ForeignKey("disruption_event.event_id"), nullable=True)
    disruption_type = Column(String(30), nullable=False)  # environmental | social — what the rider selected
    description = Column(Text, nullable=False)  # rider's own account of what happened
    claimed_amount = Column(Numeric(10, 2), nullable=False)
    approved_amount = Column(Numeric(10, 2), nullable=True)
    status = Column(String(20), nullable=False, default="pending")
    # pending | approved | rejected | manual_review
    fraud_flag = Column(Boolean, nullable=False, default=False)
    raised_at = Column(DateTime(timezone=True), server_default=func.now())
    decided_at = Column(DateTime(timezone=True), nullable=True)

    rider = relationship("Rider", back_populates="claim_tokens")
    ride = relationship("Ride", back_populates="claim_tokens")
    disruption_event = relationship("DisruptionEvent", back_populates="claim_tokens")
    payout = relationship("Payout", back_populates="claim_token", uselist=False)
