# GigShield

**AI-powered parametric income-loss insurance for India's gig delivery workforce.**

Built for **Guidewire DEVTrails 2026 — University Hackathon**.

GigShield protects platform-based delivery partners (food, e-commerce, grocery/Q-commerce) against lost income from external, uncontrollable disruptions — extreme weather, pollution, floods, curfews, and local strikes. It runs on a weekly premium cycle, verifies claims against objective external data, and pays out automatically. It does **not** cover health, life, accidents, or vehicle repairs.

---

## Table of Contents

- [How it works](#how-it-works)
- [Core modules](#core-modules)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Database](#database)
- [Testing](#testing)
- [Project management](#project-management)
- [Team](#team)

---

## How it works

1. A rider registers and is issued a **weekly policy**, priced dynamically from their zone's risk profile and their credibility score.
2. A background scheduler continuously ingests **disruption events** (weather, traffic, civic events) for each active zone.
3. When a disruption affects a rider's ability to work, they raise a **claim token** for that shift.
4. The backend cross-checks the claim against the verified disruption event, the rider's GPS/activity log, and their credibility score.
5. Claims are **auto-approved, auto-rejected, or routed to manual review** — approved claims trigger an instant payout via a sandboxed payment gateway.

## Core modules

- Rider onboarding & weekly policy management
- Disruption ingestion (weather / traffic / civic-event monitoring)
- Claim token submission and automated assessment
- Credibility scoring engine (rule-based, extendable to ML)
- Fraud detection (GPS spoofing, duplicate claims, anomaly detection)
- Dynamic weekly premium calculation
- Payout processing (sandbox payment gateway)
- Analytics dashboards for riders and admins/insurers

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React.js (Next.js), Tailwind CSS, Recharts |
| Backend / API | Python, FastAPI, Uvicorn |
| Database | PostgreSQL, SQLAlchemy (ORM) |
| ML / Fraud Detection | scikit-learn (Isolation Forest), pandas, NumPy |
| Task Scheduling | APScheduler (or Celery + Redis) |
| External APIs | OpenWeatherMap API, mock traffic/curfew service, Razorpay (Test Mode) |
| Authentication | JWT (PyJWT) / Firebase Auth |
| Containerization | Docker, Docker Compose |
| Deployment | Vercel (frontend), Render/Railway (backend + DB) |
| Testing | Pytest (backend), Jest + React Testing Library (frontend) |
| Project Management | ProjectLibre, GitHub Projects (Kanban) |
| Diagramming | Graphviz / Draw.io |

## Project structure

```
gigshield/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/              # Route-level pages
│   │   ├── hooks/
│   │   ├── services/           # API client calls
│   │   ├── context/             # Auth / global state
│   │   └── App.jsx
│   ├── package.json
│   └── tailwind.config.js
│
├── backend/
│   ├── app/
│   │   ├── api/                # Route handlers
│   │   │   ├── riders.py
│   │   │   ├── policies.py
│   │   │   ├── claims.py
│   │   │   └── admin.py
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── services/
│   │   │   ├── disruption_ingestion.py
│   │   │   ├── credibility_engine.py
│   │   │   ├── fraud_detection.py
│   │   │   ├── premium_engine.py
│   │   │   └── payout_service.py
│   │   ├── ml/
│   │   │   ├── isolation_forest_model.py
│   │   │   └── premium_regression.py
│   │   ├── core/                # config, security, DB session
│   │   └── main.py
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── mocks/
│   ├── traffic_mock_server/     # Simulated traffic/jam data
│   └── curfew_events.json       # Simulated civic disruption feed
│
├── database/
│   ├── migrations/
│   └── schema.sql
│
├── docs/
│   ├── ER_diagram.png
│   ├── SRS.docx
│   └── architecture.png
│
├── project-management/
│   └── gigshield_schedule.pod   # ProjectLibre file
│
├── docker-compose.yml
└── README.md
```

## Database

The schema is documented in [`docs/SRS.docx`](docs/SRS.docx) with a full ER diagram. Core entities: `Rider`, `Zone`, `Policy`, `Disruption_Event`, `Claim_Token`, `Credibility_Score`, `Activity_Log`, `Payout`.

## Testing

```bash
# Backend
cd backend && pytest

# Frontend
cd frontend && npm test
```

