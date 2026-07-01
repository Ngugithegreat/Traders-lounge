'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { DERIV_WS, SYNTHETIC_SYMBOLS } from '@/lib/deriv';
import { computeSignal, SignalResult } from '@/lib/indicators';

const card: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 };

type Scan = { symbol: string; signal: SignalResult; price: number };

export default function AiSoftwarePage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const pricesRef = useRef<Record<string, number[]>>({});

  const recompute = useCallback(() => {
    const out: Scan[] = [];
    for (const s of SYNTHETIC_SYMBOLS) {
      const arr = pricesRef.current[s.symbol] || [];
      if (arr.length < 25) continue;
      out.push({ symbol: s.symbol, price: arr[arr.length - 1], signal: computeSignal(arr) });
    }
    out.sort((a, b) => b.signal.strength - a.signal.strength);
    setScans(out);
  }, []);

  useEffect(() => {
    const ws = new WebSocket(DERIV_WS);
    wsRef.current = ws;
    ws.onopen = () => {
      setConnected(true);
      for (const s of SYNTHETIC_SYMBOLS) ws.send(JSON.stringify({ ticks_history: s.symbol, end: 'latest', count: 120, style: 'ticks', subscribe: 1 }));
    };
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.msg_type === 'history' && m.history?.prices) {
        const sym = m.echo_req?.ticks_history;
        if (sym) pricesRef.current[sym] = m.history.prices.map((p: string) => parseFloat(p));
      }
      if (m.msg_type === 'tick' && m.tick) {
        const arr = pricesRef.current[m.tick.symbol] || [];
        arr.push(parseFloat(m.tick.quote));
        pricesRef.current[m.tick.symbol] = arr.slice(-200);
      }
    };
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    const iv = setInterval(recompute, 1200);
    return () => { clearInterval(iv); try { ws.send(JSON.stringify({ forget_all: 'ticks' })); } catch (_) {} try { ws.close(); } catch (_) {} };
  }, [recompute]);

  const top = scans[0];
  const bullish = scans.filter((s) => s.signal.action === 'BUY').length;
  const bearish = scans.filter((s) => s.signal.action === 'SELL').length;
  const total = scans.length || 1;
  const sentiment = Math.round(((bullish - bearish) / total) * 50 + 50); // 0-100

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 1000, margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 24, fontWeight: 800, marginBottom: 4 }}>🧠 AI Software</h1>
          <p style={{ color: '#64748b', fontSize: 13 }}>Smart engine scanning every synthetic market live to surface the strongest opportunity right now.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: connected ? '#00e67a' : '#64748b', animation: connected ? 'pulse 1.5s infinite' : 'none' }} />
          <span style={{ fontSize: 12, color: connected ? '#00e67a' : '#64748b' }}>{connected ? `Scanning ${scans.length} markets` : 'Connecting...'}</span>
        </div>
      </div>

      {/* Top pick */}
      {top ? (
        <div style={{ ...card, padding: 26, background: 'linear-gradient(135deg, rgba(0,230,122,0.08), rgba(13,14,26,0))', border: '1px solid rgba(0,230,122,0.18)' }}>
          <div style={{ fontSize: 11, color: '#00e67a', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>🎯 AI Top Pick</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 28, fontWeight: 800 }}>
                {SYNTHETIC_SYMBOLS.find((s) => s.symbol === top.symbol)?.name}
              </div>
              <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>
                Recommendation: <strong style={{ color: top.signal.action === 'BUY' ? '#00e67a' : top.signal.action === 'SELL' ? '#f87171' : '#94a3b8' }}>
                  {top.signal.action === 'BUY' ? 'RISE (Buy)' : top.signal.action === 'SELL' ? 'FALL (Sell)' : 'Wait — no edge'}
                </strong>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 900, fontSize: 46, color: '#00e67a', lineHeight: 1 }}>{top.signal.strength}%</div>
              <div style={{ fontSize: 11, color: '#64748b', letterSpacing: '0.08em' }}>CONFIDENCE</div>
            </div>
          </div>
          <ul style={{ margin: '16px 0 0', padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {top.signal.reasons.map((r, i) => <li key={i} style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>{r}</li>)}
          </ul>
        </div>
      ) : (
        <div style={{ ...card, padding: 48, textAlign: 'center', color: '#64748b' }}>
          <div style={{ width: 28, height: 28, border: '2.5px solid #00e67a', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          Training on live market data...
        </div>
      )}

      {/* Sentiment gauge */}
      <div style={{ ...card, padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 15 }}>Market Sentiment</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: sentiment >= 55 ? '#00e67a' : sentiment <= 45 ? '#f87171' : '#94a3b8' }}>
            {sentiment >= 55 ? 'Bullish' : sentiment <= 45 ? 'Bearish' : 'Neutral'} · {sentiment}/100
          </span>
        </div>
        <div style={{ height: 10, borderRadius: 999, background: 'linear-gradient(90deg,#f87171,#94a3b8,#00e67a)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -3, left: `calc(${sentiment}% - 8px)`, width: 16, height: 16, borderRadius: '50%', background: '#fff', border: '3px solid #0d0e1a', boxShadow: '0 2px 8px rgba(0,0,0,0.5)', transition: 'left 0.5s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: '#475569' }}>
          <span>{bearish} bearish</span><span>{bullish} bullish</span>
        </div>
      </div>

      {/* Ranked opportunities */}
      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 13, fontWeight: 700, fontFamily: 'Space Grotesk,sans-serif' }}>Ranked Opportunities</div>
        {scans.slice(0, 12).map((s) => {
          const meta = SYNTHETIC_SYMBOLS.find((x) => x.symbol === s.symbol)!;
          const color = s.signal.action === 'BUY' ? '#00e67a' : s.signal.action === 'SELL' ? '#f87171' : '#94a3b8';
          return (
            <div key={s.symbol} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: 18 }}>{meta.icon}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{meta.short}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 44, textAlign: 'right' }}>{s.signal.action}</span>
              <div style={{ width: 90, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${s.signal.strength}%`, background: color }} />
              </div>
              <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#cbd5e1', minWidth: 36, textAlign: 'right' }}>{s.signal.strength}%</span>
            </div>
          );
        })}
      </div>

      <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', fontSize: 12, color: '#f59e0b', lineHeight: 1.5 }}>
        ⚠️ AI output is derived from live technical indicators and is informational only — not financial advice.
      </div>

      <style>{`@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(0,230,122,0.4)}70%{box-shadow:0 0 0 6px rgba(0,230,122,0)}100%{box-shadow:0 0 0 0 rgba(0,230,122,0)}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
