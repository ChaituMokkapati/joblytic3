import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { LogOut, LayoutDashboard, User, ChevronDown, Home, ChevronRight } from 'lucide-react';
import { WORKSPACE_TABS, parseWorkspaceTab, workspacePath } from '../workspaceTabs';

const MARKETING_LINKS = [
  { label: 'Features', to: '/features' },
  { label: 'Demo', to: '/demo' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Dashboard', to: '/dashboard' }
];

function readAuth() {
  try {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!token) return { loggedIn: false, user: null };
    return { loggedIn: true, user: user || { name: 'User', email: '' } };
  } catch {
    return { loggedIn: false, user: null };
  }
}

function initialsFrom(user) {
  const name = user?.name?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  const email = user?.email || '';
  return (email.slice(0, 2) || 'U').toUpperCase();
}

function tabButtonClass(active, accent) {
  if (!active) return 'text-slate-400 hover:text-white hover:bg-white/5';
  if (accent === 'cyan') return 'bg-cyan-600 text-white border border-cyan-400/40';
  if (accent === 'wine') return 'bg-[#800020] text-white border border-[#D4AF37]/40';
  if (accent === 'trace') return 'bg-slate-800 text-emerald-400 border border-emerald-500/40';
  return 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow';
}

export function notifyAuthChanged() {
  window.dispatchEvent(new Event('amb-auth-changed'));
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [auth, setAuth] = useState(() => readAuth());
  const [alertCount, setAlertCount] = useState(0);
  const avatarRef = useRef(null);

  useEffect(() => {
    const sync = () => setAuth(readAuth());
    sync();
    window.addEventListener('amb-auth-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('amb-auth-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, [location.pathname]);

  useEffect(() => {
    const onAlerts = (e) => setAlertCount(Number(e.detail?.count) || 0);
    window.addEventListener('amb-alerts-count', onAlerts);
    return () => window.removeEventListener('amb-alerts-count', onAlerts);
  }, []);

  useEffect(() => {
    setAvatarOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!avatarOpen) return undefined;
    const onPointer = (e) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setAvatarOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setAvatarOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [avatarOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('amb_user_session');
    notifyAuthChanged();
    setAvatarOpen(false);
    setMenuOpen(false);
    navigate('/login');
  };

  const displayName = auth.user?.name || auth.user?.email?.split('@')[0] || 'User';
  const inWorkspace = location.pathname.startsWith('/dashboard');
  const homeTo = auth.loggedIn ? '/dashboard' : '/';
  const initials = initialsFrom(auth.user);
  const activeTab = parseWorkspaceTab(searchParams.get('tab'));

  const goTab = (tabId) => {
    navigate(workspacePath(tabId));
    setMenuOpen(false);
  };

  return (
    <nav
      className="sticky top-0 z-50 w-full border-b border-white/[0.06]"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          <div className="flex items-center gap-2 min-w-0 shrink-0">
            <Link to={homeTo} className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <span className="text-black font-black text-sm">A</span>
              </div>
              <span className="font-black text-lg tracking-tight hidden sm:inline">
                <span className="text-amber-400">AMB</span>
                <span className="text-white"> SaaS</span>
              </span>
            </Link>

            {auth.loggedIn && inWorkspace && (
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 pl-1 sm:pl-2 border-l border-white/10 ml-1 sm:ml-2">
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span className="text-amber-400 font-medium whitespace-nowrap">Agent Workspace</span>
              </div>
            )}
          </div>

          {/* Guest marketing links · Logged-in workspace tabs */}
          <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center min-w-0 overflow-x-auto">
            {auth.loggedIn && inWorkspace ? (
              WORKSPACE_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const label = tab.id === 'alerts' ? `Alerts (${alertCount})` : tab.label;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => goTab(tab.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition whitespace-nowrap ${tabButtonClass(
                      isActive,
                      tab.accent
                    )}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </button>
                );
              })
            ) : !auth.loggedIn ? (
              MARKETING_LINKS.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })
            ) : (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Open Workspace
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3 shrink-0">
            {auth.loggedIn ? (
              <div className="relative" ref={avatarRef}>
                <button
                  type="button"
                  onClick={() => setAvatarOpen((v) => !v)}
                  aria-expanded={avatarOpen}
                  aria-haspopup="menu"
                  className="inline-flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition"
                >
                  <span className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-black text-xs font-black flex items-center justify-center shadow">
                    {initials}
                  </span>
                  <span className="text-xs text-slate-200 font-medium max-w-[110px] truncate">{displayName}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform ${avatarOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {avatarOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-64 rounded-xl border border-white/10 bg-[#111111] shadow-2xl shadow-black/50 overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{auth.user?.email || 'Signed in'}</p>
                    </div>

                    <div className="py-1.5">
                      {!inWorkspace && (
                        <Link
                          role="menuitem"
                          to="/dashboard"
                          onClick={() => setAvatarOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5 transition"
                        >
                          <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                          Open Workspace
                        </Link>
                      )}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setAvatarOpen(false);
                          navigate(workspacePath('profile'));
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5 transition"
                      >
                        <User className="w-4 h-4 text-amber-400" />
                        Profile & settings
                      </button>
                      <Link
                        role="menuitem"
                        to="/"
                        onClick={() => setAvatarOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5 transition"
                      >
                        <Home className="w-4 h-4 text-slate-400" />
                        Marketing home
                      </Link>
                    </div>

                    <div className="border-t border-white/10 py-1.5">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-300 hover:bg-rose-500/10 transition"
                      >
                        <LogOut className="w-4 h-4" />
                        Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-300 hover:text-white transition-colors px-4 py-2"
                >
                  Log In
                </Link>
                <Link
                  to="/login"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-red-900/30 hover:shadow-red-500/30"
                >
                  Get Started →
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors shrink-0"
          >
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {menuOpen && (
          <div className="lg:hidden py-4 space-y-1 border-t border-white/5">
            {auth.loggedIn && inWorkspace ? (
              <>
                <div className="px-4 pb-2 text-xs text-slate-500 flex items-center gap-1">
                  AMB SaaS <ChevronRight className="w-3 h-3" />{' '}
                  <span className="text-amber-400">Agent Workspace</span>
                </div>
                {WORKSPACE_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  const label = tab.id === 'alerts' ? `Alerts (${alertCount})` : tab.label;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => goTab(tab.id)}
                      className={`w-full flex items-center gap-2 mx-0 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                        isActive ? 'text-amber-400 bg-amber-500/10' : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  );
                })}
                <div className="border-t border-white/10 mt-2 pt-2 px-2">
                  <button
                    type="button"
                    onClick={() => {
                      goTab('profile');
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-slate-200 hover:bg-white/5"
                  >
                    <User className="w-4 h-4 text-amber-400" />
                    Profile & settings
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-rose-300 hover:bg-rose-500/10"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </div>
              </>
            ) : auth.loggedIn ? (
              <>
                <div className="px-4 py-3 mb-2 rounded-xl bg-white/5 border border-white/10 mx-2">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-black text-sm font-black flex items-center justify-center">
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                      <p className="text-xs text-slate-400 truncate">{auth.user?.email || 'Signed in'}</p>
                    </div>
                  </div>
                </div>
                <Link
                  to="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 mx-2 px-4 py-2.5 rounded-lg text-sm text-slate-200 hover:bg-white/5"
                >
                  <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                  Open Workspace
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 mx-2 px-4 py-2.5 rounded-lg text-sm text-rose-300 hover:bg-rose-500/10 w-[calc(100%-1rem)]"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              </>
            ) : (
              <>
                {MARKETING_LINKS.map((link) => {
                  const isActive = location.pathname === link.to;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMenuOpen(false)}
                      className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive ? 'text-amber-400 bg-amber-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
                <div className="flex flex-col gap-2 pt-3 px-4">
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="text-center py-2 text-sm text-gray-300 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="text-center py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                  >
                    Get Started →
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
