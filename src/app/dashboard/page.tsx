'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

const QUOTES = [
  '"Risk comes from not knowing what you\'re doing." — Warren Buffett',
  '"The trend is your friend until the end where it bends." — Ed Seykota',
  '"Cut losses short, let profits run." — David Ricardo',
  '"Markets are never wrong — opinions often are." — Jesse Livermore',
  '"The goal of a successful trader is to make the best trades." — Alexander Elder',
];

const QUICK_ACTIONS = [
  { href: '/dashboard/bot-builder', icon: '🤖', title: 'Bot Builder', desc: 'Build a custom bot with the visual editor', color: '#6366f1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)' },
  { href: '/dashboard/free-bots', icon: '⚡', title: 'Free Bots', desc: 'Browse ready-made trading strategies', color: '#00e67a', bg: 'rgba(0,230,122,0.08)', border: 'rgba(0,230,122,0.2)' },
  { href: '/dashboard/analysis', icon: '🔍', title: 'Analysis Tool', desc: 'Live digit stats and market analysis', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
  { href: '/dashboard/manual-trader', icon: '✍️', title: 'Manual Trader', desc: 'Place trades manually with live charts', color: '#06b6d4', bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.2)' },
];

const card: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, backdropFilter: 'blur(16px)' };

export default function DashboardHome() {
  const [name, setName] = useState('');
  const [account, setAccount] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [quote, setQuote] = useState('');
  const [loading, setLoading] = useState(true);
  const [isVirtual, setIsVirtual] = useState(false);

  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  const load = useCallback(async (acct: string) => {
    try {
      const [txR, pR] = await Promise.all([
        fetch(`/api/deriv/statement?account=${acct}&limit=20`),
        fetch(`/api/deriv/portfolio?account=${acct}`),
      ]);
      const tx = await txR.json();
      const p = await pR.json();
      if (tx.success) setTransactions(tx.transactions || []);
      if (p.success) setContracts(p.contracts || []);
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => {
    const acct = localStorage.getItem('tl_account') || '';
    const nm = localStorage.getItem('tl_name') || '';
    setAccount(acct); setIsVirtual(localStorage.getItem('tl_virtual') === 'true');
    setName(nm.split(' ')[0] || acct);
    if (acct) load(acct);
  }, [load]);

  const totalPnl = contracts.reduce((s, c) => s + parseFloat(c.profit_loss || '0'), 0);
  const wins = transactions.filter(t => parseFloat(t.amount || '0') > 0).length;
  const losses = transactions.filter(t => parseFloat(t.amount || '0') < 0).length;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div style={{ ...card, padding: '28px 28px 24px', background: 'linear-gradient(135deg, rgba(0,230,122,0.06) 0%, rgba(13,14,26,0) 60%)', border: '1px solid rgba(0,230,122,0.1)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,230,122,0.08), transparent 70%)' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 28, fontWeight: 800, marginBottom: 6, background: 'linear-gradient(135deg,#e2e8f0,#94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Hello {name} 👋
            </h1>
            <p style={{ color: '#64748b', fontStyle: 'italic', fontSize: 13, maxWidth: 500 }}>{quote}</p>
          </div>
          {isVirtual && <div style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b', fontSize: 12, fontWeight: 700 }}>DEMO ACCOUNT</div>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px,1fr))', gap: 12, marginTop: 20 }}>
          {[
            { label: 'Open Positions', val: loading ? '...' : String(contracts.length), color: '#818cf8', icon: '📂' },
            { label: 'Unrealised P&L', val: loading ? '...' : `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`, color: totalPnl >= 0 ? '#00e67a' : '#f87171', icon: '💰' },
            { label: 'Win Trades', val: loading ? '...' : String(wins), color: '#00e67a', icon: '✅' },
            { label: 'Loss Trades', val: loading ? '...' : String(losses), color: '#f87171', icon: '❌' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 13 }}>{s.icon}</span>
                <span style={{ fontSize: 11, color: '#64748b' }}>{s.label}</span>
              </div>
              <div style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 800, fontSize: 20, color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#475569', marginBottom: 12 }}>Quick Actions</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
          {QUICK_ACTIONS.map((a, i) => (
            <Link key={i} href={a.href} style={{ ...card, padding: 22, textDecoration: 'none', color: 'inherit', background: a.bg, border: `1px solid ${a.border}`, display: 'block', transition: 'transform 0.18s, box-shadow 0.18s' }}
              onMouseEnter={e => { (e.currentTarget as any).style.transform = 'translateY(-2px)'; (e.currentTarget as any).style.boxShadow = `0 8px 32px rgba(0,0,0,0.3)`; }}
              onMouseLeave={e => { (e.currentTarget as any).style.transform = 'none'; (e.currentTarget as any).style.boxShadow = 'none'; }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: `${a.color}18`, border: `1px solid ${a.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 14 }}>{a.icon}</div>
              <div style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 5 }}>{a.title}</div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, marginBottom: 12 }}>{a.desc}</div>
              <div style={{ color: a.color, fontSize: 12, fontWeight: 600 }}>Open →</div>
            </Link>
          ))}
        </div>
      </div>

      {contracts.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00e67a', display: 'inline-block', animation: 'pulse 2s infinite', boxShadow: '0 0 0 0 rgba(0,230,122,0.4)' }} />
            <span style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 15 }}>Open Positions ({contracts.length})</span>
          </div>
          <div style={{ ...card, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Contract ID','Symbol','Type','Stake','Current P&L'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '11px 16px', fontSize: 11, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contracts.map((c, i) => {
                  const pnl = parseFloat(c.profit_loss || '0');
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 11, color: '#64748b' }}>{c.contract_id}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{c.underlying}</td>
                      <td style={{ padding: '12px 16px' }}><span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, background: 'rgba(0,230,122,0.1)', color: '#00e67a', fontWeight: 600 }}>{c.contract_type}</span></td>
                      <td style={{ padding: '12px 16px' }}>${parseFloat(c.buy_price || '0').toFixed(2)}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: pnl >= 0 ? '#00e67a' : '#f87171' }}>{pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 15 }}>Recent Transactions</span>
          <Link href="/dashboard/reports" style={{ fontSize: 12, color: '#00e67a', textDecoration: 'none', fontWeight: 600 }}>View All →</Link>
        </div>
        {loading ? (
          <div style={{ ...card, padding: 40, textAlign: 'center', color: '#475569', fontSize: 14 }}>Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div style={{ ...card, padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>No transactions yet. Start trading to see your history here.</p>
            <Link href="/dashboard/free-bots" style={{ padding: '12px 28px', background: '#00e67a', color: '#0a0b14', borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>Browse Free Bots</Link>
          </div>
        ) : (
          <div style={{ ...card, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Time','Description','Action','Amount','Balance After'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '11px 16px', fontSize: 11, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 15).map((tx: any, i: number) => {
                  const amt = parseFloat(tx.amount || '0');
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                      <td style={{ padding: '11px 16px', fontSize: 11, color: '#475569', whiteSpace: 'nowrap' }}>{new Date((tx.transaction_time || 0) * 1000).toLocaleString()}</td>
                      <td style={{ padding: '11px 16px', fontSize: 11, color: '#64748b', maxWidth: 200 }}><span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.longcode || tx.shortcode || '—'}</span></td>
                      <td style={{ padding: '11px 16px' }}><span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10, background: 'rgba(255,255,255,0.04)', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>{tx.action_type}</span></td>
                      <td style={{ padding: '11px 16px', fontWeight: 700, color: amt >= 0 ? '#00e67a' : '#f87171' }}>{amt >= 0 ? '+' : ''}${Math.abs(amt).toFixed(2)}</td>
                      <td style={{ padding: '11px 16px', color: '#94a3b8' }}>${parseFloat(tx.balance_after || '0').toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style>{`@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(0,230,122,0.4)}70%{box-shadow:0 0 0 6px rgba(0,230,122,0)}100%{box-shadow:0 0 0 0 rgba(0,230,122,0)}}`}</style>
    </div>
  );
}
