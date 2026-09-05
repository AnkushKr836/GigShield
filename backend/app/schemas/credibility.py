from decimal import Decimal

from pydantic import BaseModel


class CredibilityOut(BaseModel):
    score: Decimal
    factors: dict
