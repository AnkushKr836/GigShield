from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine
from app import models  # noqa: F401 — import ensures all models register with Base.metadata
from app.api import riders, policies, zones


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Dev/demo convenience: auto-creates tables if they don't exist.
    # Production/Docker deployment uses database/schema.sql instead (see docker-compose.yml).
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="GigShield API", version="0.1.0", lifespan=lifespan)

# Allows the Next.js dev server (and, once deployed, the real frontend origin)
# to call this API from the browser. Without this, every browser-side fetch
# call silently fails CORS preflight even though curl/Postman work fine.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}


app.include_router(riders.router)
app.include_router(policies.router)
app.include_router(zones.router)
