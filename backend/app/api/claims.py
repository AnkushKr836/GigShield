from datetime import datetime, timezone
import time

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db, SessionLocal
from app.core.security import get_current_rider, get_current_admin
from app.models.rider import Rider
from app.models.ride import Ride
from app.models.claim_token import ClaimToken
from app.schemas.claim import ClaimCreate, ClaimOut, ClaimDecision, ClaimDetailOut, ClaimProgressOut
from app.services.claim_engine import assess_claim, get_company_payout_rate
from app.services.payout_service import create_payout_for_claim
from app.services.credibility_engine import compute_credibility
from app.services.fraud_service import check_claim_frequency
from app.services.coverage_cap import compute_capped_payout
from app.services.demo_disruptions import list_disruptions_for_ride
from app.models.claim_review import ClaimReviewJob, ClaimReviewCheckpoint
from app.models.claim_risk_analysis import ClaimRiskAnalysis
from app.services.claim_risk_model import analyze_claim_risk

router = APIRouter(prefix="/claims", tags=["claims"])

REVIEW_STEPS = [
    ("Claim received", "Your delivery and claim details have been recorded."),
    ("Coverage checked", "Checking the company policy and daily payout limit."),
    ("Disruption evidence", "Matching the reported disruption to available evidence."),
    ("Ride details checked", "Reviewing delivery time, location and account signals."),
    ("Decision prepared", "Preparing the automatic decision or review handoff."),
    ("Review complete", "Saving the decision and creating any approved payout."),
]


def process_claim_review(token_id: str):
    """Prototype review timeline: persisted checkpoints over at least 30 seconds."""
    try:
        for index, (label, _) in enumerate(REVIEW_STEPS):
            with SessionLocal() as session:
                checkpoints = session.query(ClaimReviewCheckpoint).filter_by(token_id=token_id).all()
                if not checkpoints:
                    return
                for checkpoint in checkpoints:
                    checkpoint.status = "completed" if checkpoint.step_order < index else ("in_progress" if checkpoint.step_order == index else "waiting")
                session.commit()
            time.sleep(6)

        with SessionLocal() as session:
            claim = session.query(ClaimToken).filter_by(token_id=token_id).first()
            job = session.query(ClaimReviewJob).filter_by(token_id=token_id).first()
            if not claim or not job:
                return
            result = job.result
            claim.status = result["status"]
            claim.event_id = result.get("event_id")
            claim.approved_amount = result.get("approved_amount")
            claim.payout_note = result.get("payout_note")
            claim.verification_source = result.get("verification_source")
            claim.weather_snapshot = result.get("weather_snapshot")
            claim.fraud_flag = bool(result.get("fraud_flag"))
            session.add(ClaimRiskAnalysis(token_id=claim.token_id, result=result.get("risk_analysis") or {}))
            claim.decided_at = datetime.now(timezone.utc) if claim.status not in ("pending", "manual_review") else None
            for checkpoint in session.query(ClaimReviewCheckpoint).filter_by(token_id=token_id).all():
                checkpoint.status = "completed"
            session.delete(job)
            session.commit()
            if claim.status == "approved":
                create_payout_for_claim(session, claim)
    except Exception:
        # Keep the claim and checkpoints available for transparent admin follow-up.
        with SessionLocal() as session:
            claim = session.query(ClaimToken).filter_by(token_id=token_id).first()
            if claim and claim.status == "processing":
                claim.status = "manual_review"
                claim.payout_note = "Automated review was interrupted; routed to an administrator."
                session.commit()


@router.post("/", response_model=ClaimOut, status_code=status.HTTP_201_CREATED)
def raise_claim(
    payload: ClaimCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_rider: Rider = Depends(get_current_rider),
):
    ride = (
        db.query(Ride)
        .filter(Ride.ride_id == payload.ride_id, Ride.rider_id == current_rider.rider_id)
        .first()
    )
    if not ride:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ride not found.")

    existing = db.query(ClaimToken).filter(ClaimToken.ride_id == ride.ride_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A claim has already been raised for this ride.",
        )

    decision = assess_claim(db, ride, payload.disruption_type, payload.claimed_amount)
    weather_snapshot = decision.get("weather_snapshot") or {}
    has_demo_evidence = (
        (decision.get("verification_source") or "").startswith("demo_")
        or bool(weather_snapshot.get("simulated"))
        or bool(weather_snapshot.get("demo_fixture"))
    )
    # The extra-review rule is for repeated rider-submitted claims. A known
    # prototype fixture is intentionally repeatable and should demonstrate
    # the automatic decision path even on an account with older claims.
    is_frequent = False if has_demo_evidence else check_claim_frequency(db, current_rider.rider_id)
    risk_analysis = analyze_claim_risk(db, ride)

    # A frequency flag downgrades an auto-approval to manual review rather
    # than silently approving — it never auto-rejects, matching the
    # "flag, don't punish" pattern used for unmatched disruptions.
    final_status = decision["status"]
    final_approved_amount = decision["approved_amount"]
    final_payout_note = decision["payout_note"]
    if is_frequent and final_status == "approved":
        final_status = "manual_review"
        final_approved_amount = None
        final_payout_note = None
    if risk_analysis.get("available") and risk_analysis.get("risk") == "elevated" and final_status == "approved":
        final_status = "manual_review"
        final_approved_amount = None
        final_payout_note = "An unusual ride pattern was detected by the prototype anomaly model; an administrator will review it. This is not a fraud finding."

    claim = ClaimToken(
        rider_id=current_rider.rider_id,
        ride_id=ride.ride_id,
        event_id=None,
        disruption_type=payload.disruption_type,
        description=payload.description,
        claimed_amount=payload.claimed_amount,
        approved_amount=None,
        status="processing",
        fraud_flag=False,
        verification_source=None,
        weather_snapshot=None,
        payout_note=None,
        decided_at=None,
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)
    result = {
        **decision,
        "status": final_status,
        "approved_amount": str(final_approved_amount) if final_approved_amount is not None else None,
        "payout_note": final_payout_note,
        "fraud_flag": is_frequent,
        "risk_analysis": risk_analysis,
    }
    db.add(ClaimReviewJob(token_id=claim.token_id, result=result))
    for order, (label, detail) in enumerate(REVIEW_STEPS):
        db.add(ClaimReviewCheckpoint(token_id=claim.token_id, step_order=order, label=label, detail=detail))
    db.commit()
    background_tasks.add_task(process_claim_review, claim.token_id)

    return claim


@router.get("/{token_id}/progress", response_model=ClaimProgressOut)
def get_claim_progress(token_id: str, db: Session = Depends(get_db), current_rider: Rider = Depends(get_current_rider)):
    claim = db.query(ClaimToken).filter_by(token_id=token_id, rider_id=current_rider.rider_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found.")
    checkpoints = db.query(ClaimReviewCheckpoint).filter_by(token_id=token_id).order_by(ClaimReviewCheckpoint.step_order).all()
    return {"token_id": token_id, "status": claim.status, "checkpoints": [
        {"label": item.label, "detail": item.detail, "status": item.status, "updated_at": item.updated_at}
        for item in checkpoints
    ]}


@router.get("/me", response_model=list[ClaimOut])
def list_my_claims(
    db: Session = Depends(get_db),
    current_rider: Rider = Depends(get_current_rider),
):
    return (
        db.query(ClaimToken)
        .filter(ClaimToken.rider_id == current_rider.rider_id)
        .order_by(ClaimToken.raised_at.desc())
        .all()
    )


@router.get("/manual-review", response_model=list[ClaimOut])
def list_manual_review_claims(db: Session = Depends(get_db), _admin: str = Depends(get_current_admin)):
    """
    Admin queue. No auth yet (matches the rest of the admin surface for this
    prototype). Sorted so the LOWEST-credibility riders' claims surface
    first — credibility does not affect the original auto-decision, only
    review priority, per the project roadmap.
    """
    claims = (
        db.query(ClaimToken)
        .filter(ClaimToken.status == "manual_review")
        .order_by(ClaimToken.raised_at.asc())
        .all()
    )

    def sort_key(c):
        result = compute_credibility(db, c.rider)
        return result["score"]

    return sorted(claims, key=sort_key)


@router.get("/admin", response_model=list[ClaimOut])
def list_admin_claims(db: Session = Depends(get_db), _admin: str = Depends(get_current_admin)):
    """Admin-only history, including automatically approved claims and evidence references."""
    return db.query(ClaimToken).order_by(ClaimToken.raised_at.desc()).all()


@router.get("/{token_id}/detail", response_model=ClaimDetailOut)
def get_claim_detail(token_id: str, db: Session = Depends(get_db), _admin: str = Depends(get_current_admin)):
    """
    Full detail for a single claim — ride route/coordinates for the map,
    the stored weather snapshot, and the rider's current credibility score.
    Powers the admin's expanded review page (map, weather, curfew/description
    all visible in one place, instead of a one-line list entry).
    """
    claim = db.query(ClaimToken).filter(ClaimToken.token_id == token_id).first()
    if not claim:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found.")

    cred_result = compute_credibility(db, claim.rider)
    signals_by_id = {event.event_id: event for event in list_disruptions_for_ride(db, claim.ride)}
    # Keep the exact event used for the decision even if its time window was
    # later edited or it no longer appears in the ride's overlap query.
    if claim.disruption_event:
        signals_by_id[claim.disruption_event.event_id] = claim.disruption_event

    disruption_signals = []
    for event in signals_by_id.values():
        payload = event.raw_payload or {}
        disruption_signals.append(
            {
                "event_id": event.event_id,
                "disruption_type": event.disruption_type,
                "subtype": event.subtype,
                "severity": event.severity,
                "start_time": event.start_time,
                "end_time": event.end_time,
                "source": event.source,
                "is_demo": bool(payload.get("demo")),
                "label": payload.get("label"),
                "note": payload.get("note"),
                "details": payload.get("details", {}),
            }
        )

    risk_row = db.query(ClaimRiskAnalysis).filter_by(token_id=claim.token_id).first()
    return ClaimDetailOut(
        token_id=claim.token_id,
        rider_id=claim.rider_id,
        ride_id=claim.ride_id,
        event_id=claim.event_id,
        disruption_type=claim.disruption_type,
        description=claim.description,
        claimed_amount=claim.claimed_amount,
        approved_amount=claim.approved_amount,
        status=claim.status,
        fraud_flag=claim.fraud_flag,
        verification_source=claim.verification_source,
        weather_snapshot=claim.weather_snapshot,
        payout_note=claim.payout_note,
        raised_at=claim.raised_at,
        decided_at=claim.decided_at,
        ride=claim.ride,
        rider_name=claim.rider.name,
        rider_email=claim.rider.email,
        rider_credibility_score=float(cred_result["score"]),
        disruption_signals=disruption_signals,
        risk_analysis=risk_row.result if risk_row else None,
    )


@router.patch("/{token_id}/decision", response_model=ClaimOut)
def decide_claim(
    token_id: str,
    payload: ClaimDecision,
    db: Session = Depends(get_db),
    _admin: str = Depends(get_current_admin),
):
    """Admin manually approves or rejects a claim currently in manual_review."""
    claim = db.query(ClaimToken).filter(ClaimToken.token_id == token_id).first()
    if not claim:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found.")
    if claim.status != "manual_review":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only claims currently in manual review can be manually decided.",
        )

    claim.status = payload.decision
    claim.decided_at = datetime.now(timezone.utc)
    if payload.decision == "approved":
        if payload.approved_amount is not None:
            # Admin explicitly typed an amount — respect their manual judgment,
            # don't silently override it with the automated cap.
            claim.approved_amount = payload.approved_amount
        else:
            payout_rate = get_company_payout_rate(db, claim.ride.company_id)
            if payout_rate is not None:
                cap_result = compute_capped_payout(db, claim.rider_id, claim.ride.company_id, payout_rate, claim.claimed_amount)
                claim.approved_amount = cap_result["approved_amount"]
                claim.payout_note = cap_result["payout_note"]
            else:
                claim.approved_amount = claim.claimed_amount

    db.commit()
    db.refresh(claim)

    if claim.status == "approved":
        create_payout_for_claim(db, claim)

    return claim
