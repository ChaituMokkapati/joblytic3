import React, { useState, useEffect } from 'react';
import { User, Mail, Briefcase, FileCheck, Bell, Edit3, ShieldCheck, Check, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function ProfileBoard() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: 'Candidate', email: 'candidate@ambjobs.com' });
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load user from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        const u = { name: parsed.name || 'Candidate', email: parsed.email || 'candidate@ambjobs.com' };
        setUser(u);
        setEditName(u.name);
        setEditEmail(u.email);
      }
    } catch (e) {
      console.error('Failed to parse user from localStorage');
    }
  }, [navigate]);

  const handleSave = (e) => {
    e.preventDefault();
    const updated = { ...user, name: editName, email: editEmail };
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 font-sans py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-[#D4AF37] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* Profile Header Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-[#1a080d] to-slate-900 border border-[#800020]/40 shadow-2xl flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-[#800020] border-2 border-[#D4AF37] flex items-center justify-center text-[#D4AF37] text-2xl font-bold font-serif shadow-lg shadow-[#800020]/40 shrink-0">
            {initials}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-2">
              <h1 className="text-2xl font-serif font-bold text-white">{user.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#800020]/60 border border-[#D4AF37]/50 text-[10px] font-mono font-semibold text-[#D4AF37]">
                PRO CANDIDATE
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1 font-mono justify-center sm:justify-start">
              <Mail className="w-3.5 h-3.5 text-[#D4AF37]" /> {user.email}
            </p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-5 py-2.5 rounded-xl bg-[#800020] hover:bg-[#600018] text-[#F5F1E8] font-semibold text-xs border border-[#D4AF37]/60 shadow-lg transition-all flex items-center gap-2 shrink-0"
          >
            <Edit3 className="w-4 h-4 text-[#D4AF37]" />
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {/* Save Success Banner */}
        {savedSuccess && (
          <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            Profile updated successfully!
          </div>
        )}

        {/* Edit Form */}
        {isEditing && (
          <form onSubmit={handleSave} className="p-6 rounded-2xl bg-slate-900 border border-[#800020]/50 space-y-4">
            <h3 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider font-mono">Edit Profile</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" className="px-5 py-2 rounded-xl bg-[#800020] text-white text-xs font-bold border border-[#D4AF37]/50 hover:bg-[#600018] transition">
                Save Changes
              </button>
            </div>
          </form>
        )}

        {/* 3 Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { icon: <Briefcase className="w-6 h-6 text-[#D4AF37]" />, label: 'Jobs Applied', value: '0', desc: 'Tracked applications across central & state portals.' },
            { icon: <FileCheck className="w-6 h-6 text-[#D4AF37]" />, label: 'Docs Verified', value: '0', desc: 'Certificates verified by the Codex AI Agent.' },
            { icon: <Bell className="w-6 h-6 text-[#D4AF37]" />, label: 'Alerts Active', value: '0', desc: 'Active WhatsApp & Email deadline notifications.' }
          ].map((card) => (
            <div key={card.label} className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-[#800020]/60 transition-all shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#800020]/20 border border-[#800020]/50 flex items-center justify-center">
                  {card.icon}
                </div>
                <span className="text-2xl font-extrabold text-white font-mono">{card.value}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-200">{card.label}</h3>
              <p className="text-xs text-slate-500 mt-1">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* Account Details */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white font-serif flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" /> Security & Authentication
            </h2>
            <span className="text-xs text-emerald-400 font-mono font-semibold">Active Session</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="text-slate-500 block uppercase text-[10px] font-mono mb-1">Candidate ID</span>
              <span className="text-slate-200 font-mono">usr-{user.email.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="text-slate-500 block uppercase text-[10px] font-mono mb-1">Auth Method</span>
              <span className="text-slate-200 font-mono">JWT Bearer / Express API</span>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <Link
              to="/forgot-password"
              className="text-xs text-[#800020] hover:text-[#D4AF37] transition font-semibold"
            >
              Change Password
            </Link>
            <span className="text-slate-700">·</span>
            <button
              onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); localStorage.removeItem('amb_user_session'); window.dispatchEvent(new Event('amb-auth-changed')); navigate('/login'); }}
              className="text-xs text-rose-500 hover:text-rose-400 transition font-semibold"
            >
              Sign Out
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
