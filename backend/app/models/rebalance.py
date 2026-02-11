from sqlalchemy import Column, BigInteger, Numeric, ForeignKey, UniqueConstraint, CheckConstraint, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
class RebalanceSetting(Base):
    __tablename__ = "rebalance_settings"

    rebalance_id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id"), nullable=False)
    asset_id = Column(BigInteger, ForeignKey("assets.asset_id"), nullable=False)
    target_percentage = Column(Numeric(5, 2), default=0.00)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    asset = relationship("Asset")
    user = relationship("User")

    __table_args__ = (
        UniqueConstraint('user_id', 'asset_id', name='uq_user_rebalance_asset'),
        CheckConstraint('target_percentage >= 0', name='chk_positive_percentage'),
    )