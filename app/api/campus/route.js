import { NextResponse } from 'next/server';
import { campusData } from '@/lib/simulationManager';

export async function GET() {
  return NextResponse.json(campusData);
}
