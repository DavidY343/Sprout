from pydantic import BaseModel
from datetime import date
from typing import List

class PortfolioPoint(BaseModel):
    date: date
    capital_invertido: float
    total_value: float

class PortfolioGrowthResponse(BaseModel):
    history: List[PortfolioPoint]