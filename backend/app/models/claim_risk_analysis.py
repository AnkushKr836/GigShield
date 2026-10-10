from sqlalchemy import Column, String, ForeignKey, JSON, DateTime, func

from app.core.database import Base
from app.models.base import gen_uuid


class ClaimRiskAnalysis(Base):
    __tablename__ = "claim_risk_analysis"

    analysis_id = Column(String(36), primary_key=True, default=gen_uuid)
    token_id = Column(String(36), ForeignKey("claim_token.token_id"), nullable=False, unique=True)
    result = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
