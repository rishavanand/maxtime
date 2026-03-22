from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import MONGO_DB, MONGO_URL

client: AsyncIOMotorClient | None = None


async def connect():
    global client
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[MONGO_DB]
    await db.cycles.create_index("timestamp")
    await db.model_latency.create_index([("model", 1), ("cycle_id", 1)])
    await db.model_latency.create_index("cycle_id")


async def close():
    global client
    if client:
        client.close()
        client = None


def get_db():
    if client is None:
        raise RuntimeError("Database not connected. Call connect() first.")
    return client[MONGO_DB]
