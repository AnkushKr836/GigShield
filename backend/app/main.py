from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine
from app import models  # noqa: F401 — import ensures all models register with Base.metadata
from app.api import riders, zones, companies, coverage_plans, rides, claims, analytics


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Dev/demo convenience: auto-creates tables if they don't exist.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="GigShield API (prototype)", version="0.2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}


app.include_router(riders.router)
app.include_router(zones.router)
app.include_router(companies.router)
app.include_router(coverage_plans.router)
app.include_router(rides.router)
app.include_router(claims.router)
app.include_router(analytics.router)
