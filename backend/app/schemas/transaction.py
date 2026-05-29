from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, Literal

class TransactionBase(BaseModel):
    account_id: int
    category: Optional[str] = "General"
    date: datetime
    amount: float = Field(gt=0, description="El monto debe ser positivo")
    type: Literal["income", "expense"]
    description: Optional[str] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionResponse(TransactionBase):
    transaction_id: int
    created_at: datetime
    account_name: str

    class Config:
        from_attributes = True