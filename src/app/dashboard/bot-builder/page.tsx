'use client';
import { useState, useEffect, useRef } from 'react';

const SYMBOLS = [
  ['R_100','Volatility 100'],['R_75','Volatility 75'],['R_50','Volatility 50'],
  ['R_25','Volatility 25'],['R_10','Volatility 10'],['BOOM1000','Boom 1000'],
  ['BOOM500','Boom 500'],['CRASH1000','Crash 1000'],['CRASH500','Crash 500'],
  ['STPIDX','Step Index'],['RDBULL','Bull Market'],['RDBEAR','Bear Market'],
];
const CTYPES = [
  ['CALL','Rise (CALL)'],['PUT','Fall (PUT)'],['DIGITODD','Digit Odd'],
  ['DIGITEVEN','Digit Even'],['DIGITOVER','Digit Over'],['DIGITUNDER','Digit Under'],
  ['DIGITMATCH','Digit Match'],['DIGITDIFF','Digit Differ'],
];
const APP_ID = process.env.NEXT_PUBLIC_DERIV_APP_ID || '33BguwaY1RGDz9J48qvkJ';
const card: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, backdropFilter: 'blur(16px)' };
const inp: React.CSSProperties = { width: '100%', height: 44, padding: '0 14px', background: 'hsl(220 28% 12%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'hsl(210 40% 96%)', fontSize: 14, outline: 'none', fontFamily: 'inherit' };
const lbl: React.CSSProperties = { fontSize: 12, color: 'hsl(215 20% 55%)', fontWeight: 500, display: 'block', marginBottom: 7 };

type Log = { time: string; msg: string; type: 'info'|'success'|'error'|'warn' };

export default function BotBuilderPage() {
  const [symbol, setSymbol] = useState('R_100');
  const [ctype, setCtype] = useState('CALL');
  const [dur, setDur] = useState(5);
  const [durUnit, setDurUnit] = useState('t');
  const [stake, setStake] = useState(1);
  const [tp, setTp] = useState(10);
  const [sl, setSl] = useState(10);
  const [maxTrades, setMaxTrades] = useState(20);
  const [martingale, setMartingale] = useState('none');
  const [mult, setMult] = useState(2);
  const [prediction, setPrediction] = useState(5);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [log, setLog] = useState<Log[]>([]);
  const [pnl, setPnl] = useState(0);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [trades, setTrades] = useState(0);
  const stopRef = useRef(false);
  const pauseRef = useRef(false);
  const logEnd = useRef<HTMLDivElement>(null);

  useEffect(() => { logEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [log]);

  const addLog = (msg: string, type: Log['type'] = 'info') => {
    setLog(prev => [...prev.slice(-300), { time: new Date().toLocaleTimeString(), msg, type }]);
  };

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
  const isDigit = ctype.startsWith('DIGIT');

  const doBuy = async (token: string, stakeAmt: number): Promise<{profit:number;won:boolean}|null> => {
    return new Promise(resolve => {
      const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);
      const t = setTimeout(() => { ws.close(); resolve(null); }, 28000);
      let auth = false;
      ws.onopen = () => ws.send(JSON.stringify({ authorize: token }));
      ws.onmessage = (e) => {
        const m = JSON.parse(e.data);
        if (m.error) { clearTimeout(t); ws.close(); addLog(`❌ ${m.error.message}`, 'error'); resolve(null); return; }
        if (m.msg_type === 'authorize' && !auth) {
          auth = true;
          ws.send(JSON.stringify({ proposal: 1, amount: stakeAmt, basis: 'stake', contract_type: ctype, currency: 'USD', duration: dur, duration_unit: durUnit, symbol, ...(isDigit ? { prediction } : {}) }));
        }
        if (m.msg_type === 'proposal') ws.send(JSON.stringify({ buy: m.proposal.id, price: m.proposal.ask_price }));
        if (m.msg_type === 'buy') {
          addLog(`Contract #${m.buy.contract_id} — waiting for result...`, 'info');
          ws.send(JSON.stringify({ proposal_open_contract: 1, contract_id: m.buy.contract_id, subscribe: 1 }));
        }
        if (m.msg_type === 'proposal_open_contract' && m.proposal_open_contract?.is_sold) {
          clearTimeout(t); ws.close();
          const profit = parseFloat(m.proposal_open_contract.profit || '0');
          resolve({ profit, won: profit > 0 });
        }
      };
      ws.onerror = () => { clearTimeout(t); ws.close(); resolve(null); };
    });
  };

  const start = async () => {
    const token = localStorage.getItem('tl_token') || '';
    if (!token) { addLog('No token. Please reconnect.', 'error'); return; }
    stopRef.current = false; pauseRef.current = false;
    setIsRunning(true); setIsPaused(false);
    setPnl(0); setWins(0); setLosses(0); setTrades(0); setLog([]);
    let curStake = stake, totalPnl = 0, w = 0, l = 0, n = 0;
    addLog(`🤖 Bot started | ${symbol} | ${ctype} | ${dur}${durUnit} | Stake: $${stake}`, 'info');
    addLog(`Target: +$${tp} | Stop: -$${sl} | Max: ${maxTrades} trades`, 'info');
    while (!stopRef.current) {
      if (pauseRef.current) { await sleep(500); continue; }
      if (n >= maxTrades) { addLog('Max trades reached.', 'warn'); break; }
      if (totalPnl >= tp) { addLog(`🎯 Target +$${tp} reached!`, 'success'); break; }
      if (totalPnl <= -sl) { addLog(`🛑 Stop loss -$${sl} hit!`, 'error'); break; }
      addLog(`Trade ${n+1} | Stake: $${curStake.toFixed(2)}`, 'info');
      const res = await doBuy(token, curStake);
      if (!res) { addLog('Trade failed — retrying...', 'warn'); await sleep(2000); continue; }
      n++; totalPnl += res.profit;
      if (res.won) { w++; curStake = stake; addLog(`✅ Win! +$${res.profit.toFixed(2)} | P&L: $${totalPnl.toFixed(2)}`, 'success'); }
      else { l++; addLog(`❌ Loss $${Math.abs(res.profit).toFixed(2)} | P&L: $${totalPnl.toFixed(2)}`, 'error'); if (martingale === 'double') curStake *= 2; else if (martingale === 'custom') curStake *= mult; }
      setPnl(totalPnl); setWins(w); setLosses(l); setTrades(n);
      await sleep(300);
    }
    setIsRunning(false);
    addLog(`Stopped. ${n} trades | W:${w} L:${l} | P&L: $${totalPnl.toFixed(2)}`, totalPnl >= 0 ? 'success' : 'error');
  };

  const stop = () => { stopRef.current = true; setIsRunning(false); setIsPaused(false); };
  const pause = () => { pauseRef.current = !pauseRef.current; setIsPaused(pauseRef.current); };

  const logColor = (type: string) => type === 'success' ? '#34d399' : type === 'error' ? '#f87171' : type === 'warn' ? '#fbbf24' : 'hsl(215 20% 55%)';

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>🤖 Bot Builder</h1>
        <p style={{ color: 'hsl(215 20% 55%)', fontSize: 14 }}>Configure and run automated bots on your Deriv account with full control.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20, alignItems: 'start' }}>

        {/* Config */}
        <div style={{ ...card, padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 className="font-display" style={{ fontWeight: 700, fontSize: 16 }}>⚙️ Configuration</h2>

          <div><label style={lbl}>Market Symbol</label>
            <select value={symbol} onChange={e => setSymbol(e.target.value)} style={inp}>
              {SYMBOLS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          <div><label style={lbl}>Contract Type</label>
            <select value={ctype} onChange={e => setCtype(e.target.value)} style={inp}>
              {CTYPES.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          {isDigit && <div><label style={lbl}>Prediction (0–9)</label>
            <input type="number" min={0} max={9} value={prediction} onChange={e => setPrediction(+e.target.value || 0)} style={inp} />
          </div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={lbl}>Duration</label><input type="number" min={1} value={dur} onChange={e => setDur(+e.target.value || 1)} style={inp} /></div>
            <div><label style={lbl}>Unit</label>
              <select value={durUnit} onChange={e => setDurUnit(e.target.value)} style={inp}>
                <option value="t">Ticks</option><option value="s">Seconds</option><option value="m">Minutes</option>
              </select>
            </div>
          </div>

          <div><label style={lbl}>Initial Stake ($)</label><input type="number" min={0.35} step={0.5} value={stake} onChange={e => setStake(+e.target.value || 1)} style={inp} /></div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={lbl}>Take Profit ($)</label><input type="number" min={0.1} value={tp} onChange={e => setTp(+e.target.value || 10)} style={inp} /></div>
            <div><label style={lbl}>Stop Loss ($)</label><input type="number" min={0.1} value={sl} onChange={e => setSl(+e.target.value || 10)} style={inp} /></div>
          </div>

          <div><label style={lbl}>Max Trades</label><input type="number" min={1} max={1000} value={maxTrades} onChange={e => setMaxTrades(+e.target.value || 20)} style={inp} /></div>

          <div><label style={lbl}>Martingale</label>
            <select value={martingale} onChange={e => setMartingale(e.target.value)} style={inp}>
              <option value="none">No Martingale (flat stake)</option>
              <option value="double">Double on loss (×2)</option>
              <option value="custom">Custom multiplier</option>
            </select>
          </div>

          {martingale === 'custom' && <div><label style={lbl}>Multiplier on Loss</label><input type="number" min={1.1} step={0.1} value={mult} onChange={e => setMult(+e.target.value || 2)} style={inp} /></div>}

          <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <p style={{ fontSize: 12, color: 'hsl(38 92% 50%)', lineHeight: 1.55 }}>⚠️ Real money is at risk. Martingale strategies can rapidly multiply losses. Only use funds you can afford to lose.</p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {!isRunning ? (
              <button onClick={start} className="btn-primary glow-green-sm" style={{ flex: 1, padding: '13px 0', fontSize: 15 }}>▶ Start Bot</button>
            ) : (
              <>
                <button onClick={pause} style={{ flex: 1, padding: '13px 0', fontSize: 14, fontWeight: 600, borderRadius: 12, cursor: 'pointer', border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.1)', color: 'hsl(38 92% 50%)' }}>
                  {isPaused ? '▶ Resume' : '⏸ Pause'}
                </button>
                <button onClick={stop} style={{ flex: 1, padding: '13px 0', fontSize: 14, fontWeight: 600, borderRadius: 12, cursor: 'pointer', border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
                  ⏹ Stop
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats + log */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
            {[
              { label: 'P&L', value: `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`, color: pnl >= 0 ? '#34d399' : '#f87171' },
              { label: 'Trades', value: String(trades), color: 'hsl(210 40% 96%)' },
              { label: 'Wins', value: String(wins), color: '#34d399' },
              { label: 'Losses', value: String(losses), color: '#f87171' },
            ].map((s, i) => (
              <div key={i} style={{ ...card, padding: '16px 20px', textAlign: 'center' }}>
                <div className="font-display" style={{ fontWeight: 800, fontSize: 24, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'hsl(215 20% 55%)', marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {trades > 0 && (
            <div style={{ ...card, padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'hsl(215 20% 55%)', marginBottom: 8 }}>
                <span>Win Rate</span>
                <span style={{ color: '#34d399', fontWeight: 600 }}>{((wins/trades)*100).toFixed(1)}%</span>
              </div>
              <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(wins/trades)*100}%`, background: '#34d399', borderRadius: 999, transition: 'width 0.4s' }} />
              </div>
            </div>
          )}

          <div style={{ ...card, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isRunning && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} className="pulse-green" />}
                <span className="font-display" style={{ fontWeight: 700, fontSize: 14 }}>{isRunning ? 'Running...' : 'Bot Log'}</span>
              </div>
              <button onClick={() => setLog([])} style={{ fontSize: 12, color: 'hsl(215 20% 55%)', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
            </div>
            <div style={{ height: 320, overflowY: 'auto', padding: 16, fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6, background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {log.length === 0 ? (
                <p style={{ color: 'hsl(215 20% 55%)', textAlign: 'center', marginTop: 40 }}>Configure and start the bot to see live output here.</p>
              ) : log.map((entry, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, color: logColor(entry.type) }}>
                  <span style={{ color: 'rgba(140,150,170,0.4)', flexShrink: 0 }}>{entry.time}</span>
                  <span>{entry.msg}</span>
                </div>
              ))}
              <div ref={logEnd} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}