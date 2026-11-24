'use client';

import React from 'react';
import { Sparkles, Play, Pause, ChevronRight, X } from 'lucide-react';

export default function DemoBanner({
  active,
  step,
  steps,
  autoPlay,
  onNext,
  onToggleAuto,
  onClose
}) {
  if (!active || !steps[step]) return null;

  const current = steps[step];

  return (
    <div id="demo-banner" className="demo-banner-anim">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-1">
        <div className="flex items-center gap-2">
          <span className="demo-step-pill flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            {current.title}
          </span>
        </div>
        <p className="demo-caption text-xs md:text-sm text-slate-200">
          {current.caption}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {step < steps.length - 1 ? (
          <button
            className="btn-primary btn-sm flex items-center gap-1 shadow-lg shadow-orange-500/30"
            onClick={onNext}
          >
            <span>Next Step</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            className="btn-primary btn-sm bg-emerald-600 hover:bg-emerald-500"
            onClick={onClose}
          >
            <span>Finish Tour</span>
          </button>
        )}

        <button
          className="btn-secondary btn-sm flex items-center gap-1"
          onClick={onToggleAuto}
        >
          {autoPlay ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
          <span className="hidden sm:inline">{autoPlay ? 'Pause Auto' : 'Auto Play'}</span>
        </button>

        <button
          className="btn-sm text-slate-400 hover:text-white p-1.5"
          onClick={onClose}
          title="Exit Scripted Demo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
