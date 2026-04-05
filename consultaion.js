import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Mic, Upload, Send, Loader2, FileAudio, User, Phone, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const NewConsultation = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('patient'); // patient, mode, conversation, complete
  const [patientData, setPatientData] = useState({
    name: '',
    age: '',
    gender: '',
    phone: '',
    language: 'en'
  });
  const [mode, setMode] = useState(null); // 'live' or 'upload'
  const [recording, setRecording] = useState(false);
  const [consultationId, setConsultationId] = useState(null);
  const [patientId, setPatientId] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);

  const handlePatientSubmit = async (e) => {
    e.preventDefault();
    if (!patientData.name || !patientData.age || !patientData.gender || !patientData.phone) {
      toast.error('Please fill all patient details');
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.post(`${API}/patients`, patientData);
      setPatientId(response.data.id);
      setStep('mode');
      toast.success('Patient created successfully');
    } catch (error) {
      console.error('Error creating patient:', error);
      toast.error('Failed to create patient');
    } finally {
      setLoading(false);
    }
  };
    const startConsultation = async (selectedMode) => {
    setMode(selectedMode);
    try {
      setLoading(true);
      const response = await axios.post(`${API}/consultations`, {
        patient_id: patientId,
        language: patientData.language
      });
      setConsultationId(response.data.id);
      setConversationHistory(response.data.conversation_history || []);
      setStep('conversation');
      toast.success('Consultation started');
    } catch (error) {
      console.error('Error starting consultation:', error);
      toast.error('Failed to start consultation');
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setRecording(true);
      toast.success('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      toast.info('Processing audio...');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioFile(file);
      await transcribeAudio(file);
    }
  };

  const transcribeAudio = async (audioBlob) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.wav');
      formData.append('language', patientData.language);

      const response = await axios.post(`${API}/audio/transcribe`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.status === 'success') {
        const transcribedText = response.data.text;
        setTranscript(prev => prev + ' ' + transcribedText);
        
        await axios.post(`${API}/consultations/${consultationId}/add-transcript`, {
          text: transcribedText
        });
        
        await sendMessage(transcribedText, 'user');
        toast.success('Audio transcribed');
      } else {
        toast.error('Transcription failed');
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      toast.error('Failed to transcribe audio');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (message, role = 'user') => {
    try {
      setLoading(true);
      const response = await axios.post(`${API}/consultations/message`, {
        consultation_id: consultationId,
        message: message,
        role: role
      });

      if (response.data.status === 'success') {
        setConversationHistory(prev => [
          ...prev,
          { role: role, content: message },
          { role: 'assistant', content: response.data.message }
        ]);
        setUserMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleTextMessage = (e) => {
    e.preventDefault();
    if (userMessage.trim()) {
      sendMessage(userMessage);
    }
  };

  const completeConsultation = async () => {
    try {
      setLoading(true);
      await axios.post(`${API}/consultations/${consultationId}/extract-soap`);
      toast.success('SOAP report generated');
      navigate(`/consultation/${consultationId}/soap`);
    } catch (error) {
      console.error('Error completing consultation:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      {/* Header */}
      <header className="glass-header border-b border-[#E5E2DC]/50">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              data-testid="back-btn"
              onClick={() => navigate('/dashboard')}
              variant="ghost"
              className="text-[#5C5C5C] hover:text-[#1C1C1C]"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-[#1A4331]" style={{fontFamily: 'Manrope'}}>New Consultation</h1>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 md:px-8 py-8">
        {/* Step 1: Patient Information */}
        {step === 'patient' && (
          <Card data-testid="patient-form-card" className="bg-white border border-[#E5E2DC] rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-[#1C1C1C] mb-6" style={{fontFamily: 'Manrope'}}>Patient Information</h2>
            <form onSubmit={handlePatientSubmit} className="space-y-4">
              <div>
                <Label className="text-sm font-semibold text-[#1C1C1C] mb-1 block">Full Name</Label>
                <Input
                  data-testid="patient-name-input"
                  type="text"
                  value={patientData.name}
                  onChange={(e) => setPatientData({...patientData, name: e.target.value})}
                  className="bg-[#F9F8F6] border border-[#E5E2DC] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8A9A86] focus:border-transparent w-full"
                  placeholder="Enter patient name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-[#1C1C1C] mb-1 block">Age</Label>
                  <Input
                    data-testid="patient-age-input"
                    type="number"
                    value={patientData.age}
                    onChange={(e) => setPatientData({...patientData, age: e.target.value})}
                    className="bg-[#F9F8F6] border border-[#E5E2DC] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8A9A86] focus:border-transparent w-full"
                    placeholder="Age"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-semibold text-[#1C1C1C] mb-1 block">Gender</Label>
                  <Select value={patientData.gender} onValueChange={(value) => setPatientData({...patientData, gender: value})}>
                    <SelectTrigger data-testid="patient-gender-select" className="bg-[#F9F8F6] border border-[#E5E2DC] rounded-xl px-4 py-3">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-semibold text-[#1C1C1C] mb-1 block">Phone Number</Label>
                <Input
                  data-testid="patient-phone-input"
                  type="tel"
                  value={patientData.phone}
                  onChange={(e) => setPatientData({...patientData, phone: e.target.value})}
                  className="bg-[#F9F8F6] border border-[#E5E2DC] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8A9A86] focus:border-transparent w-full"
                  placeholder="Enter phone number"
                />
              </div>
              
              <div>
                <Label className="text-sm font-semibold text-[#1C1C1C] mb-1 block">Preferred Language</Label>
                <Select value={patientData.language} onValueChange={(value) => setPatientData({...patientData, language: value})}>
                  <SelectTrigger data-testid="patient-language-select" className="bg-[#F9F8F6] border border-[#E5E2DC] rounded-xl px-4 py-3">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">Hindi (हिंदी)</SelectItem>
                    <SelectItem value="kn">Kannada (ಕನ್ನಡ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                data-testid="submit-patient-btn"
                type="submit"
                disabled={loading}
                className="w-full bg-[#1A4331] text-white hover:bg-[#133124] rounded-full px-6 py-3 font-medium transition-all mt-6"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue to Consultation'}
              </Button>
            </form>
          </Card>
        )}

        {/* Step 2: Mode Selection */}
        {step === 'mode' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-[#1C1C1C] text-center" style={{fontFamily: 'Manrope'}}>Choose Consultation Mode</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card
                data-testid="live-recording-mode-btn"
                onClick={() => startConsultation('live')}
                className="bg-white border-2 border-[#E5E2DC] rounded-2xl p-8 hover:border-[#1A4331] hover:shadow-lg transition-all cursor-pointer text-center"
              >
                <Mic className="w-16 h-16 text-[#1A4331] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[#1C1C1C] mb-2" style={{fontFamily: 'Manrope'}}>Live Recording</h3>
                <p className="text-[#5C5C5C]">Record consultation in real-time using your microphone</p>
              </Card>
              
              <Card
                data-testid="upload-audio-mode-btn"
                onClick={() => startConsultation('upload')}
                className="bg-white border-2 border-[#E5E2DC] rounded-2xl p-8 hover:border-[#1A4331] hover:shadow-lg transition-all cursor-pointer text-center"
              >
                <Upload className="w-16 h-16 text-[#1A4331] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[#1C1C1C] mb-2" style={{fontFamily: 'Manrope'}}>Upload Audio</h3>
                <p className="text-[#5C5C5C]">Upload pre-recorded audio file for transcription</p>
              </Card>
            </div>
          </div>
        )}

        {/* Step 3: Conversation */}
        {step === 'conversation' && (
          <div className="space-y-6">
            {/* Recording/Upload Interface */}
            <Card 
              className="bg-gradient-to-b from-[#F9F8F6] to-[#FFFFFF] border border-[#E5E2DC] rounded-2xl p-6"
              style={{
                backgroundImage: mode === 'live' ? `url(https://static.prod-images.emergentagent.com/jobs/a0338048-e637-4f04-b1d0-ad921f827d31/images/419d588c0d98fe7e2f12c823881fc50135b2e9fdd37752dba7ba3e10fb8167e7.png)` : 'none',
                backgroundSize: 'cover',
                backgroundBlendMode: 'overlay'
              }}
            >
              {mode === 'live' ? (
                <div className="text-center py-8">
                  {!recording ? (
                    <Button
                      data-testid="start-recording-btn"
                      onClick={startRecording}
                      className="bg-[#C86A53] text-white hover:bg-[#A85743] rounded-full px-8 py-4 font-medium transition-all"
                    >
                      <Mic className="w-6 h-6 mr-2" /> Start Recording
                    </Button>
                  ) : (
                    <div>
                      <div className="flex items-center justify-center mb-4">
                        <div className="w-4 h-4 bg-[#C86A53] rounded-full recording-pulse"></div>
                        <span className="ml-3 text-lg font-semibold text-[#1C1C1C]">Recording...</span>
                      </div>
                      <Button
                        data-testid="stop-recording-btn"
                        onClick={stopRecording}
                        className="bg-[#1A4331] text-white hover:bg-[#133124] rounded-full px-8 py-3 font-medium transition-all"
                      >
                        Stop Recording
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    data-testid="upload-audio-btn"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-[#1A4331] text-white hover:bg-[#133124] rounded-full px-8 py-4 font-medium transition-all"
                  >
                    <Upload className="w-6 h-6 mr-2" /> Upload Audio File
                  </Button>
                  {audioFile && (
                    <p className="mt-4 text-sm text-[#5C5C5C]">File: {audioFile.name}</p>
                  )}
                </div>
              )}
              
              {transcript && (
                <div className="mt-6 p-4 bg-white/80 backdrop-blur-sm rounded-xl">
                  <p className="text-xs tracking-[0.2em] uppercase font-bold text-[#5C5C5C] mb-2">Transcript</p>
                  <p className="text-[#1C1C1C]">{transcript}</p>
                </div>
              )}
            </Card>

            {/* Conversation History */}
            <Card data-testid="conversation-history-card" className="bg-white border border-[#E5E2DC] rounded-2xl p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-[#1C1C1C] mb-4" style={{fontFamily: 'Manrope'}}>Conversation</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                {conversationHistory.map((msg, index) => (
                  <div
                    key={index}
                    data-testid={`conversation-message-${index}`}
                    className={`conversation-message p-4 rounded-xl ${msg.role === 'user' ? 'bg-[#8A9A86]/10 ml-8' : 'bg-[#F9F8F6] mr-8'}`}
                  >
                    <p className="text-xs tracking-[0.2em] uppercase font-bold text-[#5C5C5C] mb-1">
                      {msg.role === 'user' ? 'Patient' : 'AI Assistant'}
                    </p>
                    <p className="text-[#1C1C1C]">{msg.content}</p>
                  </div>
                ))}
              </div>
              
              {/* Message Input */}
              <form onSubmit={handleTextMessage} className="flex gap-2">
                <Input
                  data-testid="message-input"
                  type="text"
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  placeholder="Type patient's response..."
                  className="flex-1 bg-[#F9F8F6] border border-[#E5E2DC] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8A9A86] focus:border-transparent"
                  disabled={loading}
                />
                <Button
                  data-testid="send-message-btn"
                  type="submit"
                  disabled={loading || !userMessage.trim()}
                  className="bg-[#1A4331] text-white hover:bg-[#133124] rounded-full px-6 py-3 font-medium transition-all"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </form>
            </Card>

            {/* Complete Button */}
            <Button
              data-testid="complete-consultation-btn"
              onClick={completeConsultation}
              disabled={loading || conversationHistory.length < 2}
              className="w-full bg-[#C86A53] text-white hover:bg-[#A85743] rounded-full px-6 py-3 font-medium transition-all"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete & Generate SOAP Report'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewConsultation;