from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class RideOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ride_id: str
    rider_id: str
    company_id: str
    zone_id: str
    pickup_location: str
    drop_location: str
    start_time: datetime
    end_time: datetime
    fare_amount: Decimal
    status: str
