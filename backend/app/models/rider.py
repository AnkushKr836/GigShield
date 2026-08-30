from sqlalchemy import Column, String, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import gen_uuid


class Rider(Base):
    __tablename__ = "rider"

    rider_id = Column(String(36), primary_key=True, default=gen_uuid)
    name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    phone = Column(String(20), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    persona_type = Column(String(30), nullable=False)  # food_delivery | ecommerce | grocery_qcommerce
    zone_id = Column(String(36), ForeignKey("zone.zone_id"), nullable=False)
    joined_on = Column(Date, server_default=func.current_date())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    zone = relationship("Zone", back_populates="riders")
    policies = relationship("Policy", back_populates="rider")
    claim_tokens = relationship("ClaimToken", back_populates="rider")
    credibility_scores = relationship("CredibilityScore", back_populates="rider")
    activity_logs = relationship("ActivityLog", back_populates="rider")
