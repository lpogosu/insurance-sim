import { NextResponse } from 'next/server';
import { handleCoach } from '@/server/handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const result = await handleCoach(request);
  return NextResponse.json(result.body, { status: result.status });
}
