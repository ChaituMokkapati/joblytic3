import React, { useState } from 'react';
import { X, Sparkles, Download, Copy, Check, ShieldCheck, Palette } from 'lucide-react';
import AmbMonogramLogo from './AmbMonogramLogo';

export default function BrandShowcaseModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState('vector'); // 'vector' | 'highres'

  if (!isOpen) return null;

  const svgCode = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <defs>
    <linearGradient id="goldMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F4D068" />
      <stop offset="35%" stop-color="#D4AF37" />
      <stop offset="70%" stop-color="#AA7C11" />
      <stop offset="100%" stop-color="#E6CA65" />
    </linearGradient>
    <linearGradient id="burgundyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#800020" />
      <stop offset="100%" stop-color="#5B0017" />
    </linearGradient>
  </defs>
  <rect width="500" height="500" rx="64" fill="#F5F1E8" />
  <circle cx="250" cy="250" r="215" fill="none" stroke="url(#goldMetallic)" stroke-width="3" opacity="0.75" />
  <circle cx="250" cy="250" r="205" fill="none" stroke="#800020" stroke-width="1.5" opacity="0.2" />
  <g transform="translate(0, 10)">
    <path d="M 175 340 L 225 160 L 245 160 L 195 340 Z" fill="url(#burgundyGrad)" />
    <path d="M 155 335 L 210 335 L 210 340 L 155 340 Z" fill="url(#burgundyGrad)" />
    <path d="M 275 160 L 325 340 L 305 340 L 255 160 Z" fill="url(#burgundyGrad)" />
    <path d="M 305 340 C 340 340, 365 315, 365 285 C 365 260, 345 245, 325 245 C 350 245, 370 225, 370 200 C 370 175, 345 160, 310 160 L 290 160 L 290 175 L 310 175 C 330 175, 345 185, 345 200 C 345 215, 330 230, 305 230 C 290 230, 275 230, 260 230 L 260 245 L 300 245 C 325 245, 342 260, 342 280 C 342 300, 325 325, 295 325 Z" fill="url(#burgundyGrad)" opacity="0.95" />
    <polygon points="215,160 285,160 250,225" fill="url(#burgundyGrad)" />
    <path d="M 120 280 C 180 230, 260 310, 380 230" fill="none" stroke="url(#goldMetallic)" stroke-width="8" stroke-linecap="round" />
    <path d="M 120 280 C 180 230, 260 310, 380 230" fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" opacity="0.4" />
    <circle cx="120" cy="280" r="5" fill="url(#goldMetallic)" />
    <circle cx="380" cy="230" r="5" fill="url(#goldMetallic)" />
  </g>
</svg>`;

  const handleCopySvg = () => {
    navigator.clipboard.writeText(svgCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0f172a] border border-[#D4AF37]/40 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl shadow-[#D4AF37]/10">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#800020] text-[#D4AF37] flex items-center justify-center font-serif font-bold text-lg border border-[#D4AF37]/40">
              AMB
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                AMB Luxury Monogram Logo <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              </h2>
              <p className="text-xs text-slate-400">High-Fashion & Tech SaaS Brand Identity</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* View Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveView('vector')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeView === 'vector' 
                    ? 'bg-[#800020] text-[#D4AF37] border border-[#D4AF37]/40' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Scalable SVG Vector
              </button>
              <button
                onClick={() => setActiveView('highres')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeView === 'highres' 
                    ? 'bg-[#800020] text-[#D4AF37] border border-[#D4AF37]/40' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                High-Res Render (PNG)
              </button>
            </div>

            <button
              onClick={handleCopySvg}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-slate-700 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'SVG Copied!' : 'Copy SVG Vector'}
            </button>
          </div>

          {/* Logo Showcase Display Box */}
          <div className="flex justify-center items-center p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-[#080c14] border border-slate-800 relative group">
            {activeView === 'vector' ? (
              <AmbMonogramLogo size={240} useImage={false} />
            ) : (
              <img 
                src="/amb_logo.png" 
                alt="AMB Monogram High Res" 
                className="w-60 h-60 rounded-3xl object-cover border-2 border-[#D4AF37]/60 shadow-xl shadow-[#D4AF37]/20"
              />
            )}
          </div>

          {/* Specifications & Palette */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
              <div className="flex items-center gap-2 mb-1.5 font-semibold text-slate-200">
                <span className="w-3 h-3 rounded-full bg-[#800020] border border-[#D4AF37]/60"></span> Deep Burgundy
              </div>
              <p className="font-mono text-[#D4AF37]">#800020</p>
              <p className="text-[11px] text-slate-400 mt-1">Bold serif primary stems (A, M, B)</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
              <div className="flex items-center gap-2 mb-1.5 font-semibold text-slate-200">
                <span className="w-3 h-3 rounded-full bg-[#D4AF37] border border-[#D4AF37]"></span> Metallic Gold
              </div>
              <p className="font-mono text-[#D4AF37]">#D4AF37</p>
              <p className="text-[11px] text-slate-400 mt-1">Flowing accent line & stroke accents</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
              <div className="flex items-center gap-2 mb-1.5 font-semibold text-slate-200">
                <span className="w-3 h-3 rounded-full bg-[#F5F1E8] border border-slate-600"></span> Off-White Cream
              </div>
              <p className="font-mono text-slate-300">#F5F1E8</p>
              <p className="text-[11px] text-slate-400 mt-1">Soft contrast canvas background</p>
            </div>
          </div>

          {/* Description summary */}
          <div className="p-4 rounded-xl bg-[#800020]/20 border border-[#D4AF37]/30 text-xs leading-relaxed text-slate-300">
            <p className="font-semibold text-[#D4AF37] mb-1 flex items-center gap-1.5">
              <Palette className="w-4 h-4" /> Custom Interwoven Typography Architecture
            </p>
            'A' and 'M' provide the solid structural foundation with clean serif edges, while 'B' is seamlessly interwoven into the flourish. The metallic gold swoosh unifies the mark for a timeless luxury brand identity.
          </div>

        </div>

      </div>
    </div>
  );
}
