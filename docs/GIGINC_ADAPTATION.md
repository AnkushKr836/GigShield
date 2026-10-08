# GigInc reference: patterns adapted for GigShield

Reviewed from the `GigInc-main.zip` source archive supplied with the project context. This is an adaptation guide, not a stack migration plan.

## Product boundary

GigShield remains a company-funded B2B2C cover platform. Companies own and pay for `CoveragePlan` records; riders enroll through their company and never buy a policy or pay a premium in the rider app. Keep the existing claim flow tied to a specific ride and the existing daily payout cap. Do not add GigInc's Razorpay checkout, user-selected plans, client-side premium quote, or weekly renewal flow to rider pages.

## What has been adapted

- The rider dashboard now follows the reference's useful overview pattern: headline metrics, recent payout history, recent claims, and recent deliveries.
- Each panel is populated from GigShield's authenticated rider endpoints; the payout chart is rendered with inline SVG, so it adds no charting dependency.
- Coverage messaging explicitly says the company provides cover and the rider does not check out or pay.
- Existing map, live-weather verification, manual claim review, and admin analytics remain connected to the FastAPI services already in the project.

## Integration patterns worth carrying over

| Reference technique | GigShield fit | Suggested implementation |
|---|---|---|
| Live weather lookup | Already implemented with OpenWeatherMap in `weather_service.py`; current conditions are informational and a verification signal. | Keep all provider calls in the FastAPI service. Add short-lived caching by rounded coordinates if request volume grows, and store the normalized snapshot with each claim as the current model already does. Do not expose the provider key in the browser. |
| SMS payout notices through a gateway | Useful after payout creation; not yet part of the current flow. | Add a FastAPI notification service called after `create_payout_for_claim`. Keep Twilio credentials server-side and send only a minimal event (`claim approved`, amount, reference). Make delivery best-effort so an SMS outage cannot roll back a claim or payout. The existing `Payout` row is the source of truth. |
| Geolocation and a live risk map | A map is already used for ride routes. Browser GPS should be opt-in and is not proof of a historical disruption. | If live zone awareness is added, request location only after a clear user action, explain its use, and send coordinates to an authenticated FastAPI endpoint. Compare against configured zones and weather; never auto-reject a claim solely on a GPS/IP mismatch. |
| Model with deterministic fallback | The reference uses TensorFlow.js for premium pricing. Pricing is not part of GigShield's rider flow. | If the planned claim-review model is restored, keep it in the Python backend beside `claim_engine.py` and retain the current rules/weather fallback. Treat model output as a recommendation; route uncertain or reject recommendations to admin review. Do not move claim decisions into client-side JavaScript. |
| Claims history and activity feed | Directly useful and based on GigShield's own records. | Continue deriving status and amounts from `/claims/me`; avoid hardcoded feed entries or simulated payout values. The dashboard now uses this approach. |
| Payment checkout | Conflicts with company purchasing. | Do not integrate Razorpay into rider enrollment. If company billing is later in scope, design a separate admin/company billing workflow tied to a company and its coverage plan. |

## Existing and candidate API shape

Current integrations to retain:

- `GET /riders/me`, `GET /rides/me`, `GET /claims/me` — authenticated rider dashboard data.
- `GET /rides/{ride_id}/weather` — live conditions at the ride's pickup point.
- `POST /claims/` — claim assessment, disruption/weather checks, fraud flagging, and daily-cap calculation.
- `GET /claims/{token_id}/detail` and `PATCH /claims/{token_id}/decision` — admin review workflow.

When notification delivery is added, prefer an internal service call after a committed payout instead of allowing the browser to send SMS directly. If an HTTP boundary is useful for a separately deployed gateway, use a server-to-server request such as `POST /internal/notifications/payout` with an authenticated service token, an idempotency key based on the payout ID, and a minimal payload. Keep provider secrets in backend environment variables.

## Reference caveats

The reference UI is a useful visual and interaction source, but its README and mock services include user-paid policies, hardcoded activity/history, and simulated risk signals. GigShield should keep the similar overview and map affordances while showing only its own API-backed records and describing demo or unavailable signals honestly.
