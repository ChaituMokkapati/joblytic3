import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Shared Layout
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import LandingPage from './pages/LandingPage';
import FeaturesPage from './pages/FeaturesPage';
import DemoPage from './pages/DemoPage';
import PricingPage from './pages/PricingPage';
import DashboardPage from './components/DashboardPage';

// Legacy components (kept for backward compat)
import LoginPage from './components/LoginPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ProfileBoard from './components/ProfileBoard';

export default function App() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Global Sticky Navbar */}
      <Navbar />

      {/* Page Content */}
      <main className="flex-1 w-full">
        <Routes>
          {/* ── Main SaaS Pages ── */}
          <Route path="/"           element={<LandingPage />}  />
          <Route path="/features"   element={<FeaturesPage />} />
          <Route path="/demo"       element={<DemoPage />}     />
          <Route path="/pricing"    element={<PricingPage />}  />
          <Route path="/dashboard"  element={<DashboardPage />}/>

          {/* ── Legacy / Auth Pages ── */}
          <Route path="/login"           element={<LoginPage />}           />
          <Route path="/signup"          element={<LoginPage />}           />
          <Route path="/profile"         element={<ProfileBoard />}        />
          <Route path="/forgot-password" element={<ForgotPasswordPage />}  />

          {/* ── 404 fallback ── */}
          <Route path="*" element={
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
              <div className="text-8xl mb-4 opacity-30">404</div>
              <h2 className="text-2xl font-bold text-white mb-2">Page not found</h2>
              <p className="text-gray-400 text-sm mb-6">The page you're looking for doesn't exist.</p>
              <a href="/" className="px-6 py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-colors">
                Go Home
              </a>
            </div>
          } />
        </Routes>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
