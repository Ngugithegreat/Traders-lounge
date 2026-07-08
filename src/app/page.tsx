'use client';
import { useEffect, useState, useRef, useCallback } from 'react';

const APP_ID = process.env.NEXT_PUBLIC_DERIV_APP_ID || '33BguwaY1RGDz9J48qvkJ';
const ABEPAY_URL = 'https://app.abepayy.com';

const TICKER_SYMBOLS = [
  { sym: 'R_100', label: 'Vol 100(1s)' },
  { sym: 'R_25', label: 'Vol 25' },
  { sym: 'R_10', label: 'Vol 10' },
  { sym: 'BOOM1000', label: 'Boom 1000' },
  { sym: 'CRASH1000', label: 'Crash 1000' },
  { sym: 'STPIDX', label: 'Step Index' },
  { sym: 'RDBULL', label: 'Bull Market' },
  { sym: 'RDBEAR', label: 'Bear Market' },
];

type ModalType = 'deposit' | 'withdraw' | null;

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [modal, setModal] = useState<ModalType>(null);
  const [depositRate, setDepositRate] = useState(131);
  const [withdrawRate, setWithdrawRate] = useState(124);
  const [minDepositKes, setMinDepositKes] = useState(650);
  const [livePrices, setLivePrices] = useState<Record<string, { price: string; up: boolean }>>({});
  const prevPrices = useRef<Record<string, number>>({});

  // Deposit form
  const [crAccount, setCrAccount] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositMsg, setDepositMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Fetch live rates from AbePay
  useEffect(() => {
    fetch(`${ABEPAY_URL}/api/widget/rates`)
      .then(r => r.json())
      .then(d => {
        if (d.depositRate) setDepositRate(d.depositRate);
        if (d.withdrawRate) setWithdrawRate(d.withdrawRate);
        if (d.minDeposit) setMinDepositKes(Math.ceil(d.minDeposit * d.depositRate));
      })
      .catch(() => {});
  }, []);

  // Live WebSocket prices
  useEffect(() => {
    let mounted = true;
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);
    ws.onopen = () => TICKER_SYMBOLS.forEach(s => ws.send(JSON.stringify({ ticks: s.sym, subscribe: 1 })));
    ws.onmessage = (e) => {
      if (!mounted) return;
      const m = JSON.parse(e.data);
      if (m.tick) {
        const sym = m.tick.symbol;
        const p = parseFloat(m.tick.quote);
        const up = prevPrices.current[sym] !== undefined ? p >= prevPrices.current[sym] : true;
        prevPrices.current[sym] = p;
        setLivePrices(prev => ({ ...prev, [sym]: { price: p.toFixed(2), up } }));
      }
    };
    return () => { mounted = false; try { ws.close(); } catch (_) {} };
  }, []);

  const handleLogin = () => {
    const state = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('oauth_state', state);
    window.location.href = `https://oauth.deriv.com/oauth2/authorize?app_id=${APP_ID}&brand=deriv&redirect=home&state=${state}`;
  };

  const openModal = (type: ModalType) => {
    setModal(type);
    setDepositMsg(null);
    setCrAccount(''); setPhone(''); setAmount('');
  };

  const handleDeposit = async () => {
    if (!crAccount.trim() || !phone.trim() || !amount.trim()) {
      setDepositMsg({ text: 'Please fill in all fields.', ok: false }); return;
    }
    const kes = parseFloat(amount);
    if (isNaN(kes) || kes < minDepositKes) {
      setDepositMsg({ text: `Minimum deposit is KES ${minDepositKes.toLocaleString()}.`, ok: false }); return;
    }
    setDepositLoading(true); setDepositMsg(null);
    try {
      const rawPhone = phone.trim().replace(/\D/g, '');
      const formatted = rawPhone.startsWith('0') ? '254' + rawPhone.slice(1) : rawPhone.startsWith('254') ? rawPhone : '254' + rawPhone;
      const res = await fetch(`${ABEPAY_URL}/api/mpesa/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crAccount: crAccount.trim().toUpperCase(), phone: formatted, amount: kes }),
      });
      const data = await res.json();
      if (data.success) {
        setDepositMsg({ text: '✅ M-Pesa prompt sent! Check your phone and enter your PIN to complete.', ok: true });
        setAmount('');
      } else {
        setDepositMsg({ text: data.error || 'Failed to initiate deposit. Please try again.', ok: false });
      }
    } catch {
      setDepositMsg({ text: 'Network error. Please check your connection and try again.', ok: false });
    }
    setDepositLoading(false);
  };

  const kesAmt = parseFloat(amount) || 0;
  const usdAmt = kesAmt > 0 ? (kesAmt / depositRate).toFixed(2) : '0.00';

  const tickerItems = TICKER_SYMBOLS.map(({ sym, label }) => ({
    label,
    price: livePrices[sym]?.price ?? '—',
    up: livePrices[sym]?.up ?? true,
  }));

  // Shared modal styles
  const overlay: React.CSSProperties = { position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(12px)' };
  const box: React.CSSProperties = { position: 'relative', background: 'linear-gradient(160deg,#131525 0%,#0e1020 100%)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 24, padding: 28, width: '100%', maxWidth: 440, boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,230,122,0.06)', animation: 'modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both' };
  const inp: React.CSSProperties = { width: '100%', padding: '13px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, color: '#e2e8f0', fontSize: 15, outline: 'none', fontFamily: 'Inter,sans-serif', transition: 'border-color 0.2s' };
  const lbl: React.CSSProperties = { fontSize: 11, color: '#475569', fontWeight: 700, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' };

  return (
    <div style={{ minHeight: '100vh', background: '#080910', color: '#e2e8f0', overflowX: 'hidden', fontFamily: 'Inter,system-ui,sans-serif' }}>

      {/* ── DEPOSIT MODAL ── */}
      {modal === 'deposit' && (
        <div style={overlay} onClick={() => setModal(null)}>
          <div style={box} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#00e67a,#00b85c)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(0,230,122,0.3)', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0a0b14" strokeWidth="2.5"><polyline points="8 17 12 21 16 17" /><line x1="12" y1="21" x2="12" y2="3" /></svg>
                </div>
                <div>
                  <h3 style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 800, fontSize: 20, marginBottom: 2 }}>Deposit Funds</h3>
                  <p style={{ color: '#475569', fontSize: 12 }}>Instant · Secure · Zero fees</p>
                </div>
              </div>
              <button onClick={() => setModal(null)} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', marginBottom: 24, borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', padding: 3, gap: 3 }}>
              <button style={{ flex: 1, padding: '9px 0', background: 'linear-gradient(135deg,#00e67a,#00b85c)', border: 'none', color: '#0a0b14', fontWeight: 700, fontSize: 13, cursor: 'default', borderRadius: 9, boxShadow: '0 2px 8px rgba(0,230,122,0.25)' }}>⬇️ Deposit</button>
              <button onClick={() => setModal('withdraw')} style={{ flex: 1, padding: '9px 0', background: 'none', border: 'none', color: '#64748b', fontWeight: 600, fontSize: 13, cursor: 'pointer', borderRadius: 9, transition: 'all 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as any).style.color = '#e2e8f0'; (e.currentTarget as any).style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { (e.currentTarget as any).style.color = '#64748b'; (e.currentTarget as any).style.background = 'none'; }}>
                ⬆️ Withdraw
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* CR Account */}
              <div>
                <label style={lbl}>Deriv Account (CR Number)</label>
                <input value={crAccount} onChange={e => setCrAccount(e.target.value)} placeholder="e.g. CR1234567"
                  style={inp}
                  onFocus={e => (e.target.style.borderColor = 'rgba(0,230,122,0.4)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')} />
              </div>

              {/* Phone */}
              <div>
                <label style={lbl}>M-Pesa Phone Number</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <div style={{ position: 'absolute', left: 14, color: '#475569', fontSize: 14, fontWeight: 600, pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 16 }}>🇰🇪</span> +254
                  </div>
                  <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="7XXXXXXXX"
                    style={{ ...inp, paddingLeft: 88 }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(0,230,122,0.4)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')} />
                </div>
              </div>

              {/* Amount */}
              <div>
                <label style={lbl}>Amount (KES)</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <div style={{ position: 'absolute', left: 14, color: '#475569', fontSize: 13, fontWeight: 600, pointerEvents: 'none' }}>KES</div>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                    placeholder={`Min KES ${minDepositKes.toLocaleString()}`}
                    style={{ ...inp, paddingLeft: 52 }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(0,230,122,0.4)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')} />
                </div>
                <p style={{ fontSize: 11, color: '#334155', marginTop: 5 }}>Minimum deposit: KES {minDepositKes.toLocaleString()}</p>
              </div>

              {/* Rate card */}
              <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(0,230,122,0.04)', border: '1px solid rgba(0,230,122,0.1)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e67a', display: 'inline-block', animation: 'blink 1.5s infinite' }} />
                    Live rate
                  </span>
                  <span style={{ color: '#94a3b8', fontWeight: 600 }}>1 USD = {depositRate} KES</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: '#475569' }}>You receive</span>
                  <span style={{ fontWeight: 800, color: '#00e67a', fontSize: 16, fontFamily: 'Space Grotesk,sans-serif' }}>${usdAmt} USD</span>
                </div>
              </div>

              {/* Message */}
              {depositMsg && (
                <div style={{ padding: '12px 16px', borderRadius: 12, background: depositMsg.ok ? 'rgba(0,230,122,0.07)' : 'rgba(248,113,113,0.07)', border: `1px solid ${depositMsg.ok ? 'rgba(0,230,122,0.2)' : 'rgba(248,113,113,0.2)'}`, color: depositMsg.ok ? '#00e67a' : '#f87171', fontSize: 13, lineHeight: 1.55 }}>
                  {depositMsg.text}
                </div>
              )}

              {/* Submit button */}
              <button onClick={handleDeposit} disabled={depositLoading}
                style={{ padding: '15px 0', borderRadius: 14, background: depositLoading ? 'rgba(0,230,122,0.2)' : 'linear-gradient(135deg,#00e67a,#00b85c)', border: 'none', color: '#0a0b14', fontWeight: 800, fontSize: 16, cursor: depositLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: depositLoading ? 'none' : '0 4px 20px rgba(0,230,122,0.25)', transition: 'all 0.2s', letterSpacing: '-0.2px' }}>
                {depositLoading ? (
                  <>
                    <div style={{ width: 18, height: 18, border: '2.5px solid rgba(10,11,20,0.3)', borderTopColor: '#0a0b14', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Processing...
                  </>
                ) : (
                  <>📱 Send M-Pesa Request</>
                )}
              </button>

              <p style={{ textAlign: 'center', fontSize: 11, color: '#1e293b' }}>
                Powered by{' '}
                <a href="https://app.abepayy.com" target="_blank" rel="noopener noreferrer" style={{ color: '#00e67a', textDecoration: 'none', fontWeight: 600 }}>AbePay</a>
                {' '}·{' '}
                <a href="https://app.abepayy.com" target="_blank" rel="noopener noreferrer" style={{ color: '#334155', textDecoration: 'none' }}>Open full app →</a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── WITHDRAW MODAL ── */}
      {modal === 'withdraw' && (
        <div style={overlay} onClick={() => setModal(null)}>
          <div style={box} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(99,102,241,0.3)', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polyline points="16 7 12 3 8 7" /><line x1="12" y1="3" x2="12" y2="21" /></svg>
                </div>
                <div>
                  <h3 style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 800, fontSize: 20, marginBottom: 2 }}>Withdraw to M-Pesa</h3>
                  <p style={{ color: '#475569', fontSize: 12 }}>CR Account · Automatic payout</p>
                </div>
              </div>
              <button onClick={() => setModal(null)} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', marginBottom: 24, borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', padding: 3, gap: 3 }}>
              <button onClick={() => setModal('deposit')} style={{ flex: 1, padding: '9px 0', background: 'none', border: 'none', color: '#64748b', fontWeight: 600, fontSize: 13, cursor: 'pointer', borderRadius: 9, transition: 'all 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as any).style.color = '#e2e8f0'; (e.currentTarget as any).style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { (e.currentTarget as any).style.color = '#64748b'; (e.currentTarget as any).style.background = 'none'; }}>
                ⬇️ Deposit
              </button>
              <button style={{ flex: 1, padding: '9px 0', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'default', borderRadius: 9, boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>⬆️ Withdraw</button>
            </div>

            {/* How it works — matching AbePay screenshot exactly */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {[
                {
                  n: 1,
                  icon: '🛡️',
                  title: 'Step 1 — Go to Deriv and withdraw',
                  desc: 'Go to Deriv.com and log in. Click Portfolio → Withdraw → Payment Agent. A verification code will be sent to your email. Enter it, then search for and select "Traders Lounge", enter the amount and complete the withdrawal request.',
                  color: '#6366f1',
                },
                {
                  n: 2,
                  icon: '⚡',
                  title: 'Step 2 — We detect it automatically',
                  desc: 'AbePay securely processes your withdrawal and sends the KES equivalent instantly to your registered M-Pesa number.',
                  color: '#f59e0b',
                },
                {
                  n: 3,
                  icon: '📱',
                  title: 'Step 3 — M-Pesa sent within minutes',
                  desc: `Once your withdrawal is matched, the KES amount is sent directly to your M-Pesa number. Rate: 1 USD = ${withdrawRate} KES. No further action needed — contact us on WhatsApp if you need help.`,
                  color: '#00e67a',
                },
              ].map(step => (
                <div key={step.n} style={{ display: 'flex', gap: 12, padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: `${step.color}18`, border: `1px solid ${step.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{step.icon}</div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 13, color: '#e2e8f0', marginBottom: 5 }}>{step.title}</p>
                    <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Open Deriv button */}
            <a href="https://home.deriv.com/dashboard/withdraw" target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '15px 0', borderRadius: 14, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', fontWeight: 800, fontSize: 16, textDecoration: 'none', boxShadow: '0 4px 20px rgba(99,102,241,0.3)', letterSpacing: '-0.2px' }}>
              Open Deriv.com
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
            </a>

            <p style={{ textAlign: 'center', fontSize: 11, color: '#1e293b', marginTop: 14 }}>
              Having trouble?{' '}
              <a href="https://wa.me/254793789350" target="_blank" rel="noopener noreferrer" style={{ color: '#00e67a', textDecoration: 'none', fontWeight: 600 }}>Contact us on WhatsApp</a>
            </p>
          </div>
        </div>
      )}

      {/* ── TICKER ── */}
      <div style={{ background: 'rgba(0,0,0,0.7)', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '8px 0', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        <div style={{ display: 'inline-flex', gap: 48, animation: 'ticker 30s linear infinite' }}>
          {[...tickerItems, ...tickerItems].map((t, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontFamily: 'monospace' }}>
              <span style={{ color: '#334155' }}>{t.label}</span>
              <span style={{ color: t.up ? '#00e67a' : '#f87171', fontWeight: 700 }}>{t.price}</span>
              <span style={{ color: t.up ? '#00e67a' : '#f87171', fontSize: 10 }}>{t.up ? '▲' : '▼'}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── NAVBAR ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, transition: 'all 0.35s', background: scrolled ? 'rgba(8,9,16,0.97)' : 'transparent', backdropFilter: scrolled ? 'blur(24px)' : 'none', borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#00e67a,#00b85c)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(0,230,122,0.35)' }}>
              <span style={{ color: '#0a0b14', fontWeight: 900, fontSize: 13, fontFamily: 'Space Grotesk,sans-serif' }}>TL</span>
            </div>
            <span style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 800, fontSize: 18, color: '#e2e8f0', letterSpacing: '-0.3px' }}>Traders Lounge</span>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {[['#features', 'Features'], ['#how-it-works', 'How It Works'], ['#traders', 'Traders']].map(([href, label]) => (
              <a key={href} href={href} style={{ padding: '7px 14px', borderRadius: 9, fontSize: 14, fontWeight: 500, color: '#64748b', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#e2e8f0')}
                onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>{label}</a>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <button onClick={() => openModal('deposit')}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 11, background: 'linear-gradient(135deg,#00e67a,#00b85c)', border: 'none', color: '#0a0b14', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 0 18px rgba(0,230,122,0.22)', transition: 'all 0.15s', letterSpacing: '-0.2px' }}
              onMouseEnter={e => { (e.currentTarget as any).style.transform = 'scale(1.03)'; }}
              onMouseLeave={e => { (e.currentTarget as any).style.transform = 'scale(1)'; }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="8 17 12 21 16 17" /><line x1="12" y1="21" x2="12" y2="3" /></svg>
              Deposit
            </button>
            <button onClick={() => openModal('withdraw')}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 11, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as any).style.background = 'rgba(99,102,241,0.18)'; (e.currentTarget as any).style.transform = 'scale(1.03)'; }}
              onMouseLeave={e => { (e.currentTarget as any).style.background = 'rgba(99,102,241,0.1)'; (e.currentTarget as any).style.transform = 'scale(1)'; }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="16 7 12 3 8 7" /><line x1="12" y1="3" x2="12" y2="21" /></svg>
              Withdraw
            </button>
            <button onClick={handleLogin}
              style={{ padding: '10px 20px', borderRadius: 11, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#e2e8f0', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as any).style.background = 'rgba(255,255,255,0.09)'; }}
              onMouseLeave={e => { (e.currentTarget as any).style.background = 'rgba(255,255,255,0.05)'; }}>
              Login with Deriv →
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', padding: 'clamp(80px,12vw,140px) 24px 80px', textAlign: 'center', overflow: 'hidden' }}>
        {/* Ambient blobs */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 800, height: 500, background: 'radial-gradient(ellipse,rgba(0,230,122,0.06),transparent 70%)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', top: '40%', left: '15%', width: 300, height: 300, background: 'radial-gradient(circle,rgba(99,102,241,0.05),transparent 70%)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', top: '30%', right: '15%', width: 300, height: 300, background: 'radial-gradient(circle,rgba(0,230,122,0.04),transparent 70%)', borderRadius: '50%' }} />
        </div>

        <div style={{ position: 'relative', maxWidth: 860, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 999, background: 'rgba(0,230,122,0.06)', border: '1px solid rgba(0,230,122,0.15)', fontSize: 13, color: '#00e67a', fontWeight: 500, marginBottom: 32, backdropFilter: 'blur(8px)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00e67a', animation: 'pulse 2s infinite', display: 'inline-block' }} />
            Trusted by 12,000+ Traders Worldwide
          </div>

          <h1 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 'clamp(42px,7.5vw,82px)', fontWeight: 900, lineHeight: 1.04, marginBottom: 24, letterSpacing: '-2px' }}>
            Trade with{' '}
            <span style={{ background: 'linear-gradient(135deg,#00e67a 0%,#00c96a 50%,#00b85c 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              smarter tools
            </span>
          </h1>

          <p style={{ fontSize: 19, color: '#64748b', maxWidth: 560, margin: '0 auto 44px', lineHeight: 1.65 }}>
            Professional bots, live charts, and automated strategies for Deriv synthetic indices. Your edge starts here.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 44 }}>
            <button onClick={handleLogin}
              style={{ padding: '17px 42px', borderRadius: 14, background: 'linear-gradient(135deg,#00e67a,#00b85c)', border: 'none', color: '#0a0b14', fontWeight: 800, fontSize: 17, cursor: 'pointer', boxShadow: '0 0 40px rgba(0,230,122,0.3), 0 4px 20px rgba(0,230,122,0.2)', transition: 'transform 0.15s', letterSpacing: '-0.3px' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
              Start Trading Now →
            </button>
            <a href="#features"
              style={{ padding: '17px 42px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: '#e2e8f0', fontWeight: 600, fontSize: 17, textDecoration: 'none', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}>
              Explore Features
            </a>
          </div>

          <div style={{ display: 'flex', gap: 28, justifyContent: 'center', flexWrap: 'wrap', fontSize: 14, color: '#475569' }}>
            {['No Credit Card', '$10,000 Demo Account', 'Instant Withdrawals via AbePay'].map(t => (
              <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ color: '#00e67a', fontWeight: 700 }}>✓</span>{t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '52px 24px', background: 'rgba(0,0,0,0.3)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 24, textAlign: 'center' }}>
          {[['12K+', 'Active Traders'], ['$890M+', 'Trading Volume'], ['99.9%', 'Uptime'], ['150+', 'Synthetic Pairs']].map(([v, l]) => (
            <div key={l}>
              <div style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 44, fontWeight: 900, color: '#00e67a', marginBottom: 4, letterSpacing: '-1px' }}>{v}</div>
              <div style={{ fontSize: 14, color: '#475569' }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '90px 24px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{ color: '#00e67a', fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>Everything You Need</p>
            <h2 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 'clamp(28px,4vw,50px)', fontWeight: 800, marginBottom: 16, letterSpacing: '-0.5px' }}>Built for serious traders</h2>
            <p style={{ color: '#475569', fontSize: 17, maxWidth: 500, margin: '0 auto' }}>Every tool to automate, analyze, and execute — all in one dashboard.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 20 }}>
            {[
              { icon: '🤖', t: 'Bot Builder', d: 'Visual drag-and-drop editor. Build automated strategies in minutes — no code needed.', g: 'rgba(0,230,122,.06)', b: 'rgba(0,230,122,.15)' },
              { icon: '⚡', t: 'Free Bots', d: 'Pre-built battle-tested strategies for Boom/Crash, Volatility, and Digit indices.', g: 'rgba(99,102,241,.06)', b: 'rgba(99,102,241,.15)' },
              { icon: '📊', t: 'Live Charts', d: 'Full TradingView charts with 100+ indicators for all Deriv synthetic pairs.', g: 'rgba(168,85,247,.06)', b: 'rgba(168,85,247,.15)' },
              { icon: '🔍', t: 'Analysis Tool', d: 'Real-time digit frequency rings with Even/Odd and Over/Under percentages.', g: 'rgba(245,158,11,.06)', b: 'rgba(245,158,11,.15)' },
              { icon: '📋', t: 'Copy Trading', d: 'Auto-mirror top traders in real time. Set risk limits and follow the best.', g: 'rgba(249,115,22,.06)', b: 'rgba(249,115,22,.15)', soon: true },
              { icon: '🚀', t: 'Speedbot', d: 'Ultra-fast execution for high-frequency synthetic index trading.', g: 'rgba(6,182,212,.06)', b: 'rgba(6,182,212,.15)', soon: true },
            ].map((f, i) => (
              <div key={i} style={{ position: 'relative', background: f.g, border: `1px solid ${f.b}`, borderRadius: 22, padding: 30, transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default' }}
                onMouseEnter={e => { (e.currentTarget as any).style.transform = 'translateY(-4px)'; (e.currentTarget as any).style.boxShadow = '0 16px 40px rgba(0,0,0,0.3)'; }}
                onMouseLeave={e => { (e.currentTarget as any).style.transform = 'none'; (e.currentTarget as any).style.boxShadow = 'none'; }}>
                {f.soon && <span style={{ position: 'absolute', top: 18, right: 18, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.22)' }}>SOON</span>}
                <div style={{ fontSize: 34, marginBottom: 18 }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 19, marginBottom: 10 }}>{f.t}</h3>
                <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.65 }}>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: '90px 24px', background: 'rgba(0,0,0,0.3)' }}>
        <div style={{ maxWidth: 1020, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{ color: '#00e67a', fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>Get Started</p>
            <h2 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 'clamp(28px,4vw,50px)', fontWeight: 800, letterSpacing: '-0.5px' }}>Up and running in 3 steps</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
            {[
              { n: '01', icon: '🔗', t: 'Connect Deriv', d: 'Log in with your existing Deriv account via secure OAuth. Works with real and demo accounts.' },
              { n: '02', icon: '🎯', t: 'Pick a Strategy', d: 'Choose from our free bot library, build your own in the visual editor, or use the analysis tool.' },
              { n: '03', icon: '💸', t: 'Trade & Withdraw', d: 'Run bots, monitor live P&L, and withdraw profits to M-Pesa via AbePay within minutes.' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 22, padding: 30, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -20, right: -10, fontFamily: 'Space Grotesk,sans-serif', fontWeight: 900, fontSize: 80, color: 'rgba(255,255,255,0.02)', lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontSize: 38, marginBottom: 16 }}>{s.icon}</div>
                <div style={{ color: '#00e67a', fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', marginBottom: 12 }}>STEP {s.n}</div>
                <h3 style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 21, marginBottom: 12 }}>{s.t}</h3>
                <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.65 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="traders" style={{ padding: '90px 24px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{ color: '#00e67a', fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>Real Traders</p>
            <h2 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 'clamp(28px,4vw,50px)', fontWeight: 800, letterSpacing: '-0.5px' }}>Trusted across Africa</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 20 }}>
            {[
              { i: 'MK', n: 'Musa Kamau', r: 'Algorithmic Trader', t: '"The bot builder changed everything. From 6 hours of manual trading to 3 automated strategies running overnight."' },
              { i: 'AF', n: 'Amina Farah', r: 'Forex Specialist', t: '"Free bots library alone is worth it. I copied the Boom/Crash strategy and have been consistently profitable."' },
              { i: 'JO', n: 'James Okoro', r: 'Independent Trader', t: '"Finally built for serious traders. Charts are clean, execution is fast, and AbePay withdrawals are instant."' },
              { i: 'TW', n: 'Tiffany Wanjiku', r: 'Bot Developer', t: '"Better UX than anything else out there. More bot options and the support team actually responds."' },
            ].map((t, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, transition: 'border-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,230,122,0.15)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}>
                <div style={{ display: 'flex', gap: 3 }}>{Array.from({ length: 5 }).map((_, j) => <span key={j} style={{ color: '#facc15', fontSize: 14 }}>★</span>)}</div>
                <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, fontStyle: 'italic', flex: 1 }}>{t.t}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(0,230,122,0.15),rgba(0,184,92,0.1))', border: '1px solid rgba(0,230,122,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00e67a', fontWeight: 800, fontSize: 13 }}>{t.i}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{t.n}</div>
                    <div style={{ color: '#475569', fontSize: 12 }}>{t.r}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '90px 24px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', background: 'linear-gradient(135deg,rgba(0,230,122,0.05),rgba(0,230,122,0.02))', border: '1px solid rgba(0,230,122,0.12)', borderRadius: 32, padding: 'clamp(48px,8vw,80px) 40px', boxShadow: '0 0 60px rgba(0,230,122,0.06)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'radial-gradient(circle,rgba(0,230,122,0.08),transparent 70%)', borderRadius: '50%' }} />
          <div style={{ fontSize: 60, marginBottom: 24 }}>🚀</div>
          <h2 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 'clamp(28px,4vw,46px)', fontWeight: 900, marginBottom: 18, letterSpacing: '-0.8px' }}>Ready to trade smarter?</h2>
          <p style={{ color: '#64748b', fontSize: 17, marginBottom: 38, lineHeight: 1.65 }}>Join thousands of traders automating their strategies on Deriv synthetic indices.</p>
          <button onClick={handleLogin}
            style={{ padding: '18px 48px', borderRadius: 14, background: 'linear-gradient(135deg,#00e67a,#00b85c)', border: 'none', color: '#0a0b14', fontWeight: 800, fontSize: 18, cursor: 'pointer', boxShadow: '0 4px 40px rgba(0,230,122,0.35)', transition: 'transform 0.15s', letterSpacing: '-0.3px' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
            Connect Deriv Account →
          </button>
          <p style={{ color: '#1e293b', fontSize: 13, marginTop: 18 }}>Free · No credit card · Instant setup</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '36px 24px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg,#00e67a,#00b85c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#0a0b14', fontWeight: 900, fontSize: 11 }}>TL</span>
            </div>
            <span style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 16 }}>Traders Lounge</span>
          </div>
          <p style={{ color: '#1e293b', fontSize: 13, textAlign: 'center' }}>Trading involves risk. Only trade with funds you can afford to lose. Powered by Deriv.</p>
          <div style={{ display: 'flex', gap: 18, fontSize: 13, color: '#1e293b' }}>
            <a href="https://app.abepayy.com" style={{ color: '#00e67a', textDecoration: 'none', fontWeight: 600 }}>AbePay</a>
            <span>© 2026 Traders Lounge</span>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(0,230,122,0.5); } 50% { box-shadow: 0 0 0 7px rgba(0,230,122,0); } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.93) translateY(12px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.4s ease-out both; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
      `}</style>
    </div>
  );
}
