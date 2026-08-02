import React from 'react';

const FEATURES = [
  {
    icon: '🔍',
    title: 'AI Doc Verification',
    description: '100% accuracy in verifying your eligibility documents instantly.',
    color: 'from-amber-500/20 to-amber-400/5',
    border: 'border-amber-500/20',
    accent: 'text-amber-400',
  },
  {
    icon: '🔔',
    title: 'Smart Alerts',
    description: 'Get notified before closing dates. Never miss a deadline again.',
    color: 'from-green-500/20 to-green-400/5',
    border: 'border-green-500/20',
    accent: 'text-green-400',
  },
  {
    icon: '🌐',
    title: 'Portal Aggregation',
    description: '25+ government portals aggregated into one unified dashboard.',
    color: 'from-amber-500/20 to-amber-400/5',
    border: 'border-amber-500/20',
    accent: 'text-amber-400',
  },
  {
    icon: '🧠',
    title: 'Intelligent Search',
    description: 'Search by post, salary, deadline, category & more.',
    color: 'from-green-500/20 to-green-400/5',
    border: 'border-green-500/20',
    accent: 'text-green-400',
  },
  {
    icon: '📄',
    title: 'Document Optimizer',
    description: 'AI-powered resume & document tailoring for each job.',
    color: 'from-amber-500/20 to-amber-400/5',
    border: 'border-amber-500/20',
    accent: 'text-amber-400',
  },
  {
    icon: '📊',
    title: 'Success Tracking',
    description: 'Track applications, exam dates & results all in one place.',
    color: 'from-green-500/20 to-green-400/5',
    border: 'border-green-500/20',
    accent: 'text-green-400',
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="ambient-orb w-[500px] h-[500px] bg-amber-500 top-[-150px] right-[-150px]" />
      <div className="ambient-orb w-[400px] h-[400px] bg-green-500 bottom-0 left-[-100px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            PLATFORM CAPABILITIES
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-5 tracking-tight">
            <span className="gradient-text-amber">AMB SaaS</span> Features
          </h1>
          <p className="text-gray-400 text-lg sm:text-xl max-w-xl mx-auto">
            Everything you need to land your dream government job.
          </p>
        </div>

        {/* 3x2 Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className={`glass-card p-8 flex flex-col gap-4 border bg-gradient-to-br ${f.color} ${f.border} group cursor-default`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {/* Icon bubble */}
              <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/[0.06] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                {f.icon}
              </div>

              {/* Content */}
              <div>
                <h3 className={`text-lg font-bold mb-2 ${f.accent}`}>{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.description}</p>
              </div>

              {/* Subtle bottom line */}
              <div className={`h-0.5 w-12 rounded-full bg-gradient-to-r ${f.accent === 'text-amber-400' ? 'from-amber-500 to-transparent' : 'from-green-500 to-transparent'} mt-auto opacity-60`} />
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-gray-400 text-sm mb-6">Ready to experience the power of AI-driven job search?</p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-400 text-black font-bold rounded-2xl shadow-2xl shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-105 transition-all"
          >
            Launch Dashboard →
          </a>
        </div>
      </div>
    </div>
  );
}
