import json
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.orm import declarative_base, sessionmaker

# ---------- DATABASE (for SOS reports) ----------
engine = create_engine("sqlite:///./tufaantrack.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


class Report(Base):
    __tablename__ = "reports"
    report_id = Column(Integer, primary_key=True, index=True)
    report_type = Column(String)
    description = Column(String)
    village_id = Column(String, nullable=True)
    latitude = Column(Float)
    longitude = Column(Float)
    status = Column(String, default="UNVERIFIED")


Base.metadata.create_all(bind=engine)


class SOSRequest(BaseModel):
    report_type: str
    description: str
    village_id: Optional[str] = None
    latitude: float
    longitude: float


class StatusUpdate(BaseModel):
    status: str


# ---------- LOAD MEMBER 1's MAP DATA ----------
# The data folder is 3 levels up from this file
DATA_FOLDER = Path(__file__).resolve().parent.parent.parent / "data"


def load_geojson(file_name):
    with open(DATA_FOLDER / file_name, encoding="utf-8") as f:
        return json.load(f)


VILLAGES = load_geojson("villages.geojson")
SHELTERS = load_geojson("shelters.geojson")
HOSPITALS = load_geojson("hospitals.geojson")
CYCLONE_FILE = load_geojson("cyclone_warning.geojson")


def pick_features(geometry_types):
    # keep only the features whose shape type is in the list
    return {
        "type": "FeatureCollection",
        "features": [
            f for f in CYCLONE_FILE["features"]
            if f["geometry"]["type"] in geometry_types
        ],
    }


# ---------- APP ----------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/settlements")
def get_settlements():
    return VILLAGES


@app.get("/api/shelters")
def get_shelters():
    return SHELTERS


@app.get("/api/hospitals")
def get_hospitals():
    return HOSPITALS


@app.get("/api/roads")
def get_roads():
    # No road data yet, so we return an empty map layer
    return {"type": "FeatureCollection", "features": []}


@app.get("/api/cyclone")
def get_cyclone():
    return pick_features(["LineString"])


@app.get("/api/warning-zone")
def get_warning_zone():
    return pick_features(["Polygon", "MultiPolygon"])


# ---------- REPORTS ----------
def report_to_dict(report):
    return {
        "report_id": report.report_id,
        "report_type": report.report_type,
        "description": report.description,
        "village_id": report.village_id,
        "latitude": report.latitude,
        "longitude": report.longitude,
        "status": report.status,
    }


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
    result = report_to_dict(report)
    db.close()
    return result


@app.get("/api/reports")
def get_reports():
    db = SessionLocal()
    result = [report_to_dict(r) for r in db.query(Report).all()]
    db.close()
    return result


@app.patch("/api/reports/{report_id}/status")
def update_status(report_id: int, update: StatusUpdate):
    if update.status not in ["UNVERIFIED", "VERIFIED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    db = SessionLocal()
    report = db.query(Report).filter(Report.report_id == report_id).first()
    if report is None:
        db.close()
        raise HTTPException(status_code=404, detail="Report not found")
    report.status = update.status
    db.commit()
    result = report_to_dict(report)
    db.close()
    return result