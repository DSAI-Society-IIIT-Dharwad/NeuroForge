from groq import Groq
import os
from typing import Dict, List
import json

class GroqHealthcareService:
    def __init__(self):
        api_key = os.environ.get('GROQ_API_KEY')
        if not api_key:
            raise ValueError("GROQ_API_KEY not found in environment")
        self.client = Groq(api_key=api_key)
        self.model_llm = "llama-3.3-70b-versatile"
        self.model_whisper = "whisper-large-v3"
    
    async def transcribe_audio(self, audio_file, filename: str, language: str = "en") -> Dict:
        """Transcribe audio using Groq Whisper"""
        try:
            transcript = self.client.audio.transcriptions.create(
                file=(filename, audio_file.read()),
                model=self.model_whisper,
                language=language,
                temperature=0.0
            )
            return {
                "status": "success",
                "text": transcript.text,
                "language": language
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    async def start_consultation(self, patient_info: Dict) -> Dict:
        """Start a new consultation conversation"""
        system_prompt = f"""You are an empathetic healthcare AI assistant conducting a patient consultation. 
        
Patient Information:
        - Name: {patient_info.get('name', 'Patient')}
        - Age: {patient_info.get('age', 'Unknown')}
        - Gender: {patient_info.get('gender', 'Unknown')}
        
Your role:
        1. Ask relevant questions about symptoms
        2. Gather medical history
        3. Understand current complaints
        4. Be empathetic and professional
        5. Keep responses concise and clear
        
Start by greeting the patient and asking about their chief complaint."""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model_llm,
                messages=[{"role": "system", "content": system_prompt}],
                temperature=0.7,
                max_tokens=300
            )
            return {
                "status": "success",
                "message": response.choices[0].message.content
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    async def process_conversation(self, conversation_history: List[Dict], patient_info: Dict) -> Dict:
        """Process multi-turn conversation"""
        system_prompt = f"""You are an empathetic healthcare AI assistant. 
        
Patient: {patient_info.get('name')} ({patient_info.get('age')}y, {patient_info.get('gender')})
        
Guidelines:
        - Ask follow-up questions based on symptoms
        - Gather complete medical history
        - Be thorough but concise
        - Show empathy
        - If you have enough information, suggest the consultation is complete"""
        
        messages = [{"role": "system", "content": system_prompt}] + conversation_history
        
        try:
            response = self.client.chat.completions.create(
                model=self.model_llm,
                messages=messages,
                temperature=0.7,
                max_tokens=300
            )
            return {
                "status": "success",
                "message": response.choices[0].message.content
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    async def extract_soap_data(self, conversation_history: List[Dict], transcript: str) -> Dict:
        """Extract structured SOAP format data from conversation"""
        extraction_prompt = f"""Based on the following patient consultation conversation and transcript, extract structured medical information in SOAP format.

Transcript: {transcript}

Conversation:
{json.dumps(conversation_history, indent=2)}

Extract and return ONLY a valid JSON object with this exact structure:
{{
  "subjective": {{"symptoms": "list main symptoms", "duration": "how long", "severity": "mild/moderate/severe", "history": "relevant medical history"}},
  "objective": {{"observations": "any observations mentioned", "vitals": "if mentioned"}},
  "assessment": {{"diagnosis": "preliminary assessment", "differential": "other possibilities"}},
  "plan": {{"treatment": "recommended treatment", "medications": "if any", "follow_up": "follow-up instructions", "precautions": "any precautions"}}
}}

IMPORTANT: Return ONLY the JSON object, no additional text."""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model_llm,
                messages=[{"role": "user", "content": extraction_prompt}],
                temperature=0.3,
                max_tokens=800
            )
            
            content = response.choices[0].message.content.strip()
            
            if content.startswith('```json'):
                content = content[7:]
            if content.startswith('```'):
                content = content[3:]
            if content.endswith('```'):
                content = content[:-3]
            content = content.strip()
            
            soap_data = json.loads(content)
            return {"status": "success", "soap": soap_data}
        except json.JSONDecodeError as e:
            return {"status": "error", "message": f"Failed to parse SOAP data: {str(e)}"}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    async def generate_diagnosis(self, symptoms: str, history: str) -> Dict:
        """Generate AI-powered diagnosis suggestions"""
        prompt = f"""Based on the following symptoms and history, provide a preliminary medical assessment.

Symptoms: {symptoms}
History: {history}

Provide:
1. Most likely diagnosis
2. Alternative diagnoses to consider
3. Recommended tests/investigations
4. General advice

IMPORTANT: Always include a disclaimer that this is AI-generated and should be confirmed by a healthcare professional."""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model_llm,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,
                max_tokens=500
            )
            return {
                "status": "success",
                "diagnosis": response.choices[0].message.content
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}