import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const DEMO_STEPS = [
  {
    step: 1,
    title: 'Search any government job by name or category',
    detail: 'Use our intelligent search to find jobs by post name, department, salary range, or category like Central, Bank, Railway, and more.',
    icon: '🔍',
  },
  {
    step: 2,
    title: 'Click "Run AI Doc Verification" to check your eligibility instantly',
    detail: 'Our AI scans your profile documents against the official eligibility criteria with 100% accuracy in seconds.',
    icon: '🤖',
  },
  {
    step: 3,
    title: 'Toggle alerts to get reminders before the deadline',
    detail: 'Enable smart alerts and receive push notifications, emails, or SMS reminders days before the application closing date.',
    icon: '🔔',
  },
  {
    step: 4,
    title: 'Click "Portal →" to go directly to the official application page',
    detail: 'We link you directly to the verified official government portal — no intermediaries, no fake links.',
    icon: '🌐',
  },
];

export default function DemoPage() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="ambient-orb w-[500px] h-[500px] bg-green-500 top-[-150px] left-[-100px]" />
      <div className="ambient-orb w-[400px] h-[400px] bg-amber-500 bottom-[-100px] right-[-100px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-500/30 bg-green-500/10 text-green-400 text-xs font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
            LIVE DEMO
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-5 tracking-tight">
            Interactive <span className="gradient-text-green">Demo</span>
          </h1>
          <p className="text-gray-400 text-lg sm:text-xl max-w-lg mx-auto">
            See how AMB SaaS works in 60 seconds.
          </p>
        </div>

        {/* Steps Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

          {/* Step List */}
          <div className="lg:col-span-2 space-y-3">
            {DEMO_STEPS.map((s, i) => (
              <button
                key={i}
                onClick={() => setActiveStep(i)}
                className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 ${
                  activeStep === i
                    ? 'border-green-500/50 bg-green-500/10 shadow-lg shadow-green-500/10'
                    : 'border-white/[0.06] bg-white/[0.02] hover:border-green-500/20 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Green circle step */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 transition-all ${
                    activeStep === i
                      ? 'bg-green-500 text-black'
                      : 'bg-green-500/20 text-green-400 border border-green-500/30'
                  }`}>
                    {s.step}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold leading-snug ${activeStep === i ? 'text-white' : 'text-gray-300'}`}>
                      {s.title}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-3">
            <div className="glass-card border border-green-500/20 p-8 rounded-2xl min-h-[320px] flex flex-col justify-between"
              style={{ background: 'rgba(0,255,100,0.03)' }}>

              <div>
                {/* Step badge */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center text-2xl">
                    {DEMO_STEPS[activeStep].icon}
                  </div>
                  <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-xs font-bold">
                    STEP {DEMO_STEPS[activeStep].step} OF 4
                  </div>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 leading-tight">
                  {DEMO_STEPS[activeStep].title}
                </h2>
                <p className="text-gray-400 leading-relaxed text-sm sm:text-base">
                  {DEMO_STEPS[activeStep].detail}
                </p>
              </div>

              {/* Progress dots */}
              <div className="flex items-center justify-between mt-8">
                <div className="flex gap-2">
                  {DEMO_STEPS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveStep(i)}
                      className={`rounded-full transition-all duration-300 ${
                        i === activeStep ? 'w-6 h-2 bg-green-500' : 'w-2 h-2 bg-white/20 hover:bg-white/40'
                      }`}
                    />
                  ))}
                </div>
                {activeStep < 3 ? (
                  <button
                    onClick={() => setActiveStep(s => Math.min(s + 1, 3))}
                    className="px-5 py-2 bg-green-500 hover:bg-green-400 text-black text-sm font-bold rounded-xl transition-all"
                  >
                    Next Step →
                  </button>
                ) : (
                  <Link
                    to="/dashboard"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold rounded-xl transition-all"
                  >
                    Go to Dashboard →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center mt-16">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-green-500 to-green-400 text-black font-black text-base rounded-2xl shadow-2xl shadow-green-500/25 hover:shadow-green-500/40 hover:scale-105 transition-all"
          >
            Try the Live Dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
