import { NextResponse } from 'next/server';
import { simManager } from '@/lib/simulationManager';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const reason = body.reason || 'Driver unable to accept: Current capacity fully booked or detour limits exceeded';
    const result = simManager.declineDriverRequest(id, reason);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
