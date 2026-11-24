import { NextResponse } from 'next/server';
import { simManager } from '@/lib/simulationManager';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const vehicleId = body.vehicleId || null;
    const result = simManager.acceptDriverRequest(id, vehicleId);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
