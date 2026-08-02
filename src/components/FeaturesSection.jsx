import React from 'react';
import { Cpu, FileCheck2, Calendar, ArrowUpRight, Sparkles, ShieldCheck } from 'lucide-react';

export default function FeaturesSection({ onExploreFeature }) {
  const features = [
    {
      id: 'agents',
      title: 'AI Domain Agents',
      description: 'Autonomous LLM agent orchestration designed to parse, audit, and execute complex domain workflows without human bottleneck.',
      icon: Cpu,
      badge: 'Autonomous',
      accent: 'border-[#800020]/40'
    },
    {
      id: 'optimizer',
      title: 'Document Optimizer',
      description: 'Instant multi-format document verification, compression, and automated image/pdf resolution compliance engine.',
      icon: FileCheck2,
      badge: 'Precision OCR',
      accent: 'border-[#D4AF37]/50'
    },
    {
      id: 'dashboard',
      title: 'Deadline Dashboard',
      description: 'Predictive timeline governance with rule-based notification triggers to eliminate missed compliance deadlines.',
      icon: Calendar,
      badge: 'Zero Miss Guarantee',
      accent: 'border-[#800020]/40'
    }
  ];

  return (
    <section id="features" className="py-24 bg-[#F5F1E8] text-[#333333] relative overflow-hidden border-t border-[#D4AF37]/30">
      
      {/* Background accents */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#D4AF37]/10 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-[#800020]/5 blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#800020]/10 border border-[#800020]/20 text-[#800020] text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> Core Capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#800020] tracking-tight mb-4">
            Engineered for Enterprise Excellence
          </h2>
          <p className="text-base sm:text-lg text-[#333333]/80 leading-relaxed font-sans">
            Discover the three foundational pillars powering the AMB luxury SaaS platform.
          </p>
        </div>

        {/* 3 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => onExploreFeature && onExploreFeature(item.id)}
                className={`group relative bg-white p-8 rounded-3xl border ${item.accent} shadow-xl shadow-[#800020]/5 hover:shadow-2xl hover:shadow-[#D4AF37]/20 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col justify-between`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#800020] text-[#D4AF37] border border-[#D4AF37]/40 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F5F1E8] text-[#800020] border border-[#D4AF37]/40">
                      {item.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-serif font-bold text-[#800020] mb-3 group-hover:text-[#A01235] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#333333]/80 leading-relaxed font-sans mb-6">
                    {item.description}
                  </p>
                </div>

                {/* Card Action Link */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#800020] group-hover:text-[#D4AF37] transition-colors">
                  <span>Explore Architecture</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Pricing / Demo CTA Bar */}
        <div id="pricing" className="mt-20 p-8 sm:p-12 rounded-3xl bg-[#080c14] text-white border border-[#D4AF37]/40 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
              Ready to Upgrade Your Enterprise Stack? <ShieldCheck className="w-6 h-6 text-[#D4AF37]" />
            </h3>
            <p className="text-sm text-slate-300 max-w-xl font-sans">
              Start with our 14-day risk-free trial. Zero credit card required for sandbox evaluation.
            </p>
          </div>

          <button
            onClick={() => onExploreFeature && onExploreFeature('pricing')}
            className="px-8 py-4 rounded-xl bg-[#800020] text-[#F5F1E8] font-semibold text-sm border border-[#D4AF37] shadow-lg hover:bg-[#600018] hover:shadow-[#D4AF37]/20 transition-all whitespace-nowrap"
          >
            Deploy AMB Instance &rarr;
          </button>
        </div>

      </div>
    </section>
  );
}
