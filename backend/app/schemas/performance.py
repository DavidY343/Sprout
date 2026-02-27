from pydantic import BaseModel
from typing import Dict

class PerformanceMetric(BaseModel):
    pct: float
    abs: float

class PerformanceResponse(BaseModel):
    month: PerformanceMetric
    three_months: PerformanceMetric
    ytd: PerformanceMetric
    total: PerformanceMetric