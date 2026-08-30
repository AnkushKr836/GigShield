from sqlalchemy import Column, String, Numeric, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import gen_uuid


class Policy(Base):
    __tablename__ = "policy"

    policy_id = Column(String(36), primary_key=True, default=gen_uuid)
    rider_id = Column(String(36), ForeignKey("rider.rider_id"), nullable=False)
    weekly_premium = Column(Numeric(10, 2), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String(20), nullable=False, default="active")  # active | expired | cancelled
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    rider = relationship("Rider", back_populates="policies")
    claim_tokens = relationship("ClaimToken", back_populates="policy")
