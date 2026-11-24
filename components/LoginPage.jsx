'use client';

import React, { useState } from 'react';
import {
  GraduationCap,
  Bus,
  ShieldCheck,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  KeyRound,
  CheckCircle2,
  BarChart3,
  BookOpen,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { playSound } from './AudioEffects';

export default function LoginPage({ onLogin, onOpenProblemSolution, onOpenComparison, soundEnabled }) {
  const [selectedPortal, setSelectedPortal] = useState('student'); // 'student' | 'captain' | 'admin'

  // Student form state
  const [studentRollNo, setStudentRollNo] = useState('GU24-CSE-1042');
  const [studentPassword, setStudentPassword] = useState('campus2026');
  const [studentName, setStudentName] = useState('Aarav Sharma');

  // Captain form state
  const [captainVehicle, setCaptainVehicle] = useState('V1');
  const [captainBadge, setCaptainBadge] = useState('CAPT-V1');
  const [captainPin, setCaptainPin] = useState('1234');
  const [captainName, setCaptainName] = useState('Captain Rajesh Kumar');

  // Admin form state
  const [adminEmail, setAdminEmail] = useState('admin@geeta.edu.in');
  const [adminKey, setAdminKey] = useState('admin2026');

  const handleStudentSubmit = (e) => {
    e?.preventDefault();
    if (soundEnabled) playSound('success');
    onLogin({
      role: 'student',
      user: {
        name: studentName,
        id: studentRollNo,
        credits: 160,
        department: 'School of AI & CSE'
      }
    });
  };

  const handleCaptainSubmit = (e) => {
    e?.preventDefault();
    if (soundEnabled) playSound('success');
    onLogin({
      role: 'captain',
      user: {
        name: captainName,
        badge: captainBadge,
        vehicleId: captainVehicle
      }
    });
  };

  const handleAdminSubmit = (e) => {
    e?.preventDefault();
    if (soundEnabled) playSound('success');
    onLogin({
      role: 'admin',
      user: {
        name: 'Chief Dispatcher Mehta',
        email: adminEmail,
        clearance: 'Tier-1 Master Dispatch Authority'
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-orange-500/10 via-sky-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top University Branding Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="brand-crest shadow-lg shadow-orange-500/20">GU</div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base md:text-lg tracking-wide text-white">
                GEETA UNIVERSITY
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                LIVE DISPATCH GATEWAY
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous Dynamic Campus Ride-Pooling OS • NexHack 2.0
            </p>
          </div>
        </div>

        {/* Global Reference Modals */}
        <div className="flex items-center gap-2">
          {onOpenProblemSolution && (
            <button
              onClick={onOpenProblemSolution}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 transition-all flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden sm:inline">Problem Guide</span>
            </button>
          )}
          {onOpenComparison && (
            <button
              onClick={onOpenComparison}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 transition-all flex items-center gap-1.5"
            >
              <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Solo vs Pool Report</span>
            </button>
          )}
        </div>
      </header>

      {/* Central Login Portal Container */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-5xl mx-auto w-full z-10">
        {/* Title & Introduction */}
        <div className="text-center mb-8 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Role-Based Campus Transit Authentication</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">
            Select Your Designated Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            CampusPool OS features strictly segregated portals for riders, drivers, and transport authorities. Select your credentialed role to launch your dedicated environment.
          </p>
        </div>

        {/* 3 Portal Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-6">
          {/* 1. Student Rider Portal Card */}
          <button
            type="button"
            onClick={() => {
              if (soundEnabled) playSound('click');
              setSelectedPortal('student');
            }}
            className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden group flex flex-col justify-between ${
              selectedPortal === 'student'
                ? 'bg-gradient-to-b from-orange-500/15 via-slate-900 to-slate-900 border-orange-500 ring-2 ring-orange-500/30 shadow-xl shadow-orange-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                  selectedPortal === 'student'
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                    : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'
                }`}>
                  <GraduationCap className="w-6 h-6" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  selectedPortal === 'student'
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  Student Rider
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">Student Rider Portal</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  Book pooled shuttles, track live vehicle ETAs, verify detour bounds, and manage student ride credits.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold">
              <span className={selectedPortal === 'student' ? 'text-orange-400' : 'text-slate-400'}>
                {selectedPortal === 'student' ? 'Selected Portal' : 'Select Portal'}
              </span>
              <ChevronRight className={`w-4 h-4 transition-transform ${selectedPortal === 'student' ? 'translate-x-1 text-orange-400' : 'text-slate-600'}`} />
            </div>
          </button>

          {/* 2. Shuttle Captain Terminal Card */}
          <button
            type="button"
            onClick={() => {
              if (soundEnabled) playSound('click');
              setSelectedPortal('captain');
            }}
            className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden group flex flex-col justify-between ${
              selectedPortal === 'captain'
                ? 'bg-gradient-to-b from-amber-500/15 via-slate-900 to-slate-900 border-amber-500 ring-2 ring-amber-500/30 shadow-xl shadow-amber-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                  selectedPortal === 'captain'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                    : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'
                }`}>
                  <Bus className="w-6 h-6" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  selectedPortal === 'captain'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  Driver Terminal
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">Shuttle Captain Cockpit</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  Driver tablet HUD. Live stop-by-stop passenger manifest, boarding checklists, and maintenance break reports.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold">
              <span className={selectedPortal === 'captain' ? 'text-amber-400' : 'text-slate-400'}>
                {selectedPortal === 'captain' ? 'Selected Portal' : 'Select Portal'}
              </span>
              <ChevronRight className={`w-4 h-4 transition-transform ${selectedPortal === 'captain' ? 'translate-x-1 text-amber-400' : 'text-slate-600'}`} />
            </div>
          </button>

          {/* 3. Transport Admin Command Card */}
          <button
            type="button"
            onClick={() => {
              if (soundEnabled) playSound('click');
              setSelectedPortal('admin');
            }}
            className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden group flex flex-col justify-between ${
              selectedPortal === 'admin'
                ? 'bg-gradient-to-b from-sky-500/15 via-slate-900 to-slate-900 border-sky-500 ring-2 ring-sky-500/30 shadow-xl shadow-sky-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                  selectedPortal === 'admin'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                    : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'
                }`}>
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  selectedPortal === 'admin'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  Master Dispatch
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">Transport Admin Command</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  7-Tab dispatch console. Inject road closures, simulate breakdowns, trigger class dismissal surges, tune policies.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold">
              <span className={selectedPortal === 'admin' ? 'text-sky-400' : 'text-slate-400'}>
                {selectedPortal === 'admin' ? 'Selected Portal' : 'Select Portal'}
              </span>
              <ChevronRight className={`w-4 h-4 transition-transform ${selectedPortal === 'admin' ? 'translate-x-1 text-sky-400' : 'text-slate-600'}`} />
            </div>
          </button>
        </div>

        {/* Selected Portal Form Box */}
        <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl backdrop-blur-md">
          {/* STUDENT LOGIN FORM */}
          {selectedPortal === 'student' && (
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-base text-white">Student Rider Authentication</h2>
                  <p className="text-xs text-slate-400">Enter your university roll number to book campus rides</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  University Roll Number
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={studentRollNo}
                    onChange={(e) => setStudentRollNo(e.target.value)}
                    required
                    placeholder="e.g. GU24-CSE-1042"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Student Name
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Campus Password / Passkey
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-bold text-sm text-white shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <span>Sign In to Student Rider Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleStudentSubmit}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-xs font-semibold text-slate-300 border border-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                  <span>⚡ Quick 1-Click Demo Login as Aarav Sharma</span>
                </button>
              </div>
            </form>
          )}

          {/* CAPTAIN LOGIN FORM */}
          {selectedPortal === 'captain' && (
            <form onSubmit={handleCaptainSubmit} className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <Bus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-base text-white">Shuttle Captain Terminal Login</h2>
                  <p className="text-xs text-slate-400">Select assigned campus vehicle and driver credentials</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Assigned Shuttle
                </label>
                <div className="relative">
                  <Bus className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <select
                    value={captainVehicle}
                    onChange={(e) => setCaptainVehicle(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="V1">Shuttle V1 (Campus Express - Capacity: 6)</option>
                    <option value="V2">Shuttle V2 (Hostel Shuttle - Capacity: 6)</option>
                    <option value="V3">Shuttle V3 (Library Loop - Capacity: 4)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Driver Badge ID
                  </label>
                  <input
                    type="text"
                    value={captainBadge}
                    onChange={(e) => setCaptainBadge(e.target.value)}
                    required
                    placeholder="e.g. CAPT-V1"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Driver PIN
                  </label>
                  <input
                    type="password"
                    value={captainPin}
                    onChange={(e) => setCaptainPin(e.target.value)}
                    required
                    placeholder="1234"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Captain Name
                </label>
                <input
                  type="text"
                  value={captainName}
                  onChange={(e) => setCaptainName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 font-bold text-sm text-white shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <span>Launch Shuttle {captainVehicle} Cockpit</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleCaptainSubmit}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-xs font-semibold text-slate-300 border border-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>⚡ Quick 1-Click Demo Login as Captain Rajesh (Shuttle V1)</span>
                </button>
              </div>
            </form>
          )}

          {/* ADMIN LOGIN FORM */}
          {selectedPortal === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-base text-white">Transport Authority & Dispatch Login</h2>
                  <p className="text-xs text-slate-400">Executive access for dispatch officers & system controllers</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Dispatcher Officer Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    placeholder="admin@geeta.edu.in"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Master Clearance Key
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-800/40 text-[11px] text-sky-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Full Administrative Privileges</span>
                </div>
                <p className="text-slate-400">
                  Allows road closure disruptions, vehicle breakdown simulation, dismissal surge triggers, and policy tuning.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 font-bold text-sm text-white shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <span>Enter Dispatch Command Center</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleAdminSubmit}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-xs font-semibold text-slate-300 border border-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>⚡ Quick 1-Click Demo Login as Chief Dispatcher</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Footer System Status Bar */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Geeta University Campus Spatial Network Active • Panipat, Haryana</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-slate-500">Pooling Invariant: <code className="text-orange-400">P_onboard + P_assigned ≤ Capacity</code></span>
          <span className="text-slate-500">Detour Bound: <code className="text-sky-400">T_shared ≤ 1.5 · T_direct</code></span>
        </div>
      </footer>
    </div>
  );
}
