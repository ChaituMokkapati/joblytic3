import React, { useState } from 'react';
import { ArrowRight, Play, Sparkles, Shield, Cpu, Zap, CheckCircle2, ChevronRight } from 'lucide-react';
import AmbMonogramLogo from './AmbMonogramLogo';

export default function HeroSection({ onGetStarted, onViewDemo }) {
  const [activeTab, setActiveTab] = useState('workflow');

  return (
    <section className="relative overflow-hidden bg-[#F5F1E8] text-[#333333] py-20 px-4 sm:px-6 lg:px-8 transition-colors duration-500 font-sans">
      
      {/* Background Subtle Gold Geometric Accent Lines & Rings */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        {/* Large Geometric Outer Circle */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full border stroke-1 border-[#D4AF37]/40 [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[650px] h-[650px] rounded-full border border-[#800020]/20"></div>
        <div className="absolute top-1/3 -left-32 w-96 h-96 rounded-full bg-[#D4AF37]/10 blur-3xl"></div>
        <div className="absolute top-1/4 -right-32 w-96 h-96 rounded-full bg-[#800020]/10 blur-3xl"></div>

        {/* Thin Gold Grid Lines */}
        <svg className="absolute inset-0 w-full h-full stroke-[#D4AF37]/20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="gridPattern" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#gridPattern)" />
        </svg>
      </div>

      <div className="max-w-5xl mx-auto text-center relative z-10">
        
        {/* Top: Interwoven AMB Monogram Logo & Brand Tag */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-[#D4AF37]/40 shadow-sm backdrop-blur-md mb-6 hover:scale-105 transition-transform cursor-pointer">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#800020]">
              Next-Gen Enterprise AI SaaS
            </span>
          </div>

          <div className="relative group cursor-pointer">
            <AmbMonogramLogo 
              size={110} 
              useImage={false} 
              className="drop-shadow-xl border-2 border-[#D4AF37]/60 transition-transform duration-300 group-hover:scale-105" 
            />
            <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-[#800020] border-2 border-[#F5F1E8] flex items-center justify-center shadow">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse"></span>
            </div>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#800020] tracking-tight leading-[1.15] mb-6">
          AMB Smart Solutions for <br className="hidden sm:inline" />
          <span className="italic font-normal text-[#800020]">
            Modern Business
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-[#333333]/85 max-w-2xl mx-auto font-normal leading-relaxed mb-10 tracking-wide">
          AI-powered tools to streamline your workflow and scale faster. Precision automation and luxury performance, all in one platform.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#800020] text-[#F5F1E8] font-semibold text-sm tracking-wide shadow-lg shadow-[#800020]/25 hover:bg-[#600018] hover:shadow-xl hover:shadow-[#800020]/35 border border-[#D4AF37]/40 flex items-center justify-center gap-2.5 transition-all group"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4 text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={onViewDemo}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/70 backdrop-blur-md text-[#800020] border-2 border-[#D4AF37] font-semibold text-sm tracking-wide shadow-sm hover:bg-[#D4AF37]/10 hover:border-[#800020] flex items-center justify-center gap-2 transition-all"
          >
            <Play className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
            <span>View Interactive Demo</span>
          </button>
        </div>

        {/* Apple-like Minimalist Product Preview Frame */}
        <div className="relative rounded-3xl bg-white p-3 border border-[#D4AF37]/40 shadow-2xl shadow-[#800020]/10 max-w-4xl mx-auto">
          
          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50/60 rounded-t-2xl">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-red-400"></span>
              <span className="w-3 h-3 rounded-full bg-amber-400"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
            </div>
            <div className="px-4 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-mono text-slate-500 flex items-center gap-2 shadow-inner">
              <Shield className="w-3 h-3 text-[#D4AF37]" />
              <span>https://app.amb.ai/dashboard</span>
            </div>
            <div className="text-xs text-slate-400 font-semibold">AMB OS v2.4</div>
          </div>

          {/* Interactive Feature Preview Tabs */}
          <div className="p-6 sm:p-8 text-left bg-gradient-to-b from-white to-[#F5F1E8]/40 rounded-b-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('workflow')}
                  className={`pb-2 text-xs font-bold uppercase tracking-wider transition ${
                    activeTab === 'workflow'
                      ? 'text-[#800020] border-b-2 border-[#D4AF37]'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Workflow Automation
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`pb-2 text-xs font-bold uppercase tracking-wider transition ${
                    activeTab === 'analytics'
                      ? 'text-[#800020] border-b-2 border-[#D4AF37]'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Predictive Insights
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`pb-2 text-xs font-bold uppercase tracking-wider transition ${
                    activeTab === 'security'
                      ? 'text-[#800020] border-b-2 border-[#D4AF37]'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Enterprise Security
                </button>
              </div>

              <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#800020]/10 text-[#800020] border border-[#800020]/20">
                LIVE DEMO STATE
              </span>
            </div>

            {/* Tab Body */}
            {activeTab === 'workflow' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white border border-[#D4AF37]/30 shadow-sm hover:border-[#800020]/50 transition">
                  <div className="w-8 h-8 rounded-lg bg-[#800020]/10 text-[#800020] flex items-center justify-center mb-3 font-bold">
                    01
                  </div>
                  <h4 className="font-semibold text-sm text-[#800020] mb-1">Document Parsing</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Automated multi-format document verification with 99.8% precision.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#D4AF37]/30 shadow-sm hover:border-[#800020]/50 transition">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 text-[#800020] flex items-center justify-center mb-3 font-bold">
                    02
                  </div>
                  <h4 className="font-semibold text-sm text-[#800020] mb-1">Agent Tracing</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Real-time execution log audit trails with low-latency LLM orchestration.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#D4AF37]/30 shadow-sm hover:border-[#800020]/50 transition">
                  <div className="w-8 h-8 rounded-lg bg-[#800020]/10 text-[#800020] flex items-center justify-center mb-3 font-bold">
                    03
                  </div>
                  <h4 className="font-semibold text-sm text-[#800020] mb-1">Smart Alerts</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Instant rule-based notifications for critical deadline governance.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="p-6 rounded-xl bg-white border border-[#D4AF37]/30 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#800020]">Automated Process Efficiency</span>
                  <span className="font-mono text-[#D4AF37] font-bold">+142% MoM</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
                  <div className="bg-gradient-to-r from-[#800020] to-[#D4AF37] h-full rounded-full w-[88%] transition-all duration-1000"></div>
                </div>
                <p className="text-xs text-slate-500">
                  AI Agents saved your organization over 340 operational hours this month.
                </p>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="p-4 rounded-xl bg-white border border-[#D4AF37]/30 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-slate-800">SOC2 Type II & GDPR Compliant</p>
                    <p className="text-slate-500 text-[11px]">End-to-end encrypted metadata vaults</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-semibold rounded-lg border border-emerald-200">
                  ACTIVE
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Trust metrics */}
        <div className="mt-12 pt-8 border-t border-[#D4AF37]/30 flex flex-wrap items-center justify-center gap-8 text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#800020]" /> 99.99% Uptime SLA
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#800020]" /> Enterprise Grade API
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#800020]" /> Zero-Data Retention Guarantee
          </div>
        </div>

      </div>
    </section>
  );
}
