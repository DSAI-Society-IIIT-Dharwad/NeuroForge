import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import NewConsultation from './pages/NewConsultation';
import PatientHistory from './pages/PatientHistory';
import SOAPReport from './pages/SOAPReport';
import '@/App.css';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/consultation/new" element={<NewConsultation />} />
          <Route path="/patient/:patientId/history" element={<PatientHistory />} />
          <Route path="/consultation/:consultationId/soap" element={<SOAPReport />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
    );
}

export default App;