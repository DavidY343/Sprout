from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import List

class RebalanceSettingRead(BaseModel):
    rebalance_id: int
    asset_id: int
    asset_name: str | None = None
    ticker: str | None = None
    target_percentage: float

    class Config:
        from_attributes = True

class RebalanceUpdate(BaseModel):
    asset_id: int
    target_percentage: float = Field(..., ge=0, le=100)

class RebalanceBulkUpdate(BaseModel):
    settings: List[RebalanceUpdate]

    @field_validator('settings')
    @classmethod
    def validate_total_percentage(cls, v):
        total = sum(item.target_percentage for item in v)
        # Pequeña tolerancia para evitar problemas de redondeo
        if not (99.99 <= total <= 100.01):
            raise ValueError('La suma de los porcentajes debe ser exactamente 100%')
        return v