import React from 'react';

export default function AmbMonogramLogo({ size = 44, className = '', useImage = false }) {
  if (useImage) {
    return (
      <img 
        src="/amb_logo.png" 
        alt="AMB Luxury Monogram Logo" 
        style={{ width: size, height: size }} 
        className={`rounded-xl object-cover shadow-lg border border-[#D4AF37]/40 ${className}`}
      />
    );
  }

  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 500 500" 
      width={size} 
      height={size} 
      className={`rounded-xl shadow-lg ${className}`}
      aria-label="AMB Luxury Monogram Logo"
    >
      <defs>
        {/* Metallic Gold Linear Gradient */}
        <linearGradient id="ambGoldMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F4D068" />
          <stop offset="35%" stopColor="#D4AF37" />
          <stop offset="70%" stopColor="#AA7C11" />
          <stop offset="100%" stopColor="#E6CA65" />
        </linearGradient>

        {/* Deep Burgundy Gradient */}
        <linearGradient id="ambBurgundyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#800020" />
          <stop offset="100%" stopColor="#5B0017" />
        </linearGradient>
      </defs>

      {/* Canvas background - Soft Cream */}
      <rect width="500" height="500" rx="64" fill="#F5F1E8" />

      {/* Outer Fine Gold Geometric Border Ring */}
      <circle cx="250" cy="250" r="215" fill="none" stroke="url(#ambGoldMetallic)" strokeWidth="3" opacity="0.75" />
      <circle cx="250" cy="250" r="205" fill="none" stroke="#800020" strokeWidth="1.5" opacity="0.2" />

      {/* Monogram Master Group */}
      <g transform="translate(0, 10)">
        {/* Letter A Stem (Left) */}
        <path d="M 175 340 L 225 160 L 245 160 L 195 340 Z" fill="url(#ambBurgundyGrad)" />
        <path d="M 155 335 L 210 335 L 210 340 L 155 340 Z" fill="url(#ambBurgundyGrad)" />

        {/* Letter M Stem (Right) */}
        <path d="M 275 160 L 325 340 L 305 340 L 255 160 Z" fill="url(#ambBurgundyGrad)" />
        
        {/* Integrated B Loop & Tail */}
        <path 
          d="M 305 340 C 340 340, 365 315, 365 285 C 365 260, 345 245, 325 245 C 350 245, 370 225, 370 200 C 370 175, 345 160, 310 160 L 290 160 L 290 175 L 310 175 C 330 175, 345 185, 345 200 C 345 215, 330 230, 305 230 C 290 230, 275 230, 260 230 L 260 245 L 300 245 C 325 245, 342 260, 342 280 C 342 300, 325 325, 295 325 Z" 
          fill="url(#ambBurgundyGrad)" 
          opacity="0.95" 
        />

        {/* Center Apex Intersection */}
        <polygon points="215,160 285,160 250,225" fill="url(#ambBurgundyGrad)" />
        
        {/* Flowing Metallic Gold Accent Line */}
        <path d="M 120 280 C 180 230, 260 310, 380 230" fill="none" stroke="url(#ambGoldMetallic)" strokeWidth="8" strokeLinecap="round" />
        <path d="M 120 280 C 180 230, 260 310, 380 230" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        
        {/* Gold Highlights */}
        <circle cx="120" cy="280" r="5" fill="url(#ambGoldMetallic)" />
        <circle cx="380" cy="230" r="5" fill="url(#ambGoldMetallic)" />
      </g>
    </svg>
  );
}
