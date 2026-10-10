from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import gen_uuid


class ClaimReviewJob(Base):
    __tablename__ = "claim_review_job"

    job_id = Column(String(36), primary_key=True, default=gen_uuid)
    token_id = Column(String(36), ForeignKey("claim_token.token_id"), nullable=False, unique=True)
    result = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ClaimReviewCheckpoint(Base):
    __tablename__ = "claim_review_checkpoint"

    checkpoint_id = Column(String(36), primary_key=True, default=gen_uuid)
    token_id = Column(String(36), ForeignKey("claim_token.token_id"), nullable=False, index=True)
    step_order = Column(Integer, nullable=False)
    label = Column(String(120), nullable=False)
    detail = Column(String(300), nullable=False)
    status = Column(String(20), nullable=False, default="waiting")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
