# GigShield

**A prototype parametric insurance platform protecting gig delivery riders' income against weather and civic disruptions.**

Built as a Software Development class project. This is a **prototype for demonstration purposes** — it runs entirely on fabricated/simulated data and has no production deployment plans.

---

## How it works

GigShield is **free to riders** — companies (Zomato, Swiggy, Zepto, etc.) purchase a coverage plan for their delivery workforce, and every rider registered under that company is automatically covered.

1. A rider registers under their delivery company and zone.
2. Their ride history is populated with **fabricated, plausible-looking completed deliveries** (this is a prototype — no real trip data exists or is needed).
3. If a weather or civic disruption affected a specific delivery, the rider opens that ride and **raises a claim token**, describing what happened.
4. The backend checks whether a verified disruption event exists for that ride's zone and time window.
   - **Match found** → claim is **auto-approved**, and the payout is calculated from the rider's company's coverage tier.
   - **No match** → the claim is sent to **manual review**, not automatically rejected.
5. Coverage is strictly limited to **weather/civic disruption-caused income loss** — never health, accident, or vehicle-repair claims.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React, Tailwind CSS |
| Backend | Python, FastAPI |
| Database | SQLite (default, zero setup) or PostgreSQL |
| ORM | SQLAlchemy |
| Auth | JWT + bcrypt |
| Testing | Pytest |

---

## Project structure

```
gigshield/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, routers
│   │   ├── core/                 # config, database, auth
│   │   ├── models/                # SQLAlchemy models (Rider, Company, CoveragePlan, Ride, ClaimToken, ...)
│   │   ├── schemas/               # Pydantic request/response schemas
│   │   ├── api/                   # riders, zones, companies, coverage-plans, rides, claims
│   │   └── services/               # ride_simulator.py, claim_engine.py
│   ├── tests/test_smoke.py        # end-to-end flow test
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── page.js                # landing
│   │   ├── register/, login/      # auth flows
│   │   ├── dashboard/             # coverage summary
│   │   ├── rides/                 # ride list, detail, raise-claim form
│   │   └── claims/                # claim history
│   ├── components/                # Nav, Gauge (the coverage barometer)
│   └── lib/                       # api.js, auth.js
└── README.md
```

---

## Getting started

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\Activate.ps1        # Windows PowerShell
# source venv/bin/activate       # macOS/Linux/Git Bash

pip install -r requirements.txt
uvicorn app.main:app --reload --reload-dir app
```
Runs at `http://localhost:8000`. Interactive API docs at `http://localhost:8000/docs`.

By default this uses a local SQLite file — no database setup required. To use PostgreSQL instead, set `DATABASE_URL` in a `backend/.env` file (see `.env.example`).

### 2. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```
Runs at `http://localhost:3000`.

### 3. Seed demo data (one-time, before registering any rider)

Via `curl`:
```bash
curl -X POST http://localhost:8000/companies/ -H "Content-Type: application/json" -d "{\"name\": \"Zomato\"}"
curl -X POST http://localhost:8000/zones/ -H "Content-Type: application/json" -d "{\"name\": \"Chennai Central\", \"risk_tier\": \"medium\"}"
```
Copy the `company_id` from the first response, then:
```bash
curl -X POST http://localhost:8000/coverage-plans/ -H "Content-Type: application/json" -d "{\"company_id\": \"PASTE_HERE\", \"tier_name\": \"Basic\", \"payout_per_day\": 300}"
```
Or use the Swagger UI at `/docs` for the same steps with a form instead of raw `curl`.

### 4. Try it

1. Go to `http://localhost:3000` → **Register** (pick the company and zone you just seeded)
2. Log in
3. Dashboard → **Go generate demo rides**
4. Open any ride → **Raise a token** → see it auto-approve or go to manual review

---

## Running tests

```bash
cd backend
pytest tests/test_smoke.py -v
```

---

## API reference

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | — | Health check |
| POST | `/riders/register` | — | Create a rider account |
| POST | `/riders/login` | — | Returns a JWT |
| GET | `/riders/me` | JWT | Current rider profile |
| GET/POST | `/zones/` | — | List/create zones |
| GET/POST | `/companies/` | — | List/create companies |
| GET/POST | `/coverage-plans/` | — | List/create a company's coverage tiers |
| POST | `/rides/simulate` | JWT | Generates 6 fabricated rides + 1 matching disruption event |
| GET | `/rides/me` | JWT | Rider's ride history |
| GET | `/rides/{id}` | JWT | Ride detail |
| POST | `/claims/` | JWT | Raise a claim against a ride |
| GET | `/claims/me` | JWT | Rider's claim history |

Full interactive docs at `/docs` once the backend is running.

---

## Known limitations

This is a class prototype, not a production system:
- No admin authentication on seed endpoints (`/companies`, `/zones`, `/coverage-plans`)
- No real payout execution — approved claims show an amount but no money actually moves
- No fraud detection or ML scoring
- No real weather/traffic API integration — all disruption and ride data is fabricated
- Nav bar doesn't reflect logged-in state

---

