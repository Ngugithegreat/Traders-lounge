'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

const SYMBOLS = [
  ['R_100','Volatility 100 Index'],['R_75','Volatility 75 Index'],['R_50','Volatility 50 Index'],
  ['R_25','Volatility 25 Index'],['R_10','Volatility 10 (1s) Index'],['STPIDX','Step Index'],
  ['BOOM1000','Boom 1000 Index'],['CRASH1000','Crash 1000 Index'],['RDBULL','Bull Market Index'],['RDBEAR','Bear Market Index'],
];

const TRADE_TYPES = [
  ['DIGITEVEN','Even/Odd'],['DIGITOVER','Over/Under'],['DIGITMATCH','Matches/Differs'],
  ['CALL','Rise/Fall'],['DIGITODD','Odd'],
];

const APP_ID = process.env.NEXT_PUBLIC_DERIV_APP_ID || '33BguwaY1RGDz9J48qvkJ';

export default function AnalysisPage() {
  const [symbol, setSymbol] = useState('R_100');
  const [tradeType, setTradeType] = useState('DIGITEVEN');
  const [numTicks, setNumTicks] = useState(1000);
  const [stake, setStake] = useState(0.5);
  const [noTrades, setNoTrades] = useState(1);
  const [ticks, setTicks] = useState<number[]>([]);
  const [currentTick, setCurrentTick] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const digitCounts = Array.from({ length: 10 }, (_, d) => ({
    digit: d,
    count: ticks.filter(t => Math.floor(Math.abs(t * 10)) % 10 === d).length,
    pct: ticks.length > 0 ? (ticks.filter(t => Math.floor(Math.abs(t * 10)) % 10 === d).length / ticks.length * 100) : 0,
  }));

  const lastDigits = ticks.slice(-8).map(t => Math.floor(Math.abs(t * 10)) % 10);
  const evenCount = ticks.filter(t => Math.floor(Math.abs(t * 10)) % 10 % 2 === 0).length;
  const oddCount = ticks.length - evenCount;
  const evenPct = ticks.length > 0 ? (evenCount / ticks.length * 100) : 50;
  const oddPct = 100 - evenPct;

  const maxCount = Math.max(...digitCounts.map(d => d.count), 1);

  const connect = useCallback(() => {
    if (wsRef.current) { try { wsRef.current.close(); } catch (_) {} }
    setTicks([]); setCurrentTick(null); setIsRunning(true);
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);
    wsRef.current = ws;
    ws.onopen = () => ws.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.tick) {
        const p = parseFloat(m.tick.quote);
        setCurrentTick(p);
        setTicks(prev => {
          const next = [...prev, p];
          return next.slice(-numTicks);
        });
      }
    };
    ws.onclose = () => setIsRunning(false);
    ws.onerror = () => setIsRunning(false);
  }, [symbol, numTicks]);

  useEffect(() => { connect(); return () => { try { wsRef.current?.close(); } catch (_) {} }; }, [connect]);

  useEffect(() => {
    setTicks([]);
    if (wsRef.current?.readyState === 1) {
      wsRef.current.send(JSON.stringify({ forget_all: 'ticks' }));
      setTimeout(() => wsRef.current?.send(JSON.stringify({ ticks: symbol, subscribe: 1 })), 100);
    }
  }, [symbol]);

  const buyContract = async (ctype: string) => {
    const token = localStorage.getItem('tl_token') || '';
    if (!token) return;
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);
    ws.onopen = () => ws.send(JSON.stringify({ authorize: token }));
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.msg_type === 'authorize') {
        ws.send(JSON.stringify({ proposal: 1, amount: stake, basis: 'stake', contract_type: ctype, currency: 'USD', duration: 1, duration_unit: 't', symbol }));
      }
      if (m.msg_type === 'proposal') ws.send(JSON.stringify({ buy: m.proposal.id, price: m.proposal.ask_price }));
      if (m.msg_type === 'buy') { ws.close(); }
    };
    ws.onerror = () => ws.close();
  };

  const card: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 };
  const selStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', background: '#131525', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#e2e8f0', fontSize: 14, outline: 'none', cursor: 'pointer' };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1000, margin: '0 auto' }}>
      <div>
        <h1 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>🔍 Analysis Tool</h1>
        <p style={{ color: '#64748b', fontSize: 13 }}>Live digit frequency analysis for Deriv synthetic indices.</p>
      </div>

      {/* Config row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>Market</div>
          <select value={symbol} onChange={e => setSymbol(e.target.value)} style={selStyle}>
            {SYMBOLS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>Trade Type</div>
          <select value={tradeType} onChange={e => setTradeType(e.target.value)} style={selStyle}>
            {TRADE_TYPES.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* Number of ticks */}
      <div style={{ ...card, padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Number of Ticks</span>
          <span style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 800, fontSize: 18, color: '#00e67a' }}>{numTicks}</span>
        </div>
        <input type="range" min={10} max={5000} value={numTicks} onChange={e => setNumTicks(+e.target.value)}
          style={{ width: '100%', accentColor: '#00e67a', cursor: 'pointer' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#334155', marginTop: 4 }}>
          <span>10</span><span>5000</span>
        </div>
      </div>

      {/* Current tick */}
      <div style={{ ...card, padding: '16px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Current Tick</div>
        <div style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 900, fontSize: 48, color: '#f59e0b', letterSpacing: '-1px' }}>
          {currentTick !== null ? currentTick.toFixed(2) : '—'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: isRunning ? '#00e67a' : '#64748b', animation: isRunning ? 'pulse 1.5s infinite' : 'none' }} />
          <span style={{ fontSize: 12, color: isRunning ? '#00e67a' : '#64748b' }}>{isRunning ? 'Live' : 'Disconnected'} · {ticks.length} ticks</span>
        </div>
      </div>

      {/* Digit distribution rings */}
      <div style={{ ...card, padding: 20 }}>
        <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Digit Frequency</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 8 }}>
          {digitCounts.map(({ digit, count, pct }) => {
            const isHighest = count === Math.max(...digitCounts.map(d => d.count)) && count > 0;
            return (
              <div key={digit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                {/* Ring */}
                <div style={{ position: 'relative', width: 56, height: 56 }}>
                  <svg width="56" height="56" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                    <circle cx="28" cy="28" r="22" fill="none"
                      stroke={isHighest ? '#f59e0b' : '#00e67a'}
                      strokeWidth="5" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 22}`}
                      strokeDashoffset={`${2 * Math.PI * 22 * (1 - pct / 100)}`}
                      transform="rotate(-90 28 28)"
                      style={{ transition: 'stroke-dashoffset 0.5s' }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <span style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 800, fontSize: 14, color: '#e2e8f0' }}>{digit}</span>
                  </div>
                </div>
                <span style={{ fontSize: 11, color: isHighest ? '#f59e0b' : '#64748b', fontWeight: isHighest ? 700 : 400 }}>{pct.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Last digits pattern */}
      {lastDigits.length > 0 && (
        <div style={{ ...card, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Last Digits Pattern</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {lastDigits.map((d, i) => {
              const isEven = d % 2 === 0;
              return (
                <div key={i} style={{ width: 36, height: 36, borderRadius: 8, background: isEven ? 'rgba(0,230,122,0.15)' : 'rgba(248,113,113,0.15)', border: `1px solid ${isEven?'rgba(0,230,122,0.3)':'rgba(248,113,113,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1 }}>
                  <span style={{ fontWeight: 800, fontSize: 14, color: isEven ? '#00e67a' : '#f87171', fontFamily: 'Space Grotesk,sans-serif' }}>{d}</span>
                  <span style={{ fontSize: 8, color: isEven ? '#00e67a' : '#f87171', fontWeight: 600 }}>{isEven ? 'E' : 'O'}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Trade controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {[['Ticks','1',true],['Stake',String(stake),true],['No. of Trades','1',true]].map(([label, val, editable], i) => (
          <div key={label} style={{ ...card, padding: '12px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
            {i === 1 ? (
              <input type="number" min={0.35} step={0.1} value={stake} onChange={e=>setStake(+e.target.value||0.5)}
                style={{ width: '100%', background: 'none', border: 'none', color: '#e2e8f0', fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 18, textAlign: 'center', outline: 'none' }} />
            ) : (
              <div style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 18, color: '#e2e8f0' }}>{val}</div>
            )}
          </div>
        ))}
      </div>

      {/* Even / Odd buy buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <button onClick={() => buyContract('DIGITEVEN')}
          style={{ padding: '18px 0', borderRadius: 14, background: 'linear-gradient(135deg,#00c97a,#00e67a)', border: 'none', cursor: 'pointer', color: '#0a0b14', fontFamily: 'Space Grotesk,sans-serif', fontWeight: 900, fontSize: 18, boxShadow: '0 4px 24px rgba(0,230,122,0.25)', transition: 'transform 0.1s' }}
          onMouseEnter={e=>(e.currentTarget.style.transform='scale(1.02)')}
          onMouseLeave={e=>(e.currentTarget.style.transform='scale(1)')}>
          <div>Even</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>{evenPct.toFixed(2)}%</div>
        </button>
        <button onClick={() => buyContract('DIGITODD')}
          style={{ padding: '18px 0', borderRadius: 14, background: 'linear-gradient(135deg,#dc2626,#f87171)', border: 'none', cursor: 'pointer', color: '#fff', fontFamily: 'Space Grotesk,sans-serif', fontWeight: 900, fontSize: 18, boxShadow: '0 4px 24px rgba(248,113,113,0.25)', transition: 'transform 0.1s' }}
          onMouseEnter={e=>(e.currentTarget.style.transform='scale(1.02)')}
          onMouseLeave={e=>(e.currentTarget.style.transform='scale(1)')}>
          <div>Odd</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>{oddPct.toFixed(2)}%</div>
        </button>
      </div>

      <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', fontSize: 13, color: '#475569', fontWeight: 500 }}>
        {isRunning ? `Bot is live · Analysed ${ticks.length} ticks` : 'Connecting to market data...'}
      </div>

      <style>{`@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(0,230,122,0.4)}70%{box-shadow:0 0 0 6px rgba(0,230,122,0)}100%{box-shadow:0 0 0 0 rgba(0,230,122,0)}}`}</style>
    </div>
  );
}
