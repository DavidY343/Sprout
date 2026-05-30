from sqlalchemy import Column, BigInteger, String, Text, Boolean, DateTime
from sqlalchemy.sql import func
from app.core.database import Base
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"
    
    user_id = Column(BigInteger, primary_key=True, autoincrement=True)
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(Text, nullable=True)  # Nullable for Google-only users
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)
    google_id = Column(String(255), nullable=True, unique=True)
    auth_provider = Column(String(20), default='email')  # 'email', 'google', 'both'
    
    # Relationships
    accounts = relationship("Account", back_populates="user", cascade="all, delete-orphan")