import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

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

async function tokenFor(account: string): Promise<string | null> {
  return (await redis.get(`tl_token:${account}`)) as string | null;
}

// GET: copytrading statistics for a trader, or the caller's copytrading list.
export async function GET(req: NextRequest) {
  const account = req.nextUrl.searchParams.get('account');
  const traderId = req.nextUrl.searchParams.get('trader_id');
  if (!account) return NextResponse.json({ success: false, error: 'Missing account' }, { status: 400 });
  try {
    const token = await tokenFor(account);
    if (!token) return NextResponse.json({ success: false, requiresRelink: true });

    if (traderId) {
      const data = await wsCall(token, { copytrading_statistics: 1, trader_id: traderId }, (m) => m.msg_type === 'copytrading_statistics');
      return NextResponse.json({ success: true, statistics: data.copytrading_statistics });
    }

    const data = await wsCall(token, { copytrading_list: 1 }, (m) => m.msg_type === 'copytrading_list');
    return NextResponse.json({ success: true, list: data.copytrading_list });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// POST: start / stop copying a trader.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { account, action, trader_token, max_trade_stake, min_trade_stake, assets, trade_types } = body;
    if (!account || !action || !trader_token) return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
    const token = await tokenFor(account);
    if (!token) return NextResponse.json({ success: false, error: 'Session expired' }, { status: 401 });

    if (action === 'start') {
      const payload: Record<string, unknown> = { copy_start: trader_token };
      if (max_trade_stake) payload.max_trade_stake = Number(max_trade_stake);
      if (min_trade_stake) payload.min_trade_stake = Number(min_trade_stake);
      if (Array.isArray(assets) && assets.length) payload.assets = assets;
      if (Array.isArray(trade_types) && trade_types.length) payload.trade_types = trade_types;
      const data = await wsCall(token, payload, (m) => m.msg_type === 'copy_start');
      return NextResponse.json({ success: true, copy_start: data.copy_start });
    }

    if (action === 'stop') {
      const data = await wsCall(token, { copy_stop: trader_token }, (m) => m.msg_type === 'copy_stop');
      return NextResponse.json({ success: true, copy_stop: data.copy_stop });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
