import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Edit2, Save, FileText, Download, Printer } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SOAPReport = () => {
  const { consultationId } = useParams();
  const navigate = useNavigate();
  const [consultation, setConsultation] = useState(null);
  const [patient, setPatient] = useState(null);
  const [editing, setEditing] = useState(false);
  const [soapData, setSoapData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConsultationData();
  }, [consultationId]);

  const fetchConsultationData = async () => {
    try {
      const consultationRes = await axios.get(`${API}/consultations/${consultationId}`);
      setConsultation(consultationRes.data);
      setSoapData(consultationRes.data.soap);
      
      const patientRes = await axios.get(`${API}/patients/${consultationRes.data.patient_id}`);
      setPatient(patientRes.data);
    } catch (error) {
      console.error('Error fetching consultation:', error);
      toast.error('Failed to load consultation data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await axios.put(`${API}/consultations/${consultationId}/soap`, { soap: soapData });
      toast.success('SOAP report updated successfully');
      setEditing(false);
    } catch (error) {
      console.error('Error saving SOAP report:', error);
      toast.error('Failed to save SOAP report');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
        <div className="text-[#5C5C5C]">Loading consultation data...</div>
      </div>
    );
  }

  if (!soapData) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
        <Card className="p-8 text-center">
          <FileText className="w-16 h-16 text-[#E5E2DC] mx-auto mb-4" />
          <p className="text-[#5C5C5C] mb-4">No SOAP report generated yet</p>
          <Button onClick={() => navigate('/dashboard')} className="bg-[#1A4331] text-white hover:bg-[#133124] rounded-full px-6 py-2.5">
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      {/* Header */}
      <header className="glass-header border-b border-[#E5E2DC]/50 print:hidden">
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
            <h1 className="text-2xl font-bold text-[#1A4331]" style={{fontFamily: 'Manrope'}}>SOAP Report</h1>
          </div>
          <div className="flex gap-2">
            {!editing ? (
              <>
                <Button
                  data-testid="edit-soap-btn"
                  onClick={() => setEditing(true)}
                  className="bg-[#8A9A86] text-white hover:bg-[#1A4331] rounded-full px-6 py-2.5 font-medium transition-all"
                >
                  <Edit2 className="w-5 h-5 mr-2" /> Edit
                </Button>
                <Button
                  data-testid="print-soap-btn"
                  onClick={handlePrint}
                  className="bg-[#1A4331] text-white hover:bg-[#133124] rounded-full px-6 py-2.5 font-medium transition-all"
                >
                  <Printer className="w-5 h-5 mr-2" /> Print
                </Button>
              </>
            ) : (
              <Button
                data-testid="save-soap-btn"
                onClick={handleSave}
                className="bg-[#C86A53] text-white hover:bg-[#A85743] rounded-full px-6 py-2.5 font-medium transition-all"
              >
                <Save className="w-5 h-5 mr-2" /> Save Changes
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 md:px-8 py-8">
        {/* Patient Header */}
        <Card data-testid="patient-info-card" className="bg-white border border-[#E5E2DC] rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#1C1C1C]" style={{fontFamily: 'Manrope'}}>{patient?.name}</h2>
              <p className="text-[#5C5C5C]">{patient?.age}y • {patient?.gender} • {patient?.phone}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-[#5C5C5C]">Consultation Date</p>
              <p className="text-[#1C1C1C] font-semibold">{new Date(consultation?.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </Card>

        {/* SOAP Sections */}
        <div className="space-y-6">
          {/* Subjective */}
          <Card data-testid="subjective-section" className="bg-white border border-[#E5E2DC] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#1A4331]/10 flex items-center justify-center">
                <span className="text-[#1A4331] font-bold text-lg">S</span>
              </div>
              <h3 className="text-xl font-semibold text-[#1C1C1C]" style={{fontFamily: 'Manrope'}}>Subjective</h3>
            </div>
            {editing ? (
              <div className="space-y-3">
                {Object.entries(soapData.subjective || {}).map(([key, value]) => (
                  <div key={key}>
                    <label className="text-sm font-semibold text-[#5C5C5C] capitalize mb-1 block">{key}</label>
                    <Textarea
                      value={value}
                      onChange={(e) => setSoapData({
                        ...soapData,
                        subjective: { ...soapData.subjective, [key]: e.target.value }
                      })}
                      className="bg-[#F9F8F6] border border-[#E5E2DC] rounded-xl px-4 py-3 min-h-20"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(soapData.subjective || {}).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-sm font-semibold text-[#5C5C5C] capitalize mb-1">{key}</p>
                    <p className="text-[#1C1C1C]">{value}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Objective */}
          <Card data-testid="objective-section" className="bg-white border border-[#E5E2DC] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#8A9A86]/10 flex items-center justify-center">
                <span className="text-[#8A9A86] font-bold text-lg">O</span>
              </div>
              <h3 className="text-xl font-semibold text-[#1C1C1C]" style={{fontFamily: 'Manrope'}}>Objective</h3>
            </div>
            {editing ? (
              <div className="space-y-3">
                {Object.entries(soapData.objective || {}).map(([key, value]) => (
                  <div key={key}>
                    <label className="text-sm font-semibold text-[#5C5C5C] capitalize mb-1 block">{key}</label>
                    <Textarea
                      value={value}
                      onChange={(e) => setSoapData({
                        ...soapData,
                        objective: { ...soapData.objective, [key]: e.target.value }
                      })}
                      className="bg-[#F9F8F6] border border-[#E5E2DC] rounded-xl px-4 py-3 min-h-20"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(soapData.objective || {}).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-sm font-semibold text-[#5C5C5C] capitalize mb-1">{key}</p>
                    <p className="text-[#1C1C1C]">{value}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Assessment */}
          <Card data-testid="assessment-section" className="bg-white border border-[#E5E2DC] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#C86A53]/10 flex items-center justify-center">
                <span className="text-[#C86A53] font-bold text-lg">A</span>
              </div>
              <h3 className="text-xl font-semibold text-[#1C1C1C]" style={{fontFamily: 'Manrope'}}>Assessment</h3>
            </div>
            {editing ? (
              <div className="space-y-3">
                {Object.entries(soapData.assessment || {}).map(([key, value]) => (
                  <div key={key}>
                    <label className="text-sm font-semibold text-[#5C5C5C] capitalize mb-1 block">{key}</label>
                    <Textarea
                      value={value}
                      onChange={(e) => setSoapData({
                        ...soapData,
                        assessment: { ...soapData.assessment, [key]: e.target.value }
                      })}
                      className="bg-[#F9F8F6] border border-[#E5E2DC] rounded-xl px-4 py-3 min-h-20"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(soapData.assessment || {}).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-sm font-semibold text-[#5C5C5C] capitalize mb-1">{key}</p>
                    <p className="text-[#1C1C1C]">{value}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Plan */}
          <Card data-testid="plan-section" className="bg-white border border-[#E5E2DC] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#1A4331]/10 flex items-center justify-center">
                <span className="text-[#1A4331] font-bold text-lg">P</span>
              </div>
              <h3 className="text-xl font-semibold text-[#1C1C1C]" style={{fontFamily: 'Manrope'}}>Plan</h3>
            </div>
            {editing ? (
              <div className="space-y-3">
                {Object.entries(soapData.plan || {}).map(([key, value]) => (
                  <div key={key}>
                    <label className="text-sm font-semibold text-[#5C5C5C] capitalize mb-1 block">{key}</label>
                    <Textarea
                      value={value}
                      onChange={(e) => setSoapData({
                        ...soapData,
                        plan: { ...soapData.plan, [key]: e.target.value }
                      })}
                      className="bg-[#F9F8F6] border border-[#E5E2DC] rounded-xl px-4 py-3 min-h-20"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(soapData.plan || {}).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-sm font-semibold text-[#5C5C5C] capitalize mb-1">{key}</p>
                    <p className="text-[#1C1C1C]">{value}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Transcript Section */}
        {consultation?.transcript && (
          <Card data-testid="transcript-section" className="bg-[#F9F8F6] border border-[#E5E2DC] rounded-2xl p-6 mt-6 shadow-sm print:hidden">
            <h3 className="text-xl font-semibold text-[#1C1C1C] mb-4" style={{fontFamily: 'Manrope'}}>Full Transcript</h3>
            <p className="text-[#5C5C5C] text-sm leading-relaxed whitespace-pre-wrap">{consultation.transcript}</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SOAPReport;