from pydantic import BaseModel, ConfigDict


class CompanyCreate(BaseModel):
    name: str


class CompanyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    company_id: str
    name: str
    active: bool
