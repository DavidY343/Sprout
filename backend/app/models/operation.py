from sqlalchemy import Column, BigInteger, String, DateTime, ForeignKey, Numeric, CheckConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class Operation(Base):
    __tablename__ = "operations"
    
    operation_id = Column(BigInteger, primary_key=True, autoincrement=True)
    asset_id = Column(BigInteger, ForeignKey("assets.asset_id"), nullable=False)
    account_id = Column(BigInteger, ForeignKey("accounts.account_id"), nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)
    quantity = Column(Numeric(15, 6), nullable=False)
    price = Column(Numeric(15, 6), nullable=False)
    fees = Column(Numeric(15, 6), default=0)
    operation_type = Column(String(10), nullable=False)
    
    # Relationships
    asset = relationship("Asset", back_populates="operations")
    account = relationship("Account", back_populates="operations")
    
    __table_args__ = (
        CheckConstraint("operation_type IN ('buy', 'sell')", name="chk_operation_type"),
    )