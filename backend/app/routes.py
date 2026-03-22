import re

from fastapi import APIRouter

from app.schemas import MetricsRequest, MetricsResponse, ModelInfo
from app.services.metrics import get_metrics_from_db, list_models_from_db

router = APIRouter(prefix="/api")


def model_short_name(model_id: str) -> str:
    """Derive a human-readable short name from a model ID.

    e.g. claude-opus-4-6 -> Opus 4.6
         claude-sonnet-4-5-20241022 -> Sonnet 4.5 (Oct 2024)
    """
    m = re.match(
        r"claude-(\w+)-(\d+)-(\d+)(?:-(\d{4})(\d{2})(\d{2}))?",
        model_id,
    )
    if not m:
        return model_id
    family = m.group(1).capitalize()
    major, minor = m.group(2), m.group(3)
    version = f"{major}.{minor}"
    if m.group(4):
        months = [
            "",
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ]
        month = months[int(m.group(5))]
        year = m.group(4)
        return f"{family} {version} ({month} {year})"
    return f"{family} {version}"


@router.get("/models", response_model=list[ModelInfo])
async def list_models():
    results = await list_models_from_db()
    return [
        ModelInfo(
            model=r["model"],
            short_name=model_short_name(r["model"]),
            measurement_count=r["count"],
        )
        for r in results
    ]


@router.post("/metrics", response_model=MetricsResponse)
async def get_metrics(req: MetricsRequest):
    start_iso = req.start.isoformat()
    end_iso = req.end.isoformat()
    metrics = await get_metrics_from_db(req.model_ids, start_iso, end_iso)
    return MetricsResponse(metrics=metrics, count=len(metrics))
