'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠', exact: true },
  { href: '/dashboard/bot-builder', label: 'Bot Builder', icon: '🤖' },
  { href: '/dashboard/free-bots', label: 'Free Bots', icon: '⚡' },
  { href: '/dashboard/charts', label: 'Charts', icon: '📊' },
  { href: '/dashboard/copy-trading', label: 'Copy Trading', icon: '📋', soon: true },
  { href: '/dashboard/ai-software', label: 'AI Software', icon: '🧠', soon: true },
  { href: '/dashboard/speedbot', label: 'Speedbot', icon: '🚀', soon: true },
  { href: '/dashboard/manual-trader', label: 'Manual Trader', icon: '✍️', soon: true },
  { href: '/dashboard/reports', label: 'Reports', icon: '📈', soon: true },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [account, setAccount] = useState('');
  const [name, setName] = useState('');
  const [balance, setBalance] = useState<number | null>(null);
  const [currency, setCurrency] = useState('USD');
  const [isVirtual, setIsVirtual] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showBal, setShowBal] = useState(true);

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
    fetchBal(acct);
    const iv = setInterval(() => fetchBal(acct), 30000);
    return () => clearInterval(iv);
  }, [router, fetchBal]);

  const logout = () => {
    ['tl_account','tl_token','tl_name','tl_virtual'].forEach(k => localStorage.removeItem(k));
    router.push('/');
  };

  const isActive = (href: string, exact?: boolean) => exact ? pathname === href : pathname.startsWith(href);

  const navLinkStyle = (href: string, exact?: boolean, soon?: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 12px', borderRadius: 10,
    fontSize: 13, fontWeight: 500, textDecoration: 'none',
    whiteSpace: 'nowrap' as const,
    color: soon ? 'rgba(140,150,170,0.4)' : isActive(href, exact) ? 'hsl(158 100% 44%)' : 'hsl(215 20% 55%)',
    background: isActive(href, exact) && !soon ? 'rgba(0,230,130,0.1)' : 'transparent',
    cursor: soon ? 'default' : 'pointer',
    transition: 'all 0.15s',
  });

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(220 30% 7%)', color: 'hsl(210 40% 96%)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(12,14,22,0.96)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ maxWidth: 1600, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>

          {/* Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <button onClick={() => setMobileOpen(v => !v)} style={{ display: 'flex', width: 32, height: 32, alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: 'hsl(215 20% 55%)', cursor: 'pointer' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'hsl(158 100% 44%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'hsl(220 30% 7%)', fontWeight: 800, fontSize: 12, fontFamily: 'Space Grotesk,sans-serif' }}>TL</span>
              </div>
              <span style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 15, color: 'hsl(210 40% 96%)' }}>Traders Lounge</span>
            </Link>
          </div>

          {/* Center nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 2, overflowX: 'auto', flex: 1, justifyContent: 'center' }}>
            {NAV.map(n => (
              <Link key={n.href} href={n.soon ? '#' : n.href} style={navLinkStyle(n.href, n.exact, n.soon)}>
                <span>{n.icon}</span>
                <span>{n.label}</span>
                {n.soon && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 999, background: 'rgba(245,158,11,0.15)', color: 'hsl(38 92% 50%)', marginLeft: 2 }}>SOON</span>}
              </Link>
            ))}
          </nav>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {isVirtual && <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999, background: 'rgba(245,158,11,0.12)', color: 'hsl(38 92% 50%)', border: '1px solid rgba(245,158,11,0.2)' }}>DEMO</span>}
            <button onClick={() => setShowBal(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', color: 'hsl(210 40% 96%)' }}>
              <span style={{ fontSize: 11, color: 'hsl(215 20% 55%)' }}>{currency}</span>
              <span style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 15 }}>
                {balance === null ? '...' : showBal ? balance.toFixed(2) : '••••••'}
              </span>
            </button>
            <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 10, background: 'none', border: 'none', color: 'hsl(215 20% 55%)', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={() => setMobileOpen(false)} />
          <div style={{ position: 'absolute', left: 0, top: 56, bottom: 0, width: 260, background: 'hsl(220 28% 10%)', borderRight: '1px solid rgba(255,255,255,0.07)', padding: 16, overflowY: 'auto' }}>
            <div style={{ padding: '12px 0 16px', marginBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <p style={{ fontWeight: 600, fontSize: 14 }}>{name}</p>
              <p style={{ color: 'hsl(215 20% 55%)', fontSize: 12, fontFamily: 'monospace' }}>{account}</p>
            </div>
            {NAV.map(n => (
              <Link key={n.href} href={n.soon ? '#' : n.href} onClick={() => setMobileOpen(false)}
                style={{ ...navLinkStyle(n.href, n.exact, n.soon), display: 'flex', padding: '10px 12px', marginBottom: 4, fontSize: 14 }}>
                <span style={{ fontSize: 16 }}>{n.icon}</span>
                <span style={{ flex: 1 }}>{n.label}</span>
                {n.soon && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 999, background: 'rgba(245,158,11,0.15)', color: 'hsl(38 92% 50%)' }}>SOON</span>}
              </Link>
            ))}
            <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 12px', borderRadius: 10, background: 'none', border: 'none', color: 'hsl(0 84% 60%)', cursor: 'pointer', fontSize: 14, fontWeight: 500, marginTop: 16 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Logout
            </button>
          </div>
        </div>
      )}

      <main style={{ flex: 1, maxWidth: 1600, margin: '0 auto', width: '100%', padding: '24px 16px' }}>
        {children}
      </main>
    </div>
  );
}