from sqlalchemy import Column, String, Numeric, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import gen_uuid


class CoveragePlan(Base):
    __tablename__ = "coverage_plan"

    plan_id = Column(String(36), primary_key=True, default=gen_uuid)
    company_id = Column(String(36), ForeignKey("company.company_id"), nullable=False)
    tier_name = Column(String(30), nullable=False)  # Basic | Standard | Premium
    payout_per_day = Column(Numeric(10, 2), nullable=False)  # flat amount paid per disrupted day
    active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    company = relationship("Company", back_populates="coverage_plans")
