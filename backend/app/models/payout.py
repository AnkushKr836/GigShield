from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import gen_uuid


class Payout(Base):
    __tablename__ = "payout"

    payout_id = Column(String(36), primary_key=True, default=gen_uuid)
    token_id = Column(String(36), ForeignKey("claim_token.token_id"), nullable=False, unique=True)
    amount = Column(Numeric(10, 2), nullable=False)
    channel = Column(String(30), nullable=False, default="razorpay_test")
    gateway_ref = Column(String(100), nullable=True)
    status = Column(String(20), nullable=False, default="processing")  # processing | completed | failed
    processed_at = Column(DateTime(timezone=True), server_default=func.now())

    claim_token = relationship("ClaimToken", back_populates="payout")
