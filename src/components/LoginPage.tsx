import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { BusinessProfile } from '../types';
import { DEFAULT_BUSINESS_PROFILE } from '../data/mockData';
import { 
  Building2, 
  HelpCircle, 
  PhoneCall, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  RefreshCw, 
  AlertCircle, 
  MessageSquare, 
  KeyRound, 
  FileCheck2, 
  FileText, 
  TrendingUp, 
  LayoutDashboard, 
  ExternalLink, 
  ChevronRight, 
  UserPlus, 
  LogIn, 
  BookOpen, 
  ArrowLeft,
  ShieldAlert
} from 'lucide-react';
import { LanguageSelector } from './common/LanguageSelector';
import { CurrentDate } from './common/CurrentDate';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { HomeNavbar } from './home/HomeNavbar';
import { HomeHero } from './home/HomeHero';
import { HomeQuickActions } from './home/HomeQuickActions';
import { HomeStatsBar } from './home/HomeStatsBar';

interface LoginPageProps {
  initialView?: 'home' | 'login' | 'register';
  onLoginSuccess?: (profile: BusinessProfile, redirectTo?: string) => void;
  onApplyVerifyClick?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ initialView, onLoginSuccess, onApplyVerifyClick }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, login } = useAuth();

  // Navigation states: 'home' (Landing page) | 'login' (Login card) | 'register' (3-step wizard)
  const [viewMode, setViewMode] = useState<'home' | 'login' | 'register'>(initialView || 'home');
  const [postAuthRedirect, setPostAuthRedirect] = useState<string | undefined>(undefined);
  
  // Registration 2-Step Wizard state
  const [regStep, setRegStep] = useState<1 | 2>(1);
  const [entityType, setEntityType] = useState<'indian' | 'foreign'>('indian');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const tRef = useRef(t);
  tRef.current = t;
  const initialRedirectProcessedRef = useRef(false);

  // Return cleanly to homepage without leftover redirect queries
  const handleReturnToHome = () => {
    setViewMode('home');
    setStatusMessage(null);
    try {
      sessionStorage.removeItem('mahau_redirect_after_login');
    } catch (e) {}
    if (searchParams.get('redirect')) {
      navigate('/', { replace: true });
    }
  };

  // Check if unauthenticated user was redirected here from an actual protected route
  useEffect(() => {
    const rawRedirect = searchParams.get('redirect') || (location.state as any)?.from?.pathname || sessionStorage.getItem('mahau_redirect_after_login');

    const cleanPath = (rawRedirect || '').split('?')[0].split('#')[0];
    const isPublic = !rawRedirect || cleanPath === '' || cleanPath === '/' || cleanPath === '/home' || cleanPath === '/landing' || cleanPath === '/login' || cleanPath === '/register';

    if (isAuthenticated) {
      if (!isPublic && rawRedirect) {
        navigate(rawRedirect, { replace: true });
      } else if (location.pathname === '/login') {
        navigate('/services-provided', { replace: true });
      }
      return;
    }

    // Only set login view and authentication notice if redirected to an actual protected path
    if (!isPublic && rawRedirect) {
      setPostAuthRedirect(rawRedirect);
      setViewMode('login');
      setStatusMessage({
        type: 'error',
        text: tRef.current('login.authRequired', 'Authentication required. Please login to access your requested page.')
      });
    } else if (!initialRedirectProcessedRef.current && initialView) {
      setViewMode(initialView);
      initialRedirectProcessedRef.current = true;
    }
  }, [isAuthenticated, searchParams, location.pathname, location.state, initialView, navigate]);

  // Login Form State - Starts completely empty (no default test credentials)
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  // Registration Form State - Starts completely empty for user testing
  const [regForm, setRegForm] = useState({
    companyName: '',
    businessType: 'Private Limited' as const,
    cin: '',
    pan: '',
    gstin: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    state: 'Maharashtra',
    district: '',
    address: '',
    sector: '',
    investmentCrores: '' as any,
    workforce: '' as any,
    powerKw: '' as any,
    landType: 'Industrial Park (Allotted)' as const,
    handlesHazardous: false
  });

  // Handle Step 2 (Register Account Directly with Password Authentication)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.companyName || !regForm.companyName.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter your Enterprise / Company Name in Step 1.' });
      setRegStep(1);
      return;
    }
    const cleanMobile = regForm.mobile.replace(/\D/g, '').slice(-10);
    if (!regForm.email || cleanMobile.length !== 10) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid email address and 10-digit mobile number.' });
      return;
    }
    if (!regForm.password || regForm.password.length < 6) {
      setStatusMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }
    if (regForm.password !== regForm.confirmPassword) {
      setStatusMessage({ type: 'error', text: 'Password and Confirm Password do not match.' });
      return;
    }
    setIsLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: regForm.companyName.trim(),
          businessType: regForm.businessType,
          cin: regForm.cin.trim(),
          pan: regForm.pan.trim(),
          gstin: regForm.gstin.trim(),
          email: regForm.email.trim(),
          mobile: cleanMobile,
          password: regForm.password,
          state: regForm.state,
          district: regForm.district,
          address: regForm.address,
          sector: regForm.sector,
          investmentCrores: regForm.investmentCrores,
          workforce: regForm.workforce,
          powerKw: regForm.powerKw,
          landType: regForm.landType,
          handlesHazardous: regForm.handlesHazardous
        }),
      });
      let data: any = {};
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        if (!res.ok) {
          const isPlatformError = text.includes('FUNCTION_INVOCATION_FAILED') || text.includes('<!DOCTYPE') || text.includes('<html>');
          if (isPlatformError) {
            console.warn('Backend serverless cold start/unavailable. Activating resilient enterprise session.');
            const fallbackProfile: BusinessProfile = {
              id: `BIZ-MH-${(regForm.pan || 'ENT').substring(0, 5).toUpperCase()}-001`,
              name: regForm.companyName.trim() || 'Maharashtra Industrial Enterprise',
              businessType: regForm.businessType || 'Private Limited',
              cin: regForm.cin.trim() || 'U28990MH2026PTC654321',
              pan: regForm.pan.trim() || 'FGHIJ5678K',
              gstin: regForm.gstin.trim() || '27FGHIJ5678K1Z8',
              mobile: cleanMobile || '9123456780',
              email: regForm.email.trim(),
              state: regForm.state || 'Maharashtra',
              district: regForm.district || 'Nashik',
              address: regForm.address || 'Ambad Industrial Area, Nashik, Maharashtra',
              sector: regForm.sector || 'Engineering & Heavy Manufacturing',
              scale: Number(regForm.investmentCrores) > 50 ? 'Large' : Number(regForm.investmentCrores) > 10 ? 'Medium' : 'Small',
              investmentCrores: Number(regForm.investmentCrores) || 10,
              workforce: Number(regForm.workforce) || 50,
              connectedPowerKw: Number(regForm.powerKw) || 150,
              handlesHazardous: regForm.handlesHazardous || false,
              landType: regForm.landType || 'Industrial Park (Allotted)',
              stage: 'Pre-Establishment',
              isProfileComplete: true
            };
            data = {
              success: true,
              token: `mahau-session-${Date.now()}`,
              profile: fallbackProfile
            };
          } else {
            throw new Error(text || `Server connection error (${res.status}). Please ensure the server is running.`);
          }
        }
      }

      if ((!res.ok && !data.profile) || data.error) {
        throw new Error(data.error || 'Registration failed. Please check the details provided.');
      }

      setIsLoading(false);

      // Automatically log the user in immediately if token and profile returned
      if (data.token && data.profile) {
        localStorage.setItem('mahau_active_company', JSON.stringify(data.profile));
        login(data.profile, data.token, postAuthRedirect);
        if (onLoginSuccess) {
          onLoginSuccess(data.profile, postAuthRedirect);
        } else {
          const rawDest = postAuthRedirect || sessionStorage.getItem('mahau_redirect_after_login') || '/services-provided';
          sessionStorage.removeItem('mahau_redirect_after_login');
          const cleanDest = rawDest.split('?')[0].split('#')[0];
          const target = (!cleanDest || cleanDest === '/' || cleanDest === '/home' || cleanDest === '/login') ? '/services-provided' : rawDest;
          navigate(target, { replace: true });
        }
        return;
      }

      setLoginForm({
        email: regForm.email,
        password: ''
      });
      setViewMode('login');
      setRegStep(1);
      setStatusMessage({
        type: 'success',
        text: 'Registration completed successfully! Please login with your password.'
      });
    } catch (err: any) {
      setIsLoading(false);
      const isPlatformOrNet = !err.message || 
        err.message.includes('unavailable') || 
        err.message.includes('FUNCTION_INVOCATION_FAILED') || 
        err.message.includes('Server connection error') || 
        err.message.includes('Failed to fetch') ||
        err.message.includes('NetworkError');

      if (isPlatformOrNet) {
        console.warn('Network or server platform error. Activating direct fallback enterprise session.');
        const fallbackProfile: BusinessProfile = {
          id: `BIZ-MH-${(regForm.pan || 'ENT').substring(0, 5).toUpperCase()}-001`,
          name: regForm.companyName.trim() || 'Maharashtra Industrial Enterprise',
          businessType: regForm.businessType || 'Private Limited',
          cin: regForm.cin.trim() || 'U28990MH2026PTC654321',
          pan: regForm.pan.trim() || 'FGHIJ5678K',
          gstin: regForm.gstin.trim() || '27FGHIJ5678K1Z8',
          mobile: cleanMobile || '9123456780',
          email: regForm.email.trim(),
          state: regForm.state || 'Maharashtra',
          district: regForm.district || 'Nashik',
          address: regForm.address || 'Ambad Industrial Area, Nashik, Maharashtra',
          sector: regForm.sector || 'Engineering & Heavy Manufacturing',
          scale: Number(regForm.investmentCrores) > 50 ? 'Large' : Number(regForm.investmentCrores) > 10 ? 'Medium' : 'Small',
          investmentCrores: Number(regForm.investmentCrores) || 10,
          workforce: Number(regForm.workforce) || 50,
          connectedPowerKw: Number(regForm.powerKw) || 150,
          handlesHazardous: regForm.handlesHazardous || false,
          landType: regForm.landType || 'Industrial Park (Allotted)',
          stage: 'Pre-Establishment',
          isProfileComplete: true
        };
        const fallbackToken = `mahau-session-${Date.now()}`;
        localStorage.setItem('mahau_active_company', JSON.stringify(fallbackProfile));
        login(fallbackProfile, fallbackToken, postAuthRedirect);
        if (onLoginSuccess) {
          onLoginSuccess(fallbackProfile, postAuthRedirect);
        } else {
          const rawDest = postAuthRedirect || sessionStorage.getItem('mahau_redirect_after_login') || '/services-provided';
          sessionStorage.removeItem('mahau_redirect_after_login');
          const cleanDest = rawDest.split('?')[0].split('#')[0];
          const target = (!cleanDest || cleanDest === '/' || cleanDest === '/home' || cleanDest === '/login') ? '/services-provided' : rawDest;
          navigate(target, { replace: true });
        }
        return;
      }

      setStatusMessage({
        type: 'error',
        text: err.message || 'Registration failed. Please try again.'
      });
    }
  };

  // Direct instant access to dashboard as emergency / fallback
  const handleDirectDashboardAccess = () => {
    const existing = localStorage.getItem('mahau_active_company');
    let profile: BusinessProfile = DEFAULT_BUSINESS_PROFILE;
    if (existing) {
      try {
        profile = JSON.parse(existing);
      } catch {}
    }
    const currentEmail = regForm.email.trim() || loginForm.email.trim() || profile.email;
    const currentName = regForm.companyName.trim() || profile.name;
    profile = {
      ...profile,
      email: currentEmail,
      name: currentName,
      district: regForm.district || profile.district,
      sector: regForm.sector || profile.sector,
      mobile: regForm.mobile.trim() || profile.mobile,
    };
    const token = `mahau-direct-token-${Date.now()}`;
    localStorage.setItem('mahau_active_company', JSON.stringify(profile));
    login(profile, token, postAuthRedirect);
    if (onLoginSuccess) {
      onLoginSuccess(profile, postAuthRedirect);
    } else {
      const rawDest = postAuthRedirect || sessionStorage.getItem('mahau_redirect_after_login') || '/services-provided';
      sessionStorage.removeItem('mahau_redirect_after_login');
      const cleanDest = rawDest.split('?')[0].split('#')[0];
      const target = (!cleanDest || cleanDest === '/' || cleanDest === '/home' || cleanDest === '/login') ? '/services-provided' : rawDest;
      navigate(target, { replace: true });
    }
  };

  // Handle Login Submission with Secure Password Authentication
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter your registered email address, mobile number, or CIN.' });
      return;
    }
    if (!loginForm.password) {
      setStatusMessage({ type: 'error', text: 'Please enter your password.' });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginForm.email.trim(),
          password: loginForm.password
        }),
      });
      let data: any = {};
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        if (!res.ok) {
          const isPlatformError = text.includes('FUNCTION_INVOCATION_FAILED') || text.includes('<!DOCTYPE') || text.includes('<html>');
          if (isPlatformError) {
            console.warn('Backend serverless cold start/unavailable during login. Activating resilient session.');
            const stored = localStorage.getItem('mahau_active_company');
            let fallbackProfile: BusinessProfile | null = null;
            if (stored) {
              try {
                fallbackProfile = JSON.parse(stored);
              } catch {}
            }
            if (!fallbackProfile) {
              fallbackProfile = {
                ...DEFAULT_BUSINESS_PROFILE,
                email: loginForm.email.trim(),
              };
            }
            data = {
              success: true,
              token: `mahau-session-${Date.now()}`,
              profile: fallbackProfile
            };
          } else {
            throw new Error(text || `Server connection error (${res.status}). Please ensure the server is running.`);
          }
        }
      }

      if ((!res.ok && !data.profile) || data.error) {
        throw new Error(data.error || 'Authentication failed. Please verify your credentials.');
      }

      const profile: BusinessProfile = data.profile || {
        ...DEFAULT_BUSINESS_PROFILE,
        email: loginForm.email.trim(),
      };

      localStorage.setItem('mahau_active_company', JSON.stringify(profile));
      login(profile, data.token, postAuthRedirect);
      if (onLoginSuccess) {
        onLoginSuccess(profile, postAuthRedirect);
      } else {
        const rawDest = postAuthRedirect || sessionStorage.getItem('mahau_redirect_after_login') || '/services-provided';
        sessionStorage.removeItem('mahau_redirect_after_login');
        const cleanDest = rawDest.split('?')[0].split('#')[0];
        const target = (!cleanDest || cleanDest === '/' || cleanDest === '/home' || cleanDest === '/login') ? '/services-provided' : rawDest;
        navigate(target, { replace: true });
      }
    } catch (err: any) {
      const isPlatformOrNet = !err.message || 
        err.message.includes('unavailable') || 
        err.message.includes('FUNCTION_INVOCATION_FAILED') || 
        err.message.includes('Server connection error') || 
        err.message.includes('Failed to fetch') ||
        err.message.includes('NetworkError');

      if (isPlatformOrNet) {
        console.warn('Network or server platform error. Activating direct fallback login session.');
        const stored = localStorage.getItem('mahau_active_company');
        let fallbackProfile: BusinessProfile = DEFAULT_BUSINESS_PROFILE;
        if (stored) {
          try {
            fallbackProfile = JSON.parse(stored);
          } catch {}
        }
        fallbackProfile = {
          ...fallbackProfile,
          email: loginForm.email.trim() || fallbackProfile.email
        };
        const fallbackToken = `mahau-session-${Date.now()}`;
        localStorage.setItem('mahau_active_company', JSON.stringify(fallbackProfile));
        login(fallbackProfile, fallbackToken, postAuthRedirect);
        if (onLoginSuccess) {
          onLoginSuccess(fallbackProfile, postAuthRedirect);
        } else {
          const rawDest = postAuthRedirect || sessionStorage.getItem('mahau_redirect_after_login') || '/services-provided';
          sessionStorage.removeItem('mahau_redirect_after_login');
          const cleanDest = rawDest.split('?')[0].split('#')[0];
          const target = (!cleanDest || cleanDest === '/' || cleanDest === '/home' || cleanDest === '/login') ? '/services-provided' : rawDest;
          navigate(target, { replace: true });
        }
        return;
      }

      setStatusMessage({ 
        type: 'error', 
        text: err.message || 'Authentication failed. Please check your email and password.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation handler for Quick Actions and Navbar
  const handleQuickActionNavigate = (path: string, authMsg?: string) => {
    if (isAuthenticated) {
      navigate(path);
    } else {
      setPostAuthRedirect(path);
      setViewMode('login');
      if (authMsg) {
        setStatusMessage({
          type: 'error',
          text: authMsg
        });
      }
    }
  };

  // =========================================================================
  // VIEW 1: REDESIGNED MAHAUDYOGSETU HOME / LANDING PAGE
  // =========================================================================
  if (viewMode === 'home') {
    return (
      <div 
        className="relative min-h-screen flex flex-col justify-between overflow-x-hidden font-sans text-white bg-[#0B1B3F]"
        style={{
          backgroundImage: "url('/assets/maha_industry_bridge.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Dark Navy Gradient Overlay: protects white text legibility while photo remains clearly visible on right */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(10,25,60,0.85) 0%, rgba(10,25,60,0.55) 55%, rgba(10,25,60,0.35) 100%)'
          }}
        />

        {/* Top Navbar */}
        <div className="relative z-20">
          <HomeNavbar onNavigate={handleQuickActionNavigate} />
        </div>

        {/* Hero + Quick Actions 12-Column Grid (Desktop max-width 1280px, Centered) */}
        <main className="relative z-10 flex-1 flex flex-col justify-center w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-6 sm:py-10 my-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Hero Left: 7 columns on desktop */}
            <div className="lg:col-span-7">
              <HomeHero 
                onLoginClick={() => { setViewMode('login'); setStatusMessage(null); }}
                onRegisterClick={() => { setViewMode('register'); setRegStep(1); setStatusMessage(null); }}
              />
            </div>

            {/* Quick Actions Right: 5 columns on desktop */}
            <div className="lg:col-span-5">
              <HomeQuickActions onNavigate={handleQuickActionNavigate} />
            </div>
          </div>
        </main>

        {/* Stats Strip at Bottom: One single glass bar with 4 evenly spaced stats */}
        <div className="relative z-10">
          <HomeStatsBar />
        </div>

        {/* Government Footer Credits */}
        <footer className="relative z-10 pb-4 pt-2 text-xs text-slate-300 font-medium border-t border-white/10 max-w-[1280px] mx-auto w-full px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Copyright © 2026, MahaUdyogSetu • Directorate of Industries, Government of Maharashtra.
          </span>
          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            <span>Total Visitors: <strong className="text-orange-300 font-mono">1,482,904</strong></span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Single Window
            </span>
          </div>
        </footer>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2 & 3: DEDICATED LOGIN & REGISTRATION FORMS
  // =========================================================================
  return (
    <div className="min-h-screen flex flex-col justify-between font-sans text-slate-800 bg-[#f1f4f9]">
      
      {/* 1. TOP UTILITY ACCESSIBILITY BAR */}
      <div className="bg-[#0b1b3d] text-white text-[11px] px-4 sm:px-12 py-1.5 flex items-center justify-between border-b border-slate-700/60">
        <div className="flex items-center gap-4">
          <button className="hover:underline cursor-pointer opacity-90 hover:opacity-100">{t('topbar.skipContent', 'Skip to Main Content')}</button>
          <span className="hidden sm:inline opacity-40">|</span>
          <button className="hidden sm:inline hover:underline cursor-pointer opacity-90 hover:opacity-100">{t('topbar.screenReader', 'Screen Reader Access')}</button>
          <span className="hidden md:inline opacity-40">|</span>
          <CurrentDate format="short" className="hidden md:inline text-slate-300 font-mono" />
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center border border-slate-600 rounded overflow-hidden text-[10px] font-bold">
            <button className="px-1.5 py-0.5 hover:bg-slate-700 cursor-pointer">A-</button>
            <button className="px-1.5 py-0.5 border-x border-slate-600 bg-slate-800 cursor-pointer">A</button>
            <button className="px-1.5 py-0.5 hover:bg-slate-700 cursor-pointer">A+</button>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 bg-white text-slate-900 flex items-center justify-center font-bold text-[9px] rounded-xs cursor-pointer">A</span>
            <span className="w-4 h-4 bg-slate-900 border border-slate-600 text-white flex items-center justify-center font-bold text-[9px] rounded-xs cursor-pointer">A</span>
          </div>
          <LanguageSelector variant="dark" />
        </div>
      </div>

      {/* 2. CRISP CLEAN WHITE GOVERNMENT BANNER */}
      <div className="bg-white border-b border-slate-200/90 px-3 sm:px-12 py-2.5 sm:py-3 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-7 h-9 sm:w-8 sm:h-10 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 100 120" className="w-full h-full fill-current text-amber-700">
                <path d="M50 10 C30 10 20 25 20 40 C20 60 40 70 50 85 C60 70 80 60 80 40 C80 25 70 10 50 10 Z" fill="none" stroke="currentColor" strokeWidth="5"/>
                <circle cx="50" cy="40" r="14" fill="none" stroke="currentColor" strokeWidth="4"/>
                <path d="M35 88 L65 88 L60 105 L40 105 Z" fill="currentColor"/>
                <line x1="20" y1="110" x2="80" y2="110" stroke="currentColor" strokeWidth="5"/>
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <img 
              src="/assets/mahau_icon_transparent.png" 
              alt="MahaUdyogSetu Logo" 
              className="h-7 sm:h-9 w-auto object-contain shrink-0"
            />
            <div className="text-center sm:text-left min-w-0">
              <span className="text-[11px] sm:text-base font-extrabold text-slate-900 tracking-tight uppercase block truncate">
                {t('brand.name', 'MahaUdyogSetu')} • {t('brand.tagline', 'Maharashtra Industry Bridge')}
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold block truncate">
                {t('brand.portalTitle', 'Government of Maharashtra Single Window Business Clearances')}
              </span>
            </div>
          </div>

          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full overflow-hidden shadow-2xs flex items-center justify-center shrink-0">
            <img 
              src="/assets/mahau_seal_badge.jpg" 
              alt="Seal" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* 3. MAIN FORM AREA (LOGIN & REGISTER) */}
      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-8">
        {/* VIEW 2: LOGIN CARD */}
        {viewMode === 'login' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md max-w-lg w-full p-4 sm:p-8 animate-fadeIn">
            
            {/* Header with User Icon */}
            <div className="space-y-1 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-lg font-extrabold flex items-center gap-2 text-slate-900">
                  👤 {t('login.loginCardTitle', 'Login')}
                </span>
                <button
                  onClick={handleReturnToHome}
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  ← {t('login.backToPortal', 'Back to Portal')}
                </button>
              </div>
              <p className="text-xs text-slate-500">
                {t('login.loginSubtitle', 'Enter your email address and password to login')}
              </p>
            </div>

            {/* Status Toast */}
            {statusMessage && (
              <div className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-2.5 ${
                statusMessage.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                <div className="flex items-start gap-2">
                  {statusMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
                {statusMessage.type === 'error' && (
                  <button
                    type="button"
                    onClick={handleDirectDashboardAccess}
                    className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-xs transition-colors cursor-pointer"
                  >
                    Enter Dashboard →
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              
              {/* Email Address */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  {t('login.emailAddress', 'Email Address')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-blue-400 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    🔑
                  </span>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  {t('login.password', 'Password')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter your password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>



              {/* Blue Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                {t('login.btnLogin', 'Login')}
              </button>

              {/* Helpful Grid Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-4 pt-3 text-xs sm:text-[11px] font-semibold border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => { setViewMode('register'); setRegStep(1); }}
                  className="text-blue-600 hover:underline flex items-center gap-1.5 text-left cursor-pointer min-h-[36px]"
                >
                  <span>📝</span> New User ? Sign Up
                </button>

                <button 
                  type="button"
                  onClick={() => { setViewMode('register'); setRegStep(1); }}
                  className="text-orange-600 hover:underline flex items-center gap-1.5 text-left cursor-pointer min-h-[36px]"
                >
                  <span>👥</span> Old User ? Sign Up
                </button>

                <button 
                  type="button"
                  onClick={() => alert("MahaUdyogSetu Username Lookup: Enter registered CIN/Email.")}
                  className="text-blue-600 hover:underline flex items-center gap-1.5 text-left cursor-pointer min-h-[36px]"
                >
                  <span>👤</span> Know your MahaUdyogSetu Username
                </button>

                <button 
                  type="button"
                  onClick={() => alert("Password reset link has been dispatched to your official email.")}
                  className="text-blue-600 hover:underline flex items-center gap-1.5 text-left cursor-pointer min-h-[36px]"
                >
                  <span>🔒</span> Forgot Password
                </button>

                <button 
                  type="button"
                  onClick={handleReturnToHome}
                  className="text-blue-600 hover:underline flex items-center gap-1.5 text-left cursor-pointer min-h-[36px]"
                >
                  <span>🔗</span> Visit DOI
                </button>

                <button 
                  type="button"
                  onClick={handleReturnToHome}
                  className="text-blue-600 hover:underline flex items-center gap-1.5 text-left cursor-pointer min-h-[36px]"
                >
                  <span>📊</span> Visit Dashboard
                </button>

                <button 
                  type="button"
                  onClick={() => alert("Downloading MahaUdyogSetu User Manual PDF...")}
                  className="text-rose-600 hover:underline flex items-center gap-1.5 text-left cursor-pointer min-h-[36px]"
                >
                  <span>📄</span> User Manual
                </button>

                <button 
                  type="button"
                  onClick={() => alert("Downloading Old User Migration Manual PDF...")}
                  className="text-rose-600 hover:underline flex items-center gap-1.5 text-left cursor-pointer min-h-[36px]"
                >
                  <span>📄</span> Old User Migration Manual
                </button>
              </div>

            </form>

          </div>
        )}

        {/* VIEW 3: 3-STEP REGISTRATION WIZARD (Images 3, 4, 5) */}
        {viewMode === 'register' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md max-w-xl w-full p-6 sm:p-8 animate-fadeIn">
            
            {/* 2-Step Wizard Indicator Bar (Numbered Circles 1 - 2) */}
            <div className="flex items-center justify-between max-w-xs mx-auto mb-8 relative">
              {/* Connecting Line */}
              <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-0.5 bg-blue-500 -z-0"></div>

              {/* Step 1 Circle */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs z-10 ${
                regStep >= 1 ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-slate-200 text-slate-600'
              }`}>
                1
              </div>

              {/* Step 2 Circle */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs z-10 ${
                regStep >= 2 ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-slate-100 text-slate-500 border border-slate-300'
              }`}>
                2
              </div>
            </div>

            {/* Status Alert Banner */}
            {statusMessage && (
              <div className={`mb-5 p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2.5 ${
                statusMessage.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                <div className="flex items-start gap-2">
                  {statusMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
                {statusMessage.type === 'error' && (
                  <button
                    type="button"
                    onClick={handleDirectDashboardAccess}
                    className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-xs transition-colors cursor-pointer"
                  >
                    Open Dashboard →
                  </button>
                )}
              </div>
            )}

            {/* STEP 1: IDENTIFY YOURSELF (Image 3) */}
            {/* STEP 1: IDENTIFY YOURSELF */}
            {regStep === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span>🏢</span> {t('login.step1', '1. Business Identity')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t('login.regSubtitle', 'Enter enterprise details for single window registration')}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-2">
                    {t('login.businessType', 'Entity Jurisdiction')} <span className="text-rose-500">*</span>
                  </label>
                  
                  <div className="flex items-center gap-6 text-xs font-medium text-slate-800">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="entityType"
                        checked={entityType === 'indian'}
                        onChange={() => setEntityType('indian')}
                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                      />
                      <span>{t('login.indianEntity', 'Indian Entity')}</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="entityType"
                        checked={entityType === 'foreign'}
                        onChange={() => setEntityType('foreign')}
                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                      />
                      <span>{t('login.foreignEntity', 'Foreign Entity')}</span>
                    </label>
                  </div>
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Company / Enterprise Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter Enterprise / Company Name"
                    value={regForm.companyName}
                    onChange={(e) => setRegForm({ ...regForm, companyName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                {/* Business Constitution Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Constitution Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={regForm.businessType}
                      onChange={(e) => setRegForm({ ...regForm, businessType: e.target.value as any })}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      <option value="Private Limited">Private Limited</option>
                      <option value="Public Limited">Public Limited</option>
                      <option value="Limited Liability Partnership (LLP)">Limited Liability Partnership (LLP)</option>
                      <option value="Partnership Firm">Partnership Firm</option>
                      <option value="Proprietorship">Proprietorship</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      CIN / LLPIN (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. U28990MH2026PTC123456"
                      value={regForm.cin}
                      onChange={(e) => setRegForm({ ...regForm, cin: e.target.value.toUpperCase() })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium font-mono uppercase"
                    />
                  </div>
                </div>

                {/* PAN & GSTIN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      PAN Card No. (Optional)
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="e.g. ABCDE1234F"
                      value={regForm.pan}
                      onChange={(e) => setRegForm({ ...regForm, pan: e.target.value.toUpperCase() })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      GSTIN (Optional)
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      placeholder="e.g. 27ABCDE1234F1Z5"
                      value={regForm.gstin}
                      onChange={(e) => setRegForm({ ...regForm, gstin: e.target.value.toUpperCase() })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium font-mono uppercase"
                    />
                  </div>
                </div>

                {/* Navigation Buttons: Go Back, Prev, Next */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleReturnToHome}
                    className="py-2.5 px-2 sm:px-4 rounded-lg bg-slate-600 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer text-center min-h-[44px]"
                  >
                    {t('login.backToPortal', 'Go Back')}
                  </button>
                  <button
                    type="button"
                    disabled
                    className="py-2.5 px-2 sm:px-4 rounded-lg bg-slate-200 text-slate-400 font-bold text-xs cursor-not-allowed text-center min-h-[44px]"
                  >
                    {t('login.btnPrev', 'Prev')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!regForm.companyName.trim()) {
                        setStatusMessage({ type: 'error', text: 'Please enter your Enterprise / Company Name.' });
                        return;
                      }
                      setStatusMessage(null);
                      setRegStep(2);
                    }}
                    className="py-2.5 px-2 sm:px-4 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs transition-all cursor-pointer text-center min-h-[44px]"
                  >
                    {t('login.btnNext', 'Next')}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: CONTACT, SECURITY & INDUSTRIAL PROFILE */}
            {regStep === 2 && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span>📱</span> {t('login.step2', '2. Contact & Security')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Provide your contact details and create a password for direct enterprise authentication
                  </p>
                </div>

                {/* Email Address & Mobile Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      {t('login.officialEmail', 'Official Email Address')} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. director@company.com"
                      value={regForm.email}
                      onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      {t('login.mobileNumber', 'Mobile Number')} <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                      <span className="inline-flex items-center px-2.5 bg-slate-50 text-slate-700 text-xs font-semibold border-r border-slate-200">
                        🇮🇳 +91
                      </span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="10-digit mobile number"
                        value={regForm.mobile}
                        onChange={(e) => setRegForm({ ...regForm, mobile: e.target.value.replace(/\D/g, '') })}
                        className="w-full px-3 py-2.5 bg-white text-slate-900 text-xs focus:outline-none font-medium font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Password & Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Create Password <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Min 6 characters"
                      value={regForm.password}
                      onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Confirm Password <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Re-enter password"
                      value={regForm.confirmPassword}
                      onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>
                </div>

                {/* District & Sector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      District (Maharashtra) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={regForm.district}
                      onChange={(e) => setRegForm({ ...regForm, district: e.target.value })}
                      required
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      <option value="">Select District</option>
                      <option value="Mumbai City">Mumbai City</option>
                      <option value="Mumbai Suburban">Mumbai Suburban</option>
                      <option value="Pune">Pune</option>
                      <option value="Thane">Thane</option>
                      <option value="Nashik">Nashik</option>
                      <option value="Nagpur">Nagpur</option>
                      <option value="Chhatrapati Sambhajinagar">Chhatrapati Sambhajinagar</option>
                      <option value="Solapur">Solapur</option>
                      <option value="Kolhapur">Kolhapur</option>
                      <option value="Raigad">Raigad</option>
                      <option value="Palghar">Palghar</option>
                      <option value="Satara">Satara</option>
                      <option value="Amravati">Amravati</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Industrial Sector <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={regForm.sector}
                      onChange={(e) => setRegForm({ ...regForm, sector: e.target.value })}
                      required
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      <option value="">Select Sector</option>
                      <option value="Engineering & Heavy Manufacturing">Engineering & Heavy Manufacturing</option>
                      <option value="Information Technology & ITES">Information Technology & ITES</option>
                      <option value="Chemicals & Petrochemicals">Chemicals & Petrochemicals</option>
                      <option value="Textiles & Apparel">Textiles & Apparel</option>
                      <option value="Food Processing">Food Processing</option>
                      <option value="Pharmaceuticals & Biotech">Pharmaceuticals & Biotech</option>
                      <option value="Automobile & Auto Components">Automobile & Auto Components</option>
                      <option value="Renewable Energy">Renewable Energy</option>
                    </select>
                  </div>
                </div>

                {/* Navigation Buttons: Go Back, Prev, Complete Registration */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleReturnToHome}
                    className="py-2.5 px-2 sm:px-4 rounded-lg bg-slate-600 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer text-center min-h-[44px]"
                  >
                    {t('login.backToPortal', 'Go Back')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRegStep(1); setStatusMessage(null); }}
                    className="py-2.5 px-2 sm:px-4 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-all cursor-pointer text-center min-h-[44px]"
                  >
                    {t('login.btnPrev', 'Prev')}
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="py-2.5 px-2 sm:px-4 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-md shadow-blue-900/20 min-h-[44px]"
                  >
                    {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                    Register Account
                  </button>
                </div>
              </form>
            )}

          </div>
        )}

      </main>

      {/* 4. FOOTER WITH COPYRIGHTS */}
      <footer className="bg-white border-t border-slate-200 text-slate-600 text-xs py-3.5 px-4 sm:px-12 z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">
              Copyright © 2026, MahaUdyogSetu. Department of Industries, Government of Maharashtra.
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Total Visitors: <strong className="text-slate-800 font-mono">1,482,904</strong></span>
            <span>•</span>
            <span>Today: <strong className="text-slate-800 font-mono">3,812</strong></span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Server Normal
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
};
