from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TradeHistoryResponse(BaseModel):
    operation_id: int
    ticker: Optional[str] = None
    isin: Optional[str] = None
    asset_name: str
    currency: str
    date: datetime
    quantity: float
    price: float
    operation_type: str
    fees: float = 0
    account_name: str
    
    class Config:
        from_attributes = True