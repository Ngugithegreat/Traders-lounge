'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

const SYMBOLS = [
  ['R_100','Volatility 100 (1s) Index'],['R_75','Volatility 75 Index'],['R_50','Volatility 50 Index'],
  ['R_25','Volatility 25 Index'],['R_10','Volatility 10 (1s) Index'],['BOOM1000','Boom 1000 Index'],
  ['BOOM500','Boom 500 Index'],['CRASH1000','Crash 1000 Index'],['CRASH500','Crash 500 Index'],
  ['STPIDX','Step Index'],['RDBULL','Bull Market Index'],['RDBEAR','Bear Market Index'],
];

const CONTRACT_CONFIGS: Record<string, { label: string; types: [string, string][] }> = {
  rise_fall: { label: 'Rise/Fall', types: [['CALL','Rise'],['PUT','Fall']] },
  higher_lower: { label: 'Higher/Lower', types: [['CALL','Higher'],['PUT','Lower']] },
  digits: { label: 'Digits', types: [['DIGITEVEN','Even'],['DIGITODD','Odd'],['DIGITOVER','Over'],['DIGITUNDER','Under'],['DIGITMATCH','Match'],['DIGITDIFF','Differ']] },
};

const APP_ID = process.env.NEXT_PUBLIC_DERIV_APP_ID || '33BguwaY1RGDz9J48qvkJ';

const TV_MAP: Record<string,string> = {
  R_100:'DERIVBETA:VOLATILITY_100_INDEX', R_75:'DERIVBETA:VOLATILITY_75_INDEX',
  R_50:'DERIVBETA:VOLATILITY_50_INDEX', R_25:'DERIVBETA:VOLATILITY_25_INDEX',
  R_10:'DERIVBETA:VOLATILITY_10_INDEX', BOOM1000:'DERIVBETA:BOOM_1000_INDEX',
  BOOM500:'DERIVBETA:BOOM_500_INDEX', CRASH1000:'DERIVBETA:CRASH_1000_INDEX',
  CRASH500:'DERIVBETA:CRASH_500_INDEX', STPIDX:'DERIVBETA:STEP_INDEX',
  RDBULL:'DERIVBETA:BULL_MARKET_INDEX', RDBEAR:'DERIVBETA:BEAR_MARKET_INDEX',
};

export default function ManualTraderPage() {
  const [symbol, setSymbol] = useState('R_100');
  const [contractGroup, setContractGroup] = useState('rise_fall');
  const [duration, setDuration] = useState(5);
  const [durUnit, setDurUnit] = useState('t');
  const [stake, setStake] = useState(10);
  const [takeProfit, setTakeProfit] = useState(false);
  const [tpAmount, setTpAmount] = useState(5);
  const [prediction, setPrediction] = useState(5);
  const [price, setPrice] = useState<number | null>(null);
  const [priceDir, setPriceDir] = useState<'up'|'down'>('up');
  const [proposal, setProposal] = useState<any>(null);
  const [buying, setBuying] = useState<string|null>(null);
  const [lastResult, setLastResult] = useState<{type:string;profit:number;won:boolean}|null>(null);
  const wsRef = useRef<WebSocket|null>(null);
  const propWsRef = useRef<WebSocket|null>(null);
  const isDigit = contractGroup === 'digits';

  // Live price
  useEffect(() => {
    let prev: number|null = null; let mounted = true;
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);
    wsRef.current = ws;
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
    return () => { mounted = false; try { ws.close(); } catch (_) {} };
  }, [symbol]);

  // Proposal
  const fetchProposal = useCallback(async (ctype: string) => {
    const token = localStorage.getItem('tl_token') || '';
    if (!token) return;
    try { propWsRef.current?.close(); } catch (_) {}
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);
    propWsRef.current = ws;
    ws.onopen = () => ws.send(JSON.stringify({ authorize: token }));
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.msg_type === 'authorize') {
        ws.send(JSON.stringify({ proposal: 1, subscribe: 1, amount: stake, basis: 'stake', contract_type: ctype, currency: 'USD', duration, duration_unit: durUnit, symbol, ...(isDigit ? { prediction } : {}) }));
      }
      if (m.msg_type === 'proposal') setProposal(m.proposal);
    };
  }, [stake, duration, durUnit, symbol, isDigit, prediction]);

  const buyNow = async (ctype: string) => {
    const token = localStorage.getItem('tl_token') || '';
    if (!token || buying) return;
    setBuying(ctype); setLastResult(null);
    try {
      await new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);
        const t = setTimeout(() => { ws.close(); reject(); }, 25000);
        ws.onopen = () => ws.send(JSON.stringify({ authorize: token }));
        ws.onmessage = (e) => {
          const m = JSON.parse(e.data);
          if (m.msg_type === 'authorize') {
            ws.send(JSON.stringify({ proposal: 1, amount: stake, basis: 'stake', contract_type: ctype, currency: 'USD', duration, duration_unit: durUnit, symbol, ...(isDigit ? { prediction } : {}) }));
          }
          if (m.msg_type === 'proposal') ws.send(JSON.stringify({ buy: m.proposal.id, price: m.proposal.ask_price }));
          if (m.msg_type === 'buy') {
            ws.send(JSON.stringify({ proposal_open_contract: 1, contract_id: m.buy.contract_id, subscribe: 1 }));
          }
          if (m.msg_type === 'proposal_open_contract' && m.proposal_open_contract?.is_sold) {
            clearTimeout(t); ws.close();
            const profit = parseFloat(m.proposal_open_contract.profit || '0');
            setLastResult({ type: ctype, profit, won: profit > 0 });
            resolve();
          }
        };
        ws.onerror = () => { clearTimeout(t); ws.close(); reject(); };
      });
    } catch (_) {}
    setBuying(null);
  };

  const config = CONTRACT_CONFIGS[contractGroup];
  const selStyle: React.CSSProperties = { padding: '8px 10px', background: '#1a1d2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0', fontSize: 13, outline: 'none', width: '100%' };

  return (
    <div className="fade-in" style={{ display: 'flex', gap: 16, height: 'calc(100vh - 120px)', overflow: 'hidden' }}>

      {/* Chart */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
        {/* Symbol selector + price */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#131525', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(0,230,122,0.1)', border: '1px solid rgba(0,230,122,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📈</div>
            <div>
              <select value={symbol} onChange={e=>setSymbol(e.target.value)} style={{ background:'none', border:'none', color:'#e2e8f0', fontFamily:'Space Grotesk,sans-serif', fontWeight:700, fontSize:16, outline:'none', cursor:'pointer' }}>
                {SYMBOLS.map(([v,l])=><option key={v} value={v} style={{background:'#131525'}}>{l}</option>)}
              </select>
              {price !== null && (
                <div style={{ fontSize: 12, color: priceDir==='up'?'#00e67a':'#f87171', fontWeight: 600 }}>
                  {price.toFixed(2)} {priceDir==='up'?'▲':'▼'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TradingView chart */}
        <div style={{ flex: 1, borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
          <iframe
            key={symbol}
            src={`https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(TV_MAP[symbol]||'DERIVBETA:VOLATILITY_100_INDEX')}&interval=1&theme=dark&style=1&timezone=Africa%2FNairobi&locale=en&hide_side_toolbar=0&allow_symbol_change=0`}
            width="100%" height="100%" frameBorder="0" allowFullScreen title="Chart" style={{ display: 'block' }}
          />
        </div>
      </div>

      {/* Right panel */}
      <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>

        {/* Contract type selector */}
        <div style={{ background: '#131525', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {Object.entries(CONTRACT_CONFIGS).map(([key, val]) => (
              <button key={key} onClick={() => setContractGroup(key)}
                style={{ flex: 1, padding: '10px 4px', background: contractGroup===key?'rgba(0,230,122,0.1)':'none', border: 'none', borderBottom: contractGroup===key?'2px solid #00e67a':'2px solid transparent', color: contractGroup===key?'#00e67a':'#64748b', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                {val.label}
              </button>
            ))}
          </div>
          <div style={{ padding: 14 }}>
            <div style={{ fontSize: 11, color: '#475569', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Contract Type</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {config.types.map(([v,l]) => (
                <button key={v} onClick={() => fetchProposal(v)}
                  style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
                  onMouseEnter={e=>{(e.currentTarget as any).style.borderColor='rgba(0,230,122,0.3)';(e.currentTarget as any).style.color='#00e67a';}}
                  onMouseLeave={e=>{(e.currentTarget as any).style.borderColor='rgba(255,255,255,0.08)';(e.currentTarget as any).style.color='#94a3b8';}}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Duration */}
        <div style={{ background: '#131525', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', padding: 14 }}>
          <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Duration</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="number" min={1} value={duration} onChange={e=>setDuration(+e.target.value||1)} style={{ ...selStyle, flex: 1 }} />
            <select value={durUnit} onChange={e=>setDurUnit(e.target.value)} style={{ ...selStyle, width: 'auto' }}>
              <option value="t">Ticks</option><option value="s">Seconds</option><option value="m">Minutes</option>
            </select>
          </div>
        </div>

        {/* Stake */}
        <div style={{ background: '#131525', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', padding: 14 }}>
          <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Stake</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={()=>setStake(s=>Math.max(0.35,+(s-1).toFixed(2)))} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
            <input type="number" min={0.35} step={0.5} value={stake} onChange={e=>setStake(+e.target.value||0.35)} style={{ ...selStyle, textAlign: 'center', fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 18 }} />
            <span style={{ color: '#64748b', fontSize: 13 }}>USD</span>
            <button onClick={()=>setStake(s=>+(s+1).toFixed(2))} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
            <input type="checkbox" id="tp" checked={takeProfit} onChange={e=>setTakeProfit(e.target.checked)} style={{ accentColor: '#00e67a' }} />
            <label htmlFor="tp" style={{ fontSize: 13, color: '#94a3b8', cursor: 'pointer' }}>Take Profit</label>
            {takeProfit && <input type="number" value={tpAmount} onChange={e=>setTpAmount(+e.target.value||1)} style={{ ...selStyle, width: 70, textAlign: 'center' }} />}
          </div>
        </div>

        {/* Proposal info */}
        {proposal && (
          <div style={{ background: '#131525', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
              <span style={{ color: '#64748b' }}>Max payout</span>
              <span style={{ fontWeight: 700, color: '#00e67a' }}>${parseFloat(proposal.payout||'0').toFixed(2)} USD</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#64748b' }}>Ask price</span>
              <span style={{ fontWeight: 700 }}>${parseFloat(proposal.ask_price||'0').toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Last result */}
        {lastResult && (
          <div style={{ padding: '12px 14px', borderRadius: 12, background: lastResult.won?'rgba(0,230,122,0.08)':'rgba(248,113,113,0.08)', border: `1px solid ${lastResult.won?'rgba(0,230,122,0.2)':'rgba(248,113,113,0.2)'}`, textAlign: 'center' }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{lastResult.won?'✅':'❌'}</div>
            <div style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:800, fontSize:18, color:lastResult.won?'#00e67a':'#f87171' }}>
              {lastResult.won?'+':''}{lastResult.profit.toFixed(2)} USD
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{lastResult.won?'Trade won!':'Trade lost'}</div>
          </div>
        )}

        {/* Buy buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {config.types.slice(0, 2).map(([ctype, label]) => {
            const isUp = ['CALL','DIGITEVEN','DIGITOVER','DIGITMATCH'].includes(ctype);
            const isBuying = buying === ctype;
            return (
              <button key={ctype} onClick={() => buyNow(ctype)} disabled={!!buying}
                style={{ padding: '16px 20px', borderRadius: 14, border: 'none', cursor: buying?'not-allowed':'pointer', fontFamily:'Space Grotesk,sans-serif', fontWeight:900, fontSize:17,
                  background: isBuying?'rgba(255,255,255,0.05)': isUp?'linear-gradient(135deg,#00c97a,#00e67a)':'linear-gradient(135deg,#dc2626,#ef4444)',
                  color: isBuying?'#64748b': isUp?'#0a0b14':'#fff',
                  boxShadow: isBuying?'none': isUp?'0 4px 20px rgba(0,230,122,0.25)':'0 4px 20px rgba(239,68,68,0.25)',
                  transition: 'transform 0.1s', opacity: buying&&!isBuying?0.5:1 }}
                onMouseEnter={e=>{if(!buying)(e.currentTarget as any).style.transform='scale(1.02)';}}
                onMouseLeave={e=>{(e.currentTarget as any).style.transform='scale(1)';}}>
                {isBuying ? (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                    <div style={{ width:16, height:16, border:'2px solid currentColor', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
                    Buying...
                  </div>
                ) : (
                  <div>
                    <div>{label}</div>
                    <div style={{ fontSize:13, fontWeight:600, marginTop:3, opacity:0.8 }}>≥ ${stake.toFixed(2)}</div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ padding:'8px 12px', borderRadius:8, background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.1)', fontSize:11, color:'#f59e0b', lineHeight:1.5 }}>
          ⚠️ Risk Disclaimer: Trading involves substantial risk of loss. Trade responsibly.
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
