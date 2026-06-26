import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
export const dynamic = 'force-dynamic';

const APP_ID = process.env.NEXT_PUBLIC_DERIV_APP_ID || '33BguwaY1RGDz9J48qvkJ';

function wsCall(token: string, payload: object, matcher: (m: any) => boolean, ms = 20000): Promise<any> {
  return new Promise((resolve, reject) => {
    const WS = require('ws');
    const ws = new WS(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);
    const t = setTimeout(() => { try { ws.close(); } catch (_) {} reject(new Error('Timeout')); }, ms);
    ws.on('open', () => ws.send(JSON.stringify({ authorize: token })));
    ws.on('message', (buf: Buffer) => {
      try {
        const msg = JSON.parse(buf.toString());
        if (msg.error) { clearTimeout(t); try { ws.close(); } catch (_) {} reject(new Error(msg.error.message)); return; }
        if (msg.msg_type === 'authorize') { ws.send(JSON.stringify(payload)); return; }
        if (matcher(msg)) { clearTimeout(t); try { ws.close(); } catch (_) {} resolve(msg); }
      } catch (_) {}
    });
    ws.on('error', (e: any) => { clearTimeout(t); try { ws.close(); } catch (_) {} reject(e); });
  });
}

export async function GET(req: NextRequest) {
  const account = req.nextUrl.searchParams.get('account');
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
  if (!account) return NextResponse.json({ success: false }, { status: 400 });
  try {
    const token = await redis.get(`tl_token:${account}`) as string | null;
    if (!token) return NextResponse.json({ success: false, requiresRelink: true });
    const data = await wsCall(token, { statement: 1, limit, description: 1 }, (m) => m.msg_type === 'statement');
    return NextResponse.json({ success: true, transactions: data.statement?.transactions ?? [] });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message, transactions: [] });
  }
}