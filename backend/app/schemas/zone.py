from pydantic import BaseModel, ConfigDict


class ZoneCreate(BaseModel):
    name: str
    risk_tier: str = "medium"


class ZoneOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    zone_id: str
    name: str
    risk_tier: str
