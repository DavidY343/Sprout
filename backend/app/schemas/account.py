from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime

class AccountCreate(BaseModel):
    name: str
    type: str
    currency: str
    
    @field_validator('currency')
    def validate_currency(cls, v):
        if len(v) != 3:
            raise ValueError('Currency must be 3 characters')
        return v.upper()
    
    # @field_validator('type') // FUTURA VALIDACION
    # def validate_type(cls, v):
    #     valid_types = ['broker', 'bank', 'crypto_exchange', 'other']
    #     if v.lower() not in valid_types:
    #         raise ValueError(f'Type must be one of: {", ".join(valid_types)}')
    #     return v.lower()

class AccountResponse(BaseModel):
    account_id: int
    user_id: int
    name: str
    type: str
    currency: str
    created_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True