from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
from decimal import Decimal

class OperationCreate(BaseModel):
    asset_id: int
    account_id: int
    date: datetime
    quantity: Decimal
    price: Decimal
    fees: Optional[Decimal] = Decimal('0')
    operation_type: str
    
    @field_validator('operation_type')
    def validate_operation_type(cls, v):
        if v.lower() not in ['buy', 'sell']:
            raise ValueError('Operation type must be "buy" or "sell"')
        return v.lower()
    
    @field_validator('quantity', 'price')
    def validate_positive(cls, v):
        if v <= 0:
            raise ValueError('Must be positive')
        return v
    
    @field_validator('fees')
    def validate_non_negative(cls, v):
        if v < 0:
            raise ValueError('Fees cannot be negative')
        return v

class OperationResponse(BaseModel):
    operation_id: int
    asset_id: int
    account_id: int
    date: datetime
    quantity: Decimal
    price: Decimal
    fees: Decimal
    operation_type: str
    
    class Config:
        from_attributes = True