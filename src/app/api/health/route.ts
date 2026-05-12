import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { noStoreHeaders } from '@/lib/api-guard';

export async function GET() {
  const startedAt = Date.now();

  try {
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json({
      success: true,
      status: 'ok',
      database: 'ok',
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    }, {
      headers: noStoreHeaders(),
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      success: false,
      status: 'degraded',
      database: 'error',
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    }, {
      status: 503,
      headers: noStoreHeaders(),
    });
  }
}
