"""Seed MongoDB with 30 days of dummy latency data."""

import asyncio
import random
from datetime import datetime, timedelta, timezone

from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import MONGO_DB, MONGO_URL

MODELS = [
    # Opus family
    "claude-opus-4-5-20250120",
    "claude-opus-4-6",
    "claude-opus-4-6-20260301",
    # Sonnet family
    "claude-sonnet-4-5-20241022",
    "claude-sonnet-4-6",
    "claude-sonnet-4-6-20260215",
    # Haiku family
    "claude-haiku-4-5-20251001",
    "claude-haiku-4-5-20260101",
]

# Baseline TTFT ranges per model (ms) — newer/bigger = slower
TTFT_RANGES = {
    "claude-opus-4-5-20250120": (900, 2800),
    "claude-opus-4-6": (800, 2500),
    "claude-opus-4-6-20260301": (750, 2300),
    "claude-sonnet-4-5-20241022": (500, 1400),
    "claude-sonnet-4-6": (400, 1200),
    "claude-sonnet-4-6-20260215": (380, 1100),
    "claude-haiku-4-5-20251001": (150, 500),
    "claude-haiku-4-5-20260101": (120, 450),
}


async def seed():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[MONGO_DB]

    # Clear existing data
    await db.cycles.delete_many({})
    await db.model_latency.delete_many({})

    now = datetime.now(timezone.utc)
    start = now - timedelta(days=30)

    cycles = []
    latencies = []

    # Every 10 min for 30 days = ~4320 cycles
    current = start
    interval = timedelta(minutes=10)

    while current <= now:
        hour = current.hour
        # Simulate higher latency during peak hours (14-22 UTC)
        peak_factor = 1.3 if 14 <= hour <= 22 else 1.0
        # Occasional degradation
        degraded = random.random() < 0.03

        dns_ms = round(random.uniform(5, 25) * peak_factor, 2)
        connect_ms = round(random.uniform(15, 60) * peak_factor, 2)
        ttfb_ms = round(random.uniform(50, 200) * peak_factor, 2)

        if degraded:
            dns_ms *= 3
            connect_ms *= 3
            ttfb_ms *= 3

        cycle_doc = {
            "timestamp": current.isoformat(),
            "hour_local": (current.hour - 5) % 24,  # simulate EST
            "dns_ms": round(dns_ms, 2),
            "connect_ms": round(connect_ms, 2),
            "ttfb_ms": round(ttfb_ms, 2),
            "api_status": "degraded_performance" if degraded else "operational",
            "has_incident": degraded,
        }
        cycles.append((current, cycle_doc))
        current += interval

    print(f"Inserting {len(cycles)} cycles...")

    # Batch insert cycles
    cycle_docs = [c[1] for c in cycles]
    result = await db.cycles.insert_many(cycle_docs)
    cycle_ids = result.inserted_ids

    # Build latency docs
    for i, (current, _) in enumerate(cycles):
        cycle_id = cycle_ids[i]
        hour = current.hour
        peak_factor = 1.3 if 14 <= hour <= 22 else 1.0
        degraded = cycle_docs[i]["api_status"] != "operational"

        for model in MODELS:
            lo, hi = TTFT_RANGES[model]
            ttft = random.uniform(lo, hi) * peak_factor
            error = None

            if degraded and random.random() < 0.4:
                ttft = None
                error = "HTTP 529: Overloaded"
            elif degraded:
                ttft *= 2.5

            latencies.append(
                {
                    "cycle_id": cycle_id,
                    "model": model,
                    "ttft_ms": round(ttft, 2) if ttft else None,
                    "error": error,
                }
            )

    print(f"Inserting {len(latencies)} model latency records...")
    # Insert in batches of 1000
    for i in range(0, len(latencies), 1000):
        await db.model_latency.insert_many(latencies[i : i + 1000])

    print("Seed complete. Indexes are created by app.db.connect() on startup.")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
