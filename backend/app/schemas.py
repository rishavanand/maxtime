from datetime import datetime

from pydantic import BaseModel


class ModelInfo(BaseModel):
    model: str
    short_name: str
    measurement_count: int


class MetricsRequest(BaseModel):
    model_ids: list[str]
    start: datetime
    end: datetime


class ModelMetric(BaseModel):
    timestamp: str
    model: str
    ttft_ms: float | None
    error: str | None
    dns_ms: float | None
    connect_ms: float | None
    ttfb_ms: float | None
    api_status: str | None
    has_incident: bool | None


class MetricsResponse(BaseModel):
    metrics: list[ModelMetric]
    count: int
