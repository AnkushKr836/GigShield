"""Idempotent starter service regions for the prototype."""

from sqlalchemy.orm import Session

from app.models.zone import Zone


DEFAULT_ZONES = (
    ("Chennai Central", "medium"),
    ("Mumbai", "high"),
    ("Tambaram", "low"),
    ("Coimbatore", "medium"),
)


def seed_default_zones(db: Session) -> None:
    """Create or normalize the built-in regions without duplicating existing zones."""
    existing = {zone.name.strip().casefold(): zone for zone in db.query(Zone).all()}
    changed = False

    for name, risk_tier in DEFAULT_ZONES:
        key = name.casefold()
        zone = existing.get(key)
        if zone is None:
            zone = Zone(name=name, risk_tier=risk_tier, active=True)
            db.add(zone)
            existing[key] = zone
            changed = True
            continue

        if zone.name != name:
            zone.name = name
            changed = True
        if zone.risk_tier != risk_tier:
            zone.risk_tier = risk_tier
            changed = True
        if not zone.active:
            zone.active = True
            changed = True

    if changed:
        db.commit()
