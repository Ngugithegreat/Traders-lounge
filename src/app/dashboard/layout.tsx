'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠', exact: true },
  { href: '/dashboard/bot-builder', label: 'Bot Builder', icon: '🤖' },
  { href: '/dashboard/free-bots', label: 'Free Bots', icon: '⚡' },
  { href: '/dashboard/analysis', label: 'Analysis Tool', icon: '🔍' },
  { href: '/dashboard/manual-trader', label: 'Manual Trader', icon: '✍️' },
  { href: '/dashboard/charts', label: 'Charts', icon: '📊' },
  { href: '/dashboard/copy-trading', label: 'Copy Trading', icon: '📋', soon: true },
  { href: '/dashboard/speedbot', label: 'Speedbot', icon: '🚀', soon: true },
  { href: '/dashboard/reports', label: 'Reports', icon: '📈' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [account, setAccount] = useState('');
  const [name, setName] = useState('');
  const [balance, setBalance] = useState<number | null>(null);
  const [currency, setCurrency] = useState('USD');
  const [isVirtual, setIsVirtual] = useState(false);
  const [showBal, setShowBal] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [allAccounts, setAllAccounts] = useState<any[]>([]);

  const fetchBal = useCallback(async (acct: string) => {
    try {
      const r = await fetch(`/api/deriv/balance?account=${acct}`);
      const d = await r.json();
      if (d.requiresRelink) { router.push('/'); return; }
      if (d.success) { setBalance(d.balance); setCurrency(d.currency); }
    } catch (_) {}
  }, [router]);

  useEffect(() => {
    const acct = localStorage.getItem('tl_account');
    if (!acct) { router.push('/'); return; }
    setAccount(acct);
    setName(localStorage.getItem('tl_name') || acct);
    setIsVirtual(localStorage.getItem('tl_virtual') === 'true');
    try {
      const stored = localStorage.getItem('tl_all_accounts');
      if (stored) setAllAccounts(JSON.parse(stored));
    } catch (_) {}
    fetchBal(acct);
    const iv = setInterval(() => fetchBal(acct), 30000);

    return () => clearInterval(iv);
  }, [router, fetchBal, pathname]);

  const switchAccount = (acct: any) => {
    localStorage.setItem('tl_account', acct.loginid);
    localStorage.setItem('tl_token', acct.token);
    localStorage.setItem('tl_virtual', String(acct.is_virtual));
    setAccount(acct.loginid);
    setIsVirtual(acct.is_virtual);
    setBalance(null);
    fetchBal(acct.loginid);
    setAccountsOpen(false);
  };

  const logout = () => {
    ['tl_account','tl_token','tl_name','tl_virtual','tl_all_accounts'].forEach(k => localStorage.removeItem(k));
    router.push('/');
  };

  const isActive = (href: string, exact?: boolean) => exact ? pathname === href : pathname.startsWith(href);

  return (
    <div style={{ minHeight: '100vh', background: '#0d0e1a', color: '#e2e8f0', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Top bar */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(10,11,20,0.98)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Row 1: Logo + balance + account */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 52, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setMobileOpen(v => !v)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4, display: 'flex' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #00e67a, #00b85c)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(0,230,122,0.3)' }}>
                <span style={{ color: '#0a0b14', fontWeight: 900, fontSize: 13, fontFamily: 'Space Grotesk, sans-serif' }}>TL</span>
              </div>
              <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 16, color: '#e2e8f0', letterSpacing: '-0.3px' }}>Traders Lounge</span>
            </Link>
            <Link href="/dashboard/reports" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 8, fontSize: 12, color: '#64748b', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              Reports
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div id="abepay-nav" />
            <script dangerouslySetInnerHTML={{ __html: `
              (function tryInit(n) {
                if (window.AbePay) {
                  window.AbePay.init({ ref: 'partner1', mountId: 'abepay-nav', powered: true });
                } else if (n < 20) {
                  setTimeout(function() { tryInit(n + 1); }, 300);
                }
              })(0);
            `}} />
            {isVirtual && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>DEMO</span>
            )}

            {/* Balance + account switcher */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setAccountsOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', color: '#e2e8f0' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg,#00e67a,#00b85c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 9, color: '#0a0b14', fontWeight: 800 }}>D</span>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1 }}>{account}</div>
                  <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 15, lineHeight: 1.3, color: '#00e67a' }}>
                    {balance === null ? '...' : showBal ? `${balance.toFixed(2)} ${currency}` : '•••••• USD'}
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); setShowBal(v => !v); }} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 14, padding: '0 2px' }}>
                  {showBal ? '👁' : '🙈'}
                </button>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" style={{ transform: accountsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
              </button>

              {accountsOpen && allAccounts.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: '#131525', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 8, minWidth: 220, zIndex: 100, boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}>
                  {allAccounts.map((a: any) => (
                    <button key={a.loginid} onClick={() => switchAccount(a)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 8, background: a.loginid === account ? 'rgba(0,230,122,0.08)' : 'none', border: 'none', cursor: 'pointer', color: '#e2e8f0', textAlign: 'left' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: a.is_virtual ? 'rgba(245,158,11,0.15)' : 'rgba(0,230,122,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: a.is_virtual ? '#f59e0b' : '#00e67a' }}>
                        {a.is_virtual ? 'D' : 'R'}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{a.loginid}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{a.is_virtual ? 'Demo' : 'Real'} · {a.currency}</div>
                      </div>
                      {a.loginid === account && <span style={{ marginLeft: 'auto', color: '#00e67a', fontSize: 14 }}>✓</span>}
                    </button>
                  ))}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 8, paddingTop: 8 }}>
                    <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontSize: 13 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Nav tabs */}
        <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', padding: '0 8px', height: 44, gap: 2 }}
          className="hide-scrollbar">
          {NAV.map(n => {
            const active = isActive(n.href, n.exact);
            return (
              <Link key={n.href} href={n.soon ? '#' : n.href}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: active ? 600 : 500, textDecoration: 'none', whiteSpace: 'nowrap', transition: 'all 0.15s', flexShrink: 0, position: 'relative',
                  color: n.soon ? 'rgba(100,116,139,0.4)' : active ? '#00e67a' : '#94a3b8',
                  background: active ? 'rgba(0,230,122,0.1)' : 'transparent',
                  borderBottom: active ? '2px solid #00e67a' : '2px solid transparent',
                  cursor: n.soon ? 'default' : 'pointer',
                }}>
                <span style={{ fontSize: 14 }}>{n.icon}</span>
                {n.label}
                {n.soon && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>SOON</span>}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }} onClick={() => setMobileOpen(false)} />
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 260, background: '#131525', borderRight: '1px solid rgba(255,255,255,0.06)', padding: 20, overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#00e67a,#00b85c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#0a0b14', fontWeight: 900, fontSize: 12 }}>TL</span>
              </div>
              <span style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 15 }}>Traders Lounge</span>
            </div>
            <div style={{ marginBottom: 20, padding: '12px 14px', borderRadius: 10, background: 'rgba(0,230,122,0.06)', border: '1px solid rgba(0,230,122,0.1)' }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>{account}</div>
              <div style={{ fontWeight: 700, color: '#00e67a', fontSize: 16, marginTop: 2 }}>{balance !== null ? `${balance.toFixed(2)} ${currency}` : '...'}</div>
            </div>
            {NAV.map(n => {
              const active = isActive(n.href, n.exact);
              return (
                <Link key={n.href} href={n.soon ? '#' : n.href} onClick={() => setMobileOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, fontSize: 14, fontWeight: 500, textDecoration: 'none', marginBottom: 4, color: n.soon ? 'rgba(100,116,139,0.4)' : active ? '#00e67a' : '#94a3b8', background: active ? 'rgba(0,230,122,0.08)' : 'transparent' }}>
                  <span>{n.icon}</span><span style={{ flex: 1 }}>{n.label}</span>
                  {n.soon && <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontWeight: 700 }}>SOON</span>}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <main style={{ flex: 1, maxWidth: 1600, margin: '0 auto', width: '100%', padding: '20px 16px' }}>
        {children}
      </main>

      <style>{`.hide-scrollbar::-webkit-scrollbar{display:none}.hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  );
}
