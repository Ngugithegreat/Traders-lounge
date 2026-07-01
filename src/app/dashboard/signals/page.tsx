'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { DERIV_WS, SYNTHETIC_SYMBOLS } from '@/lib/deriv';
import { computeSignal, SignalResult } from '@/lib/indicators';

const CATS = ['All', 'Volatility', 'Boom & Crash', 'Step & Range', 'Jump'] as const;
const card: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 };

const ACTION_STYLE: Record<string, { color: string; bg: string; border: string; label: string }> = {
  BUY: { color: '#00e67a', bg: 'rgba(0,230,122,0.1)', border: 'rgba(0,230,122,0.3)', label: 'RISE / BUY' },
  SELL: { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)', label: 'FALL / SELL' },
  NEUTRAL: { color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)', label: 'NEUTRAL' },
};

type SignalCard = {
  symbol: string;
  price: number | null;
  prevPrice: number | null;
  signal: SignalResult;
};

export default function SignalsPage() {
  const [cat, setCat] = useState<(typeof CATS)[number]>('All');
  const [cards, setCards] = useState<Record<string, SignalCard>>({});
  const [connected, setConnected] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const [tradeMsg, setTradeMsg] = useState<Record<string, string>>({});
  const [trading, setTrading] = useState<Record<string, boolean>>({});

  const wsRef = useRef<WebSocket | null>(null);
  const pricesRef = useRef<Record<string, number[]>>({});

  const recompute = useCallback(() => {
    const next: Record<string, SignalCard> = {};
    for (const s of SYNTHETIC_SYMBOLS) {
      const arr = pricesRef.current[s.symbol] || [];
      if (!arr.length) continue;
      next[s.symbol] = {
        symbol: s.symbol,
        price: arr[arr.length - 1],
        prevPrice: arr.length > 1 ? arr[arr.length - 2] : null,
        signal: computeSignal(arr),
      };
    }
    setCards(next);
  }, []);

  useEffect(() => {
    const ws = new WebSocket(DERIV_WS);
    wsRef.current = ws;
    ws.onopen = () => {
      setConnected(true);
      for (const s of SYNTHETIC_SYMBOLS) {
        ws.send(JSON.stringify({ ticks_history: s.symbol, end: 'latest', count: 120, style: 'ticks', subscribe: 1 }));
      }
    };
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.msg_type === 'history' && m.history?.prices) {
        const sym = m.echo_req?.ticks_history;
        if (sym) pricesRef.current[sym] = m.history.prices.map((p: string) => parseFloat(p));
      }
      if (m.msg_type === 'tick' && m.tick) {
        const sym = m.tick.symbol;
        const arr = pricesRef.current[sym] || [];
        arr.push(parseFloat(m.tick.quote));
        pricesRef.current[sym] = arr.slice(-200);
      }
    };
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    const iv = setInterval(recompute, 1000);
    return () => {
      clearInterval(iv);
      try { ws.send(JSON.stringify({ forget_all: 'ticks' })); } catch (_) {}
      try { ws.close(); } catch (_) {}
    };
  }, [recompute]);

  const list = Object.values(cards)
    .filter((c) => {
      const meta = SYNTHETIC_SYMBOLS.find((s) => s.symbol === c.symbol);
      return cat === 'All' || meta?.category === cat;
    })
    .sort((a, b) => b.signal.strength - a.signal.strength);

  const counts = Object.values(cards).reduce(
    (acc, c) => { acc[c.signal.action]++; return acc; },
    { BUY: 0, SELL: 0, NEUTRAL: 0 } as Record<string, number>
  );

  const trade = async (symbol: string, action: 'BUY' | 'SELL') => {
    const token = localStorage.getItem('tl_token') || '';
    if (!token) { setTradeMsg((m) => ({ ...m, [symbol]: '❌ Connect your Deriv account first.' })); return; }
    setTrading((t) => ({ ...t, [symbol]: true }));
    setTradeMsg((m) => ({ ...m, [symbol]: 'Placing trade...' }));
    try {
      await new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(DERIV_WS);
        const t = setTimeout(() => { ws.close(); reject(new Error('Timeout')); }, 25000);
        let authed = false;
        ws.onopen = () => ws.send(JSON.stringify({ authorize: token }));
        ws.onmessage = (e) => {
          const m = JSON.parse(e.data);
          if (m.error) { clearTimeout(t); ws.close(); reject(new Error(m.error.message)); return; }
          if (m.msg_type === 'authorize' && !authed) {
            authed = true;
            ws.send(JSON.stringify({ proposal: 1, amount: 1, basis: 'stake', contract_type: action === 'BUY' ? 'CALL' : 'PUT', currency: 'USD', duration: 5, duration_unit: 't', symbol }));
          }
          if (m.msg_type === 'proposal') ws.send(JSON.stringify({ buy: m.proposal.id, price: m.proposal.ask_price }));
          if (m.msg_type === 'buy') { clearTimeout(t); ws.close(); setTradeMsg((ms) => ({ ...ms, [symbol]: `✅ Trade placed · #${m.buy.contract_id}` })); resolve(); }
        };
        ws.onerror = () => { clearTimeout(t); ws.close(); reject(new Error('WebSocket error')); };
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed';
      setTradeMsg((m) => ({ ...m, [symbol]: `❌ ${msg}` }));
    }
    setTrading((t) => ({ ...t, [symbol]: false }));
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 24, fontWeight: 800, marginBottom: 4 }}>📡 Trading Signals</h1>
          <p style={{ color: '#64748b', fontSize: 13 }}>Live technical signals across Deriv synthetic indices — EMA crossover, RSI &amp; momentum.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: connected ? '#00e67a' : '#64748b', animation: connected ? 'pulse 1.5s infinite' : 'none' }} />
          <span style={{ fontSize: 12, color: connected ? '#00e67a' : '#64748b' }}>{connected ? 'Live market feed' : 'Connecting...'}</span>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { k: 'BUY', ...ACTION_STYLE.BUY, label: 'Buy Signals' },
          { k: 'SELL', ...ACTION_STYLE.SELL, label: 'Sell Signals' },
          { k: 'NEUTRAL', ...ACTION_STYLE.NEUTRAL, label: 'Neutral' },
        ].map((s) => (
          <div key={s.k} style={{ ...card, padding: '14px 18px', background: s.bg, border: `1px solid ${s.border}` }}>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 800, fontSize: 26, color: s.color }}>{counts[s.k]}</div>
          </div>
        ))}
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {CATS.map((c) => (
          <button key={c} onClick={() => setCat(c)} style={{ padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s', background: cat === c ? '#00e67a' : 'rgba(255,255,255,0.03)', color: cat === c ? '#0a0b14' : '#64748b', borderColor: cat === c ? '#00e67a' : 'rgba(255,255,255,0.08)' }}>
            {c}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div style={{ ...card, padding: 48, textAlign: 'center', color: '#64748b' }}>
          <div style={{ width: 28, height: 28, border: '2.5px solid #00e67a', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          Gathering market data and computing signals...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
          {list.map((c) => {
            const meta = SYNTHETIC_SYMBOLS.find((s) => s.symbol === c.symbol)!;
            const st = ACTION_STYLE[c.signal.action];
            const up = c.prevPrice != null && c.price != null && c.price >= c.prevPrice;
            const isOpen = detail === c.symbol;
            return (
              <div key={c.symbol} style={{ ...card, padding: 20, display: 'flex', flexDirection: 'column', gap: 14, borderColor: st.border }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{meta.icon}</div>
                    <div>
                      <div style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 14 }}>{meta.short}</div>
                      <div style={{ fontSize: 11, color: '#475569' }}>{meta.category}</div>
                    </div>
                  </div>
                  <span style={{ padding: '5px 12px', borderRadius: 999, fontSize: 11, fontWeight: 800, letterSpacing: '0.04em', color: st.color, background: st.bg, border: `1px solid ${st.border}` }}>{st.label}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Price</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: up ? '#00e67a' : '#f87171' }}>
                      {c.price != null ? c.price.toFixed(meta.symbol.startsWith('R_') || meta.symbol.includes('HZ') ? 3 : 2) : '—'} {up ? '▲' : '▼'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Strength</div>
                    <div style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 800, fontSize: 20, color: st.color }}>{c.signal.strength}%</div>
                  </div>
                </div>

                {/* Strength bar */}
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${c.signal.strength}%`, background: st.color, borderRadius: 999, transition: 'width 0.4s' }} />
                </div>

                {/* Indicators */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                  {[
                    { k: 'RSI', v: c.signal.indicators.rsi != null ? c.signal.indicators.rsi.toFixed(0) : '—' },
                    { k: 'EMA9', v: c.signal.indicators.emaFast != null ? c.signal.indicators.emaFast.toFixed(2) : '—' },
                    { k: 'MOM', v: c.signal.indicators.momentum != null ? `${c.signal.indicators.momentum.toFixed(2)}%` : '—' },
                  ].map((ind) => (
                    <div key={ind.k} style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 9, padding: '8px 6px', textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: '#475569', letterSpacing: '0.06em' }}>{ind.k}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#cbd5e1' }}>{ind.v}</div>
                    </div>
                  ))}
                </div>

                <button onClick={() => setDetail(isOpen ? null : c.symbol)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                  {isOpen ? '▾ Hide rationale' : '▸ Why this signal?'}
                </button>
                {isOpen && (
                  <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {c.signal.reasons.map((r, i) => (
                      <li key={i} style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>{r}</li>
                    ))}
                  </ul>
                )}

                {tradeMsg[c.symbol] && (
                  <div style={{ padding: '8px 12px', borderRadius: 9, fontSize: 12, background: tradeMsg[c.symbol].startsWith('✅') ? 'rgba(0,230,122,0.08)' : tradeMsg[c.symbol].startsWith('❌') ? 'rgba(248,113,113,0.08)' : 'rgba(255,255,255,0.04)', color: tradeMsg[c.symbol].startsWith('✅') ? '#00e67a' : tradeMsg[c.symbol].startsWith('❌') ? '#f87171' : '#94a3b8' }}>
                    {tradeMsg[c.symbol]}
                  </div>
                )}

                {c.signal.action !== 'NEUTRAL' && (
                  <button
                    onClick={() => trade(c.symbol, c.signal.action as 'BUY' | 'SELL')}
                    disabled={trading[c.symbol]}
                    style={{ padding: '11px 0', borderRadius: 10, background: trading[c.symbol] ? 'rgba(255,255,255,0.05)' : st.color, color: trading[c.symbol] ? st.color : '#0a0b14', border: 'none', fontWeight: 700, fontSize: 13, cursor: trading[c.symbol] ? 'not-allowed' : 'pointer' }}
                  >
                    {trading[c.symbol] ? '⏳ Placing...' : `▶ Trade ${st.label} · $1`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', fontSize: 12, color: '#f59e0b', lineHeight: 1.5 }}>
        ⚠️ Signals are generated from live technical indicators and are for information only — not financial advice. Trading synthetic indices carries risk.
      </div>

      <style>{`@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(0,230,122,0.4)}70%{box-shadow:0 0 0 6px rgba(0,230,122,0)}100%{box-shadow:0 0 0 0 rgba(0,230,122,0)}}`}</style>
    </div>
  );
}
