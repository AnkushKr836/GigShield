"""Clear only transactional prototype data while preserving setup and users.

Run from ``backend``. Defaults to a count-only dry run; pass ``--apply`` to
delete payout, claim, ride, and disruption-event rows in one transaction.
Companies, coverage plans, zones, riders, credibility scores, and activity
logs are deliberately retained.
"""

import argparse

from sqlalchemy import delete, func, select

from app.core.database import engine
from app.models.claim_token import ClaimToken
from app.models.disruption_event import DisruptionEvent
from app.models.payout import Payout
from app.models.ride import Ride


TABLES_IN_DELETE_ORDER = (
    ("payout", Payout.__table__),
    ("claim_token", ClaimToken.__table__),
    ("ride", Ride.__table__),
    ("disruption_event", DisruptionEvent.__table__),
)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="delete the approved demo records")
    args = parser.parse_args()

    with engine.begin() as connection:
        counts = {
            name: connection.execute(select(func.count()).select_from(table)).scalar_one()
            for name, table in TABLES_IN_DELETE_ORDER
        }
        print("Records selected for reset:")
        for name, count in counts.items():
            print(f"  {name}: {count}")

        if not args.apply:
            print("Dry run only. Re-run with --apply to delete these rows.")
            return

        deleted = {}
        for name, table in TABLES_IN_DELETE_ORDER:
            result = connection.execute(delete(table))
            deleted[name] = result.rowcount

        print("Reset complete:")
        for name, count in deleted.items():
            print(f"  {name}: {count} deleted")
        print("Riders and company/coverage setup were preserved.")


if __name__ == "__main__":
    main()
