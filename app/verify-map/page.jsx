'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Map } from 'lucide-react';

export default function VerifyMapPage() {
  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden">
      <header className="h-14 bg-slate-900 border-b border-orange-500/60 px-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4 text-orange-400" />
            <span>Back to CampusPool App</span>
          </Link>
          <div className="h-5 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-white">Geeta University Blueprint Overlay</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
              Phase 1 Ground Truth
            </span>
          </div>
        </div>

        <div className="text-xs text-slate-400 hidden sm:block">
          768 × 1024 px Architectural Plan • 22 Nodes • 28 Edges
        </div>
      </header>

      <main className="flex-1 w-full h-full relative">
        <iframe
          src="/verify-map.html"
          className="w-full h-full border-none"
          title="Master Plan Blueprint Overlay"
        />
      </main>
    </div>
  );
}
