'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

const QUOTES = [
  '"Risk comes from not knowing what you\'re doing." — Warren Buffett',
  '"The trend is your friend until the end where it bends." — Ed Seykota',
  '"In trading, the impossible happens about twice a year." — Henri M. Simoes',
  '"Markets are never wrong — opinions often are." — Jesse Livermore',
  '"Cut your losses short and let your profits run." — David Ricardo',
];

const ACTIONS = [
  { href: '/dashboard/free-bots', icon: '⚡', title: 'Free Bots', desc: 'Browse ready-made trading strategies', grad: 'rgba(0,230,130,0.08)', border: 'rgba(0,230,130,0.2)' },
  { href: '/dashboard/bot-builder', icon: '🤖', title: 'Bot Builder', desc: 'Build a custom bot with visual editor', grad: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)' },
  { href: '/dashboard/charts', icon: '📊', title: 'Live Charts', desc: 'Professional TradingView charts', grad: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.2)' },
  { href: '#', icon: '📋', title: 'Copy Trading', desc: 'Follow top traders automatically', grad: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)', soon: true },
];

const card: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, backdropFilter: 'blur(16px)' };

export default function DashboardHome() {
  const [name, setName] = useState('');
  const [account, setAccount] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [quote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (acct: string) => {
    try {
      const [txR, pR] = await Promise.all([
        fetch(`/api/deriv/statement?account=${acct}&limit=10`),
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
    setAccount(acct);
    setName((localStorage.getItem('tl_name') || acct).split(' ')[0]);
    if (acct) load(acct);
  }, [load]);

  const totalPnl = contracts.reduce((s, c) => s + parseFloat(c.profit_loss || '0'), 0);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Greeting */}
      <div style={{ ...card, padding: 24, background: 'linear-gradient(135deg,rgba(0,230,130,0.06),rgba(0,0,0,0))', border: '1px solid rgba(0,230,130,0.12)' }}>
        <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Hello {name} 👋</h1>
        <p style={{ color: 'hsl(215 20% 55%)', fontStyle: 'italic', fontSize: 14, maxWidth: 560 }}>{quote}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 14, marginTop: 20 }}>
          {[
            { label: 'Open Positions', value: contracts.length, color: '#818cf8' },
            { label: 'Unrealised P&L', value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`, color: totalPnl >= 0 ? '#34d399' : '#f87171' },
            { label: 'Recent Trades', value: transactions.length, color: '#a78bfa' },
            { label: 'Status', value: 'Live', color: '#34d399' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 12, color: 'hsl(215 20% 55%)', marginBottom: 4 }}>{s.label}</div>
              <div className="font-display" style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{loading ? '...' : s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'hsl(215 20% 55%)', marginBottom: 14 }}>Quick Actions</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
          {ACTIONS.map((a, i) => (
            <Link key={i} href={a.href} style={{ ...card, padding: 22, background: a.grad, border: `1px solid ${a.border}`, textDecoration: 'none', color: 'inherit', display: 'block', position: 'relative', transition: 'transform 0.18s' }}
              onMouseEnter={e => { if (!a.soon) (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}>
              {a.soon && <span style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(245,158,11,0.15)', color: 'hsl(38 92% 50%)', border: '1px solid rgba(245,158,11,0.2)' }}>SOON</span>}
              <div style={{ fontSize: 30, marginBottom: 12 }}>{a.icon}</div>
              <div className="font-display" style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{a.title}</div>
              <div style={{ fontSize: 13, color: 'hsl(215 20% 55%)', lineHeight: 1.5 }}>{a.desc}</div>
              {!a.soon && <div style={{ color: 'hsl(158 100% 44%)', fontSize: 13, fontWeight: 600, marginTop: 12 }}>Open →</div>}
            </Link>
          ))}
        </div>
      </div>

      {/* Open positions */}
      {contracts.length > 0 && (
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} className="pulse-green" />
            Open Positions ({contracts.length})
          </p>
          <div style={{ ...card, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {['Contract ID','Symbol','Type','Stake','P&L'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, color: 'hsl(215 20% 55%)', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((c, i) => {
                    const pnl = parseFloat(c.profit_loss || '0');
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 11, color: 'hsl(215 20% 55%)' }}>{c.contract_id}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{c.underlying}</td>
                        <td style={{ padding: '12px 16px' }}><span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, background: 'rgba(0,230,130,0.1)', color: 'hsl(158 100% 44%)' }}>{c.contract_type}</span></td>
                        <td style={{ padding: '12px 16px' }}>{parseFloat(c.buy_price || '0').toFixed(2)}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: pnl >= 0 ? '#34d399' : '#f87171' }}>{pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div>
        <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Recent Transactions</p>
        {loading ? (
          <div style={{ ...card, padding: 40, textAlign: 'center', color: 'hsl(215 20% 55%)', fontSize: 14 }}>Loading...</div>
        ) : transactions.length === 0 ? (
          <div style={{ ...card, padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <p style={{ color: 'hsl(215 20% 55%)', fontSize: 14, marginBottom: 20 }}>No transactions yet. Run your first bot to get started.</p>
            <Link href="/dashboard/free-bots" className="btn-primary" style={{ padding: '12px 28px', fontSize: 14 }}>Browse Free Bots</Link>
          </div>
        ) : (
          <div style={{ ...card, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {['Time','Description','Action','Amount','Balance After'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, color: 'hsl(215 20% 55%)', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx: any, i: number) => {
                    const amt = parseFloat(tx.amount || '0');
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '11px 16px', fontSize: 11, color: 'hsl(215 20% 55%)', whiteSpace: 'nowrap' }}>{new Date((tx.transaction_time || 0) * 1000).toLocaleString()}</td>
                        <td style={{ padding: '11px 16px', fontSize: 11, color: 'hsl(215 20% 55%)', maxWidth: 200 }}><span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.longcode || tx.shortcode || '—'}</span></td>
                        <td style={{ padding: '11px 16px' }}><span style={{ padding: '3px 8px', borderRadius: 999, fontSize: 10, background: 'rgba(255,255,255,0.05)', color: 'hsl(215 20% 55%)' }}>{tx.action_type || '—'}</span></td>
                        <td style={{ padding: '11px 16px', fontWeight: 700, color: amt >= 0 ? '#34d399' : '#f87171' }}>{amt >= 0 ? '+' : ''}{amt.toFixed(2)}</td>
                        <td style={{ padding: '11px 16px' }}>{parseFloat(tx.balance_after || '0').toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}