from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime

# Schema para crear un asset
class AssetCreate(BaseModel):
    ticker: Optional[str] = None
    isin: Optional[str] = None
    name: str
    currency: str
    theme: Optional[str] = None
    type: str
    
    @field_validator('currency')
    def validate_currency(cls, v):
        if len(v) != 3:
            raise ValueError('Currency must be 3 characters (e.g., EUR, USD)')
        return v.upper()
    
    @field_validator('type')
    @classmethod
    def validate_type(cls, v):
        valid_types = ['stock', 'crypto', 'bond', 'etf', 'fund', 'reit', 'money_market']
        if v.lower() not in valid_types:
            raise ValueError(f'Type must be one of: {", ".join(valid_types)}')
        return v.lower()

# Schema para actualizar un asset (solo type y theme)
class AssetUpdate(BaseModel):
    type: Optional[str] = None
    theme: Optional[str] = None

    @field_validator('type')
    @classmethod
    def validate_type(cls, v):
        if v is None:
            return v
        valid_types = ['stock', 'crypto', 'bond', 'etf', 'fund', 'reit', 'money_market']
        if v.lower() not in valid_types:
            raise ValueError(f'Type must be one of: {", ".join(valid_types)}')
        return v.lower()

# Schema para respuesta de asset
class AssetResponse(BaseModel):
    asset_id: int
    ticker: Optional[str]
    isin: Optional[str]
    name: str
    currency: str
    theme: Optional[str]
    type: str
    is_active: bool
    
    class Config:
        from_attributes = True