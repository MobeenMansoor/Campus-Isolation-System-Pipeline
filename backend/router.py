"""
API Router for the Campus AI Backend.

Exposes the ``/predict``, ``/health``, and volunteer endpoints.
"""

import csv
import json
import logging
import os
import uuid
import threading
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ml_engine import MLEngine
from models import AssessmentInput, PredictionResponse
from privacy import append_training_data, strip_pii

logger = logging.getLogger("router")

router = APIRouter()

# ---------------------------------------------------------------------------
# Module-level reference to the ML engine — set by main.py on startup.
# ---------------------------------------------------------------------------
_engine: Optional[MLEngine] = None

# Thread lock for volunteer file writes
_volunteer_lock = threading.Lock()

# Thread lock for CSV appends
_csv_lock = threading.Lock()

# Path to the volunteers JSON file
VOLUNTEERS_FILE = os.path.join(os.path.dirname(__file__), "volunteers.json")

# Path to the main ML dataset
DATASET_CSV = os.path.join(os.path.dirname(__file__), "..", "ML-Dataset.csv")

# Counter for assessments appended this session (triggers retrain every N)
_assessment_counter = 0
_RETRAIN_INTERVAL = 10  # Retrain model every 10 new assessments

def set_engine(engine: MLEngine) -> None:
    """Called by main.py to inject the initialised MLEngine instance."""
    global _engine
    _engine = engine


def get_engine() -> MLEngine:
    """Return the MLEngine or raise if not initialised."""
    if _engine is None:
        raise HTTPException(
            status_code=503,
            detail="ML engine is not initialised yet. Please try again shortly.",
        )
    return _engine


# ---------------------------------------------------------------------------
# Helper: Append assessment to ML-Dataset.csv
# ---------------------------------------------------------------------------
def _append_assessment_to_csv(assessment: AssessmentInput) -> None:
    """
    Append a new assessment row to ML-Dataset.csv so the model
    trains on an ever-growing dataset.
    """
    global _assessment_counter, _engine

    csv_path = os.path.normpath(DATASET_CSV)
    data = assessment.model_dump()

    # Map form fields back to CSV column order
    row = {
        "Timestamp": datetime.now(timezone.utc).isoformat(),
        "Name:": "Anonymous",
        "University/Institution Name \\nWrite abbreviation only (e.g NUST, NUTECH, FAST)": "NUTECH",
        "Semester:": 4,
        "Living Status": data.get("living_status", "Hostelite"),
        "How many friends are in your group?": data.get("friend_group_size", 0),
        "How much does the presence of friends influence your decision to attend university events or classes?  ": data.get("friend_influence", 3),
        "Academic Performance:": "Good",
        "Current CGPA (e.g., 3.45)": data.get("cgpa", 0),
        "Average Class Attendance Rate (Weekly)": data.get("class_attendance", 3),
        "Average Daily Self-Study Hours": data.get("daily_self_study_hours", 0),
        "Number of Active Society Memberships": data.get("society_memberships", 0),
        "Do you contribute/help/join society events?": "Yes" if data.get("society_memberships", 0) > 0 else "No",
        "How many society meetings/events did you attend this semester?": data.get("society_events_attended", 0),
        "Do you play for any sports at University?": "No",
        "Do you enjoy physical Campus Presence?": "Yes",
        "Number of meals eaten with friends on average in a week?": data.get("meals_with_friends", 0),
        "Total hours spent in personal space/alone on average in a week?": data.get("hours_alone_weekly", 0),
        "Frequency of using Common Rooms/Student Lounges/Library Rooms": data.get("common_room_frequency", 3),
        "How many times did you leave campus for social reasons this week? (Gatherings, events, trips, hangout, etc)": data.get("social_outings", 0),
        "Number of Assignments/Quizzes due this week?": data.get("assignments_due", 0),
        "Perceived Academic Workload Stress": data.get("workload_stress", 5),
        "How well did you manage your workload this week?": data.get("workload_management", 3),
        "Average daily Screen Time on your phone (Hours)? (In weekdays)": data.get("screen_time", 0),
        "Average hours of sleep per night? (in weekdays)": data.get("sleep_hours", 7),
        "Do you mostly skip breakfast/lunch in the cafeteria?": "No",
        "How would you rate your social interaction and wellness?": data.get("social_wellness_rating", 3),
        "How would you rate your overall mood this week?": data.get("mood_rating", 5),
        "How often did you feel socially isolated or lonely this week?": data.get("loneliness_score", 2),
        "Satisfaction with your peer interactions": data.get("peer_satisfaction", 5),
        "How would you rate the helpfulness of your peers/friends in academic matters (e.g., studying for exams, assignments)?": data.get("peer_helpfulness", 3),
    }

    with _csv_lock:
        file_exists = os.path.isfile(csv_path)
        with open(csv_path, "a", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=row.keys())
            if not file_exists:
                writer.writeheader()
            writer.writerow(row)

    _assessment_counter += 1
    logger.info("Assessment appended to CSV. Counter: %d", _assessment_counter)

    # Retrain if threshold hit
    if _assessment_counter >= _RETRAIN_INTERVAL and _engine is not None:
        logger.info("Retrain interval reached. Triggering model retraining in background...")
        retrain_thread = threading.Thread(target=_engine.retrain)
        retrain_thread.start()
        _assessment_counter = 0


# ---------------------------------------------------------------------------
# Volunteer schemas
# ---------------------------------------------------------------------------
class VolunteerRegister(BaseModel):
    """Input model for volunteer registration."""
    name: str = Field(..., min_length=2, max_length=100, description="Volunteer's full name")
    gender: str = Field(..., description="Gender: 'Male' or 'Female'")
    age: int = Field(..., ge=16, le=40, description="Age in years")
    semester: int = Field(..., ge=1, le=12, description="Current semester")
    university: str = Field(..., min_length=2, max_length=50, description="University abbreviation")
    phone: str = Field(..., min_length=11, max_length=15, description="Pakistani phone number (e.g. 0312-3456789)")
    interests: List[str] = Field(default_factory=list, description="List of interest tags")


class VolunteerRecord(BaseModel):
    """Full volunteer record including system-generated fields."""
    id: str
    name: str
    gender: str
    age: int
    semester: int
    university: str
    phone: str
    interests: List[str]
    registered_at: str


# ---------------------------------------------------------------------------
# Helper: Read/Write volunteers JSON
# ---------------------------------------------------------------------------
def _read_volunteers() -> List[Dict[str, Any]]:
    """Read the volunteers JSON file. Returns empty list if file missing."""
    if not os.path.isfile(VOLUNTEERS_FILE):
        return []
    try:
        with open(VOLUNTEERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        logger.warning("Failed to read volunteers.json, returning empty list")
        return []


def _write_volunteers(data: List[Dict[str, Any]]) -> None:
    """Write the volunteers list to JSON file (thread-safe)."""
    with _volunteer_lock:
        with open(VOLUNTEERS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@router.post("/predict", response_model=PredictionResponse)
async def predict(assessment: AssessmentInput) -> PredictionResponse:
    """
    Accept a student assessment and return a social-isolation prediction
    with cluster label, risk category, anomaly score, recommendation,
    and radar-chart data.
    """
    engine = get_engine()

    try:
        result = engine.predict(assessment)
    except Exception as exc:
        logger.exception("Prediction failed")
        raise HTTPException(
            status_code=500,
            detail=f"Prediction error: {exc}",
        ) from exc

    # ---- Privacy-safe training-data logging ----
    try:
        raw_input = assessment.model_dump()
        clean_features = strip_pii(raw_input)
        prediction_data: Dict[str, Any] = {
            "social_density_score": result.social_density_score,
            "cluster_label": result.cluster_label,
            "risk_category": result.risk_category,
        }
        training_csv = os.path.join(
            os.path.dirname(__file__), "training_data.csv"
        )
        append_training_data(
            user_id=result.user_id,
            features=clean_features,
            prediction=prediction_data,
            filepath=training_csv,
        )
    except Exception:
        # Logging failure must never block the response
        logger.warning("Failed to append training data", exc_info=True)

    # ---- Append to main ML-Dataset.csv for incremental training ----
    try:
        _append_assessment_to_csv(assessment)
    except Exception:
        logger.warning("Failed to append assessment to ML-Dataset.csv", exc_info=True)

    return result


@router.get("/health")
async def health() -> Dict[str, str]:
    """Lightweight health-check endpoint."""
    engine_status = "ready" if _engine is not None else "not_initialised"
    return {"status": "ok", "engine": engine_status}


@router.get("/stats")
async def stats() -> Dict[str, Any]:
    """Return dataset-wide statistics for the frontend dashboard."""
    engine = get_engine()
    return engine.get_stats()


# ---------------------------------------------------------------------------
# Volunteer endpoints
# ---------------------------------------------------------------------------
@router.get("/volunteers")
async def list_volunteers(university: Optional[str] = None) -> List[VolunteerRecord]:
    """
    Return all registered volunteers.
    Optionally filter by university (case-insensitive).
    """
    volunteers = _read_volunteers()

    if university:
        uni_lower = university.strip().lower()
        volunteers = [
            v for v in volunteers
            if v.get("university", "").lower() == uni_lower
        ]

    return [VolunteerRecord(**v) for v in volunteers]


@router.post("/volunteers", response_model=VolunteerRecord, status_code=201)
async def register_volunteer(volunteer: VolunteerRegister) -> VolunteerRecord:
    """
    Register a new volunteer. Appends to volunteers.json and returns
    the created record with a generated ID and timestamp.
    """
    new_record = {
        "id": f"v_{uuid.uuid4().hex[:8]}",
        "name": volunteer.name,
        "gender": volunteer.gender,
        "age": volunteer.age,
        "semester": volunteer.semester,
        "university": volunteer.university.strip().upper(),
        "phone": volunteer.phone,
        "interests": volunteer.interests,
        "registered_at": datetime.now(timezone.utc).isoformat(),
    }

    # Read, append, write
    volunteers = _read_volunteers()
    volunteers.append(new_record)
    _write_volunteers(volunteers)

    logger.info("New volunteer registered: %s (%s)", new_record["name"], new_record["university"])

    return VolunteerRecord(**new_record)


@router.get("/volunteers/count")
async def volunteer_count() -> Dict[str, int]:
    """Return the total number of registered volunteers."""
    volunteers = _read_volunteers()
    return {"count": len(volunteers)}
