from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.company import Company
from app.schemas.company import CompanyCreate, CompanyOut

router = APIRouter(prefix="/companies", tags=["companies"])


@router.get("/", response_model=list[CompanyOut])
def list_companies(db: Session = Depends(get_db)):
    return db.query(Company).filter(Company.active == True).all()  # noqa: E712


@router.post("/", response_model=CompanyOut, status_code=status.HTTP_201_CREATED)
def create_company(payload: CompanyCreate, db: Session = Depends(get_db)):
    """No admin auth — fine for a class-project demo/seed step, not for real deployment."""
    company = Company(name=payload.name)
    db.add(company)
    db.commit()
    db.refresh(company)
    return company
