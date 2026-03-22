"""Database query logic for metrics and model endpoints."""

from typing import TypedDict

from app.db import get_db
from app.schemas import ModelMetric


class ModelCount(TypedDict):
    model: str
    count: int


async def list_models_from_db() -> list[ModelCount]:
    """Return distinct models with measurement counts."""
    db = get_db()
    pipeline = [
        {"$group": {"_id": "$model", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    results: list[ModelCount] = []
    async for doc in db.model_latency.aggregate(pipeline):
        results.append(ModelCount(model=doc["_id"], count=doc["count"]))
    return results


async def get_metrics_from_db(
    model_ids: list[str],
    start_iso: str,
    end_iso: str,
) -> list[ModelMetric]:
    """Fetch metrics by joining cycles and model_latency collections."""
    db = get_db()

    cycles_cursor = db.cycles.find(
        {
            "timestamp": {"$gte": start_iso, "$lte": end_iso},
        }
    )

    cycle_map = {}
    async for cycle in cycles_cursor:
        cycle_map[cycle["_id"]] = cycle

    if not cycle_map:
        return []

    latency_cursor = db.model_latency.find(
        {
            "cycle_id": {"$in": list(cycle_map.keys())},
            "model": {"$in": model_ids},
        }
    )

    metrics = []
    async for doc in latency_cursor:
        cycle = cycle_map.get(doc["cycle_id"], {})
        metrics.append(
            ModelMetric(
                timestamp=cycle.get("timestamp", ""),
                model=doc["model"],
                ttft_ms=doc.get("ttft_ms"),
                error=doc.get("error"),
                dns_ms=cycle.get("dns_ms"),
                connect_ms=cycle.get("connect_ms"),
                ttfb_ms=cycle.get("ttfb_ms"),
                api_status=cycle.get("api_status"),
                has_incident=cycle.get("has_incident"),
            )
        )

    metrics.sort(key=lambda m: m.timestamp)
    return metrics
