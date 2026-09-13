from typing import Optional

from pydantic import BaseModel


class SeedEmployeesRequest(BaseModel):
    count: int = 10
    company_id: Optional[str] = None
    zone_id: Optional[str] = None


class SeededEmployeeOut(BaseModel):
    rider_id: str
    name: str
    email: str
    credibility_score: float
    demo_password: str


class EmployeeListItem(BaseModel):
    rider_id: str
    name: str
    email: str
    phone: str
    persona_type: str
    company_name: str
    zone_name: str
    joined_on: str
    credibility_score: Optional[float] = None
