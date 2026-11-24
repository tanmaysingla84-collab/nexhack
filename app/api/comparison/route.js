import { NextResponse } from 'next/server';
import { simManager } from '@/lib/simulationManager';

export async function POST(request) {
  try {
    const body = await request.json();
    const { seed = 42, durationMin = 60 } = body;
    const result = simManager.runComparison({ seed, durationMin });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
