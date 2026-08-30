from sqlalchemy import Column, String, Boolean, DateTime, func
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import gen_uuid


class Company(Base):
    __tablename__ = "company"

    company_id = Column(String(36), primary_key=True, default=gen_uuid)
    name = Column(String(150), nullable=False, unique=True)  # e.g. "Zomato", "Swiggy", "Zepto"
    active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    riders = relationship("Rider", back_populates="company")
    coverage_plans = relationship("CoveragePlan", back_populates="company")
