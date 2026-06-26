'use client';
import { useState, useEffect, useRef } from 'react';

const SYMBOLS = [
  ['R_100','Volatility 100 (1s)'],['R_75','Volatility 75'],['R_50','Volatility 50'],
  ['R_25','Volatility 25'],['R_10','Volatility 10 (1s)'],['BOOM1000','Boom 1000'],
  ['BOOM500','Boom 500'],['CRASH1000','Crash 1000'],['CRASH500','Crash 500'],
  ['STPIDX','Step Index'],['RDBULL','Bull Market'],['RDBEAR','Bear Market'],
];
const CTYPES = [
  ['CALL','Rise'],['PUT','Fall'],['DIGITODD','Digit Odd'],['DIGITEVEN','Digit Even'],
  ['DIGITOVER','Digit Over'],['DIGITUNDER','Digit Under'],['DIGITMATCH','Digit Match'],['DIGITDIFF','Digit Differ'],
];
const APP_ID = process.env.NEXT_PUBLIC_DERIV_APP_ID || '33BguwaY1RGDz9J48qvkJ';

type Log = { time: string; msg: string; type: 'info'|'success'|'error'|'warn' };

const sel: React.CSSProperties = { padding: '6px 10px', background: '#1a1d2e', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#e2e8f0', fontSize: 13, outline: 'none', cursor: 'pointer' };
const inp: React.CSSProperties = { padding: '6px 10px', background: '#1a1d2e', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#e2e8f0', fontSize: 13, outline: 'none', width: 80, fontFamily: 'inherit' };
const blockStyle: React.CSSProperties = { background: '#1a1d2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 };
const blockHeader: React.CSSProperties = { background: 'rgba(0,230,122,0.12)', borderBottom: '1px solid rgba(0,230,122,0.15)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#00e67a' };
const blockBody: React.CSSProperties = { padding: 16, display: 'flex', flexDirection: 'column', gap: 12 };
const row: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' };
const lbl: React.CSSProperties = { fontSize: 12, color: '#64748b', minWidth: 140 };

export default function BotBuilderPage() {
  const [symbol, setSymbol] = useState('R_100');
  const [ctype, setCtype] = useState('CALL');
  const [dur, setDur] = useState(1);
  const [durUnit, setDurUnit] = useState('t');
  const [stake, setStake] = useState(0.35);
  const [tp, setTp] = useState(10);
  const [sl, setSl] = useState(10);
  const [maxTrades, setMaxTrades] = useState(50);
  const [noTrades, setNoTrades] = useState(1);
  const [martingale, setMartingale] = useState('none');
  const [mult, setMult] = useState(2);
  const [prediction, setPrediction] = useState(5);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [execSpeed, setExecSpeed] = useState<'normal'|'fast'>('normal');
  const [log, setLog] = useState<Log[]>([]);
  const [pnl, setPnl] = useState(0);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [trades, setTrades] = useState(0);
  const [currentStake, setCurrentStake] = useState(0.35);
  const [activeSection, setActiveSection] = useState<string|null>(null);
  const stopRef = useRef(false);
  const pauseRef = useRef(false);
  const logEnd = useRef<HTMLDivElement>(null);
  const isDigit = ctype.startsWith('DIGIT');

  useEffect(() => { logEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [log]);

  const addLog = (msg: string, type: Log['type'] = 'info') =>
    setLog(prev => [...prev.slice(-400), { time: new Date().toLocaleTimeString(), msg, type }]);

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  const doBuy = async (token: string, stakeAmt: number): Promise<{profit:number;won:boolean}|null> =>
    new Promise(resolve => {
      const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);
      const t = setTimeout(() => { ws.close(); resolve(null); }, 30000);
      let auth = false;
      ws.onopen = () => ws.send(JSON.stringify({ authorize: token }));
      ws.onmessage = (e) => {
        const m = JSON.parse(e.data);
        if (m.error) { clearTimeout(t); ws.close(); addLog(`Deriv: ${m.error.message}`, 'error'); resolve(null); return; }
        if (m.msg_type === 'authorize' && !auth) {
          auth = true;
          ws.send(JSON.stringify({ proposal: 1, amount: stakeAmt, basis: 'stake', contract_type: ctype, currency: 'USD', duration: dur, duration_unit: durUnit, symbol, ...(isDigit ? { prediction } : {}) }));
        }
        if (m.msg_type === 'proposal') ws.send(JSON.stringify({ buy: m.proposal.id, price: m.proposal.ask_price }));
        if (m.msg_type === 'buy') {
          addLog(`#${m.buy.contract_id} purchased · stake $${stakeAmt.toFixed(2)}`, 'info');
          ws.send(JSON.stringify({ proposal_open_contract: 1, contract_id: m.buy.contract_id, subscribe: 1 }));
        }
        if (m.msg_type === 'proposal_open_contract' && m.proposal_open_contract?.is_sold) {
          clearTimeout(t); ws.close();
          resolve({ profit: parseFloat(m.proposal_open_contract.profit || '0'), won: parseFloat(m.proposal_open_contract.profit || '0') > 0 });
        }
      };
      ws.onerror = () => { clearTimeout(t); ws.close(); resolve(null); };
    });

  const start = async () => {
    const token = localStorage.getItem('tl_token') || '';
    if (!token) { addLog('No token found. Please reconnect.', 'error'); return; }
    stopRef.current = false; pauseRef.current = false;
    setIsRunning(true); setIsPaused(false);
    setPnl(0); setWins(0); setLosses(0); setTrades(0); setLog([]);
    let curStake = stake, totalPnl = 0, w = 0, l = 0, n = 0;
    addLog(`Bot started · ${SYMBOLS.find(s=>s[0]===symbol)?.[1]} · ${ctype} · ${dur}${durUnit} · $${stake}`, 'info');
    addLog(`Target: +$${tp} · Stop: -$${sl} · Max trades: ${maxTrades}`, 'info');
    while (!stopRef.current) {
      if (pauseRef.current) { await sleep(200); continue; }
      if (n >= maxTrades) { addLog('✓ Max trades reached.', 'warn'); break; }
      if (totalPnl >= tp) { addLog(`🎯 Take profit +$${tp} hit!`, 'success'); break; }
      if (totalPnl <= -sl) { addLog(`🛑 Stop loss -$${sl} hit!`, 'error'); break; }
      setCurrentStake(curStake);
      const res = await doBuy(token, curStake);
      if (!res) { await sleep(2000); continue; }
      n++; totalPnl += res.profit;
      if (res.won) { w++; curStake = stake; addLog(`✅ Win +$${res.profit.toFixed(2)} · P&L $${totalPnl.toFixed(2)}`, 'success'); }
      else { l++; addLog(`❌ Loss $${Math.abs(res.profit).toFixed(2)} · P&L $${totalPnl.toFixed(2)}`, 'error'); if (martingale==='double') curStake*=2; else if(martingale==='custom') curStake*=mult; }
      setPnl(totalPnl); setWins(w); setLosses(l); setTrades(n);
      await sleep(execSpeed === 'fast' ? 100 : 500);
    }
    setIsRunning(false);
    addLog(`Stopped · ${n} trades · W:${w} L:${l} · P&L: $${totalPnl.toFixed(2)}`, totalPnl>=0?'success':'error');
  };

  const stop = () => { stopRef.current = true; setIsRunning(false); setIsPaused(false); };
  const pause = () => { pauseRef.current = !pauseRef.current; setIsPaused(pauseRef.current); };

  const logColor = (t: string) => t==='success'?'#00e67a':t==='error'?'#f87171':t==='warn'?'#fbbf24':'#64748b';

  const SideItem = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={row}>
      <span style={lbl}>{label}:</span>
      {children}
    </div>
  );

  return (
    <div className="fade-in" style={{ display: 'flex', gap: 16, height: 'calc(100vh - 120px)', overflow: 'hidden' }}>

      {/* Left sidebar — Blocks menu */}
      <div style={{ width: 220, flexShrink: 0, background: '#131525', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={{ flex: 1, padding: '8px 12px', background: '#00e67a', color: '#0a0b14', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>⚡ Quick Strategy</button>
        </div>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>Blocks Menu</span>
            <span style={{ color: '#64748b', fontSize: 16 }}>⌃</span>
          </div>
        </div>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <input placeholder="🔍 Search blocks..." style={{ width: '100%', padding: '7px 10px', background: '#1a1d2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#94a3b8', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 6px' }}>
          {[
            { label: '🔥 Logics', children: ['If/Then','And','Or','Not'] },
            { label: '⚙️ Trade Parameters', children: ['Market','Trade Type','Contract Type','Duration'] },
            { label: '🛒 Purchase Conditions', children: ['Purchase When','No. of Trades','Bulk Purchase'] },
            { label: '📉 Sell Conditions', children: ['Sell When','Profit/Loss','Ticks Elapsed'] },
            { label: '🔄 Restart Conditions', children: ['Trade Again','After Win','After Loss'] },
            { label: '📊 Analysis', children: ['Last Digit','Tick Count','Streak Count'] },
            { label: '🔧 Utility', children: ['Notify','Delay','Counter','Math'] },
          ].map(section => (
            <div key={section.label}>
              <button onClick={() => setActiveSection(activeSection === section.label ? null : section.label)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 10px', background: 'none', border: 'none', color: '#94a3b8', fontSize: 13, fontWeight: 500, cursor: 'pointer', borderRadius: 8, textAlign: 'left' }}>
                {section.label}
                <span style={{ fontSize: 10, transform: activeSection === section.label ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
              </button>
              {activeSection === section.label && (
                <div style={{ paddingLeft: 10, paddingBottom: 4 }}>
                  {section.children.map(child => (
                    <div key={child} style={{ padding: '6px 10px', fontSize: 12, color: '#64748b', cursor: 'grab', borderRadius: 6, marginBottom: 2 }}
                      onMouseEnter={e => { (e.currentTarget as any).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as any).style.color = '#e2e8f0'; }}
                      onMouseLeave={e => { (e.currentTarget as any).style.background = 'none'; (e.currentTarget as any).style.color = '#64748b'; }}>
                      {child}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Center — Visual blocks canvas */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: '#131525', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
          {[['↻','Reload'],['📂','Open'],['💾','Save'],['📈','Zoom In'],['📉','Zoom Out'],['↩','Undo'],['↪','Redo']].map(([icon, tip]) => (
            <button key={tip} title={tip} style={{ width: 32, height: 32, background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}
              onMouseEnter={e => { (e.currentTarget as any).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as any).style.color = '#e2e8f0'; }}
              onMouseLeave={e => { (e.currentTarget as any).style.background = 'none'; (e.currentTarget as any).style.color = '#64748b'; }}>
              {icon}
            </button>
          ))}
        </div>

        {/* Blocks canvas */}
        <div style={{ flex: 1, overflow: 'auto', padding: 4 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, minWidth: 640 }}>

            {/* Block 1: Trade Parameters */}
            <div style={blockStyle}>
              <div style={blockHeader}>
                <span style={{ fontSize: 14 }}>⚙️</span> 1. Trade Parameters
              </div>
              <div style={blockBody}>
                <SideItem label="Market">
                  <select value={symbol} onChange={e=>setSymbol(e.target.value)} style={sel}>
                    {SYMBOLS.map(([v,l])=><option key={v} value={v}>{l}</option>)}
                  </select>
                </SideItem>
                <SideItem label="Trade Type">
                  <select value={ctype} onChange={e=>setCtype(e.target.value)} style={sel}>
                    {CTYPES.map(([v,l])=><option key={v} value={v}>{l}</option>)}
                  </select>
                </SideItem>
                {isDigit && (
                  <SideItem label="Prediction (0–9)">
                    <input type="number" min={0} max={9} value={prediction} onChange={e=>setPrediction(+e.target.value)} style={inp} />
                  </SideItem>
                )}
                <SideItem label="Duration">
                  <input type="number" min={1} value={dur} onChange={e=>setDur(+e.target.value||1)} style={inp} />
                  <select value={durUnit} onChange={e=>setDurUnit(e.target.value)} style={sel}>
                    <option value="t">Ticks</option><option value="s">Seconds</option><option value="m">Minutes</option>
                  </select>
                </SideItem>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>Trade Options:</div>
                  <SideItem label="Stake (USD)">
                    <input type="number" min={0.35} step={0.5} value={stake} onChange={e=>setStake(+e.target.value||0.35)} style={inp} />
                    <span style={{ fontSize: 11, color: '#475569' }}>(min 0.35 – max 50000)</span>
                  </SideItem>
                </div>
              </div>
            </div>

            {/* Block 3: Sell Conditions */}
            <div style={blockStyle}>
              <div style={{ ...blockHeader, background: 'rgba(248,113,113,0.1)', borderBottomColor: 'rgba(248,113,113,0.15)', color: '#f87171' }}>
                <span>📉</span> 3. Sell Conditions
              </div>
              <div style={blockBody}>
                <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', fontSize: 13 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', marginBottom: 8 }}>
                    <span style={{ color: '#64748b' }}>if</span>
                    <span style={{ padding: '3px 10px', background: 'rgba(248,113,113,0.1)', borderRadius: 6, color: '#f87171', fontWeight: 600 }}>Sell is available</span>
                    <span style={{ color: '#64748b' }}>then</span>
                  </div>
                  <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 6, fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>
                    True if active contract can be sold before expiration at current market price
                  </div>
                </div>
                <SideItem label="Take Profit ($)">
                  <input type="number" min={0.1} value={tp} onChange={e=>setTp(+e.target.value||10)} style={inp} />
                </SideItem>
                <SideItem label="Stop Loss ($)">
                  <input type="number" min={0.1} value={sl} onChange={e=>setSl(+e.target.value||10)} style={inp} />
                </SideItem>
              </div>
            </div>

            {/* Block 2: Purchase Conditions */}
            <div style={blockStyle}>
              <div style={{ ...blockHeader, background: 'rgba(99,102,241,0.1)', borderBottomColor: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                <span>🛒</span> 2. Purchase Conditions
              </div>
              <div style={blockBody}>
                <SideItem label="Purchase">
                  <select value={ctype} onChange={e=>setCtype(e.target.value)} style={sel}>
                    {CTYPES.map(([v,l])=><option key={v} value={v}>{l}</option>)}
                  </select>
                </SideItem>
                <SideItem label="No. of Trades">
                  <input type="number" min={1} value={noTrades} onChange={e=>setNoTrades(+e.target.value||1)} style={inp} />
                </SideItem>
                <SideItem label="Max Trades">
                  <input type="number" min={1} max={10000} value={maxTrades} onChange={e=>setMaxTrades(+e.target.value||50)} style={inp} />
                </SideItem>
                <SideItem label="Martingale">
                  <select value={martingale} onChange={e=>setMartingale(e.target.value)} style={sel}>
                    <option value="none">Off (flat stake)</option>
                    <option value="double">Double on loss</option>
                    <option value="custom">Custom multiplier</option>
                  </select>
                </SideItem>
                {martingale==='custom' && (
                  <SideItem label="Multiplier">
                    <input type="number" min={1.1} step={0.1} value={mult} onChange={e=>setMult(+e.target.value||2)} style={inp} />
                  </SideItem>
                )}
              </div>
            </div>

            {/* Block 4: Restart Conditions */}
            <div style={blockStyle}>
              <div style={{ ...blockHeader, background: 'rgba(245,158,11,0.1)', borderBottomColor: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                <span>🔄</span> 4. Restart Conditions
              </div>
              <div style={blockBody}>
                <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ padding: '6px 16px', background: 'rgba(245,158,11,0.1)', borderRadius: 8, color: '#f59e0b', fontSize: 13, fontWeight: 600 }}>Trade Again</span>
                </div>
                <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                  The bot will automatically restart and trade again when sell conditions are met, until the Take Profit or Stop Loss is reached.
                </p>
                <div style={{ padding: '8px 12px', background: 'rgba(245,158,11,0.06)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.1)' }}>
                  <p style={{ fontSize: 11, color: '#f59e0b' }}>⚠️ Real money. Trade responsibly.</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Run bar */}
        <div style={{ padding: '12px 16px', background: '#131525', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 14 }}>
          {!isRunning ? (
            <button onClick={start} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', background: '#00e67a', color: '#0a0b14', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 0 16px rgba(0,230,122,0.25)' }}>
              ▶ Run
            </button>
          ) : (
            <>
              <button onClick={pause} style={{ padding: '10px 20px', background: isPaused ? 'rgba(0,230,122,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${isPaused?'rgba(0,230,122,0.3)':'rgba(245,158,11,0.3)'}`, borderRadius: 10, color: isPaused?'#00e67a':'#f59e0b', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                {isPaused ? '▶ Resume' : '⏸ Pause'}
              </button>
              <button onClick={stop} style={{ padding: '10px 20px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, color: '#f87171', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                ⏹ Stop
              </button>
            </>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 12 }}>
              <div style={{ color: '#475569', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Execution Speed</div>
              <div style={{ color: execSpeed === 'fast' ? '#00e67a' : '#94a3b8', fontWeight: 700, fontSize: 13 }}>{execSpeed === 'fast' ? 'FAST SPEED' : 'NORMAL SPEED'}</div>
            </div>
            <button onClick={() => setExecSpeed(v => v === 'normal' ? 'fast' : 'normal')}
              style={{ width: 44, height: 24, borderRadius: 12, background: execSpeed==='fast'?'#00e67a':'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
              <span style={{ position: 'absolute', top: 3, left: execSpeed==='fast'?22:3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
            </button>
          </div>
          {isRunning && (
            <div style={{ display: 'flex', gap: 16, marginLeft: 'auto', fontSize: 13 }}>
              <span style={{ color: '#00e67a' }}>W: {wins}</span>
              <span style={{ color: '#f87171' }}>L: {losses}</span>
              <span style={{ color: pnl>=0?'#00e67a':'#f87171', fontWeight: 700 }}>P&L: {pnl>=0?'+':''}{pnl.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right — Live log */}
      <div style={{ width: 280, flexShrink: 0, background: '#131525', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
            {isRunning && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00e67a', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />}
            Bot Log
          </div>
          <button onClick={()=>setLog([])} style={{ fontSize: 11, color: '#475569', background:'none', border:'none', cursor:'pointer' }}>Clear</button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {[['Trades',String(trades),'#94a3b8'],['P&L',`${pnl>=0?'+':''}$${pnl.toFixed(2)}`,pnl>=0?'#00e67a':'#f87171'],['Wins',String(wins),'#00e67a'],['Losses',String(losses),'#f87171']].map(([l,v,c])=>(
            <div key={l} style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.2)', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#475569', marginBottom: 3 }}>{l}</div>
              <div style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight: 800, fontSize: 16, color: c }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', fontFamily: 'monospace', fontSize: 11, lineHeight: 1.7, background: 'rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {log.length === 0 ? (
            <p style={{ color: '#475569', textAlign: 'center', marginTop: 32, lineHeight: 1.6 }}>Configure the blocks and press Run to start trading.</p>
          ) : log.map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: 8 }}>
              <span style={{ color: '#334155', flexShrink: 0 }}>{e.time}</span>
              <span style={{ color: logColor(e.type) }}>{e.msg}</span>
            </div>
          ))}
          <div ref={logEnd} />
        </div>
      </div>

      <style>{`@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(0,230,122,0.4)}70%{box-shadow:0 0 0 5px rgba(0,230,122,0)}100%{box-shadow:0 0 0 0 rgba(0,230,122,0)}}`}</style>
    </div>
  );
}
