'use client';
import { useEffect, useRef, useState } from 'react';
import { DERIV_WS, SYNTHETIC_SYMBOLS } from '@/lib/deriv';

const card: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 };
const input: React.CSSProperties = { width: '100%', padding: '10px 12px', background: '#131525', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, color: '#e2e8f0', fontSize: 14, outline: 'none' };
const label: React.CSSProperties = { fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6, display: 'block' };

const CONTRACTS: [string, string][] = [
  ['CALL', 'Rise'],
  ['PUT', 'Fall'],
  ['DIGITEVEN', 'Even'],
  ['DIGITODD', 'Odd'],
];

type LogEntry = { id: number; result: 'win' | 'loss'; profit: number; stake: number; time: string };

export default function SpeedbotPage() {
  const [symbol, setSymbol] = useState('R_100');
  const [contractType, setContractType] = useState('CALL');
  const [baseStake, setBaseStake] = useState('1');
  const [duration, setDuration] = useState('1');
  const [takeProfit, setTakeProfit] = useState('10');
  const [stopLoss, setStopLoss] = useState('10');
  const [martingale, setMartingale] = useState('2');

  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [pnl, setPnl] = useState(0);
  const [wins, setWins] = useState(0);
  const [runs, setRuns] = useState(0);
  const [curStake, setCurStake] = useState(1);
  const [log, setLog] = useState<LogEntry[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const runningRef = useRef(false);
  const stakeRef = useRef(1);
  const pnlRef = useRef(0);
  const logId = useRef(0);

  const stop = (reason: string) => {
    runningRef.current = false;
    setRunning(false);
    setStatus(reason);
    try { wsRef.current?.close(); } catch (_) {}
    wsRef.current = null;
  };

  useEffect(() => () => { runningRef.current = false; try { wsRef.current?.close(); } catch (_) {} }, []);

  const start = () => {
    const token = localStorage.getItem('tl_token') || '';
    if (!token) { setStatus('❌ Connect your Deriv account first.'); return; }

    const base = Math.max(0.35, parseFloat(baseStake) || 1);
    const tp = parseFloat(takeProfit) || Infinity;
    const sl = parseFloat(stopLoss) || Infinity;
    const mg = Math.max(1, parseFloat(martingale) || 1);
    const dur = Math.max(1, parseInt(duration) || 1);

    stakeRef.current = base;
    pnlRef.current = 0;
    runningRef.current = true;
    setRunning(true);
    setPnl(0); setWins(0); setRuns(0); setCurStake(base); setLog([]);
    setStatus('Connecting...');

    const ws = new WebSocket(DERIV_WS);
    wsRef.current = ws;
    let currentContractId: number | null = null;

    const placeTrade = () => {
      if (!runningRef.current) return;
      setStatus(`Placing trade · stake $${stakeRef.current.toFixed(2)}`);
      ws.send(JSON.stringify({
        buy: 1,
        price: stakeRef.current * 100,
        parameters: { amount: Number(stakeRef.current.toFixed(2)), basis: 'stake', contract_type: contractType, currency: 'USD', duration: dur, duration_unit: 't', symbol },
      }));
    };

    ws.onopen = () => ws.send(JSON.stringify({ authorize: token }));
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.error) { stop(`❌ ${m.error.message}`); return; }
      if (m.msg_type === 'authorize') { placeTrade(); return; }
      if (m.msg_type === 'buy') {
        currentContractId = m.buy.contract_id;
        setStatus(`In trade · #${currentContractId}`);
        ws.send(JSON.stringify({ proposal_open_contract: 1, contract_id: currentContractId, subscribe: 1 }));
        return;
      }
      if (m.msg_type === 'proposal_open_contract') {
        const poc = m.proposal_open_contract;
        if (!poc || poc.contract_id !== currentContractId) return;
        if (poc.is_sold) {
          const profit = parseFloat(poc.profit);
          const won = profit >= 0;
          pnlRef.current += profit;
          logId.current += 1;
          const entry: LogEntry = { id: logId.current, result: won ? 'win' : 'loss', profit, stake: stakeRef.current, time: new Date().toLocaleTimeString() };
          setLog((l) => [entry, ...l].slice(0, 40));
          setPnl(pnlRef.current);
          setRuns((r) => r + 1);
          if (won) { setWins((w) => w + 1); stakeRef.current = base; }
          else { stakeRef.current = Number((stakeRef.current * mg).toFixed(2)); }
          setCurStake(stakeRef.current);

          try { ws.send(JSON.stringify({ forget_all: 'proposal_open_contract' })); } catch (_) {}
          currentContractId = null;

          if (pnlRef.current >= tp) { stop(`🎯 Take profit hit · +$${pnlRef.current.toFixed(2)}`); return; }
          if (pnlRef.current <= -Math.abs(sl)) { stop(`🛑 Stop loss hit · $${pnlRef.current.toFixed(2)}`); return; }
          if (runningRef.current) setTimeout(placeTrade, 600);
        }
      }
    };
    ws.onclose = () => { if (runningRef.current) stop('Disconnected'); };
    ws.onerror = () => stop('❌ Connection error');
  };

  const winRate = runs > 0 ? ((wins / runs) * 100).toFixed(0) : '0';

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 1100, margin: '0 auto', width: '100%' }}>
      <div>
        <h1 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 24, fontWeight: 800, marginBottom: 4 }}>🚀 Speedbot</h1>
        <p style={{ color: '#64748b', fontSize: 13 }}>Ultra-fast automated execution with martingale recovery, take-profit and stop-loss guards.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 380px) 1fr', gap: 16, alignItems: 'start' }} className="speedbot-grid">
        {/* Config */}
        <div style={{ ...card, padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={label}>Market</label>
              <select style={input} value={symbol} onChange={(e) => setSymbol(e.target.value)} disabled={running}>
                {SYNTHETIC_SYMBOLS.map((s) => <option key={s.symbol} value={s.symbol}>{s.short}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Direction</label>
              <select style={input} value={contractType} onChange={(e) => setContractType(e.target.value)} disabled={running}>
                {CONTRACTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={label}>Base Stake ($)</label><input style={input} type="number" min="0.35" step="0.5" value={baseStake} onChange={(e) => setBaseStake(e.target.value)} disabled={running} /></div>
            <div><label style={label}>Duration (ticks)</label><input style={input} type="number" min="1" max="10" value={duration} onChange={(e) => setDuration(e.target.value)} disabled={running} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={label}>Take Profit ($)</label><input style={input} type="number" min="0" step="1" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} disabled={running} /></div>
            <div><label style={label}>Stop Loss ($)</label><input style={input} type="number" min="0" step="1" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} disabled={running} /></div>
          </div>
          <div>
            <label style={label}>Martingale Multiplier (on loss)</label>
            <input style={input} type="number" min="1" step="0.1" value={martingale} onChange={(e) => setMartingale(e.target.value)} disabled={running} />
          </div>

          <div style={{ padding: '10px 13px', borderRadius: 9, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)', fontSize: 12, color: '#f59e0b', lineHeight: 1.5 }}>
            ⚠️ Places real trades in a rapid loop. Martingale increases stake after losses — use small values and a strict stop loss.
          </div>

          {!running ? (
            <button onClick={start} className="btn-primary" style={{ padding: '14px 0', fontSize: 15 }}>▶ Start Speedbot</button>
          ) : (
            <button onClick={() => stop('Stopped by user')} style={{ padding: '14px 0', borderRadius: 12, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>⏹ Stop Speedbot</button>
          )}
        </div>

        {/* Live panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ ...card, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: running ? '#00e67a' : '#64748b', animation: running ? 'pulse 1.4s infinite' : 'none' }} />
            <span style={{ fontSize: 13, color: running ? '#e2e8f0' : '#94a3b8' }}>{status}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 12 }}>
            {[
              { label: 'Net P&L', val: `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`, color: pnl >= 0 ? '#00e67a' : '#f87171' },
              { label: 'Runs', val: String(runs), color: '#818cf8' },
              { label: 'Win Rate', val: `${winRate}%`, color: '#00e67a' },
              { label: 'Next Stake', val: `$${curStake.toFixed(2)}`, color: '#f59e0b' },
            ].map((s) => (
              <div key={s.label} style={{ ...card, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 5 }}>{s.label}</div>
                <div style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 800, fontSize: 20, color: s.color }}>{s.val}</div>
              </div>
            ))}
          </div>

          <div style={{ ...card, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 13, fontWeight: 700, fontFamily: 'Space Grotesk,sans-serif' }}>Trade Log</div>
            {log.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#475569', fontSize: 13 }}>No trades yet. Start the bot to see results here.</div>
            ) : (
              <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                {log.map((e) => (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: 13 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: e.result === 'win' ? '#00e67a' : '#f87171' }} />
                      <span style={{ color: '#94a3b8' }}>{e.time}</span>
                      <span style={{ color: '#475569', fontSize: 12 }}>· stake ${e.stake.toFixed(2)}</span>
                    </span>
                    <span style={{ fontWeight: 700, color: e.profit >= 0 ? '#00e67a' : '#f87171', fontFamily: 'monospace' }}>{e.profit >= 0 ? '+' : ''}${e.profit.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(0,230,122,0.4)}70%{box-shadow:0 0 0 6px rgba(0,230,122,0)}100%{box-shadow:0 0 0 0 rgba(0,230,122,0)}}@media(max-width:820px){.speedbot-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}
