import uuid


def gen_uuid() -> str:
    """String UUID default — portable across SQLite (local/test) and Postgres (prod)."""
    return str(uuid.uuid4())
