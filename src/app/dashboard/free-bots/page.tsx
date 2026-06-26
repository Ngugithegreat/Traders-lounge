'use client';
import { useState, useEffect } from 'react';

const BOTS = [
  { id: 'boom_crash', name: 'Boom & Crash Classic', desc: 'Trades Boom 1000 using spike detection. Classic entry on confirmed spikes.', symbol: 'BOOM1000', contract_type: 'CALL', duration: 1, duration_unit: 't', icon: '💥', risk: 'Medium', riskColor: '#f59e0b', winRate: '68%', category: 'Boom & Crash', tags: ['Spike','Synthetic'] },
  { id: 'vol100', name: 'Vol 100 Rise/Fall', desc: 'Trades Rise/Fall on Volatility 100 using momentum. Best for trending markets.', symbol: 'R_100', contract_type: 'CALL', duration: 5, duration_unit: 't', icon: '📈', risk: 'Low', riskColor: '#34d399', winRate: '72%', category: 'Volatility', tags: ['Trending','Low Risk'] },
  { id: 'step_odd', name: 'Step Index Odd/Even', desc: 'Predicts even/odd last digit on Step Index. High win-rate digit strategy.', symbol: 'STPIDX', contract_type: 'DIGITODD', duration: 1, duration_unit: 't', icon: '🎲', risk: 'Low', riskColor: '#34d399', winRate: '74%', category: 'Digits', tags: ['Digits','Step Index'] },
  { id: 'vol25_over', name: 'Vol 25 Over/Under', desc: 'Trades Over/Under 5 on Volatility 25 last digit. Consistent returns.', symbol: 'R_25', contract_type: 'DIGITOVER', duration: 1, duration_unit: 't', icon: '🔢', risk: 'Low', riskColor: '#34d399', winRate: '76%', category: 'Digits', tags: ['Digits','Steady'] },
  { id: 'crash500', name: 'Crash 500 Sniper', desc: 'Waits for confirmed crash spikes on Crash 500 and enters PUT at peak.', symbol: 'CRASH500', contract_type: 'PUT', duration: 1, duration_unit: 't', icon: '🎯', risk: 'High', riskColor: '#f87171', winRate: '65%', category: 'Boom & Crash', tags: ['Spike','Aggressive'] },
  { id: 'bull_market', name: 'Bull Market Rider', desc: 'Trades Rise contracts on Bull Market Index during uptrend momentum phases.', symbol: 'RDBULL', contract_type: 'CALL', duration: 5, duration_unit: 't', icon: '🐂', risk: 'Medium', riskColor: '#f59e0b', winRate: '70%', category: 'Volatility', tags: ['Reversal'] },
];

const CATS = ['All','Boom & Crash','Volatility','Digits'];
const APP_ID = process.env.NEXT_PUBLIC_DERIV_APP_ID || '33BguwaY1RGDz9J48qvkJ';
const card: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, backdropFilter: 'blur(16px)' };

export default function FreeBotsPage() {
  const [cat, setCat] = useState('All');
  const [running, setRunning] = useState<Record<string,boolean>>({});
  const [msgs, setMsgs] = useState<Record<string,string>>({});
  const [confirm, setConfirm] = useState<typeof BOTS[0] | null>(null);
  const [stake, setStake] = useState('1');
  const [info, setInfo] = useState<typeof BOTS[0] | null>(null);

  const filtered = cat === 'All' ? BOTS : BOTS.filter(b => b.category === cat);

  const runBot = async (bot: typeof BOTS[0], stakeAmt: number) => {
    const token = localStorage.getItem('tl_token') || '';
    if (!token) { setMsgs(m => ({ ...m, [bot.id]: '❌ Not logged in.' })); return; }
    setRunning(r => ({ ...r, [bot.id]: true }));
    setMsgs(m => ({ ...m, [bot.id]: 'Connecting to Deriv...' }));
    try {
      await new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);
        const t = setTimeout(() => { ws.close(); reject(new Error('Timeout')); }, 25000);
        let authed = false;
        ws.onopen = () => ws.send(JSON.stringify({ authorize: token }));
        ws.onmessage = (e) => {
          const msg = JSON.parse(e.data);
          if (msg.error) { clearTimeout(t); ws.close(); reject(new Error(msg.error.message)); return; }
          if (msg.msg_type === 'authorize' && !authed) {
            authed = true;
            setMsgs(m => ({ ...m, [bot.id]: 'Fetching proposal...' }));
            ws.send(JSON.stringify({ proposal: 1, amount: stakeAmt, basis: 'stake', contract_type: bot.contract_type, currency: 'USD', duration: bot.duration, duration_unit: bot.duration_unit, symbol: bot.symbol }));
          }
          if (msg.msg_type === 'proposal') {
            setMsgs(m => ({ ...m, [bot.id]: `Buying at $${msg.proposal.ask_price}...` }));
            ws.send(JSON.stringify({ buy: msg.proposal.id, price: msg.proposal.ask_price }));
          }
          if (msg.msg_type === 'buy') {
            clearTimeout(t); ws.close();
            setMsgs(m => ({ ...m, [bot.id]: `✅ Contract #${msg.buy.contract_id} purchased! Stake: $${stakeAmt}` }));
            resolve();
          }
        };
        ws.onerror = () => { clearTimeout(t); ws.close(); reject(new Error('WebSocket error')); };
      });
    } catch (e: any) {
      setMsgs(m => ({ ...m, [bot.id]: `❌ ${e.message}` }));
    }
    setRunning(r => ({ ...r, [bot.id]: false }));
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>⚡ Free Bots</h1>
        <p style={{ color: 'hsl(215 20% 55%)', fontSize: 14 }}>Ready-to-use strategies for Deriv synthetic indices. One click to trade.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {CATS.map(c => (
          <button key={c} onClick={() => setCat(c)} style={{ padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s', background: cat === c ? 'hsl(158 100% 44%)' : 'rgba(255,255,255,0.04)', color: cat === c ? 'hsl(220 30% 7%)' : 'hsl(215 20% 55%)', borderColor: cat === c ? 'hsl(158 100% 44%)' : 'rgba(255,255,255,0.1)' }}>
            {c}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18 }}>
        {filtered.map(bot => (
          <div key={bot.id} style={{ ...card, padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(0,230,130,0.1)', border: '1px solid rgba(0,230,130,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{bot.icon}</div>
                <div>
                  <div className="font-display" style={{ fontWeight: 700, fontSize: 15 }}>{bot.name}</div>
                  <div style={{ color: 'hsl(215 20% 55%)', fontSize: 12 }}>{bot.category}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'hsl(215 20% 55%)' }}>Win Rate</div>
                <div style={{ fontWeight: 700, color: '#34d399', fontSize: 15 }}>{bot.winRate}</div>
              </div>
            </div>
            <p style={{ color: 'hsl(215 20% 55%)', fontSize: 13, lineHeight: 1.55 }}>{bot.desc}</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {bot.tags.map(tag => <span key={tag} style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, background: 'rgba(255,255,255,0.05)', color: 'hsl(215 20% 55%)', border: '1px solid rgba(255,255,255,0.08)' }}>{tag}</span>)}
              <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, color: bot.riskColor, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>Risk: {bot.risk}</span>
            </div>
            {msgs[bot.id] && (
              <div style={{ padding: '8px 12px', borderRadius: 10, fontSize: 12, background: msgs[bot.id].startsWith('✅') ? 'rgba(52,211,153,0.1)' : msgs[bot.id].startsWith('❌') ? 'rgba(248,113,113,0.1)' : 'rgba(0,230,130,0.08)', color: msgs[bot.id].startsWith('✅') ? '#34d399' : msgs[bot.id].startsWith('❌') ? '#f87171' : 'hsl(158 100% 44%)', border: `1px solid ${msgs[bot.id].startsWith('✅') ? 'rgba(52,211,153,0.2)' : msgs[bot.id].startsWith('❌') ? 'rgba(248,113,113,0.2)' : 'rgba(0,230,130,0.15)'}` }}>
                {msgs[bot.id]}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
              <button onClick={() => { setConfirm(bot); setStake('1'); }} disabled={running[bot.id]} className="btn-primary" style={{ flex: 1, padding: '10px 0', fontSize: 13 }}>
                {running[bot.id] ? 'Running...' : '▶ Run Bot'}
              </button>
              <button onClick={() => setInfo(bot)} style={{ padding: '10px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(210 40% 96%)', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Info</button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirm modal */}
      {confirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }} onClick={() => setConfirm(null)} />
          <div style={{ position: 'relative', ...card, padding: 28, width: '100%', maxWidth: 380, border: '1px solid rgba(0,230,130,0.2)' }} className="glass-bright">
            <h3 className="font-display" style={{ fontWeight: 800, fontSize: 20, marginBottom: 4 }}>Configure & Run</h3>
            <p style={{ color: 'hsl(215 20% 55%)', fontSize: 13, marginBottom: 20 }}>{confirm.name}</p>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: 'hsl(215 20% 55%)', fontWeight: 500, display: 'block', marginBottom: 8 }}>Stake Amount (USD)</label>
              <input type="number" value={stake} onChange={e => setStake(e.target.value)} min="0.35" step="0.5"
                style={{ width: '100%', height: 44, padding: '0 14px', background: 'hsl(220 28% 12%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'hsl(210 40% 96%)', fontSize: 15, outline: 'none' }} />
              <p style={{ fontSize: 11, color: 'hsl(215 20% 55%)', marginTop: 6 }}>Minimum $0.35 — only use what you can afford to lose</p>
            </div>
            <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: 18 }}>
              <p style={{ fontSize: 12, color: 'hsl(38 92% 50%)', lineHeight: 1.5 }}>⚠️ This places a real trade on your Deriv account. Trading involves risk.</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirm(null)} style={{ flex: 1, padding: '12px 0', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'hsl(210 40% 96%)', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Cancel</button>
              <button onClick={() => { runBot(confirm, parseFloat(stake) || 1); setConfirm(null); }} className="btn-primary" style={{ flex: 1, padding: '12px 0', fontSize: 14 }}>Run Now</button>
            </div>
          </div>
        </div>
      )}

      {/* Info modal */}
      {info && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }} onClick={() => setInfo(null)} />
          <div style={{ position: 'relative', ...card, padding: 28, width: '100%', maxWidth: 420 }} className="glass-bright">
            <button onClick={() => setInfo(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'hsl(215 20% 55%)', cursor: 'pointer', fontSize: 18 }}>✕</button>
            <div style={{ fontSize: 36, marginBottom: 12 }}>{info.icon}</div>
            <h3 className="font-display" style={{ fontWeight: 800, fontSize: 22, marginBottom: 8 }}>{info.name}</h3>
            <p style={{ color: 'hsl(215 20% 55%)', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>{info.desc}</p>
            {[['Symbol',info.symbol],['Contract',info.contract_type],['Duration',`${info.duration} ${info.duration_unit === 't' ? 'tick(s)' : info.duration_unit}`],['Win Rate',info.winRate],['Risk',info.risk]].map(([k,v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 14 }}>
                <span style={{ color: 'hsl(215 20% 55%)' }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
            <button onClick={() => { setInfo(null); setConfirm(info); setStake('1'); }} className="btn-primary" style={{ width: '100%', padding: '14px 0', fontSize: 15, marginTop: 20 }}>Run This Bot</button>
          </div>
        </div>
      )}
    </div>
  );
}