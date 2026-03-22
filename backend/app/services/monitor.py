"""Async measurement cycle — probes network, status page, and TTFT for each model."""

import asyncio
from datetime import datetime, timezone

from app.core.config import ANTHROPIC_API_KEY, MODELS
from app.core.probes import check_status_page, measure_network_latency, measure_ttft
from app.db import get_db


async def run_cycle() -> None:
    now_utc = datetime.now(timezone.utc)
    now_local = datetime.now()
    print(f"\n[{now_utc.strftime('%Y-%m-%d %H:%M:%S')} UTC] Starting measurement cycle")

    print("  Probing network latency + status page...", flush=True)
    net, status = await asyncio.gather(
        asyncio.to_thread(measure_network_latency),
        asyncio.to_thread(check_status_page),
    )
    print(f"  dns={net.dns_ms}ms  connect={net.connect_ms}ms  ttfb={net.ttfb_ms}ms")
    print(f"  status={status.api_status}  incident={status.has_incident}")

    db = get_db()

    cycle_doc = {
        "timestamp": now_utc.isoformat(),
        "hour_local": now_local.hour,
        "dns_ms": net.dns_ms,
        "connect_ms": net.connect_ms,
        "ttfb_ms": net.ttfb_ms,
        "api_status": status.api_status,
        "has_incident": status.has_incident,
    }
    result = await db.cycles.insert_one(cycle_doc)
    cycle_id = result.inserted_id

    if ANTHROPIC_API_KEY:
        print(f"  Measuring {len(MODELS)} models concurrently...", flush=True)
        results = await asyncio.gather(
            *(asyncio.to_thread(measure_ttft, model, ANTHROPIC_API_KEY) for model in MODELS)
        )
        latency_docs = []
        for model, ttft_result in zip(MODELS, results, strict=True):
            latency_docs.append(
                {
                    "cycle_id": cycle_id,
                    "model": model,
                    "ttft_ms": ttft_result.ttft_ms,
                    "error": ttft_result.error,
                }
            )
            if ttft_result.error:
                print(f"    {model}: ERROR: {ttft_result.error}")
            else:
                print(f"    {model}: {ttft_result.ttft_ms}ms")
        await db.model_latency.insert_many(latency_docs)
    else:
        print("  Skipping TTFT (no ANTHROPIC_API_KEY)")

    print("  Cycle complete.", flush=True)
