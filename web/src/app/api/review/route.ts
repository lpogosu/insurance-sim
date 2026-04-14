import { NextResponse } from 'next/server';
import { handleReview } from '@/server/handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const result = await handleReview(request);
  return NextResponse.json(result.body, { status: result.status });
}
