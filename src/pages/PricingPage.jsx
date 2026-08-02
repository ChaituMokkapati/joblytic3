import React, { useState } from 'react';

const PLANS = [
  {
    name: 'Free',
    price: '₹0',
    period: '/forever',
    popular: false,
    color: 'border-white/10',
    badge: null,
    features: [
      '5 job searches/day',
      'Basic job listings',
      '3 portal access',
      'Email alerts (weekly)',
      'Basic doc checklist',
      'Community support',
    ],
    cta: 'Start Free',
    ctaStyle: 'bg-white/10 hover:bg-white/15 text-white border border-white/10',
  },
  {
    name: 'Pro',
    price: '₹299',
    period: '/month',
    popular: true,
    color: 'border-green-500/50',
    badge: 'MOST POPULAR',
    features: [
      'Unlimited job searches',
      'All 25+ portals access',
      'AI Doc Verification (unlimited)',
      'Smart alerts (instant)',
      'Document Optimizer AI',
      'Application tracker',
      'Exam date reminders',
      'Priority email support',
    ],
    cta: 'Get Pro →',
    ctaStyle: 'bg-green-500 hover:bg-green-400 text-black font-bold',
  },
  {
    name: 'Enterprise',
    price: '₹999',
    period: '/month',
    popular: false,
    color: 'border-amber-500/40',
    badge: null,
    features: [
      'Everything in Pro',
      'Bulk candidate management',
      'API access',
      'Custom portal integrations',
      'Dedicated account manager',
      'White-label options',
      'SLA guarantee',
      'Phone + chat support',
    ],
    cta: 'Contact Sales',
    ctaStyle: 'bg-gradient-to-r from-amber-500 to-amber-400 text-black font-bold',
  },
];

const CHECK_ICON = () => (
  <svg className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
);

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="ambient-orb w-[600px] h-[600px] bg-amber-500 top-[-200px] right-[-200px]" />
      <div className="ambient-orb w-[400px] h-[400px] bg-green-500 bottom-[-100px] left-[-100px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">

        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            TRANSPARENT PRICING
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 tracking-tight">
            Simple <span className="gradient-text-amber">Pricing</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-md mx-auto mb-8">
            No hidden fees. No surprises. Pick the plan that works for you.
          </p>

          {/* Annual toggle */}
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <span className={`text-sm font-medium ${!annual ? 'text-white' : 'text-gray-400'}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-10 h-5.5 rounded-full transition-colors ${annual ? 'bg-green-500' : 'bg-white/20'}`}
              style={{ height: '22px', width: '42px' }}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${annual ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <span className={`text-sm font-medium ${annual ? 'text-white' : 'text-gray-400'}`}>
              Annual <span className="text-green-400 font-bold">-20%</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PLANS.map((plan, i) => (
            <div
              key={i}
              className={`relative flex flex-col rounded-2xl border p-8 transition-all duration-300 ${plan.color} ${
                plan.popular
                  ? 'bg-gradient-to-b from-green-950/40 to-black shadow-2xl shadow-green-500/15 scale-[1.03]'
                  : 'bg-white/[0.03] hover:bg-white/[0.05]'
              }`}
              style={{ backdropFilter: 'blur(16px)' }}
            >
              {/* Most Popular badge */}
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-green-500 text-black text-xs font-black rounded-full tracking-wider">
                  {plan.badge}
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-8">
                <h3 className="text-white font-bold text-lg mb-3">{plan.name}</h3>
                <div className="flex items-end gap-1">
                  <span className={`text-5xl font-black ${plan.popular ? 'gradient-text-green' : plan.name === 'Enterprise' ? 'gradient-text-amber' : 'text-white'}`}>
                    {annual && plan.price !== '₹0'
                      ? `₹${Math.floor(parseInt(plan.price.replace('₹', '')) * 0.8)}`
                      : plan.price}
                  </span>
                  <span className="text-gray-400 text-sm mb-1.5">{plan.period}</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <CHECK_ICON />
                    <span className="text-gray-300 text-sm">{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button className={`w-full py-3.5 rounded-xl text-sm transition-all duration-200 hover:scale-105 ${plan.ctaStyle}`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Trust row */}
        <div className="mt-14 text-center">
          <p className="text-gray-500 text-sm mb-4">Trusted by 100M+ aspirants across India</p>
          <div className="flex flex-wrap justify-center gap-6">
            {['✅ Secure Payments', '✅ Cancel Anytime', '✅ 7-Day Refund', '✅ No Hidden Charges'].map(t => (
              <span key={t} className="text-gray-400 text-sm">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
