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


def _admin_headers():
    resp = client.post("/admin/login", json={"username": "admin", "password": "changeme123"})
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


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

    resp = client.get("/analytics/summary", headers=_admin_headers())
    assert resp.status_code == 200
    summary = resp.json()
    assert summary["total_claims"] >= 3
    assert summary["fraud_flagged_count"] >= 1
    assert "manual_review" in summary["claims_by_status"]


def test_seed_demo_employees_produces_varied_credibility():
    zone_id, company_id = _seed()

    resp = client.post("/admin/employees/seed", headers=_admin_headers(), json={"count": 8, "company_id": company_id, "zone_id": zone_id})
    assert resp.status_code == 201, resp.text
    employees = resp.json()
    assert len(employees) == 8

    for e in employees:
        assert 0 <= e["credibility_score"] <= 1
        assert e["demo_password"] == "demo12345"
        assert "@example.com" in e["email"]

    # Scores should show real spread, not all identical (statistically near-certain with 8 riders + weighted random outcomes)
    scores = set(e["credibility_score"] for e in employees)
    assert len(scores) > 1

    # Reject count/company validation
    resp = client.post("/admin/employees/seed", headers=_admin_headers(), json={"count": 100})
    assert resp.status_code == 400


def test_list_employees_endpoint():
    zone_id, company_id = _seed()
    client.post("/admin/employees/seed", headers=_admin_headers(), json={"count": 3, "company_id": company_id, "zone_id": zone_id})

    resp = client.get("/admin/employees/", headers=_admin_headers())
    assert resp.status_code == 200
    employees = resp.json()
    assert len(employees) >= 3
    sample = employees[0]
    assert "company_name" in sample and "credibility_score" in sample


def test_admin_auth_gating():
    # Wrong credentials rejected
    resp = client.post("/admin/login", json={"username": "admin", "password": "wrong"})
    assert resp.status_code == 401

    # Correct credentials work
    resp = client.post("/admin/login", json={"username": "admin", "password": "changeme123"})
    assert resp.status_code == 200
    admin_token = resp.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Admin-gated endpoint rejects no token
    resp = client.post("/zones/", json={"name": "Unauthorized Zone", "risk_tier": "low"})
    assert resp.status_code == 401

    # Admin-gated endpoint rejects a RIDER token (not just "no token")
    zone_id, company_id = _seed()
    client.post("/riders/register", json={
        "name": "Not An Admin", "email": "notadmin@example.com", "phone": "9000000001",
        "password": "supersecret123", "persona_type": "food_delivery",
        "company_id": company_id, "zone_id": zone_id,
    })
    rider_resp = client.post("/riders/login", json={"email": "notadmin@example.com", "password": "supersecret123"})
    rider_token = rider_resp.json()["access_token"]
    resp = client.post("/zones/", headers={"Authorization": f"Bearer {rider_token}"}, json={"name": "Rider Attempt Zone", "risk_tier": "low"})
    assert resp.status_code == 401

    # Admin-gated endpoint accepts a real admin token
    resp = client.post("/zones/", headers=admin_headers, json={"name": "Admin Created Zone", "risk_tier": "low"})
    assert resp.status_code == 201


def test_company_zone_plan_edit_and_delete():
    zone_id, company_id = _seed()
    headers = _admin_headers()

    # --- Company ---
    resp = client.patch(f"/companies/{company_id}", headers=headers, json={"name": "Renamed Co"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Renamed Co"

    resp = client.delete(f"/companies/{company_id}", headers=headers)
    assert resp.status_code == 204
    resp = client.get("/companies/")
    assert company_id not in [c["company_id"] for c in resp.json()]  # soft-deleted, no longer listed

    # --- Zone ---
    resp = client.patch(f"/zones/{zone_id}", headers=headers, json={"risk_tier": "high"})
    assert resp.status_code == 200
    assert resp.json()["risk_tier"] == "high"

    resp = client.delete(f"/zones/{zone_id}", headers=headers)
    assert resp.status_code == 204
    resp = client.get("/zones/")
    assert zone_id not in [z["zone_id"] for z in resp.json()]

    # --- Coverage plan (needs a fresh, non-deleted company) ---
    zone_id2, company_id2 = _seed()
    resp = client.post("/coverage-plans/", headers=headers, json={"company_id": company_id2, "tier_name": "Basic", "payout_per_day": 200})
    plan_id = resp.json()["plan_id"]

    resp = client.patch(f"/coverage-plans/{plan_id}", headers=headers, json={"payout_per_day": 350})
    assert resp.status_code == 200
    assert float(resp.json()["payout_per_day"]) == 350.0

    resp = client.delete(f"/coverage-plans/{plan_id}", headers=headers)
    assert resp.status_code == 204
    resp = client.get("/coverage-plans/", headers=headers)
    assert plan_id not in [p["plan_id"] for p in resp.json()]

    # --- Edit/delete require admin auth ---
    resp = client.patch(f"/companies/{company_id2}", json={"name": "No Auth"})
    assert resp.status_code == 401


def test_claim_verified_by_real_weather_when_no_fabricated_match():
    """
    Mocks the weather_service call (this sandbox can't reach the real
    OpenWeatherMap network) to prove the claim engine actually uses a
    real-weather signal when there's no fabricated disruption match.
    """
    from unittest.mock import patch

    zone_id, company_id = _seed()
    resp = client.post("/riders/register", json={
        "name": "Weather Test Rider", "email": "weathertest@example.com", "phone": "9555500001",
        "password": "supersecret123", "persona_type": "food_delivery",
        "company_id": company_id, "zone_id": zone_id,
    })
    assert resp.status_code == 201
    resp = client.post("/riders/login", json={"email": "weathertest@example.com", "password": "supersecret123"})
    headers = {"Authorization": f"Bearer {resp.json()['access_token']}"}

    resp = client.post("/rides/simulate", headers=headers)
    rides = resp.json()
    # Pick a ride that is NOT the earliest (so it has no fabricated disruption overlap)
    rides_sorted = sorted(rides, key=lambda r: r["start_time"])
    non_overlapping_ride = rides_sorted[-1]
    assert non_overlapping_ride["pickup_lat"] is not None  # real coordinates present

    with patch("app.services.claim_engine.get_current_weather") as mock_weather:
        mock_weather.return_value = {
            "condition_code": 502,  # heavy rain
            "description": "heavy intensity rain",
            "temp_c": 27.0,
            "is_disruptive": True,
        }
        resp = client.post("/claims/", headers=headers, json={
            "ride_id": non_overlapping_ride["ride_id"],
            "disruption_type": "environmental",
            "description": "It was pouring rain right now when I checked.",
            "claimed_amount": 200,
        })
    assert resp.status_code == 201, resp.text
    claim = resp.json()
    assert claim["status"] == "approved"
    assert claim["verification_source"] == "real_weather"
    assert claim["weather_snapshot"]["condition_code"] == 502


def test_claim_falls_back_to_manual_review_when_weather_unavailable():
    from unittest.mock import patch

    zone_id, company_id = _seed()
    resp = client.post("/riders/register", json={
        "name": "No Weather Rider", "email": "noweather@example.com", "phone": "9555500002",
        "password": "supersecret123", "persona_type": "food_delivery",
        "company_id": company_id, "zone_id": zone_id,
    })
    resp = client.post("/riders/login", json={"email": "noweather@example.com", "password": "supersecret123"})
    headers = {"Authorization": f"Bearer {resp.json()['access_token']}"}

    resp = client.post("/rides/simulate", headers=headers)
    rides = sorted(resp.json(), key=lambda r: r["start_time"])
    non_overlapping_ride = rides[-1]

    with patch("app.services.claim_engine.get_current_weather") as mock_weather:
        mock_weather.return_value = None  # simulates missing API key / network failure
        resp = client.post("/claims/", headers=headers, json={
            "ride_id": non_overlapping_ride["ride_id"],
            "disruption_type": "environmental",
            "description": "Weather check unavailable in this test.",
            "claimed_amount": 150,
        })
    assert resp.status_code == 201
    claim = resp.json()
    assert claim["status"] == "manual_review"
    assert claim["verification_source"] is None
