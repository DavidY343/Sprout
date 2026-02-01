from sqlalchemy import Column, BigInteger, DateTime, ForeignKey, Numeric, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class PriceHistory(Base):
    __tablename__ = "price_history"
    
    price_id = Column(BigInteger, primary_key=True, autoincrement=True)
    asset_id = Column(BigInteger, ForeignKey("assets.asset_id"), nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)
    price = Column(Numeric(15, 6), nullable=False)
    
    # Relationships
    asset = relationship("Asset", back_populates="price_history")
    
    __table_args__ = (
        UniqueConstraint('asset_id', 'date', name='uq_asset_date'),
    )