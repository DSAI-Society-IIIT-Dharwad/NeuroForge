from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
from groq_service import GroqHealthcareService
import tempfile

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Healthcare AI Platform")
api_router = APIRouter(prefix="/api")

groq_service = GroqHealthcareService()

class Patient(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    age: int
    gender: str
    phone: str
    language: str = "en"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PatientCreate(BaseModel):
    name: str
    age: int
    language: str = "en"

class Consultation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    transcript: str = ""
    language: str = "en"
    conversation_history: List[Dict[str, str]] = []
    soap: Optional[Dict[str, Any]] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ConsultationCreate(BaseModel):
    patient_id: str
    language: str = "en"

class ConversationMessage(BaseModel):
    consultation_id: str
    message: str
    role: str = "user"

class SOAPUpdate(BaseModel):
    soap: Dict[str, Any]

@api_router.get("/")
async def root():
    return {"message": "Healthcare AI Platform API", "version": "1.0.0"}

@api_router.post("/patients", response_model=Patient)
async def create_patient(patient: PatientCreate):
    """Create a new patient"""
    patient_obj = Patient(**patient.model_dump())
    doc = patient_obj.model_dump()
    await db.patients.insert_one(doc)
    return patient_obj

@api_router.get("/patients", response_model=List[Patient])
async def get_patients():
    """Get all patients"""
    patients = await db.patients.find({}, {"_id": 0}).to_list(1000)
    return patients

@api_router.get("/patients/{patient_id}", response_model=Patient)
async def get_patient(patient_id: str):
    """Get patient by ID"""
    patient = await db.patients.find_one({"id": patient_id}, {"_id": 0})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@api_router.get("/patients/{patient_id}/history")
async def get_patient_history(patient_id: str):
    """Get consultation history for a patient"""
    consultations = await db.consultations.find(
        {"patient_id": patient_id}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return {"patient_id": patient_id, "consultations": consultations}

@api_router.post("/audio/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = Form("en")
):
    """Transcribe audio file using Groq Whisper"""
    if not file.content_type or not file.content_type.startswith('audio'):
        raise HTTPException(status_code=400, detail="File must be audio format")
    
    try:
        result = await groq_service.transcribe_audio(file.file, file.filename, language)
        return JSONResponse(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/consultations", response_model=Consultation)
async def create_consultation(consultation: ConsultationCreate):
    """Start a new consultation"""
    patient = await db.patients.find_one({"id": consultation.patient_id}, {"_id": 0})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    greeting = await groq_service.start_consultation(patient)
    
    consultation_obj = Consultation(
        patient_id=consultation.patient_id,
        language=consultation.language,
        conversation_history=[{"role": "assistant", "content": greeting["message"]}]
    )
    
    doc = consultation_obj.model_dump()
    await db.consultations.insert_one(doc)
    return consultation_obj

@api_router.post("/consultations/message")
async def process_message(message: ConversationMessage):
    """Process a conversation message"""
    consultation = await db.consultations.find_one(
        {"id": message.consultation_id}, 
        {"_id": 0}
    )
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    
    patient = await db.patients.find_one(
        {"id": consultation["patient_id"]}, 
        {"_id": 0}
    )
    
    conversation_history = consultation.get("conversation_history", [])
    conversation_history.append({"role": message.role, "content": message.message})
    
    response = await groq_service.process_conversation(conversation_history, patient)
    
    if response["status"] == "success":
        conversation_history.append({"role": "assistant", "content": response["message"]})
        
        await db.consultations.update_one(
            {"id": message.consultation_id},
            {
                "$set": {
                    "conversation_history": conversation_history,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
    
    return response

@api_router.post("/consultations/{consultation_id}/extract-soap")
async def extract_soap(consultation_id: str):
    """Extract SOAP format data from consultation"""
    consultation = await db.consultations.find_one(
        {"id": consultation_id}, 
        {"_id": 0}
    )
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    
    conversation_history = consultation.get("conversation_history", [])
    transcript = consultation.get("transcript", "")
    
    soap_result = await groq_service.extract_soap_data(conversation_history, transcript)
    
    if soap_result["status"] == "success":
        await db.consultations.update_one(
            {"id": consultation_id},
            {
                "$set": {
                    "soap": soap_result["soap"],
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
    
    return soap_result

@api_router.put("/consultations/{consultation_id}/soap")
async def update_soap(consultation_id: str, update: SOAPUpdate):
    """Update SOAP report"""
    result = await db.consultations.update_one(
        {"id": consultation_id},
        {
            "$set": {
                "soap": update.soap,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Consultation not found")
    
    return {"status": "success", "message": "SOAP report updated"}

@api_router.get("/consultations", response_model=List[Consultation])
async def get_consultations():
    """Get all consultations"""
    consultations = await db.consultations.find(
        {}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return consultations

@api_router.get("/consultations/{consultation_id}", response_model=Consultation)
async def get_consultation(consultation_id: str):
    """Get consultation by ID"""
    consultation = await db.consultations.find_one(
        {"id": consultation_id}, 
        {"_id": 0}
    )
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    return consultation

@api_router.post("/consultations/{consultation_id}/add-transcript")
async def add_transcript(consultation_id: str, transcript: Dict[str, str]):
    """Add transcript to consultation"""
    existing_consultation = await db.consultations.find_one(
        {"id": consultation_id}, 
        {"_id": 0}
    )
    if not existing_consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    
    current_transcript = existing_consultation.get("transcript", "")
    new_transcript = current_transcript + "\n" + transcript.get("text", "") if current_transcript else transcript.get("text", "")
    
    await db.consultations.update_one(
        {"id": consultation_id},
        {
            "$set": {
                "transcript": new_transcript,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"status": "success", "transcript": new_transcript}

@api_router.get("/analytics")
async def get_analytics():
    """Get platform analytics"""
    total_patients = await db.patients.count_documents({})
    total_consultations = await db.consultations.count_documents({})
    
    recent_consultations = await db.consultations.find(
        {}, 
        {"_id": 0, "created_at": 1, "patient_id": 1}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    return {
        "total_patients": total_patients,
        "total_consultations": total_consultations,
        "recent_consultations": recent_consultations
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
