import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { account, token, email, fullname, currency, is_virtual, all_accounts } = await req.json();
    if (!account || !token) return NextResponse.json({ success: false }, { status: 400 });
    const TTL = 86400 * 30;
    await Promise.all([
      redis.set(`tl_token:${account}`, token, { ex: TTL }),
      redis.set(`tl_email:${account}`, email || '', { ex: TTL }),
      redis.set(`tl_name:${account}`, fullname || '', { ex: TTL }),
      redis.set(`tl_currency:${account}`, currency || 'USD', { ex: TTL }),
      redis.set(`tl_virtual:${account}`, String(is_virtual || false), { ex: TTL }),
      redis.set(`tl_accounts:${account}`, JSON.stringify(all_accounts || []), { ex: TTL }),
    ]);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}