#!/usr/bin/env python3
"""
Claude Code Latency Monitor — measures TTFT across models throughout the day.

Usage:
  python -m cli.monitor                    # one measurement cycle
  python -m cli.monitor --daemon --interval 5  # run every 5 minutes
  python -m cli.monitor --analyze          # show heatmap
  python -m cli.monitor --analyze --days 3 # limit to last 3 days
"""

import argparse
import asyncio
from datetime import datetime, timedelta, timezone

from motor.motor_asyncio import AsyncIOMotorDatabase

from app import db
from app.core.config import MODEL_SHORT
from app.services.monitor import run_cycle

# ---------------------------------------------------------------------------
# Analysis / heatmap
# ---------------------------------------------------------------------------


def _to_bucket(ts_utc: str) -> str:
    """Convert UTC ISO8601 timestamp to local HH:MM 15-min bucket string."""
    dt = datetime.fromisoformat(ts_utc).astimezone()
    bucket_min = (dt.minute // 15) * 15
    return f"{dt.hour:02d}:{bucket_min:02d}"


async def analyze(mongo: AsyncIOMotorDatabase, days: int) -> None:  # type: ignore[type-arg]
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    # Query 1: TTFB by time bucket
    cursor = mongo.cycles.find(
        {"timestamp": {"$gte": since}, "ttfb_ms": {"$ne": None}},
        {"timestamp": 1, "ttfb_ms": 1},
    )
    ttfb_by_bucket: dict[str, list[float]] = {}
    async for row in cursor:
        b = _to_bucket(row["timestamp"])
        ttfb_by_bucket.setdefault(b, []).append(row["ttfb_ms"])

    # Query 2: TTFT by model (two-query join, matching services/metrics.py pattern)
    cycle_cursor = mongo.cycles.find({"timestamp": {"$gte": since}}, {"timestamp": 1})
    cycle_map: dict[object, str] = {}
    async for c in cycle_cursor:
        cycle_map[c["_id"]] = c["timestamp"]

    ttft_by_bucket_model: dict[tuple[str, str], list[float]] = {}
    active_models_set: set[str] = set()
    if cycle_map:
        latency_cursor = mongo.model_latency.find(
            {"cycle_id": {"$in": list(cycle_map.keys())}, "ttft_ms": {"$ne": None}},
            {"cycle_id": 1, "model": 1, "ttft_ms": 1},
        )
        async for doc in latency_cursor:
            ts = cycle_map.get(doc["cycle_id"])
            if ts:
                key = (_to_bucket(ts), doc["model"])
                ttft_by_bucket_model.setdefault(key, []).append(doc["ttft_ms"])
                active_models_set.add(doc["model"])

    active_models = sorted(active_models_set)

    if not ttfb_by_bucket and not ttft_by_bucket_model:
        print("No data yet. Run a measurement cycle first.")
        return

    all_buckets = sorted(set(ttfb_by_bucket.keys()) | {b for (b, _) in ttft_by_bucket_model})

    def avg(lst: list[float]) -> float | None:
        return sum(lst) / len(lst) if lst else None

    def bar(val: float | None, max_val: float, width: int = 16) -> str:
        if val is None or max_val == 0:
            return " " * width
        filled = round(val / max_val * width)
        return "\u2588" * filled + "\u2591" * (width - filled)

    print(f"\nClaude Code Latency Heatmap \u2014 last {days} day(s) (local time, 15-min buckets)")
    print("\u2550" * 65)

    best_bucket: str | None = None

    if ttfb_by_bucket:
        all_ttfb = [v for vals in ttfb_by_bucket.values() for v in vals]
        max_ttfb = max(all_ttfb) if all_ttfb else 1
        best_bucket = min(ttfb_by_bucket, key=lambda b: avg(ttfb_by_bucket[b]) or 0.0)
        worst_bucket = max(ttfb_by_bucket, key=lambda b: avg(ttfb_by_bucket[b]) or 0.0)

        print("\nNetwork TTFB (no API key required)")
        print(f"{'Time':<6}\u2502 {'Avg TTFB':>9} \u2502 Bar")
        print(
            "\u2500\u2500\u2500\u2500\u2500\u2500\u253c"
            "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253c"
            + "\u2500"
            * 17
        )
        for b in all_buckets:
            vals = ttfb_by_bucket.get(b, [])
            a = avg(vals)
            label = ""
            if b == best_bucket:
                label = "  \u2190 best"
            elif b == worst_bucket:
                label = "  \u2190 worst"
            ms_str = f"{a:.0f}ms" if a is not None else "\u2014"
            print(f"{b}  \u2502 {ms_str:>9} \u2502 {bar(a, max_ttfb)}{label}")

    best_ttft_bucket: str | None = None
    worst_ttft_bucket: str | None = None

    if active_models:
        col_w = 8
        header_models = "\u2502".join(f" {MODEL_SHORT.get(m, m):^{col_w}} " for m in active_models)
        sep_models = "\u253c".join("\u2500" * (col_w + 2) for _ in active_models)

        bucket_avgs: dict[str, float] = {}
        for b in all_buckets:
            total_samples = 0
            total_sum = 0.0
            for m in active_models:
                vals = ttft_by_bucket_model.get((b, m), [])
                total_samples += len(vals)
                if vals:
                    a = avg(vals)
                    if a is not None:
                        total_sum += a
            if total_samples:
                bucket_avgs[b] = total_sum
        best_ttft_bucket = min(bucket_avgs, key=lambda b: bucket_avgs[b]) if bucket_avgs else None
        worst_ttft_bucket = max(bucket_avgs, key=lambda b: bucket_avgs[b]) if bucket_avgs else None

        print("\n\nTime to First Token by Model")
        print(f"{'Time':<6}\u2502{header_models}\u2502 {'Samples':>7}")
        print(
            f"\u2500\u2500\u2500\u2500\u2500\u2500\u253c{sep_models}"
            "\u253c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"
        )
        for b in all_buckets:
            cells = []
            total_samples = 0
            for m in active_models:
                vals = ttft_by_bucket_model.get((b, m), [])
                total_samples += len(vals)
                a = avg(vals)
                ms_str = f"{a:.0f}ms" if a is not None else "\u2014"
                cells.append(f" {ms_str:^{col_w}} ")
            row_str = "\u2502".join(cells)
            label = ""
            if b == best_ttft_bucket:
                label = "  \u2190 best"
            elif b == worst_ttft_bucket:
                label = "  \u2190 worst"
            print(f"{b}  \u2502{row_str}\u2502 {total_samples:>7}{label}")

    best = best_ttft_bucket or best_bucket
    if best:
        h, m = map(int, best.split(":"))
        total_min = h * 60 + m + 30
        next_b = f"{(total_min // 60) % 24:02d}:{total_min % 60:02d}"
        label = "Best time to code" if best_ttft_bucket else "Best network window"
        print(f"\n{label}: {best}\u2013{next_b} local time")

    print()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


async def async_main(args: argparse.Namespace) -> None:
    await db.connect()
    try:
        if args.analyze:
            await analyze(db.get_db(), args.days)
        elif args.daemon:
            print(f"Daemon mode: measuring every {args.interval} minute(s). Ctrl+C to stop.")
            while True:
                await run_cycle()
                print(f"Sleeping {args.interval}m...", flush=True)
                await asyncio.sleep(args.interval * 60)
        else:
            await run_cycle()
    finally:
        await db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Claude Code Latency Monitor")
    parser.add_argument("--analyze", action="store_true", help="Show heatmap and exit")
    parser.add_argument("--days", type=int, default=7, help="Lookback window for --analyze")
    parser.add_argument("--daemon", action="store_true", help="Run continuously")
    parser.add_argument(
        "--interval",
        type=int,
        default=5,
        help="Interval in minutes (daemon mode)",
    )
    args = parser.parse_args()

    try:
        asyncio.run(async_main(args))
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
