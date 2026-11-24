'use client';

import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  Gauge,
  Sparkles,
  BarChart3,
  BookOpen,
  Volume2,
  VolumeX,
  User,
  Bus,
  Shield,
  LogOut,
  GraduationCap
} from 'lucide-react';
import { playSound } from './AudioEffects';

export default function TopNavbar({
  simTime = 0,
  isPlaying,
  onTogglePlay,
  onStep,
  speedMultiplier,
  onSpeedChange,
  currentUser,
  onLogout,
  onOpenProblemSolution,
  onOpenComparison,
  onStartDemo,
  soundEnabled,
  onToggleSound
}) {
  const role = currentUser?.role || 'student';
  const user = currentUser?.user || {};

  return (
    <header className="app-header">
      {/* Brand Crest & Portal Identity */}
      <div className="flex items-center gap-3">
        <div className="brand-crest shadow-md shadow-orange-500/20">GU</div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm md:text-base tracking-wide text-white">
              GEETA UNIVERSITY
            </span>
            {role === 'student' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
                <GraduationCap className="w-3 h-3" />
                STUDENT RIDER PORTAL
              </span>
            )}
            {role === 'captain' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Bus className="w-3 h-3" />
                CAPTAIN COCKPIT • SHUTTLE {user.vehicleId || 'V1'}
              </span>
            )}
            {role === 'admin' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                <Shield className="w-3 h-3" />
                TRANSPORT DISPATCH COMMAND
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
            {role === 'student' && 'Personal Campus Ride-Pooling & Live Vehicle Tracking'}
            {role === 'captain' && `Active Driver Terminal • ${user.name || 'Captain Rajesh'}`}
            {role === 'admin' && 'Autonomous Fleet Dispatch & Disruption Management Center'}
          </p>
        </div>
      </div>

      {/* Center Persona Profile Badge */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
        {role === 'student' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-white">{user.name || 'Aarav Sharma'}</span>
            <span className="text-slate-400">({user.id || 'GU24-CSE-1042'})</span>
            <span className="px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-300 font-mono text-[11px] font-bold">
              {user.credits || 160} pts
            </span>
          </div>
        )}

        {role === 'captain' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="font-bold text-white">{user.name || 'Captain Rajesh Kumar'}</span>
            <span className="text-slate-400">Badge: {user.badge || 'CAPT-V1'}</span>
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-[11px] font-bold">
              In-Service
            </span>
          </div>
        )}

        {role === 'admin' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
            <span className="font-bold text-white">{user.name || 'Chief Dispatcher Mehta'}</span>
            <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-[11px] font-bold">
              Full Clearance
            </span>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Time Pill */}
        <div className="time-display-pill">
          <span>⏱ t = {typeof simTime === 'number' ? simTime.toFixed(1) : simTime} min</span>
        </div>

        {/* Admin-only Simulation Controls */}
        {role === 'admin' && (
          <>
            <div className="btn-group">
              <button
                className={`btn-sm ${isPlaying ? 'bg-amber-600/30 text-amber-300' : 'bg-emerald-600/30 text-emerald-300'}`}
                title={isPlaying ? 'Pause Simulation' : 'Resume Simulation'}
                onClick={() => {
                  if (soundEnabled) playSound('click');
                  onTogglePlay();
                }}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isPlaying ? 'Pause' : 'Play'}</span>
              </button>
              <button
                className="btn-sm"
                title="Step 10s Forward"
                onClick={() => {
                  if (soundEnabled) playSound('click');
                  onStep();
                }}
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Step</span>
              </button>
            </div>

            {/* Speed Pills */}
            <div className="btn-group hidden md:flex">
              {[1, 5, 20].map(s => (
                <button
                  key={s}
                  className={`btn-sm btn-speed ${speedMultiplier === s ? 'active' : ''}`}
                  onClick={() => {
                    if (soundEnabled) playSound('click');
                    onSpeedChange(s);
                  }}
                >
                  {s}x
                </button>
              ))}
            </div>
          </>
        )}

        {/* Problem Solution Modal Button */}
        <button
          className="btn-secondary btn-sm hidden xl:flex items-center gap-1.5"
          onClick={() => {
            if (soundEnabled) playSound('click');
            onOpenProblemSolution();
          }}
          title="View Problem Statement, Architecture & Formulas"
        >
          <BookOpen className="w-3.5 h-3.5 text-sky-400" />
          <span>Solution Guide</span>
        </button>

        {/* Comparison Modal Button */}
        <button
          className="btn-secondary btn-sm hidden md:flex items-center gap-1.5"
          onClick={() => {
            if (soundEnabled) playSound('click');
            onOpenComparison();
          }}
          title="Head-to-Head: Dynamic Pooling vs Solo Rides"
        >
          <BarChart3 className="w-3.5 h-3.5 text-orange-400" />
          <span>Solo vs Pool</span>
        </button>

        {/* Sound FX Toggle */}
        <button
          className="btn-sm p-1.5 text-slate-400 hover:text-white"
          onClick={() => onToggleSound()}
          title={soundEnabled ? 'Mute Procedural Audio' : 'Enable Procedural Audio'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
        </button>

        {/* 7-Step Scripted Presentation Demo (Admin role) */}
        {role === 'admin' && onStartDemo && (
          <button
            className="btn-primary btn-sm flex items-center gap-1.5"
            onClick={() => {
              if (soundEnabled) playSound('chime');
              onStartDemo();
            }}
            title="Launch 7-Step Interactive Presentation Demo"
          >
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>Run Demo</span>
          </button>
        )}

        {/* Dedicated Sign Out / Switch Portal Button */}
        {onLogout && (
          <button
            className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            onClick={() => {
              if (soundEnabled) playSound('click');
              onLogout();
            }}
            title="Sign Out of Current Role & Return to Portal Login Hub"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Switch Portal</span>
          </button>
        )}
      </div>
    </header>
  );
}

