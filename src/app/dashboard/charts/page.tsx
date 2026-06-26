'use client';
import { useState, useEffect } from 'react';

const SYMBOLS = [
  ['R_100','Volatility 100'],['R_75','Volatility 75'],['R_50','Volatility 50'],
  ['R_25','Volatility 25'],['R_10','Volatility 10'],['BOOM1000','Boom 1000'],
  ['BOOM500','Boom 500'],['CRASH1000','Crash 1000'],['CRASH500','Crash 500'],
  ['STPIDX','Step Index'],['RDBULL','Bull Market'],['RDBEAR','Bear Market'],
];

const TV_MAP: Record<string,string> = {
  R_100:'DERIVBETA:VOLATILITY_100_INDEX', R_75:'DERIVBETA:VOLATILITY_75_INDEX',
  R_50:'DERIVBETA:VOLATILITY_50_INDEX', R_25:'DERIVBETA:VOLATILITY_25_INDEX',
  R_10:'DERIVBETA:VOLATILITY_10_INDEX', BOOM1000:'DERIVBETA:BOOM_1000_INDEX',
  BOOM500:'DERIVBETA:BOOM_500_INDEX', CRASH1000:'DERIVBETA:CRASH_1000_INDEX',
  CRASH500:'DERIVBETA:CRASH_500_INDEX', STPIDX:'DERIVBETA:STEP_INDEX',
  RDBULL:'DERIVBETA:BULL_MARKET_INDEX', RDBEAR:'DERIVBETA:BEAR_MARKET_INDEX',
};

const IV_MAP: Record<string,string> = { '1m':'1','5m':'5','15m':'15','1h':'60','4h':'240','1d':'D' };
const INTERVALS = [['1m','1M'],['5m','5M'],['15m','15M'],['1h','1H'],['4h','4H'],['1d','1D']];
const CHART_TYPES = [['1','Candles'],['2','Line'],['0','OHLC'],['3','Area']];
const APP_ID = process.env.NEXT_PUBLIC_DERIV_APP_ID || '33BguwaY1RGDz9J48qvkJ';

const card: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, backdropFilter: 'blur(16px)' };

export default function ChartsPage() {
  const [symbol, setSymbol] = useState('R_100');
  const [interval, setInterval] = useState('1m');
  const [chartType, setChartType] = useState('1');
  const [price, setPrice] = useState<number | null>(null);
  const [priceDir, setPriceDir] = useState<'up'|'down'>('up');

  useEffect(() => {
    let ws: WebSocket; let prev: number | null = null; let mounted = true;
    try {
      ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);
      ws.onopen = () => ws.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
      ws.onmessage = (e) => {
        if (!mounted) return;
        const m = JSON.parse(e.data);
        if (m.tick) {
          const p = parseFloat(m.tick.quote);
          if (prev !== null) setPriceDir(p >= prev ? 'up' : 'down');
          prev = p; setPrice(p);
        }
      };
    } catch (_) {}
    return () => { mounted = false; try { ws?.close(); } catch (_) {} };
  }, [symbol]);

  const tvSrc = `https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(TV_MAP[symbol] || 'DERIVBETA:VOLATILITY_100_INDEX')}&interval=${IV_MAP[interval]}&theme=dark&style=${chartType}&timezone=Africa%2FNairobi&locale=en&hide_side_toolbar=0&allow_symbol_change=1`;

  const btnRow: React.CSSProperties = { display: 'flex', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' };
  const btnActive: React.CSSProperties = { padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: 'hsl(158 100% 44%)', color: 'hsl(220 30% 7%)' };
  const btnInactive: React.CSSProperties = { padding: '8px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none', background: 'hsl(220 28% 12%)', color: 'hsl(215 20% 55%)' };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>📊 Live Charts</h1>
          <p style={{ color: 'hsl(215 20% 55%)', fontSize: 14 }}>Professional TradingView charts for all Deriv synthetic pairs.</p>
        </div>
        {price !== null && (
          <div style={{ ...card, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: 'hsl(215 20% 55%)' }}>{SYMBOLS.find(s => s[0] === symbol)?.[1]}</div>
              <div className="font-display" style={{ fontWeight: 800, fontSize: 20 }}>{price.toFixed(2)}</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: priceDir === 'up' ? '#34d399' : '#f87171' }}>
              {priceDir === 'up' ? '▲' : '▼'}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <select value={symbol} onChange={e => setSymbol(e.target.value)} style={{ height: 38, padding: '0 12px', background: 'hsl(220 28% 12%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'hsl(210 40% 96%)', fontSize: 13, outline: 'none' }}>
          {SYMBOLS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <div style={btnRow}>
          {INTERVALS.map(([v,l]) => <button key={v} onClick={() => setInterval(v)} style={interval === v ? btnActive : btnInactive}>{l}</button>)}
        </div>
        <div style={btnRow}>
          {CHART_TYPES.map(([v,l]) => <button key={v} onClick={() => setChartType(v)} style={chartType === v ? btnActive : btnInactive}>{l}</button>)}
        </div>
      </div>

      <div style={{ ...card, overflow: 'hidden', height: 580 }}>
        <iframe key={`${symbol}-${interval}-${chartType}`} src={tvSrc} width="100%" height="100%" frameBorder="0" allowFullScreen title="Chart" style={{ display: 'block' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 10 }}>
        {SYMBOLS.map(([v,l]) => (
          <button key={v} onClick={() => setSymbol(v)}
            style={{ ...card, padding: '12px 14px', textAlign: 'left', cursor: 'pointer', border: `1px solid ${symbol === v ? 'rgba(0,230,130,0.4)' : 'rgba(255,255,255,0.07)'}`, background: symbol === v ? 'rgba(0,230,130,0.08)' : 'rgba(255,255,255,0.03)' }}>
            <div style={{ fontSize: 11, color: 'hsl(215 20% 55%)', marginBottom: 4, lineHeight: 1.3 }}>{l}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: symbol === v ? 'hsl(158 100% 44%)' : 'hsl(215 20% 55%)', fontFamily: 'monospace' }}>{v}</div>
          </button>
        ))}
      </div>
    </div>
  );
}