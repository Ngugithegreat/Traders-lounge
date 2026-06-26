'use client';
import { useState, useEffect } from 'react';

const SYMBOLS = [
  ['R_100', 'Vol 100 (1s)'], ['R_75', 'Vol 75'], ['R_50', 'Vol 50'], ['R_25', 'Vol 25'], ['R_10', 'Vol 10 (1s)'],
  ['BOOM1000', 'Boom 1000'], ['BOOM500', 'Boom 500'], ['CRASH1000', 'Crash 1000'], ['CRASH500', 'Crash 500'],
  ['STPIDX', 'Step Index'], ['RDBULL', 'Bull Market'], ['RDBEAR', 'Bear Market'],
];
const TV_MAP: Record<string, string> = {
  R_100: 'DERIVBETA:VOLATILITY_100_INDEX', R_75: 'DERIVBETA:VOLATILITY_75_INDEX', R_50: 'DERIVBETA:VOLATILITY_50_INDEX',
  R_25: 'DERIVBETA:VOLATILITY_25_INDEX', R_10: 'DERIVBETA:VOLATILITY_10_INDEX', BOOM1000: 'DERIVBETA:BOOM_1000_INDEX',
  BOOM500: 'DERIVBETA:BOOM_500_INDEX', CRASH1000: 'DERIVBETA:CRASH_1000_INDEX', CRASH500: 'DERIVBETA:CRASH_500_INDEX',
  STPIDX: 'DERIVBETA:STEP_INDEX', RDBULL: 'DERIVBETA:BULL_MARKET_INDEX', RDBEAR: 'DERIVBETA:BEAR_MARKET_INDEX',
};
const INTERVALS = [['1', '1T'], ['5', '5M'], ['15', '15M'], ['60', '1H'], ['240', '4H'], ['D', '1D']];
const APP_ID = process.env.NEXT_PUBLIC_DERIV_APP_ID || '33BguwaY1RGDz9J48qvkJ';
const card: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 };

export default function ChartsPage() {
  const [symbol, setSymbol] = useState('R_100');
  const [interval, setInterval] = useState('1');
  const [chartType, setChartType] = useState('1');
  const [price, setPrice] = useState<number | null>(null);
  const [dir, setDir] = useState<'up' | 'down'>('up');

  useEffect(() => {
    let prev: number | null = null; let mounted = true;
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);
    ws.onopen = () => ws.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
    ws.onmessage = (e) => {
      if (!mounted) return;
      const m = JSON.parse(e.data);
      if (m.tick) {
        const p = parseFloat(m.tick.quote);
        if (prev !== null) setDir(p >= prev ? 'up' : 'down');
        prev = p; setPrice(p);
      }
    };
    return () => { mounted = false; try { ws.close(); } catch (_) { } };
  }, [symbol]);

  const tvSrc = `https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(TV_MAP[symbol] || '')}&interval=${interval}&theme=dark&style=${chartType}&timezone=Africa%2FNairobi&locale=en&hide_side_toolbar=0&allow_symbol_change=0&withdateranges=1&details=1`;

  const btnActive: React.CSSProperties = { padding: '6px 14px', background: '#00e67a', color: '#0a0b14', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' };
  const btnInactive: React.CSSProperties = { padding: '6px 14px', background: 'rgba(255,255,255,0.04)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontWeight: 500, fontSize: 12, cursor: 'pointer' };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14, height: 'calc(100vh - 120px)', overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '10px 14px', background: '#131525', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
        <select value={symbol} onChange={e => setSymbol(e.target.value)} style={{ padding: '7px 12px', background: '#1a1d2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0', fontSize: 14, outline: 'none', fontWeight: 600 }}>
          {SYMBOLS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {price !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 800, fontSize: 20, color: '#e2e8f0' }}>{price.toFixed(2)}</span>
            <span style={{ color: dir === 'up' ? '#00e67a' : '#f87171', fontSize: 14, fontWeight: 700 }}>{dir === 'up' ? '▲' : '▼'}</span>
          </div>
        )}
        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          {INTERVALS.map(([v, l]) => <button key={v} onClick={() => setInterval(v)} style={interval === v ? btnActive : btnInactive}>{l}</button>)}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[['1', '🕯'], ['2', '📈'], ['0', '📊'], ['3', '🏔']].map(([v, l]) => <button key={v} onClick={() => setChartType(v)} style={chartType === v ? btnActive : btnInactive} title={['Candles', 'Line', 'OHLC', 'Area'][+v === 2 ? 1 : +v]}>{l}</button>)}
        </div>
      </div>

      {/* Chart */}
      <div style={{ flex: 1, borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
        <iframe key={`${symbol}-${interval}-${chartType}`} src={tvSrc} width="100%" height="100%" frameBorder="0" allowFullScreen title="Chart" style={{ display: 'block' }} />
      </div>

      {/* Symbol grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(100px,1fr))', gap: 8 }}>
        {SYMBOLS.map(([v, l]) => (
          <button key={v} onClick={() => setSymbol(v)} style={{ ...card, padding: '9px 12px', textAlign: 'left', cursor: 'pointer', border: `1px solid ${symbol === v ? 'rgba(0,230,122,0.35)' : 'rgba(255,255,255,0.06)'}`, background: symbol === v ? 'rgba(0,230,122,0.06)' : 'rgba(255,255,255,0.02)', color: 'inherit' }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2, lineHeight: 1.2 }}>{l}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: symbol === v ? '#00e67a' : '#334155', fontFamily: 'monospace' }}>{v}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
