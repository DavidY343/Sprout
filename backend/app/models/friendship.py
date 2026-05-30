from sqlalchemy import Column, BigInteger, String, DateTime, ForeignKey, func
from app.core.database import Base


class Friendship(Base):
    __tablename__ = "friendships"

    friendship_id = Column(BigInteger, primary_key=True, autoincrement=True)
    requester_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    addressee_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    status = Column(String(10), nullable=False, default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
