import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, FileAudio, Activity, Brain, FileText, History, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Mic className="w-8 h-8 text-[#1A4331]" />,
      title: "Multilingual Voice Capture",
      description: "Record consultations in English, Hindi, or Kannada with real-time transcription"
    },
    {
      icon: <Brain className="w-8 h-8 text-[#1A4331]" />,
      title: "AI Conversation Intelligence",
      description: "Dynamic question branching and context-aware medical dialogue"
    },
    {
      icon: <FileText className="w-8 h-8 text-[#1A4331]" />,
      title: "SOAP Report Generation",
      description: "Automatic structured medical reports with editable fields"
    },
    {
      icon: <History className="w-8 h-8 text-[#1A4331]" />,
      title: "Longitudinal Tracking",
      description: "Complete patient history with searchable consultation records"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      {/* Header */}
      <header className="glass-header fixed top-0 left-0 right-0 z-50 border-b border-[#E5E2DC]/50">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-8 h-8 text-[#1A4331]" />
            <h1 className="text-2xl font-bold text-[#1A4331]" style={{fontFamily: 'Manrope'}}>MediWhisper AI</h1>
          </div>
          <Button 
            data-testid="get-started-header-btn"
            onClick={() => navigate('/dashboard')}
            className="bg-[#1A4331] text-white hover:bg-[#133124] rounded-full px-6 py-2.5 font-medium transition-all"
          >
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="hero-section pt-32 pb-16 px-6 md:px-8"
        style={{
          backgroundImage: `url(https://static.prod-images.emergentagent.com/jobs/a0338048-e637-4f04-b1d0-ad921f827d31/images/e27694ff0c64d597b9adfc0807a03acd0ebeb2a9b90226947f7f081715a11b62.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay',
          backgroundColor: 'rgba(249, 248, 246, 0.95)'
        }}
      >
        <div className="max-w-7xl mx-auto text-center">
          <h2 
            className="text-4xl sm:text-5xl lg:text-6xl tracking-tighter font-bold text-[#1C1C1C] mb-6 animate-fade-in-up"
            style={{fontFamily: 'Manrope'}}
          >
            AI-Powered Healthcare<br />Consultation Platform
          </h2>
          <p className="text-lg sm:text-xl text-[#5C5C5C] max-w-3xl mx-auto mb-10 leading-relaxed">
            Transform patient consultations with multilingual voice intelligence, real-time transcription, 
            and automated SOAP documentation. Built for healthcare professionals.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              data-testid="start-consultation-btn"
              onClick={() => navigate('/consultation/new')}
              className="bg-[#1A4331] text-white hover:bg-[#133124] rounded-full px-8 py-3 text-lg font-medium transition-all hover:-translate-y-1 hover:shadow-md"
            >
              Start New Consultation <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button>
              data-testid="view-dashboard-btn"
              onClick={() => navigate('/dashboard')}
              className="bg-[#E5E2DC]/30 text-[#1C1C1C] hover:bg-[#E5E2DC]/50 rounded-full px-8 py-3 text-lg font-medium transition-all border border-[#E5E2DC]"
            >
              View Dashboard
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 md:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.2em] uppercase font-bold text-[#5C5C5C] mb-3">Key Features</p>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl tracking-tight font-semibold text-[#1C1C1C]" style={{fontFamily: 'Manrope'}}>
              Complete Conversational Intelligence
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                data-testid={`feature-card-${index}`}
                className="feature-card bg-[#FFFFFF] border border-[#E5E2DC] rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="mb-4">{feature.icon}</div>
                <h4 className="text-xl font-semibold text-[#1C1C1C] mb-3" style={{fontFamily: 'Manrope'}}>
                  {feature.title}
                </h4>
                <p className="text-base leading-relaxed text-[#5C5C5C]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 md:px-8 bg-gradient-to-b from-[#F9F8F6] to-[#FFFFFF]">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl sm:text-3xl lg:text-4xl tracking-tight font-semibold text-[#1C1C1C] mb-6" style={{fontFamily: 'Manrope'}}>
            Ready to Transform Your Practice?
          </h3>
          <p className="text-lg text-[#5C5C5C] mb-8 leading-relaxed">
            Join healthcare professionals using AI to improve patient documentation and care quality.
          </p>
          <Button
            data-testid="cta-get-started-btn"
            onClick={() => navigate('/dashboard')}
            className="bg-[#C86A53] text-white hover:bg-[#A85743] rounded-full px-8 py-3 text-lg font-medium transition-all hover:-translate-y-1 hover:shadow-md"
          >
            Get Started Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1A4331] text-white py-8 px-6 md:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-white/80">© 2026 MediWhisper AI. Healthcare Conversational Intelligence Platform.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;