from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class FriendRequest(BaseModel):
    email: str


class FriendshipOut(BaseModel):
    friendship_id: int
    friend_email: str
    friend_id: int
    status: str
    direction: str  # 'sent' or 'received'
    created_at: datetime

    class Config:
        from_attributes = True
