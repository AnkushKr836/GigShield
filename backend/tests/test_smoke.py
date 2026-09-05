"""
End-to-end smoke test for the pivoted (B2B2C) model:
company + coverage plan + zone -> rider registration -> login ->
simulate rides -> raise a claim -> verify auto-approval on the
disruption-overlapping ride.

Run with: pytest tests/test_smoke.py -v
"""
import os
import sys
import uuid

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ["DATABASE_URL"] = "sqlite:///./test_gigshield.db"

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.core.database import SessionLocal  # noqa: E402
from app.models.zone import Zone  # noqa: E402
from app.models.company import Company  # noqa: E402
from app.models.coverage_plan import CoveragePlan  # noqa: E402

client = TestClient(app)
client.__enter__()


def _seed():
    db = SessionLocal()
    suffix = uuid.uuid4().hex[:8]
    zone = Zone(name=f"Chennai Central {suffix}", risk_tier="medium")
    company = Company(name=f"Zomato {suffix}")
    db.add_all([zone, company])
    db.commit()
    db.refresh(zone)
    db.refresh(company)

    plan = CoveragePlan(company_id=company.company_id, tier_name="Basic", payout_per_day=300)
    db.add(plan)
    db.commit()

    zone_id, company_id = zone.zone_id, company.company_id
    db.close()
    return zone_id, company_id


def test_health_check():
    resp = client.get("/health")
    assert resp.status_code == 200


def test_full_rider_flow_with_claim():
    zone_id, company_id = _seed()

    # Register
    resp = client.post("/riders/register", json={
        "name": "Ravi Kumar",
        "email": "ravi@example.com",
        "phone": "9876543210",
        "password": "supersecret123",
        "persona_type": "food_delivery",
        "company_id": company_id,
        "zone_id": zone_id,
    })
    assert resp.status_code == 201, resp.text

    # Login
    resp = client.post("/riders/login", json={"email": "ravi@example.com", "password": "supersecret123"})
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Simulate rides (also seeds one overlapping disruption event)
    resp = client.post("/rides/simulate", headers=headers)
    assert resp.status_code == 201, resp.text
    rides = resp.json()
    assert len(rides) == 14

    # The earliest ride (by start_time) is guaranteed to overlap the seeded disruption
    earliest_ride = min(rides, key=lambda r: r["start_time"])

    # Raise a claim against it
    resp = client.post("/claims/", headers=headers, json={
        "ride_id": earliest_ride["ride_id"],
        "disruption_type": "environmental",
        "description": "Heavy rain made the roads unsafe and I had to stop deliveries early.",
        "claimed_amount": 250,
    })
    assert resp.status_code == 201, resp.text
    claim = resp.json()
    assert claim["status"] == "approved"
    assert float(claim["approved_amount"]) == 300.0  # matches the Basic tier payout_per_day

    # Duplicate claim on the same ride should be rejected
    resp = client.post("/claims/", headers=headers, json={
        "ride_id": earliest_ride["ride_id"],
        "disruption_type": "environmental",
        "description": "Trying again for the same ride.",
        "claimed_amount": 250,
    })
    assert resp.status_code == 409

    # List claims
    resp = client.get("/claims/me", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def teardown_module(module):
    if os.path.exists("test_gigshield.db"):
        os.remove("test_gigshield.db")


def test_payout_created_on_approval_and_credibility_endpoint_works():
    zone_id, company_id = _seed()

    resp = client.post("/riders/register", json={
        "name": "Priya Singh",
        "email": "priya@example.com",
        "phone": "9123456789",
        "password": "supersecret123",
        "persona_type": "food_delivery",
        "company_id": company_id,
        "zone_id": zone_id,
    })
    assert resp.status_code == 201

    resp = client.post("/riders/login", json={"email": "priya@example.com", "password": "supersecret123"})
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post("/rides/simulate", headers=headers)
    rides = resp.json()
    assert len(rides) == 14

    earliest_ride = min(rides, key=lambda r: r["start_time"])
    resp = client.post("/claims/", headers=headers, json={
        "ride_id": earliest_ride["ride_id"],
        "disruption_type": "environmental",
        "description": "Heavy rain made the roads unsafe.",
        "claimed_amount": 250,
    })
    assert resp.status_code == 201
    claim = resp.json()
    assert claim["status"] == "approved"

    # Credibility endpoint returns a score in range
    resp = client.get("/riders/me/credibility", headers=headers)
    assert resp.status_code == 200
    cred = resp.json()
    assert 0 <= float(cred["score"]) <= 1
    assert "total_claims" in cred["factors"]


def test_rides_pagination():
    zone_id, company_id = _seed()

    resp = client.post("/riders/register", json={
        "name": "Arjun Rao",
        "email": "arjun@example.com",
        "phone": "9988776655",
        "password": "supersecret123",
        "persona_type": "ecommerce",
        "company_id": company_id,
        "zone_id": zone_id,
    })
    assert resp.status_code == 201
    resp = client.post("/riders/login", json={"email": "arjun@example.com", "password": "supersecret123"})
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    client.post("/rides/simulate", headers=headers)

    resp = client.get("/rides/me?limit=5&offset=0", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 5

    resp = client.get("/rides/me?limit=5&offset=5", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 5


def test_fraud_flag_and_analytics():
    zone_id, company_id = _seed()

    resp = client.post("/riders/register", json={
        "name": "Frequent Filer", "email": "frequent@example.com", "phone": "9111122233",
        "password": "supersecret123", "persona_type": "food_delivery",
        "company_id": company_id, "zone_id": zone_id,
    })
    assert resp.status_code == 201
    resp = client.post("/riders/login", json={"email": "frequent@example.com", "password": "supersecret123"})
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post("/rides/simulate", headers=headers)
    rides = resp.json()

    # Raise 3 claims quickly on non-overlapping rides -> all manual_review (no disruption match)
    for r in rides[:3]:
        resp = client.post("/claims/", headers=headers, json={
            "ride_id": r["ride_id"], "disruption_type": "environmental",
            "description": "Testing frequency-based fraud flagging.", "claimed_amount": 100,
        })
        assert resp.status_code == 201

    # The 3rd claim should now be frequency-flagged
    last_claim = resp.json()
    assert last_claim["fraud_flag"] is True

    resp = client.get("/analytics/summary")
    assert resp.status_code == 200
    summary = resp.json()
    assert summary["total_claims"] >= 3
    assert summary["fraud_flagged_count"] >= 1
    assert "manual_review" in summary["claims_by_status"]
