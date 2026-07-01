'use client';
import { useEffect, useState, useCallback } from 'react';

const card: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 };
const input: React.CSSProperties = { width: '100%', padding: '11px 14px', background: '#131525', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, color: '#e2e8f0', fontSize: 14, outline: 'none' };
const label: React.CSSProperties = { fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7, display: 'block' };

type ActiveCopy = { token: string; label: string; maxStake: string; minStake: string; addedAt: number };
type Msg = { text: string; kind: 'ok' | 'err' | 'info' } | null;

export default function CopyTradingPage() {
  const [account, setAccount] = useState('');

  // Trader lookup
  const [lookupId, setLookupId] = useState('');
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [lookupMsg, setLookupMsg] = useState<Msg>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  // Start copy
  const [traderToken, setTraderToken] = useState('');
  const [maxStake, setMaxStake] = useState('50');
  const [minStake, setMinStake] = useState('1');
  const [copyMsg, setCopyMsg] = useState<Msg>(null);
  const [copyLoading, setCopyLoading] = useState(false);

  const [copies, setCopies] = useState<ActiveCopy[]>([]);

  useEffect(() => {
    setAccount(localStorage.getItem('tl_account') || '');
    try {
      const stored = localStorage.getItem('tl_copies');
      if (stored) setCopies(JSON.parse(stored));
    } catch (_) {}
  }, []);

  const persist = useCallback((next: ActiveCopy[]) => {
    setCopies(next);
    localStorage.setItem('tl_copies', JSON.stringify(next));
  }, []);

  const lookup = async () => {
    if (!lookupId.trim()) return;
    setLookupLoading(true); setLookupMsg(null); setStats(null);
    try {
      const r = await fetch(`/api/deriv/copy?account=${account}&trader_id=${encodeURIComponent(lookupId.trim().toUpperCase())}`);
      const d = await r.json();
      if (d.requiresRelink) { setLookupMsg({ text: 'Session expired — please log in again.', kind: 'err' }); return; }
      if (!d.success) { setLookupMsg({ text: d.error || 'Trader not found or not copyable.', kind: 'err' }); return; }
      setStats(d.statistics || {});
    } catch (e: unknown) {
      setLookupMsg({ text: e instanceof Error ? e.message : 'Lookup failed', kind: 'err' });
    } finally { setLookupLoading(false); }
  };

  const startCopy = async () => {
    if (!traderToken.trim()) { setCopyMsg({ text: 'Enter the trader\u2019s read-only API token.', kind: 'err' }); return; }
    setCopyLoading(true); setCopyMsg(null);
    try {
      const r = await fetch('/api/deriv/copy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account, action: 'start', trader_token: traderToken.trim(), max_trade_stake: maxStake, min_trade_stake: minStake }),
      });
      const d = await r.json();
      if (!d.success) { setCopyMsg({ text: d.error || 'Could not start copying.', kind: 'err' }); return; }
      const next = [
        { token: traderToken.trim(), label: lookupId.trim().toUpperCase() || `Trader ${copies.length + 1}`, maxStake, minStake, addedAt: Date.now() },
        ...copies.filter((c) => c.token !== traderToken.trim()),
      ];
      persist(next);
      setCopyMsg({ text: '✅ You are now copying this trader. Their new trades will mirror to your account.', kind: 'ok' });
      setTraderToken('');
    } catch (e: unknown) {
      setCopyMsg({ text: e instanceof Error ? e.message : 'Failed to start copying', kind: 'err' });
    } finally { setCopyLoading(false); }
  };

  const stopCopy = async (copy: ActiveCopy) => {
    try {
      const r = await fetch('/api/deriv/copy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account, action: 'stop', trader_token: copy.token }),
      });
      const d = await r.json();
      // Remove locally regardless — if the API says it wasn't active, it's already stopped.
      persist(copies.filter((c) => c.token !== copy.token));
      if (!d.success) setCopyMsg({ text: d.error || 'Stopped locally.', kind: 'info' });
      else setCopyMsg({ text: '⏹ Stopped copying this trader.', kind: 'info' });
    } catch (_) {
      persist(copies.filter((c) => c.token !== copy.token));
    }
  };

  const msgStyle = (m: Msg): React.CSSProperties => ({
    padding: '10px 13px', borderRadius: 9, fontSize: 12.5, lineHeight: 1.5, marginTop: 12,
    background: m?.kind === 'ok' ? 'rgba(0,230,122,0.08)' : m?.kind === 'err' ? 'rgba(248,113,113,0.08)' : 'rgba(255,255,255,0.04)',
    color: m?.kind === 'ok' ? '#00e67a' : m?.kind === 'err' ? '#f87171' : '#94a3b8',
    border: `1px solid ${m?.kind === 'ok' ? 'rgba(0,230,122,0.18)' : m?.kind === 'err' ? 'rgba(248,113,113,0.18)' : 'rgba(255,255,255,0.06)'}`,
  });

  const statRows: [string, string][] = stats ? [
    ['Active Traders', String((stats.active_since as number) ? new Date((stats.active_since as number) * 1000).toLocaleDateString() : '—')],
    ['Total Trades', String(stats.total_trades ?? '—')],
    ['Trades Profitable', stats.trades_profitable != null ? `${((stats.trades_profitable as number) * 100).toFixed(1)}%` : '—'],
    ['Avg Profit', stats.avg_profit != null ? `${((stats.avg_profit as number) * 100).toFixed(2)}%` : '—'],
    ['Avg Loss', stats.avg_loss != null ? `${((stats.avg_loss as number) * 100).toFixed(2)}%` : '—'],
    ['Copiers', String(stats.copiers ?? '—')],
    ['Performance Prob.', stats.performance_probability != null ? `${((stats.performance_probability as number) * 100).toFixed(1)}%` : '—'],
  ] : [];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 1100, margin: '0 auto', width: '100%' }}>
      <div>
        <h1 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 24, fontWeight: 800, marginBottom: 4 }}>📋 Copy Trading</h1>
        <p style={{ color: '#64748b', fontSize: 13 }}>Automatically mirror the trades of top Deriv traders in real time. Set your own stake limits and stay in control.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16 }}>
        {/* Lookup */}
        <div style={{ ...card, padding: 22 }}>
          <h2 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>🔎 Trader Lookup</h2>
          <p style={{ color: '#64748b', fontSize: 12.5, marginBottom: 16 }}>Check a trader&apos;s performance before you copy. Enter their Deriv account ID (e.g. CR1234567).</p>
          <label style={label}>Trader Account ID</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input style={input} value={lookupId} onChange={(e) => setLookupId(e.target.value)} placeholder="CR1234567" />
            <button onClick={lookup} disabled={lookupLoading} className="btn-primary" style={{ padding: '0 18px', fontSize: 13, whiteSpace: 'nowrap' }}>
              {lookupLoading ? '...' : 'Check'}
            </button>
          </div>
          {lookupMsg && <div style={msgStyle(lookupMsg)}>{lookupMsg.text}</div>}
          {stats && (
            <div style={{ marginTop: 16 }}>
              {statRows.map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13 }}>
                  <span style={{ color: '#64748b' }}>{k}</span>
                  <span style={{ fontWeight: 600, fontFamily: 'Space Grotesk,sans-serif' }}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Start copying */}
        <div style={{ ...card, padding: 22 }}>
          <h2 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>➕ Copy a Trader</h2>
          <p style={{ color: '#64748b', fontSize: 12.5, marginBottom: 16 }}>Paste the trader&apos;s <strong style={{ color: '#94a3b8' }}>read-only API token</strong> (they generate it in their Deriv settings and share it). Set your risk limits.</p>
          <label style={label}>Trader Read Token</label>
          <input style={input} value={traderToken} onChange={(e) => setTraderToken(e.target.value)} placeholder="a1b2c3d4e5f6..." />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
            <div>
              <label style={label}>Min Stake ($)</label>
              <input style={input} type="number" min="0.35" step="0.5" value={minStake} onChange={(e) => setMinStake(e.target.value)} />
            </div>
            <div>
              <label style={label}>Max Stake ($)</label>
              <input style={input} type="number" min="1" step="1" value={maxStake} onChange={(e) => setMaxStake(e.target.value)} />
            </div>
          </div>
          <button onClick={startCopy} disabled={copyLoading} className="btn-primary" style={{ width: '100%', padding: '13px 0', fontSize: 14, marginTop: 16 }}>
            {copyLoading ? 'Starting...' : 'Start Copying'}
          </button>
          {copyMsg && <div style={msgStyle(copyMsg)}>{copyMsg.text}</div>}
        </div>
      </div>

      {/* Active copies */}
      <div>
        <h2 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Active Copies ({copies.length})</h2>
        {copies.length === 0 ? (
          <div style={{ ...card, padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 34, marginBottom: 10 }}>🫂</div>
            <p style={{ color: '#64748b', fontSize: 14 }}>You&apos;re not copying anyone yet. Look up a trader and start copying above.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
            {copies.map((c) => (
              <div key={c.token} style={{ ...card, padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(0,230,122,0.12)', border: '1px solid rgba(0,230,122,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👤</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, fontFamily: 'Space Grotesk,sans-serif' }}>{c.label}</div>
                      <div style={{ fontSize: 11, color: '#475569' }}>Since {new Date(c.addedAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00e67a', animation: 'pulse 1.6s infinite' }} />
                </div>
                <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                  <span style={{ padding: '3px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', color: '#64748b' }}>Min ${c.minStake}</span>
                  <span style={{ padding: '3px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', color: '#64748b' }}>Max ${c.maxStake}</span>
                </div>
                <button onClick={() => stopCopy(c)} style={{ padding: '9px 0', borderRadius: 9, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>⏹ Stop Copying</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Become a trader */}
      <div style={{ ...card, padding: 22, background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(13,14,26,0))', border: '1px solid rgba(99,102,241,0.15)' }}>
        <h2 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>💡 Want people to copy you?</h2>
        <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6, marginBottom: 8 }}>
          To let others copy your trades, enable <strong>&quot;Allow copiers&quot;</strong> in your Deriv account settings, then create a
          read-only API token and share it. Copiers who add your token will automatically mirror every trade you place.
        </p>
        <a href="https://app.deriv.com/account/api-token" target="_blank" rel="noreferrer" style={{ color: '#818cf8', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Open Deriv API token settings →</a>
      </div>

      <style>{`@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(0,230,122,0.4)}70%{box-shadow:0 0 0 6px rgba(0,230,122,0)}100%{box-shadow:0 0 0 0 rgba(0,230,122,0)}}`}</style>
    </div>
  );
}
