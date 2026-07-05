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

  const overlay: React.CSSProperties = { position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(12px)' };
  const box: React.CSSProperties = { position: 'relative', background: 'linear-gradient(160deg,#131525 0%,#0e1020 100%)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 24, padding: 28, width: '100%', maxWidth: 440, boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,230,122,0.06)', animation: 'modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both' };
  const inp: React.CSSProperties = { width: '100%', padding: '13px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, color: '#e2e8f0', fontSize: 15, outline: 'none', fontFamily: 'Inter,sans-serif', transition: 'border-color 0.2s' };
  const lbl: React.CSSProperties = { fontSize: 11, color: '#475569', fontWeight: 700, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' };

  return (
    <div style={{ minHeight: '100vh', background: '#080910', color: '#e2e8f0', overflowX: 'hidden', fontFamily: 'Inter,system-ui,sans-serif' }}>

      {modal === 'deposit' && (
        <div style={overlay} onClick={() => setModal(null)}>
          <div style={box} onClick={e => e.stopPropagation()}>
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

            <div style={{ display: 'flex', marginBottom: 24, borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', padding: 3, gap: 3 }}>
              <button style={{ flex: 1, padding: '9px 0', background: 'linear-gradient(135deg,#00e67a,#00b85c)', border: 'none', color: '#0a0b14', fontWeight: 700, fontSize: 13, cursor: 'default', borderRadius: 9, boxShadow: '0 2px 8px rgba(0,230,122,0.25)' }}>⬇️ Deposit</button>
              <button onClick={() => setModal('withdraw')} style={{ flex: 1, padding: '9px 0', background: 'none', border: 'none', color: '#64748b', fontWeight: 600, fontSize: 13, cursor: 'pointer', borderRadius: 9, transition: 'all 0.15s' }}>⬆️ Withdraw</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={lbl}>Deriv Account (CR Number)</label>
                <input value={crAccount} onChange={e => setCrAccount(e.target.value)} placeholder="e.g. CR1234567" style={inp} />
              </div>
              <div>
                <label style={lbl}>M-Pesa Phone Number</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <div style={{ position: 'absolute', left: 14, color: '#475569', fontSize: 14, fontWeight: 600, pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 16 }}>🇰🇪</span> +254
                  </div>
                  <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="7XXXXXXXX" style={{ ...inp, paddingLeft: 88 }} />
                </div>
              </div>
              <div>
                <label style={lbl}>Amount (KES)</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <div style={{ position: 'absolute', left: 14, color: '#475569', fontSize: 13, fontWeight: 600, pointerEvents: 'none' }}>KES</div>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder={`Min KES ${minDepositKes.toLocaleString()}`} style={{ ...inp, paddingLeft: 52 }} />
                </div>
              </div>
              <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(0,230,122,0.04)', border: '1px solid rgba(0,230,122,0.1)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#475569' }}>Live rate</span>
                  <span style={{ color: '#94a3b8', fontWeight: 600 }}>1 USD = {depositRate} KES</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: '#475569' }}>You receive</span>
                  <span style={{ fontWeight: 800, color: '#00e67a', fontSize: 16, fontFamily: 'Space Grotesk,sans-serif' }}>${usdAmt} USD</span>
                </div>
              </div>
              {depositMsg && (
                <div style={{ padding: '12px 16px', borderRadius: 12, background: depositMsg.ok ? 'rgba(0,230,122,0.07)' : 'rgba(248,113,113,0.07)', border: `1px solid ${depositMsg.ok ? 'rgba(0,230,122,0.2)' : 'rgba(248,113,113,0.2)'}`, color: depositMsg.ok ? '#00e67a' : '#f87171', fontSize: 13, lineHeight: 1.55 }}>
                  {depositMsg.text}
                </div>
              )}
              <button onClick={handleDeposit} disabled={depositLoading} style={{ padding: '15px 0', borderRadius: 14, background: depositLoading ? 'rgba(0,230,122,0.2)' : 'linear-gradient(135deg,#00e67a,#00b85c)', border: 'none', color: '#0a0b14', fontWeight: 800, fontSize: 16, cursor: depositLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: depositLoading ? 'none' : '0 4px 20px rgba(0,230,122,0.25)', transition: 'all 0.2s' }}>
                {depositLoading ? 'Processing...' : '📱 Send M-Pesa Request'}
              </button>
              <p style={{ textAlign: 'center', fontSize: 11, color: '#1e293b' }}>Powered by <a href="https://app.abepayy.com" target="_blank" rel="noopener noreferrer" style={{ color: '#00e67a', textDecoration: 'none', fontWeight: 600 }}>AbePay</a></p>
            </div>
          </div>
        </div>
      )}

      {modal === 'withdraw' && (
        <div style={overlay} onClick={() => setModal(null)}>
          <div style={box} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(99,102,241,0.3)', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polyline points="16 7 12 3 8 7" /><line x1="12" y1="3" x2="12" y2="21" /></svg>
                </div>
                <div>
                  <h3 style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 800, fontSize: 20, marginBottom: 2 }}>Withdraw Funds</h3>
                  <p style={{ color: '#475569', fontSize: 12 }}>CR Account · Automatic payout</p>
                </div>
              </div>
              <button onClick={() => setModal(null)} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <div style={{ display: 'flex', marginBottom: 24, borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', padding: 3, gap: 3 }}>
              <button onClick={() => setModal('deposit')} style={{ flex: 1, padding: '9px 0', background: 'none', border: 'none', color: '#64748b', fontWeight: 600, fontSize: 13, cursor: 'pointer', borderRadius: 9 }}>⬇️ Deposit</button>
              <button style={{ flex: 1, padding: '9px 0', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'default', borderRadius: 9 }}>⬆️ Withdraw</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {[
                { n: 1, icon: '🛡️', title: 'Step 1 — Go to Deriv and withdraw', desc: 'Go to Deriv.com and log in. Click Portfolio → Withdraw → Payment Agent. Enter verification code from email, search for "Traders Lounge", enter amount and complete.', color: '#6366f1' },
                { n: 2, icon: '⚡', title: 'Step 2 — We detect it automatically', desc: 'AbePay securely processes your withdrawal and sends the KES equivalent instantly to your registered M-Pesa number.', color: '#f59e0b' },
                { n: 3, icon: '📱', title: 'Step 3 — M-Pesa sent within minutes', desc: `Once matched, the KES amount is sent directly to your M-Pesa number. Rate: 1 USD = ${withdrawRate} KES.`, color: '#00e67a' },
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

            <a href="https://home.deriv.com/dashboard/withdraw" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '15px 0', borderRadius: 14, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', fontWeight: 800, fontSize: 16, textDecoration: 'none', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}>
              Open Deriv.com
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
            </a>
          </div>
        </div>
      )}

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

      <header style={{ position: 'sticky', top: 0, zIndex: 50, transition: 'all 0.35s', background: scrolled ? 'rgba(8,9,16,0.97)' : 'transparent', backdropFilter: scrolled ? 'blur(24px)' : 'none', borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#00e67a,#00b85c)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(0,230,122,0.35)' }}>
              <span style={{ color: '#0a0b14', fontWeight: 900, fontSize: 13, fontFamily: 'Space Grotesk,sans-serif' }}>TL</span>
            </div>
            <span style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 800, fontSize: 18, color: '#e2e8f0' }}>Traders Lounge</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => openModal('deposit')} style={{ padding: '10px 20px', borderRadius: 11, background: 'linear-gradient(135deg,#00e67a,#00b85c)', border: 'none', color: '#0a0b14', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Deposit</button>
            <button onClick={() => openModal('withdraw')} style={{ padding: '10px 20px', borderRadius: 11, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Withdraw</button>
            <button onClick={handleLogin} style={{ padding: '10px 20px', borderRadius: 11, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#e2e8f0', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Login with Deriv →</button>
          </div>
        </div>
      </header>

      <section style={{ padding: '100px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 'clamp(42px,7.5vw,82px)', fontWeight: 900, lineHeight: 1.04, marginBottom: 24, letterSpacing: '-2px' }}>Trade with smarter tools</h1>
        <p style={{ fontSize: 19, color: '#64748b', maxWidth: 560, margin: '0 auto 44px', lineHeight: 1.65 }}>Professional bots, live charts, and automated strategies for Deriv synthetic indices.</p>
        <button onClick={handleLogin} style={{ padding: '17px 42px', borderRadius: 14, background: 'linear-gradient(135deg,#00e67a,#00b85c)', border: 'none', color: '#0a0b14', fontWeight: 800, fontSize: 17, cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,230,122,0.2)' }}>Start Trading Now →</button>
      </section>

      <style>{`
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.93) translateY(12px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.4s ease-out both; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
      `}</style>
    </div>
  );
}
