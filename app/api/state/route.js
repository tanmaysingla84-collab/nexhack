import { NextResponse } from 'next/server';
import { simManager } from '@/lib/simulationManager';

export async function GET() {
  return NextResponse.json({
    state: simManager.getState(),
    events: simManager.getEvents(),
    isRunning: simManager.isRunning,
    speedMultiplier: simManager.speedMultiplier
  });
}
