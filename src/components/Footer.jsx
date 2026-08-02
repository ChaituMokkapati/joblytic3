import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 320);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Floating back-to-top */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Back to top"
        className={`fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-amber-500/30 bg-black/90 text-amber-300 text-xs font-semibold shadow-lg shadow-black/40 backdrop-blur-md transition-all duration-300 hover:bg-amber-500 hover:text-black hover:border-amber-400 ${
          showTop ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-3 pointer-events-none'
        }`}
      >
        <ArrowUp className="w-4 h-4" />
        Back to top
      </button>

      <footer
        className="border-t border-white/[0.06] mt-auto"
        style={{ background: 'rgba(0,0,0,0.9)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                  <span className="text-black font-black text-sm">A</span>
                </div>
                <span className="font-black text-lg">
                  <span className="text-amber-400">AMB</span>
                  <span className="text-white"> SaaS</span>
                </span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                India's most intelligent government job aggregation platform. Powered by AI, built for aspirants.
              </p>
              <div className="flex gap-4 mt-6">
                <div className="w-8 h-8 rounded-lg bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/30 flex items-center justify-center cursor-pointer transition-all">
                  <span className="text-gray-400 text-xs">𝕏</span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/30 flex items-center justify-center cursor-pointer transition-all">
                  <span className="text-gray-400 text-xs">in</span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/30 flex items-center justify-center cursor-pointer transition-all">
                  <span className="text-gray-400 text-xs">yt</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-widest">Product</h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Features', to: '/features' },
                  { label: 'Demo', to: '/demo' },
                  { label: 'Pricing', to: '/pricing' },
                  { label: 'Dashboard', to: '/dashboard' }
                ].map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-gray-400 hover:text-amber-400 text-sm transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-widest">Legal</h4>
              <ul className="space-y-2.5">
                {['Privacy Policy', 'Terms of Service', 'Refund Policy', 'Contact Us'].map((l) => (
                  <li key={l}>
                    <span className="text-gray-400 hover:text-amber-400 text-sm transition-colors cursor-pointer">{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-gray-500 text-xs">© {year} AMB SaaS. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={scrollToTop}
                className="inline-flex items-center gap-1.5 text-xs text-amber-400/90 hover:text-amber-300 transition-colors"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                Back to top
              </button>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-gray-500 text-xs">All systems operational</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
