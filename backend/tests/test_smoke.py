"""
End-to-end smoke test for the 40%-milestone backend slice:
rider registration -> login -> authenticated policy creation.

Run with: pytest tests/test_smoke.py -v
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Use an isolated, disposable SQLite file for the test run instead of the dev DB.
os.environ["DATABASE_URL"] = "sqlite:///./test_gigshield.db"

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.core.database import SessionLocal  # noqa: E402
from app.models.zone import Zone  # noqa: E402

client = TestClient(app)
client.__enter__()  # triggers the lifespan startup (table creation) for this test session


def _seed_zone():
    db = SessionLocal()
    zone = Zone(name="Chennai Central", risk_tier="medium")
    db.add(zone)
    db.commit()
    db.refresh(zone)
    db.close()
    return zone.zone_id


def test_health_check():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_full_rider_flow():
    zone_id = _seed_zone()

    # 1. Register
    register_payload = {
        "name": "Test Rider",
        "email": "rider1@example.com",
        "phone": "9876543210",
        "password": "supersecret123",
        "persona_type": "food_delivery",
        "zone_id": zone_id,
    }
    resp = client.post("/riders/register", json=register_payload)
    assert resp.status_code == 201, resp.text
    rider = resp.json()
    assert rider["email"] == "rider1@example.com"

    # 2. Duplicate registration should be rejected (REQ-4.1.2)
    resp = client.post("/riders/register", json=register_payload)
    assert resp.status_code == 409

    # 3. Login
    resp = client.post("/riders/login", json={"email": "rider1@example.com", "password": "supersecret123"})
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 4. Wrong password should be rejected
    resp = client.post("/riders/login", json={"email": "rider1@example.com", "password": "wrongpassword"})
    assert resp.status_code == 401

    # 5. Authenticated profile fetch
    resp = client.get("/riders/me", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Test Rider"

    # 6. Create a weekly policy (REQ-4.1.3 premium calc + REQ-4.1.4 one-active-policy rule)
    resp = client.post("/policies/", headers=headers)
    assert resp.status_code == 201, resp.text
    policy = resp.json()
    assert float(policy["weekly_premium"]) == 100.00  # medium risk tier, no credibility discount yet
    assert policy["status"] == "active"

    # 7. Second policy creation in the same week should be rejected (REQ-4.1.4)
    resp = client.post("/policies/", headers=headers)
    assert resp.status_code == 409

    # 8. List policies
    resp = client.get("/policies/me", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def teardown_module(module):
    if os.path.exists("test_gigshield.db"):
        os.remove("test_gigshield.db")
