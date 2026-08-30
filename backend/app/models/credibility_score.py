from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import gen_uuid


class CredibilityScore(Base):
    __tablename__ = "credibility_score"

    score_id = Column(String(36), primary_key=True, default=gen_uuid)
    rider_id = Column(String(36), ForeignKey("rider.rider_id"), nullable=False)
    score_value = Column(Numeric(4, 3), nullable=False)  # 0.000 - 1.000
    computed_at = Column(DateTime(timezone=True), server_default=func.now())
    factors = Column(JSON, nullable=True)  # breakdown, for explainability

    rider = relationship("Rider", back_populates="credibility_scores")
