import asyncio
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI

from app import db
from app.core.config import MONITOR_INTERVAL_SECONDS
from app.routes import router
from app.services.monitor import run_cycle


async def monitor_loop():
    while True:
        try:
            await run_cycle()
        except Exception as e:
            print(f"Monitor cycle error: {e}")
        await asyncio.sleep(MONITOR_INTERVAL_SECONDS)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect()
    task = asyncio.create_task(monitor_loop())
    yield
    task.cancel()
    with suppress(asyncio.CancelledError):
        await task
    await db.close()


app = FastAPI(title="MaxTime API", lifespan=lifespan)
app.include_router(router)


@app.get("/health")
async def health():
    return {"status": "ok"}
