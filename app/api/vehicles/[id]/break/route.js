import { NextResponse } from 'next/server';
import { simManager } from '@/lib/simulationManager';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    simManager.breakVehicle(id);
    return NextResponse.json({ ok: true, vehicleId: id });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
