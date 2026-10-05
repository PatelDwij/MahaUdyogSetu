import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { 
  DEFAULT_BUSINESS_PROFILE,
  DEPARTMENT_METRICS, 
} from './data/mockData';
import { 
  generateDynamicApprovals, 
  generateInitialDocuments, 
  getMatchedSchemes 
} from './data/regulatoryEngine';
import { BusinessProfile, ApprovalItem, DocumentItem, IncentiveScheme } from './types';
import { ExecutiveBriefing } from './components/ExecutiveBriefing';
import { ProcessFlowchartViewer } from './components/ProcessFlowchartViewer';
import { DepartmentDashboard } from './components/DepartmentDashboard';
import { LoginPage } from './components/LoginPage';
import { IndianEntityRegistration } from './components/IndianEntityRegistration';
import { MaitriPortalLayout } from './components/MaitriPortalLayout';
import { 
  Building2, 
  ShieldCheck, 
  GitBranch, 
  FileText, 
  UserCheck, 
  LogOut 
} from 'lucide-react';

import { ApplyVerifyHubPage } from './components/public/ApplyVerifyHubPage';
import { ApplyForServicesPage } from './components/public/ApplyForServicesPage';
import { ListOfServicesPage } from './components/public/ListOfServicesPage';
import { VerifyPermissionPage } from './components/public/VerifyPermissionPage';

import { GrievanceLandingPage } from './components/grievance/GrievanceLandingPage';
import { RegisterGrievancePage } from './components/grievance/RegisterGrievancePage';
import { CheckStatusPage } from './components/grievance/CheckStatusPage';
import { RegisterQueryPage } from './components/grievance/RegisterQueryPage';

import { InvestLandingPage } from './components/invest/InvestLandingPage';
import { KnowYourApprovalsPage } from './components/invest/KnowYourApprovalsPage';
import { IncentiveCalculatorPage } from './components/invest/IncentiveCalculatorPage';
import { TestingLabsPage } from './components/invest/TestingLabsPage';
import { InvestmentPlannerPage } from './components/invest/InvestmentPlannerPage';

import { PublicDashboardPage } from './components/public_dashboard/PublicDashboardPage';
import { DepartmentPublicDetailPage } from './components/public_dashboard/DepartmentPublicDetailPage';

import { FeedbackPage } from './components/feedback/FeedbackPage';
import { MainPortalPage } from './components/portal/MainPortalPage';
import { LanguageSelector } from './components/common/LanguageSelector';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';

function AppContent() {
  const navigate = useNavigate();
  const { isAuthenticated, activeProfile, updateProfile, logout } = useAuth();

  // Navigation view: 'applicant' | 'department' | 'flowchart' | 'briefing'
  const [currentView, setCurrentView] = useState<'applicant' | 'department' | 'flowchart' | 'briefing'>('applicant');

  // Post-login Onboarding Screen to collect Indian Entity details if requested
  const [showEntityForm, setShowEntityForm] = useState<boolean>(false);

  // Dynamic Approvals, Documents & Schemes generated strictly from active profile
  const [approvals, setApprovals] = useState<ApprovalItem[]>(() => {
    try {
      const saved = localStorage.getItem('mahau_active_approvals');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return generateDynamicApprovals(activeProfile);
  });

  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    try {
      const saved = localStorage.getItem('mahau_active_documents');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return generateInitialDocuments(activeProfile);
  });

  const [schemes, setSchemes] = useState<IncentiveScheme[]>(() => getMatchedSchemes(activeProfile));
  const [departmentMetrics] = useState(DEPARTMENT_METRICS);

  const handleUpdateDocuments = (newDocs: DocumentItem[]) => {
    setDocuments(newDocs);
    try {
      localStorage.setItem('mahau_active_documents', JSON.stringify(newDocs));
    } catch (e) {}
  };

  const handleUpdateApprovals = (newApprovals: ApprovalItem[]) => {
    setApprovals(newApprovals);
    try {
      localStorage.setItem('mahau_active_approvals', JSON.stringify(newApprovals));
    } catch (e) {}
  };

  // Live persistent fetch for company applications & documents from Supabase API
  useEffect(() => {
    let isMounted = true;
    async function fetchLiveCompanyData() {
      const storedToken = 
        sessionStorage.getItem('mahau_session_token') || 
        localStorage.getItem('mahau_session_token') ||
        sessionStorage.getItem('mahau_auth_token') ||
        localStorage.getItem('mahau_auth_token');
      if (!storedToken) return;

      try {
        // 1. Fetch Applications
        const appRes = await fetch('/api/applications', {
          headers: {
            Authorization: `Bearer ${storedToken}`
          }
        });
        if (appRes.ok) {
          const data = await appRes.json();
          if (data.applications && Array.isArray(data.applications) && data.applications.length > 0 && isMounted) {
            setApprovals(data.applications);
            try {
              localStorage.setItem('mahau_active_approvals', JSON.stringify(data.applications));
            } catch (e) {}
          }
        }

        // 2. Fetch Documents Vault
        const docRes = await fetch('/api/documents', {
          headers: {
            Authorization: `Bearer ${storedToken}`
          }
        });
        if (docRes.ok) {
          const docData = await docRes.json();
          if (docData.documents && Array.isArray(docData.documents) && isMounted) {
            setDocuments(docData.documents);
            try {
              localStorage.setItem('mahau_active_documents', JSON.stringify(docData.documents));
            } catch (e) {}
          }
        }
      } catch (err) {
        console.warn('Live company data sync notice:', err);
      }
    }

    if (isAuthenticated) {
      fetchLiveCompanyData();
    }
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, activeProfile.id]);

  // When active company profile updates, dynamically update clearances and documents
  const handleUpdateActiveProfile = (newProfile: BusinessProfile) => {
    updateProfile(newProfile);

    // Synchronize dynamic approvals & documents with new profile parameters
    const newApprovals = generateDynamicApprovals(newProfile);
    const newDocs = generateInitialDocuments(newProfile);
    const newSchemes = getMatchedSchemes(newProfile);

    setApprovals(newApprovals);
    setDocuments(newDocs);
    setSchemes(newSchemes);
    try {
      localStorage.setItem('mahau_active_approvals', JSON.stringify(newApprovals));
      localStorage.setItem('mahau_active_documents', JSON.stringify(newDocs));
    } catch (e) {}
  };

  const handleEntityRegistrationComplete = (updatedProfile: BusinessProfile) => {
    handleUpdateActiveProfile(updatedProfile);
    setShowEntityForm(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Render Single Window Portal Dashboard or Secondary Views
  const renderDashboardView = () => {
    if (showEntityForm) {
      return (
        <IndianEntityRegistration
          initialEmail={activeProfile.email || 'arya2007in@gmail.com'}
          initialMobile={activeProfile.mobile || '9825204240'}
          onComplete={handleEntityRegistrationComplete}
          onCancel={() => setShowEntityForm(false)}
        />
      );
    }

    if (currentView === 'applicant') {
      return (
        <MaitriPortalLayout
          profile={activeProfile}
          approvals={approvals}
          documents={documents}
          schemes={schemes}
          onUpdateProfile={handleUpdateActiveProfile}
          onUpdateApprovals={handleUpdateApprovals}
          onUpdateDocuments={handleUpdateDocuments}
          onOpenFlowchart={() => setCurrentView('flowchart')}
          onOpenRegistration={() => setShowEntityForm(true)}
          onLogout={handleLogout}
          onSwitchDepartmentView={() => setCurrentView('department')}
        />
      );
    }

    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-teal-100 selection:text-teal-900">
        {/* Top Universal GovTech Navbar */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              
              {/* Brand & Emblem */}
              <div className="flex items-center gap-3">
                <img 
                  src="/assets/mahau_logo.jpg" 
                  alt="MahaUdyogSetu" 
                  className="h-10 w-auto object-contain rounded-lg shadow-2xs"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black tracking-tight text-slate-900">
                      MahaUdyogSetu <span className="text-teal-700 text-sm font-semibold">(महाराष्ट्र उद्योग सेतु)</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                      Govt of Maharashtra
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 hidden sm:block">
                    Smart Single Window Business Approval, Compliance & Clearance Platform
                  </p>
                </div>
              </div>

              {/* View Navigation Switcher */}
              <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setCurrentView('applicant')}
                  className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    (currentView as string) === 'applicant'
                      ? 'bg-white text-teal-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>Single Window Portal</span>
                </button>

                <button
                  onClick={() => setCurrentView('department')}
                  className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentView === 'department'
                      ? 'bg-white text-teal-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>Department Scrutiny</span>
                </button>

                <button
                  onClick={() => setCurrentView('flowchart')}
                  className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentView === 'flowchart'
                      ? 'bg-white text-teal-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <GitBranch className="w-3.5 h-3.5 text-teal-600" />
                  <span className="hidden md:inline">Clearance Flowchart</span>
                  <span className="md:hidden">Flow</span>
                </button>

                <button
                  onClick={() => setCurrentView('briefing')}
                  className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentView === 'briefing'
                      ? 'bg-white text-teal-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  <span className="hidden md:inline">Architecture Brief</span>
                  <span className="md:hidden">Brief</span>
                </button>
              </nav>

              {/* Active Company, Language Selector & Logout */}
              <div className="flex items-center gap-2">
                <LanguageSelector />
                <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-xs font-bold">
                  <UserCheck className="w-3.5 h-3.5 text-teal-700" />
                  <span>{activeProfile.name.slice(0, 20)}...</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  title="Log out back to login/registration"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-500" />
                  <span>Log Out</span>
                </button>
              </div>

            </div>
          </div>
        </header>

        {/* Main App Canvas */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {currentView === 'department' && (
            <DepartmentDashboard
              approvals={approvals}
              departmentMetrics={departmentMetrics}
              activeProfile={activeProfile}
              onUpdateApprovals={setApprovals}
              onOpenFlowchart={() => setCurrentView('flowchart')}
            />
          )}

          {currentView === 'flowchart' && (
            <ProcessFlowchartViewer
              activeProfileName={activeProfile.name}
            />
          )}

          {currentView === 'briefing' && (
            <ExecutiveBriefing
              onExploreFlowchart={() => setCurrentView('flowchart')}
              onLaunchApplicantDemo={() => setCurrentView('applicant')}
              onLaunchDepartmentDemo={() => setCurrentView('department')}
            />
          )}
        </main>
      </div>
    );
  };

  return (
    <Routes>
      {/* PUBLIC ROUTES (Accessible without login) */}
      <Route path="/" element={<LoginPage initialView="home" />} />
      <Route path="/home" element={<LoginPage initialView="home" />} />
      <Route path="/landing" element={<LoginPage initialView="home" />} />
      <Route path="/login" element={<LoginPage initialView="login" />} />
      <Route path="/register" element={<LoginPage initialView="register" />} />
      <Route path="/forgot-password" element={<LoginPage initialView="login" />} />
      <Route path="/otp-verification" element={<Navigate to="/register" replace />} />

      {/* PROTECTED ROUTES (All require active authentication) */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            {renderDashboardView()}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/my-dashboard" 
        element={
          <ProtectedRoute>
            {renderDashboardView()}
          </ProtectedRoute>
        } 
      />
      {/* Single Window Portal Dashboard & All Integrated Tab/Sidebar Views */}
      <Route 
        path="/services-provided" 
        element={
          <ProtectedRoute>
            {renderDashboardView()}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/services" 
        element={
          <ProtectedRoute>
            {renderDashboardView()}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/services-applied" 
        element={
          <ProtectedRoute>
            {renderDashboardView()}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/applications" 
        element={
          <ProtectedRoute>
            {renderDashboardView()}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/caf" 
        element={
          <ProtectedRoute>
            {renderDashboardView()}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/payment-history" 
        element={
          <ProtectedRoute>
            {renderDashboardView()}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/intelligence-engine" 
        element={
          <ProtectedRoute>
            {renderDashboardView()}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/imprisonment-provisions" 
        element={
          <ProtectedRoute>
            {renderDashboardView()}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/business-profile" 
        element={
          <ProtectedRoute>
            {renderDashboardView()}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/business-profile/show" 
        element={
          <ProtectedRoute>
            {renderDashboardView()}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/business-profile/factory-units" 
        element={
          <ProtectedRoute>
            {renderDashboardView()}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/business-profile/midc-plot" 
        element={
          <ProtectedRoute>
            {renderDashboardView()}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/investor-wizard" 
        element={
          <ProtectedRoute>
            {renderDashboardView()}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/investor-wizard/run" 
        element={
          <ProtectedRoute>
            {renderDashboardView()}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/investor-wizard/applied-list" 
        element={
          <ProtectedRoute>
            {renderDashboardView()}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/investor-wizard/sectoral-approvals" 
        element={
          <ProtectedRoute>
            {renderDashboardView()}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/document-repository" 
        element={
          <ProtectedRoute>
            {renderDashboardView()}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/old-applications" 
        element={
          <ProtectedRoute>
            {renderDashboardView()}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/firm-registration" 
        element={
          <ProtectedRoute>
            {renderDashboardView()}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/nsws" 
        element={
          <ProtectedRoute>
            {renderDashboardView()}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/feedback" 
        element={
          <ProtectedRoute>
            {renderDashboardView()}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/query" 
        element={
          <ProtectedRoute>
            {renderDashboardView()}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/grievance" 
        element={
          <ProtectedRoute>
            {renderDashboardView()}
          </ProtectedRoute>
        } 
      />

      {/* Standalone Public & Dedicated Support Portals */}
      <Route 
        path="/grievance/portal" 
        element={
          <ProtectedRoute>
            <GrievanceLandingPage profile={activeProfile} />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/grievance-portal" 
        element={
          <ProtectedRoute>
            <GrievanceLandingPage profile={activeProfile} />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/grievance/register" 
        element={
          <ProtectedRoute>
            <RegisterGrievancePage profile={activeProfile} />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/grievance/status" 
        element={
          <ProtectedRoute>
            <CheckStatusPage profile={activeProfile} />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/grievance/query" 
        element={
          <ProtectedRoute>
            <RegisterQueryPage profile={activeProfile} />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/feedback/hub" 
        element={
          <ProtectedRoute>
            <FeedbackPage profile={activeProfile} />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/feedback-center" 
        element={
          <ProtectedRoute>
            <FeedbackPage profile={activeProfile} />
          </ProtectedRoute>
        } 
      />

      {/* Invest in Maharashtra Protected Routes */}
      <Route 
        path="/invest" 
        element={
          <ProtectedRoute>
            <InvestLandingPage profile={activeProfile} />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/invest/know-your-approvals" 
        element={
          <ProtectedRoute>
            <KnowYourApprovalsPage profile={activeProfile} />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/invest/incentive-calculator" 
        element={
          <ProtectedRoute>
            <IncentiveCalculatorPage profile={activeProfile} />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/invest/testing-labs" 
        element={
          <ProtectedRoute>
            <TestingLabsPage profile={activeProfile} />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/invest/planner" 
        element={
          <ProtectedRoute>
            <InvestmentPlannerPage profile={activeProfile} />
          </ProtectedRoute>
        } 
      />

      {/* Public Dashboard Protected Routes */}
      <Route 
        path="/public-dashboard" 
        element={
          <ProtectedRoute>
            <PublicDashboardPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/public-dashboards" 
        element={
          <ProtectedRoute>
            <PublicDashboardPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/public-dashboard/department/:deptId" 
        element={
          <ProtectedRoute>
            <DepartmentPublicDetailPage />
          </ProtectedRoute>
        } 
      />

      {/* Feedback Protected Route */}
      <Route 
        path="/feedback" 
        element={
          <ProtectedRoute>
            <FeedbackPage profile={activeProfile} />
          </ProtectedRoute>
        } 
      />

      {/* Services & Approvals Hub Protected Routes */}
      <Route 
        path="/apply-verify" 
        element={
          <ProtectedRoute>
            <ApplyVerifyHubPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/apply-for-services" 
        element={
          <ProtectedRoute>
            <ApplyForServicesPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/list-of-services" 
        element={
          <ProtectedRoute>
            <ListOfServicesPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/service-catalogue" 
        element={
          <ProtectedRoute>
            <ListOfServicesPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/verify-permission" 
        element={
          <ProtectedRoute>
            <VerifyPermissionPage />
          </ProtectedRoute>
        } 
      />

      {/* Fallback Catch-All Route */}
      <Route 
        path="*" 
        element={
          <ProtectedRoute>
            <Navigate to="/services-provided" replace />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
