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

  // New funding states
  const [modal, setModal] = useState<'deposit'|'withdraw'|null>(null);
  const [depositRate, setDepositRate] = useState(131);
  const [withdrawRate, setWithdrawRate] = useState(124);
  const [minDepositKes, setMinDepositKes] = useState(650);
  const [crAccount2, setCrAccount2] = useState('');
  const [phone2, setPhone2] = useState('');
  const [amount2, setAmount2] = useState('');
  const [depositLoading2, setDepositLoading2] = useState(false);
  const [depositMsg2, setDepositMsg2] = useState<{text:string;ok:boolean}|null>(null);

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
    const token = localStorage.getItem('tl_token');
    const expiresAt = localStorage.getItem('tl_token_expires');

    if (!acct || !token) { router.push('/'); return; }

    if (expiresAt && Date.now() > parseInt(expiresAt)) {
      ['tl_account','tl_token','tl_name','tl_virtual','tl_all_accounts','tl_token_expires'].forEach(k => localStorage.removeItem(k));
      router.push('/');
      return;
    }

    setAccount(acct);
    setName(localStorage.getItem('tl_name') || acct);
    setIsVirtual(localStorage.getItem('tl_virtual') === 'true');
    try {
      const stored = localStorage.getItem('tl_all_accounts');
      if (stored) setAllAccounts(JSON.parse(stored));
    } catch (_) {}
    fetchBal(acct);
    const iv = setInterval(() => fetchBal(acct), 30000);

    // Fetch live rates
    fetch('https://app.abepayy.com/api/widget/rates')
      .then(r => r.json())
      .then(d => {
        if (d.depositRate) setDepositRate(d.depositRate);
        if (d.withdrawRate) setWithdrawRate(d.withdrawRate);
        if (d.minDeposit && d.depositRate) setMinDepositKes(Math.ceil(d.minDeposit * d.depositRate));
      })
      .catch(() => {});

    return () => clearInterval(iv);
  }, [router, fetchBal]);

  const handleDeposit2 = async () => {
    if (!crAccount2.trim() || !phone2.trim() || !amount2.trim()) {
      setDepositMsg2({ text: 'Please fill in all fields.', ok: false }); return;
    }
    const kes = parseFloat(amount2);
    if (isNaN(kes) || kes < minDepositKes) {
      setDepositMsg2({ text: `Minimum deposit is KES ${minDepositKes.toLocaleString()}.`, ok: false }); return;
    }
    setDepositLoading2(true); setDepositMsg2(null);
    try {
      const rawPhone = phone2.trim().replace(/\D/g, '');
      const formatted = rawPhone.startsWith('0') ? '254' + rawPhone.slice(1) : rawPhone.startsWith('254') ? rawPhone : '254' + rawPhone;
      const res = await fetch(`https://app.abepayy.com/api/mpesa/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crAccount: crAccount2.trim().toUpperCase(), phone: formatted, amount: kes }),
      });
      if (!res.ok && res.status !== 400 && res.status !== 429) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      const data = await res.json();
      if (data.success) {
        setDepositMsg2({ text: '✅ M-Pesa prompt sent! Check your phone and enter your PIN to complete.', ok: true });
        setAmount2('');
      } else {
        setDepositMsg2({ text: data.error || 'Failed. Please try again.', ok: false });
      }
    } catch (err: any) {
      setDepositMsg2({ text: err?.message || 'Network error. Please check your connection and try again.', ok: false });
    }
    setDepositLoading2(false);
  };

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
    ['tl_account','tl_token','tl_name','tl_virtual','tl_all_accounts','tl_token_expires'].forEach(k => localStorage.removeItem(k));
    router.push('/');
  };

  const isActive = (href: string, exact?: boolean) => exact ? pathname === href : pathname.startsWith(href);

  return (
    <div style={{ minHeight: '100vh', background: '#0d0e1a', color: '#e2e8f0', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(10,11,20,0.98)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 52, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setMobileOpen(v => !v)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4, display: 'flex' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #00e67a, #00b85c)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(0,230,122,0.3)' }}>
                <span style={{ color: '#0a0b14', fontWeight: 900, fontSize: 13, fontFamily: 'Space Grotesk,sans-serif' }}>TL</span>
              </div>
              <span style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 16, color: '#e2e8f0', letterSpacing: '-0.3px' }}>Traders Lounge</span>
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <button onClick={() => { setModal('deposit'); setCrAccount2(''); setPhone2(''); setAmount2(''); setDepositMsg2(null); }}
              style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:10,background:'linear-gradient(135deg,#00e67a,#00b85c)',border:'none',color:'#0a0b14',fontWeight:700,fontSize:13,cursor:'pointer',boxShadow:'0 0 14px rgba(0,230,122,0.2)',transition:'transform 0.15s' }}
              onMouseEnter={e=>(e.currentTarget.style.transform='scale(1.04)')}
              onMouseLeave={e=>(e.currentTarget.style.transform='scale(1)')}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="21" x2="12" y2="3"/></svg>
              Deposit
            </button>
            <button onClick={() => setModal('withdraw')}
              style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:10,background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.22)',color:'#818cf8',fontWeight:700,fontSize:13,cursor:'pointer',transition:'transform 0.15s' }}
              onMouseEnter={e=>(e.currentTarget.style.transform='scale(1.04)')}
              onMouseLeave={e=>(e.currentTarget.style.transform='scale(1)')}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="16 7 12 3 8 7"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
              Withdraw
            </button>

            {isVirtual && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>DEMO</span>
            )}

            <div style={{ position: 'relative' }}>
              <button onClick={() => setAccountsOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', color: '#e2e8f0' }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1 }}>{account}</div>
                  <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 15, lineHeight: 1.3, color: '#00e67a' }}>
                    {balance === null ? '...' : showBal ? `${balance.toFixed(2)} ${currency}` : '•••••• USD'}
                  </div>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" style={{ transform: accountsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
              </button>

              {accountsOpen && allAccounts.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: '#131525', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 8, minWidth: 220, zIndex: 100, boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}>
                  {allAccounts.map((a: any) => (
                    <button key={a.loginid} onClick={() => switchAccount(a)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 8, background: a.loginid === account ? 'rgba(0,230,122,0.08)' : 'none', border: 'none', cursor: 'pointer', color: '#e2e8f0', textAlign: 'left' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: a.is_virtual ? 'rgba(245,158,11,0.15)' : 'rgba(0,230,122,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: a.is_virtual ? '#f59e0b' : '#00e67a' }}>{a.is_virtual ? 'D' : 'R'}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{a.loginid}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{a.is_virtual ? 'Demo' : 'Real'} · {a.currency}</div>
                      </div>
                    </button>
                  ))}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 8, paddingTop: 8 }}>
                    <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontSize: 13 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Logout</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', padding: '0 8px', height: 44, gap: 2 }} className="hide-scrollbar">
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
            {NAV.map(n => {
              const active = isActive(n.href, n.exact);
              return (
                <Link key={n.href} href={n.soon ? '#' : n.href} onClick={() => setMobileOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, fontSize: 14, fontWeight: 500, textDecoration: 'none', marginBottom: 4, color: n.soon ? 'rgba(100,116,139,0.4)' : active ? '#00e67a' : '#94a3b8', background: active ? 'rgba(0,230,122,0.08)' : 'transparent' }}>
                  <span>{n.icon}</span><span style={{ flex: 1 }}>{n.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <main style={{ flex: 1, maxWidth: 1600, margin: '0 auto', width: '100%', padding: '20px 16px' }}>{children}</main>

      {modal === 'deposit' && (
        <div style={{ position:'fixed',inset:0,zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:16,background:'rgba(0,0,0,0.82)',backdropFilter:'blur(12px)' }} onClick={()=>setModal(null)}>
          <div style={{ position:'relative',background:'linear-gradient(160deg,#131525,#0e1020)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:24,padding:28,width:'100%',maxWidth:420,boxShadow:'0 32px 80px rgba(0,0,0,0.8)',animation:'modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both' }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24 }}>
              <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                <div style={{ width:44,height:44,borderRadius:14,background:'linear-gradient(135deg,#00e67a,#00b85c)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 20px rgba(0,230,122,0.3)' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0a0b14" strokeWidth="2.5"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="21" x2="12" y2="3"/></svg></div>
                <div><h3 style={{ fontFamily:'Space Grotesk,sans-serif',fontWeight:800,fontSize:20,marginBottom:2 }}>Deposit Funds</h3><p style={{ color:'#475569',fontSize:12 }}>Instant · Secure · Zero fees</p></div>
              </div>
              <button onClick={()=>setModal(null)} style={{ width:32,height:32,borderRadius:10,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:'#64748b',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center' }}>✕</button>
            </div>
            <div style={{ display:'flex',marginBottom:20,borderRadius:12,overflow:'hidden',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',padding:3,gap:3 }}>
              <button style={{ flex:1,padding:'9px 0',background:'linear-gradient(135deg,#00e67a,#00b85c)',border:'none',color:'#0a0b14',fontWeight:700,fontSize:13,cursor:'default',borderRadius:9 }}>⬇️ Deposit</button>
              <button onClick={()=>setModal('withdraw')} style={{ flex:1,padding:'9px 0',background:'none',border:'none',color:'#64748b',fontWeight:600,fontSize:13,cursor:'pointer',borderRadius:9 }}>⬆️ Withdraw</button>
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
              <div><label style={{ fontSize:11,color:'#475569',fontWeight:700,display:'block',marginBottom:7,textTransform:'uppercase',letterSpacing:'0.08em' }}>Deriv Account (CR Number)</label><input value={crAccount2} onChange={e=>setCrAccount2(e.target.value)} placeholder="e.g. CR1234567" style={{ width:'100%',padding:'12px 14px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:12,color:'#e2e8f0',fontSize:15,outline:'none' }} /></div>
              <div><label style={{ fontSize:11,color:'#475569',fontWeight:700,display:'block',marginBottom:7,textTransform:'uppercase',letterSpacing:'0.08em' }}>M-Pesa Phone Number</label><div style={{ position:'relative',display:'flex',alignItems:'center' }}><div style={{ position:'absolute',left:14,color:'#475569',fontSize:14,fontWeight:600,pointerEvents:'none',display:'flex',alignItems:'center',gap:5 }}><span style={{ fontSize:16 }}>🇰🇪</span> +254</div><input value={phone2} onChange={e=>setPhone2(e.target.value.replace(/\D/g,''))} placeholder="7XXXXXXXX" style={{ width:'100%',padding:'12px 14px',paddingLeft:88,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:12,color:'#e2e8f0',fontSize:15,outline:'none' }} /></div></div>
              <div><label style={{ fontSize:11,color:'#475569',fontWeight:700,display:'block',marginBottom:7,textTransform:'uppercase',letterSpacing:'0.08em' }}>Amount (KES)</label><div style={{ position:'relative',display:'flex',alignItems:'center' }}><div style={{ position:'absolute',left:14,color:'#475569',fontSize:13,fontWeight:600,pointerEvents:'none' }}>KES</div><input type="number" value={amount2} onChange={e=>setAmount2(e.target.value)} placeholder={`Min KES ${minDepositKes.toLocaleString()}`} style={{ width:'100%',padding:'12px 14px',paddingLeft:52,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:12,color:'#e2e8f0',fontSize:15,outline:'none' }} /></div></div>
              <div style={{ padding:'12px 14px',borderRadius:12,background:'rgba(0,230,122,0.04)',border:'1px solid rgba(0,230,122,0.1)' }}>
                <div style={{ display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:6 }}><span style={{ color:'#475569',display:'flex',alignItems:'center',gap:6 }}><span style={{ width:6,height:6,borderRadius:'50%',background:'#00e67a',display:'inline-block',animation:'blink 1.5s infinite' }}/>Live rate</span><span style={{ color:'#94a3b8',fontWeight:600 }}>1 USD = {depositRate} KES</span></div>
                <div style={{ display:'flex',justifyContent:'space-between',fontSize:14 }}><span style={{ color:'#475569' }}>You receive</span><span style={{ fontWeight:800,color:'#00e67a',fontSize:16,fontFamily:'Space Grotesk,sans-serif' }}>${amount2 ? (parseFloat(amount2)/depositRate).toFixed(2) : '0.00'} USD</span></div>
              </div>
              {depositMsg2 && <div style={{ padding:'11px 14px',borderRadius:11,background:depositMsg2.ok?'rgba(0,230,122,0.07)':'rgba(248,113,113,0.07)',border:`1px solid ${depositMsg2.ok?'rgba(0,230,122,0.2)':'rgba(248,113,113,0.2)'}`,color:depositMsg2.ok?'#00e67a':'#f87171',fontSize:13,lineHeight:1.55 }}>{depositMsg2.text}</div>}
              <button onClick={handleDeposit2} disabled={depositLoading2} style={{ padding:'14px 0',borderRadius:13,background:depositLoading2?'rgba(0,230,122,0.2)':'linear-gradient(135deg,#00e67a,#00b85c)',border:'none',color:'#0a0b14',fontWeight:800,fontSize:15,cursor:depositLoading2?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:9,boxShadow:depositLoading2?'none':'0 4px 20px rgba(0,230,122,0.25)' }}>
                {depositLoading2 ? <><div style={{ width:17,height:17,border:'2.5px solid rgba(10,11,20,0.3)',borderTopColor:'#0a0b14',borderRadius:'50%',animation:'spin 0.8s linear infinite' }}/>Processing...</> : '📱 Send M-Pesa Request'}
              </button>
              <p style={{ textAlign:'center',fontSize:11,color:'#1e293b' }}>Powered by <a href="https://app.abepayy.com" target="_blank" rel="noopener noreferrer" style={{ color:'#00e67a',textDecoration:'none',fontWeight:600 }}>AbePay</a></p>
            </div>
          </div>
        </div>
      )}

      {modal === 'withdraw' && (
        <div style={{ position:'fixed',inset:0,zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:16,background:'rgba(0,0,0,0.82)',backdropFilter:'blur(12px)' }} onClick={()=>setModal(null)}>
          <div style={{ position:'relative',background:'linear-gradient(160deg,#131525,#0e1020)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:24,padding:28,width:'100%',maxWidth:440,boxShadow:'0 32px 80px rgba(0,0,0,0.8)',animation:'modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both' }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24 }}>
              <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                <div style={{ width:44,height:44,borderRadius:14,background:'linear-gradient(135deg,#6366f1,#4f46e5)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 20px rgba(99,102,241,0.3)' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polyline points="16 7 12 3 8 7"/><line x1="12" y1="3" x2="12" y2="21"/></svg></div>
                <div><h3 style={{ fontFamily:'Space Grotesk,sans-serif',fontWeight:800,fontSize:20,marginBottom:2 }}>Withdraw to M-Pesa</h3><p style={{ color:'#475569',fontSize:12 }}>CR Account · Automatic payout</p></div>
              </div>
              <button onClick={()=>setModal(null)} style={{ width:32,height:32,borderRadius:10,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:'#64748b',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center' }}>✕</button>
            </div>
            <div style={{ display:'flex',marginBottom:20,borderRadius:12,overflow:'hidden',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',padding:3,gap:3 }}>
              <button onClick={()=>setModal('deposit')} style={{ flex:1,padding:'9px 0',background:'none',border:'none',color:'#64748b',fontWeight:600,fontSize:13,cursor:'pointer',borderRadius:9 }}>⬇️ Deposit</button>
              <button style={{ flex:1,padding:'9px 0',background:'linear-gradient(135deg,#6366f1,#4f46e5)',border:'none',color:'#fff',fontWeight:700,fontSize:13,cursor:'default',borderRadius:9 }}>⬆️ Withdraw</button>
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:10,marginBottom:20 }}>
              {[
                { icon:'🛡️',color:'#6366f1',t:'Step 1 — Go to Deriv and withdraw',d:'Go to Deriv.com and log in. Click Portfolio → Withdraw → Payment Agent. A verification code will be sent to your email. Enter it, then search for and select "Traders Lounge", enter the amount and complete the withdrawal request.' },
                { icon:'⚡',color:'#f59e0b',t:'Step 2 — We detect it automatically',d:'AbePay securely processes your withdrawal and sends the KES equivalent instantly to your registered M-Pesa number.' },
                { icon:'📱',color:'#00e67a',t:'Step 3 — M-Pesa sent within minutes',d:`Once your withdrawal is matched, the KES amount is sent directly to your M-Pesa number. Rate: 1 USD = ${withdrawRate} KES. No further action needed — contact us on WhatsApp if you have any issue.` },
              ].map((s,i)=>(
                <div key={i} style={{ display:'flex',gap:12,padding:'13px 14px',borderRadius:13,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width:30,height:30,borderRadius:9,background:`${s.color}18`,border:`1px solid ${s.color}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0 }}>{s.icon}</div>
                  <div><p style={{ fontWeight:700,fontSize:13,color:'#e2e8f0',marginBottom:4 }}>{s.t}</p><p style={{ fontSize:12,color:'#64748b',lineHeight:1.6 }}>{s.d}</p></div>
                </div>
              ))}
            </div>
            <a href="https://home.deriv.com/dashboard/withdraw" target="_blank" rel="noopener noreferrer" style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'14px 0',borderRadius:13,background:'linear-gradient(135deg,#6366f1,#4f46e5)',color:'#fff',fontWeight:800,fontSize:16,textDecoration:'none',boxShadow:'0 4px 20px rgba(99,102,241,0.3)' }}>
              Open Deriv.com
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>

            <div style={{ marginTop:16, padding:'12px 14px', borderRadius:12, background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.15)' }}>
              <p style={{ fontSize:12, color:'#f59e0b', lineHeight:1.6, marginBottom:8 }}>
                <strong>⚠️ First time withdrawing?</strong> You must have an AbePay account with your M-Pesa number saved before your withdrawal can be processed automatically.
              </p>
              <a href="https://app.abepayy.com" target="_blank" rel="noopener noreferrer"
                style={{ display:'inline-flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:8,background:'rgba(245,158,11,0.12)',border:'1px solid rgba(245,158,11,0.2)',color:'#f59e0b',fontSize:12,fontWeight:700,textDecoration:'none' }}>
                Register on AbePay →
              </a>
            </div>
            <p style={{ textAlign:'center',fontSize:11,color:'#1e293b',marginTop:14 }}>Having trouble? <a href="https://wa.me/254793789350" target="_blank" rel="noopener noreferrer" style={{ color:'#00e67a',textDecoration:'none',fontWeight:600 }}>Contact us on WhatsApp</a></p>
          </div>
        </div>
      )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar{display:none}
        .hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes modalIn{from{opacity:0;transform:scale(0.93) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
      `}</style>
    </div>
  );
}
