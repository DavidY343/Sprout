from sqlalchemy import Column, BigInteger, String, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class Asset(Base):
    __tablename__ = "assets"
    
    asset_id = Column(BigInteger, primary_key=True, autoincrement=True)
    ticker = Column(String(50))
    isin = Column(String(12))
    name = Column(String(255), nullable=False)
    currency = Column(String(3), nullable=False)
    theme = Column(String(255))
    type = Column(String(30), nullable=False)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    operations = relationship("Operation", back_populates="asset", cascade="all, delete-orphan")
    price_history = relationship("PriceHistory", back_populates="asset", cascade="all, delete-orphan")