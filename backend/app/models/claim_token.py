from sqlalchemy import Column, String, Numeric, Boolean, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import gen_uuid


class ClaimToken(Base):
    __tablename__ = "claim_token"
    __table_args__ = (
        UniqueConstraint("rider_id", "event_id", name="uq_claim_rider_event"),
    )

    token_id = Column(String(36), primary_key=True, default=gen_uuid)
    rider_id = Column(String(36), ForeignKey("rider.rider_id"), nullable=False)
    policy_id = Column(String(36), ForeignKey("policy.policy_id"), nullable=False)
    event_id = Column(String(36), ForeignKey("disruption_event.event_id"), nullable=False)
    claimed_amount = Column(Numeric(10, 2), nullable=False)
    approved_amount = Column(Numeric(10, 2), nullable=True)
    status = Column(String(20), nullable=False, default="pending")
    # pending | auto_approved | auto_rejected | manual_review | approved | rejected
    fraud_flag = Column(Boolean, nullable=False, default=False)
    raised_at = Column(DateTime(timezone=True), server_default=func.now())
    decided_at = Column(DateTime(timezone=True), nullable=True)

    rider = relationship("Rider", back_populates="claim_tokens")
    policy = relationship("Policy", back_populates="claim_tokens")
    disruption_event = relationship("DisruptionEvent", back_populates="claim_tokens")
    payout = relationship("Payout", back_populates="claim_token", uselist=False)
