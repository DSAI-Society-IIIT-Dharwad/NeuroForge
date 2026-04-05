import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Users, Activity, FileText, Search, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [patientsRes, analyticsRes] = await Promise.all([
        axios.get(`${API}/patients`),
        axios.get(`${API}/analytics`)
      ]);
      setPatients(patientsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      {/* Header */}
      <header className="glass-header border-b border-[#E5E2DC]/50">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              data-testid="back-to-home-btn"
              onClick={() => navigate('/')}
              variant="ghost"
              className="text-[#5C5C5C] hover:text-[#1C1C1C]"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Activity className="w-8 h-8 text-[#1A4331]" />
              <h1 className="text-2xl font-bold text-[#1A4331]" style={{fontFamily: 'Manrope'}}>Dashboard</h1>
            </div>
          </div>
          <Button
            data-testid="new-consultation-btn"
            onClick={() => navigate('/consultation/new')}
            className="bg-[#1A4331] text-white hover:bg-[#133124] rounded-full px-6 py-2.5 font-medium transition-all"
          >
            <Plus className="w-5 h-5 mr-2" /> New Consultation
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 md:px-8 py-8">
        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card data-testid="total-patients-card" className="bg-white border border-[#E5E2DC] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#5C5C5C] mb-1">Total Patients</p>
                  <p className="text-3xl font-bold text-[#1A4331]" style={{fontFamily: 'Manrope'}}>{analytics.total_patients}</p>
                </div>
                <Users className="w-12 h-12 text-[#8A9A86]" />
              </div>
            </Card>
            
            <Card data-testid="total-consultations-card" className="bg-white border border-[#E5E2DC] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#5C5C5C] mb-1">Total Consultations</p>
                  <p className="text-3xl font-bold text-[#1A4331]" style={{fontFamily: 'Manrope'}}>{analytics.total_consultations}</p>
                </div>
                <FileText className="w-12 h-12 text-[#8A9A86]" />
              </div>
            </Card>
            
            <Card data-testid="active-today-card" className="bg-white border border-[#E5E2DC] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#5C5C5C] mb-1">Recent Activity</p>
                  <p className="text-3xl font-bold text-[#1A4331]" style={{fontFamily: 'Manrope'}}>{analytics.recent_consultations?.length || 0}</p>
                </div>
                <Activity className="w-12 h-12 text-[#8A9A86]" />
              </div>
            </Card>
          </div>
        )}

        {/* Patients Section */}
        <div className="bg-white border border-[#E5E2DC] rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-[#1C1C1C]" style={{fontFamily: 'Manrope'}}>Patients</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#8A8A8A]" />
              <Input
                data-testid="search-patients-input"
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[#F9F8F6] border border-[#E5E2DC] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8A9A86] focus:border-transparent"
              />
            </div>
          </div>          {loading ? (
            <div className="text-center py-12 text-[#5C5C5C]">Loading patients...</div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-[#E5E2DC] mx-auto mb-4" />
              <p className="text-[#5C5C5C] mb-4">No patients found</p>
              <Button
                data-testid="create-first-patient-btn"
                onClick={() => navigate('/consultation/new')}
                className="bg-[#1A4331] text-white hover:bg-[#133124] rounded-full px-6 py-2.5 font-medium"
              >
                Create First Patient
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPatients.map((patient) => (
                <Card
                  key={patient.id}
                  data-testid={`patient-card-${patient.id}`}
                  onClick={() => navigate(`/patient/${patient.id}/history`)}
                  className="bg-[#F9F8F6] border border-[#E5E2DC] rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-[#1C1C1C]" style={{fontFamily: 'Manrope'}}>{patient.name}</h3>
                      <p className="text-sm text-[#5C5C5C]">{patient.age}y • {patient.gender}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#1A4331] text-white flex items-center justify-center font-semibold">
                      {patient.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <p className="text-sm text-[#5C5C5C] mb-2">{patient.phone}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2 py-1 bg-[#8A9A86]/20 text-[#1A4331] rounded-full">
                      {patient.language.toUpperCase()}
                    </span>
                    <span className="text-xs text-[#8A8A8A]">
                      {new Date(patient.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );