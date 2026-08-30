from datetime import date
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, ConfigDict


class RiderCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    email: EmailStr
    phone: str = Field(min_length=6, max_length=20)
    password: str = Field(min_length=8)
    persona_type: Literal["food_delivery", "ecommerce", "grocery_qcommerce"]
    company_id: str
    zone_id: str


class RiderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    rider_id: str
    name: str
    email: EmailStr
    phone: str
    persona_type: str
    company_id: str
    zone_id: str
    joined_on: date


class RiderLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
