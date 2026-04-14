import { NextResponse } from 'next/server';
import { handleHealth } from '@/server/handlers';

// node:crypto для проверки подписи Telegram недоступен в edge-рантайме.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await handleHealth();
  return NextResponse.json(result.body, { status: result.status });
}
