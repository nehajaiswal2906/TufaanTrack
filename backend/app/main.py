from typing import Optional

from fastapi import FastAPI
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.orm import declarative_base, sessionmaker

# Connect to the database file
engine = create_engine("sqlite:///./tufaantrack.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


# This describes the "reports" table (like an Excel sheet with these columns)
class Report(Base):
    __tablename__ = "reports"
    report_id = Column(Integer, primary_key=True, index=True)
    report_type = Column(String)
    description = Column(String)
    village_id = Column(String, nullable=True)
    latitude = Column(Float)
    longitude = Column(Float)
    status = Column(String, default="UNVERIFIED")


# Create the table if it doesn't exist yet
Base.metadata.create_all(bind=engine)


# This describes what the website must send us when someone submits an SOS
class SOSRequest(BaseModel):
    report_type: str
    description: str
    village_id: Optional[str] = None
    latitude: float
    longitude: float


app = FastAPI()

# SAMPLE DATA - will be replaced with real data later
SETTLEMENTS = [
    {"village_id": "V1", "name": "Village A", "population": 1200, "latitude": 19.80, "longitude": 85.82},
    {"village_id": "V2", "name": "Village B", "population": 800, "latitude": 19.75, "longitude": 85.90},
]

SHELTERS = [
    {"shelter_id": "S1", "name": "Cyclone Shelter 1", "latitude": 19.78, "longitude": 85.85},
]

HOSPITALS = [
    {"hospital_id": "H1", "name": "Primary Health Centre 1", "latitude": 19.77, "longitude": 85.84},
]


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/settlements")
def get_settlements():
    return SETTLEMENTS


@app.get("/api/shelters")
def get_shelters():
    return SHELTERS


@app.get("/api/hospitals")
def get_hospitals():
    return HOSPITALS

@app.post("/api/sos")
def create_sos(sos: SOSRequest):
    db = SessionLocal()
    report = Report(
        report_type=sos.report_type,
        description=sos.description,
        village_id=sos.village_id,
        latitude=sos.latitude,
        longitude=sos.longitude,
        status="UNVERIFIED",
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    result = {
        "report_id": report.report_id,
        "report_type": report.report_type,
        "description": report.description,
        "village_id": report.village_id,
        "latitude": report.latitude,
        "longitude": report.longitude,
        "status": report.status,
    }
    db.close()
    return result