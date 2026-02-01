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
    
    # @field_validator('type') // FUTURA VALIDACION
    # def validate_type(cls, v):
    #     valid_types = ['stock', 'crypto', 'bond', 'etf', 'fund', 'commodity', 'other']
    #     if v.lower() not in valid_types:
    #         raise ValueError(f'Type must be one of: {", ".join(valid_types)}')
    #     return v.lower()

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