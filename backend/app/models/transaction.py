from sqlalchemy import Column, BigInteger, String, Text, Boolean, DateTime, ForeignKey, Numeric, CheckConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Transaction(Base):
    __tablename__ = "transactions"
    
    transaction_id = Column(BigInteger, primary_key=True, autoincrement=True)
    account_id = Column(BigInteger, ForeignKey("accounts.account_id"), nullable=False)
    operation_id = Column(BigInteger, ForeignKey("operations.operation_id", ondelete="SET NULL"), nullable=True)
    category = Column(String(100))
    date = Column(DateTime(timezone=True), nullable=False)
    amount = Column(Numeric(15, 6), nullable=False)
    type = Column(String(10), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    
    # Relationships
    account = relationship("Account", back_populates="transactions")

    @property
    def account_name(self):
        return self.account.name if self.account else ""
    
    __table_args__ = (
        CheckConstraint("type IN ('income', 'expense')", name="chk_transaction_type"),
    )