'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

const APP_ID = process.env.NEXT_PUBLIC_DERIV_APP_ID || '33BguwaY1RGDz9J48qvkJ';
const ABEPAY_URL = 'https://app.abepayy.com';

const TICKER = [
  { label: 'Vol 25', price: '2190.44', up: false },
  { label: 'Vol 10', price: '1023.67', up: true },
  { label: 'Boom 1000', price: '6782.33', up: true },
  { label: 'Crash 1000', price: '4391.18', up: false },
  { label: 'Step Index', price: '892.54', up: true },
  { label: 'Bull Market', price: '1064.13', up: true },
  { label: 'Bear Market', price: '909.58', up: false },
  { label: 'Vol 100(1s)', price: '8241.23', up: true },
];

const FEATURES = [
  { icon: '🤖', title: 'Bot Builder', desc: 'Visual drag-and-drop bot editor. Build automated strategies in minutes — no code required.', grad: 'rgba(0,230,122,.1)', border: 'rgba(0,230,122,.2)' },
  { icon: '⚡', title: 'Free Bots', desc: 'Pre-built battle-tested strategies for Boom/Crash, Volatility, and Digit indices.', grad: 'rgba(99,102,241,.1)', border: 'rgba(99,102,241,.2)' },
  { icon: '📊', title: 'Live Charts', desc: 'Full TradingView charts with 100+ indicators for all Deriv synthetic pairs.', grad: 'rgba(168,85,247,.1)', border: 'rgba(168,85,247,.2)' },
  { icon: '🔍', title: 'Analysis Tool', desc: 'Real-time digit frequency analysis with Even/Odd and Over/Under stats.', grad: 'rgba(245,158,11,.1)', border: 'rgba(245,158,11,.2)' },
  { icon: '📋', title: 'Copy Trading', desc: 'Auto-mirror top traders in real time. Set limits and follow the best.', grad: 'rgba(249,115,22,.1)', border: 'rgba(249,115,22,.2)', soon: true },
  { icon: '🚀', title: 'Speedbot', desc: 'Ultra-fast execution engine for high-frequency synthetic index trading.', grad: 'rgba(6,182,212,.1)', border: 'rgba(6,182,212,.2)', soon: true },
];

type ModalType = 'deposit' | 'withdraw' | null;

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [modal, setModal] = useState<ModalType>(null);
  const [depositRate, setDepositRate] = useState(131);
  const [withdrawRate, setWithdrawRate] = useState(124);
  const [minDeposit, setMinDeposit] = useState(50);

  // Deposit form
  const [crAccount, setCrAccount] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositMsg, setDepositMsg] = useState<{text:string;ok:boolean}|null>(null);

  // Live ticker prices
  const [livePrices, setLivePrices] = useState<Record<string,{price:string;up:boolean}>>({});

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Fetch live rates from AbePay
  useEffect(() => {
    fetch(`${ABEPAY_URL}/api/widget/rates`)
      .then(r => r.json())
      .then(d => {
        if (d.depositRate) setDepositRate(d.depositRate);
        if (d.withdrawRate) setWithdrawRate(d.withdrawRate);
        if (d.minDeposit) setMinDeposit(d.minDeposit);
      })
      .catch(() => {});
  }, []);

  // Live WebSocket prices
  useEffect(() => {
    const symbols = ['R_100','BOOM1000','CRASH1000','STPIDX','RDBULL','RDBEAR','R_25','R_10'];
    let mounted = true;
    const prevPrices: Record<string,number> = {};
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);
    ws.onopen = () => {
      symbols.forEach(s => ws.send(JSON.stringify({ ticks: s, subscribe: 1 })));
    };
    ws.onmessage = (e) => {
      if (!mounted) return;
      const m = JSON.parse(e.data);
      if (m.tick) {
        const sym = m.tick.symbol;
        const p = parseFloat(m.tick.quote);
        const up = prevPrices[sym] !== undefined ? p >= prevPrices[sym] : true;
        prevPrices[sym] = p;
        setLivePrices(prev => ({ ...prev, [sym]: { price: p.toFixed(2), up } }));
      }
    };
    return () => { mounted = false; try { ws.close(); } catch(_) {} };
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
      setDepositMsg({ text: 'Please fill in all fields.', ok: false });
      return;
    }
    const kes = parseFloat(amount);
    if (isNaN(kes) || kes < minDeposit) {
      setDepositMsg({ text: `Minimum deposit is KES ${minDeposit}.`, ok: false });
      return;
    }
    setDepositLoading(true);
    setDepositMsg(null);
    try {
      const res = await fetch(`${ABEPAY_URL}/api/mpesa/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crAccount: crAccount.trim().toUpperCase(), phone: phone.trim(), amount: kes }),
      });
      const data = await res.json();
      if (data.success) {
        setDepositMsg({ text: '✅ M-Pesa prompt sent! Check your phone and enter your PIN to complete the deposit.', ok: true });
        setAmount('');
      } else {
        setDepositMsg({ text: data.error || 'Failed to initiate deposit. Please try again.', ok: false });
      }
    } catch {
      setDepositMsg({ text: 'Network error. Please check your connection and try again.', ok: false });
    }
    setDepositLoading(false);
  };

  const kesAmount = amount ? Math.round(parseFloat(amount) || 0) : 0;
  const usdAmount = kesAmount > 0 ? (kesAmount / depositRate).toFixed(2) : '0.00';

  const TICKER_LABELS: Record<string,string> = {
    R_100:'Vol 100(1s)', BOOM1000:'Boom 1000', CRASH1000:'Crash 1000',
    STPIDX:'Step Index', RDBULL:'Bull Market', RDBEAR:'Bear Market',
    R_25:'Vol 25', R_10:'Vol 10',
  };

  const tickerItems = Object.entries(TICKER_LABELS).map(([sym, label]) => ({
    label,
    price: livePrices[sym]?.price ?? TICKER.find(t=>t.label===label)?.price ?? '—',
    up: livePrices[sym]?.up ?? true,
  }));

  const modalBg: React.CSSProperties = { position:'fixed',inset:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:16,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(8px)' };
  const modalBox: React.CSSProperties = { position:'relative',background:'#131525',border:'1px solid rgba(255,255,255,0.1)',borderRadius:20,padding:28,width:'100%',maxWidth:420,boxShadow:'0 24px 64px rgba(0,0,0,0.7)' };
  const inp: React.CSSProperties = { width:'100%',padding:'12px 14px',background:'#1a1d2e',border:'1px solid rgba(255,255,255,0.1)',borderRadius:12,color:'#e2e8f0',fontSize:15,outline:'none',fontFamily:'Inter,sans-serif' };
  const lbl: React.CSSProperties = { fontSize:12,color:'#64748b',fontWeight:600,display:'block',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.07em' };

  return (
    <div style={{ minHeight:'100vh',background:'#0a0b14',color:'#e2e8f0',overflowX:'hidden',fontFamily:'Inter,system-ui,sans-serif' }}>

      {/* Live ticker */}
      <div style={{ background:'rgba(0,0,0,0.6)',borderBottom:'1px solid rgba(255,255,255,0.05)',padding:'7px 0',overflow:'hidden',whiteSpace:'nowrap' }}>
        <div style={{ display:'inline-flex',gap:48,animation:'ticker 35s linear infinite' }}>
          {[...tickerItems,...tickerItems].map((t,i)=>(
            <span key={i} style={{ display:'inline-flex',alignItems:'center',gap:8,fontSize:12,fontFamily:'monospace' }}>
              <span style={{ color:'#475569' }}>{t.label}</span>
              <span style={{ color:t.up?'#00e67a':'#f87171',fontWeight:700 }}>{t.price}</span>
              <span style={{ color:t.up?'#00e67a':'#f87171',fontSize:10 }}>{t.up?'▲':'▼'}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Navbar */}
      <header style={{ position:'sticky',top:0,zIndex:50,transition:'all 0.3s',background:scrolled?'rgba(10,11,20,0.98)':'transparent',backdropFilter:scrolled?'blur(20px)':'none',borderBottom:scrolled?'1px solid rgba(255,255,255,0.06)':'none' }}>
        <div style={{ maxWidth:1200,margin:'0 auto',padding:'0 24px',height:64,display:'flex',alignItems:'center',justifyContent:'space-between',gap:16 }}>

          {/* Logo */}
          <div style={{ display:'flex',alignItems:'center',gap:10,flexShrink:0 }}>
            <div style={{ width:32,height:32,borderRadius:9,background:'linear-gradient(135deg,#00e67a,#00b85c)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 14px rgba(0,230,122,0.3)' }}>
              <span style={{ color:'#0a0b14',fontWeight:900,fontSize:13,fontFamily:'Space Grotesk,sans-serif' }}>TL</span>
            </div>
            <span style={{ fontFamily:'Space Grotesk,sans-serif',fontWeight:700,fontSize:17,color:'#e2e8f0' }}>Traders Lounge</span>
          </div>

          {/* Nav links */}
          <nav style={{ display:'flex',alignItems:'center',gap:4 }}>
            {[['#features','Features'],['#how-it-works','How It Works'],['#traders','Traders']].map(([href,label])=>(
              <a key={href} href={href} style={{ padding:'7px 14px',borderRadius:9,fontSize:14,fontWeight:500,color:'#64748b',textDecoration:'none',transition:'color 0.15s' }}
                onMouseEnter={e=>(e.currentTarget.style.color='#e2e8f0')}
                onMouseLeave={e=>(e.currentTarget.style.color='#64748b')}>{label}</a>
            ))}
          </nav>

          {/* RIGHT: Deposit + Withdraw + Login */}
          <div style={{ display:'flex',alignItems:'center',gap:10,flexShrink:0 }}>
            <button onClick={()=>openModal('deposit')}
              style={{ display:'flex',alignItems:'center',gap:7,padding:'9px 18px',borderRadius:10,background:'linear-gradient(135deg,#00e67a,#00b85c)',border:'none',color:'#0a0b14',fontWeight:700,fontSize:14,cursor:'pointer',boxShadow:'0 0 16px rgba(0,230,122,0.25)',transition:'opacity 0.15s' }}
              onMouseEnter={e=>(e.currentTarget.style.opacity='0.88')}
              onMouseLeave={e=>(e.currentTarget.style.opacity='1')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="21" x2="12" y2="3"/></svg>
              Deposit
            </button>
            <button onClick={()=>openModal('withdraw')}
              style={{ display:'flex',alignItems:'center',gap:7,padding:'9px 18px',borderRadius:10,background:'rgba(99,102,241,0.12)',border:'1px solid rgba(99,102,241,0.3)',color:'#818cf8',fontWeight:700,fontSize:14,cursor:'pointer',transition:'all 0.15s' }}
              onMouseEnter={e=>{(e.currentTarget as any).style.background='rgba(99,102,241,0.2)';}}
              onMouseLeave={e=>{(e.currentTarget as any).style.background='rgba(99,102,241,0.12)';}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="16 7 12 3 8 7"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
              Withdraw
            </button>
            <button onClick={handleLogin}
              style={{ padding:'9px 20px',borderRadius:10,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'#e2e8f0',fontWeight:600,fontSize:14,cursor:'pointer',transition:'all 0.15s' }}
              onMouseEnter={e=>{(e.currentTarget as any).style.background='rgba(255,255,255,0.1)';}}
              onMouseLeave={e=>{(e.currentTarget as any).style.background='rgba(255,255,255,0.06)';}}>
              Login with Deriv →
            </button>
          </div>
        </div>
      </header>

      {/* DEPOSIT MODAL */}
      {modal === 'deposit' && (
        <div style={modalBg} onClick={()=>setModal(null)}>
          <div style={modalBox} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22 }}>
              <div>
                <h3 style={{ fontFamily:'Space Grotesk,sans-serif',fontWeight:800,fontSize:20,marginBottom:3 }}>⬇️ Deposit Funds</h3>
                <p style={{ color:'#64748b',fontSize:12 }}>Instant · Secure · Zero fees</p>
              </div>
              <button onClick={()=>setModal(null)} style={{ width:32,height:32,borderRadius:8,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:'#64748b',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center' }}>✕</button>
            </div>

            <div style={{ display:'flex', marginBottom:20, borderRadius:12, overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)' }}>
              <button style={{ flex:1,padding:'10px 0',background:'#00e67a',border:'none',color:'#0a0b14',fontWeight:700,fontSize:13,cursor:'default' }}>⬇️ Deposit</button>
              <button onClick={()=>{setModal('withdraw');}} style={{ flex:1,padding:'10px 0',background:'none',border:'none',color:'#64748b',fontWeight:600,fontSize:13,cursor:'pointer' }}>⬆️ Withdraw</button>
            </div>

            <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
              <div>
                <label style={lbl}>Deriv Account (CR Number)</label>
                <input value={crAccount} onChange={e=>setCrAccount(e.target.value)} placeholder="e.g. CR1234567" style={inp} />
              </div>
              <div>
                <label style={lbl}>M-Pesa Phone Number</label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'#64748b',fontSize:15 }}>+254</span>
                  <input value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,''))} placeholder="7XXXXXXXX" style={{ ...inp, paddingLeft:56 }} />
                </div>
              </div>
              <div>
                <label style={lbl}>Amount (KES)</label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'#64748b',fontSize:15 }}>KES</span>
                  <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder={`Min ${minDeposit}`} style={{ ...inp, paddingLeft:52 }} />
                </div>
              </div>

              {/* Live rate display */}
              <div style={{ padding:'12px 14px',borderRadius:12,background:'rgba(0,230,122,0.05)',border:'1px solid rgba(0,230,122,0.12)' }}>
                <div style={{ display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:6 }}>
                  <span style={{ color:'#64748b' }}>Live rate</span>
                  <span style={{ fontWeight:600,color:'#94a3b8' }}>1 USD = {depositRate} KES</span>
                </div>
                <div style={{ display:'flex',justifyContent:'space-between',fontSize:13 }}>
                  <span style={{ color:'#64748b' }}>You receive</span>
                  <span style={{ fontWeight:700,color:'#00e67a',fontSize:15 }}>${usdAmount} USD</span>
                </div>
              </div>

              {depositMsg && (
                <div style={{ padding:'10px 14px',borderRadius:10,background:depositMsg.ok?'rgba(0,230,122,0.08)':'rgba(248,113,113,0.08)',border:`1px solid ${depositMsg.ok?'rgba(0,230,122,0.2)':'rgba(248,113,113,0.2)'}`,color:depositMsg.ok?'#00e67a':'#f87171',fontSize:13,lineHeight:1.5 }}>
                  {depositMsg.text}
                </div>
              )}

              <button onClick={handleDeposit} disabled={depositLoading}
                style={{ padding:'15px 0',borderRadius:12,background:depositLoading?'rgba(0,230,122,0.3)':'linear-gradient(135deg,#00e67a,#00b85c)',border:'none',color:'#0a0b14',fontWeight:700,fontSize:16,cursor:depositLoading?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow:'0 4px 20px rgba(0,230,122,0.2)' }}>
                {depositLoading ? (
                  <><div style={{ width:18,height:18,border:'2.5px solid rgba(10,11,20,0.4)',borderTopColor:'#0a0b14',borderRadius:'50%',animation:'spin 0.8s linear infinite' }} />Processing...</>
                ) : '📱 Send M-Pesa Request'}
              </button>

              <p style={{ textAlign:'center',fontSize:11,color:'#334155' }}>
                Powered by <a href="https://app.abepayy.com" target="_blank" rel="noopener noreferrer" style={{ color:'#00e67a',textDecoration:'none' }}>AbePay</a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* WITHDRAW MODAL — Manual method for CR accounts */}
      {modal === 'withdraw' && (
        <div style={modalBg} onClick={()=>setModal(null)}>
          <div style={modalBox} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22 }}>
              <div>
                <h3 style={{ fontFamily:'Space Grotesk,sans-serif',fontWeight:800,fontSize:20,marginBottom:3 }}>⬆️ Withdraw Funds</h3>
                <p style={{ color:'#64748b',fontSize:12 }}>Manual withdrawal via Deriv Payment Agent</p>
              </div>
              <button onClick={()=>setModal(null)} style={{ width:32,height:32,borderRadius:8,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:'#64748b',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center' }}>✕</button>
            </div>

            <div style={{ display:'flex', marginBottom:20, borderRadius:12, overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)' }}>
              <button onClick={()=>setModal('deposit')} style={{ flex:1,padding:'10px 0',background:'none',border:'none',color:'#64748b',fontWeight:600,fontSize:13,cursor:'pointer' }}>⬇️ Deposit</button>
              <button style={{ flex:1,padding:'10px 0',background:'rgba(99,102,241,0.15)',border:'none',color:'#818cf8',fontWeight:700,fontSize:13,cursor:'default' }}>⬆️ Withdraw</button>
            </div>

            <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
              {/* Step 1 */}
              <div style={{ padding:'16px',borderRadius:14,background:'rgba(0,230,122,0.05)',border:'1px solid rgba(0,230,122,0.12)' }}>
                <div style={{ display:'flex',gap:12,alignItems:'flex-start',marginBottom:12 }}>
                  <div style={{ width:28,height:28,borderRadius:'50%',background:'rgba(0,230,122,0.15)',border:'1px solid rgba(0,230,122,0.25)',display:'flex',alignItems:'center',justifyContent:'center',color:'#00e67a',fontWeight:800,fontSize:13,flexShrink:0 }}>1</div>
                  <div>
                    <p style={{ fontWeight:700,fontSize:14,color:'#e2e8f0',marginBottom:4 }}>Go to Deriv and withdraw</p>
                    <p style={{ fontSize:12,color:'#64748b',lineHeight:1.6 }}>
                      Log in to <span style={{ color:'#00e67a',fontWeight:600 }}>app.deriv.com</span> → Cashier → Withdraw → Payment Agent → search <span style={{ color:'#e2e8f0',fontWeight:600 }}>"Traders Lounge"</span> and enter your amount.
                    </p>
                  </div>
                </div>
                <a href="https://app.deriv.com/cashier/withdrawal" target="_blank" rel="noopener noreferrer"
                  style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'12px 0',borderRadius:10,background:'linear-gradient(135deg,#00e67a,#00b85c)',color:'#0a0b14',fontWeight:700,fontSize:14,textDecoration:'none',boxShadow:'0 4px 16px rgba(0,230,122,0.2)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  Open Deriv Cashier
                </a>
              </div>

              {/* Step 2 */}
              <div style={{ padding:'14px 16px',borderRadius:14,background:'rgba(99,102,241,0.05)',border:'1px solid rgba(99,102,241,0.12)' }}>
                <div style={{ display:'flex',gap:12,alignItems:'flex-start' }}>
                  <div style={{ width:28,height:28,borderRadius:'50%',background:'rgba(99,102,241,0.15)',border:'1px solid rgba(99,102,241,0.25)',display:'flex',alignItems:'center',justifyContent:'center',color:'#818cf8',fontWeight:800,fontSize:13,flexShrink:0 }}>2</div>
                  <div>
                    <p style={{ fontWeight:700,fontSize:14,color:'#e2e8f0',marginBottom:4 }}>We detect it automatically</p>
                    <p style={{ fontSize:12,color:'#64748b',lineHeight:1.6 }}>
                      Our system monitors your agent account in real time. The moment your transfer arrives, it is matched to your account automatically.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div style={{ padding:'14px 16px',borderRadius:14,background:'rgba(0,230,122,0.05)',border:'1px solid rgba(0,230,122,0.12)' }}>
                <div style={{ display:'flex',gap:12,alignItems:'flex-start' }}>
                  <div style={{ width:28,height:28,borderRadius:'50%',background:'rgba(0,230,122,0.15)',border:'1px solid rgba(0,230,122,0.25)',display:'flex',alignItems:'center',justifyContent:'center',color:'#00e67a',fontWeight:800,fontSize:13,flexShrink:0 }}>3</div>
                  <div>
                    <p style={{ fontWeight:700,fontSize:14,color:'#e2e8f0',marginBottom:4 }}>M-Pesa sent within minutes</p>
                    <p style={{ fontSize:12,color:'#64748b',lineHeight:1.6 }}>
                      The KES equivalent is automatically sent to your registered M-Pesa number. Rate: <span style={{ color:'#00e67a',fontWeight:600 }}>1 USD = {withdrawRate} KES</span>
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ padding:'10px 14px',borderRadius:10,background:'rgba(245,158,11,0.06)',border:'1px solid rgba(245,158,11,0.15)' }}>
                <p style={{ fontSize:12,color:'#f59e0b',lineHeight:1.5 }}>
                  💡 <strong>First time?</strong> Make sure your M-Pesa number is saved in your AbePay account before withdrawing.
                  <a href="https://app.abepayy.com" target="_blank" rel="noopener noreferrer" style={{ color:'#f59e0b',marginLeft:4,textDecoration:'underline' }}>Open AbePay →</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HERO */}
      <section style={{ position:'relative',padding:'110px 24px 90px',textAlign:'center',overflow:'hidden' }}>
        <div style={{ position:'absolute',inset:0,pointerEvents:'none' }}>
          <div style={{ position:'absolute',top:'30%',left:'50%',transform:'translateX(-50%)',width:900,height:500,background:'radial-gradient(ellipse,rgba(0,230,122,0.07),transparent 70%)',borderRadius:'50%' }} />
        </div>
        <div style={{ position:'relative',maxWidth:860,margin:'0 auto' }}>
          <div style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'8px 20px',borderRadius:999,background:'rgba(0,230,122,0.07)',border:'1px solid rgba(0,230,122,0.18)',fontSize:13,color:'#00e67a',fontWeight:500,marginBottom:32 }}>
            <span style={{ width:8,height:8,borderRadius:'50%',background:'#00e67a',boxShadow:'0 0 0 0 rgba(0,230,122,0.4)',animation:'pulse 2s infinite',display:'inline-block' }} />
            Trusted by 12,000+ Traders Worldwide
          </div>
          <h1 style={{ fontFamily:'Space Grotesk,sans-serif',fontSize:'clamp(40px,7vw,76px)',fontWeight:900,lineHeight:1.05,marginBottom:24,letterSpacing:'-1.5px' }}>
            Trade with{' '}
            <span style={{ background:'linear-gradient(135deg,#00e67a,#00b85c)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>
              smarter tools
            </span>
          </h1>
          <p style={{ fontSize:18,color:'#64748b',maxWidth:580,margin:'0 auto 40px',lineHeight:1.65 }}>
            Professional bots, live charts, and automated strategies for Deriv synthetic indices. Your edge starts here.
          </p>
          <div style={{ display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap',marginBottom:40 }}>
            <button onClick={handleLogin}
              style={{ padding:'16px 38px',borderRadius:12,background:'linear-gradient(135deg,#00e67a,#00b85c)',border:'none',color:'#0a0b14',fontWeight:800,fontSize:17,cursor:'pointer',boxShadow:'0 0 32px rgba(0,230,122,0.3)',transition:'transform 0.1s' }}
              onMouseEnter={e=>(e.currentTarget.style.transform='scale(1.02)')}
              onMouseLeave={e=>(e.currentTarget.style.transform='scale(1)')}>
              Start Trading Now →
            </button>
            <a href="#features" style={{ padding:'16px 38px',borderRadius:12,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#e2e8f0',fontWeight:600,fontSize:17,textDecoration:'none',transition:'background 0.15s' }}
              onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.09)')}
              onMouseLeave={e=>(e.currentTarget.style.background='rgba(255,255,255,0.05)')}>
              Explore Features
            </a>
          </div>
          <div style={{ display:'flex',gap:28,justifyContent:'center',flexWrap:'wrap',fontSize:14,color:'#64748b' }}>
            {['No Credit Card','$10,000 Demo Account','Instant Withdrawals via AbePay'].map(t=>(
              <span key={t} style={{ display:'flex',alignItems:'center',gap:6 }}>
                <span style={{ color:'#00e67a' }}>✓</span>{t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ borderTop:'1px solid rgba(255,255,255,0.05)',borderBottom:'1px solid rgba(255,255,255,0.05)',padding:'48px 24px' }}>
        <div style={{ maxWidth:900,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:24,textAlign:'center' }}>
          {[['12K+','Active Traders'],['$890M+','Trading Volume'],['99.9%','Uptime'],['150+','Synthetic Pairs']].map(([v,l])=>(
            <div key={l}>
              <div style={{ fontFamily:'Space Grotesk,sans-serif',fontSize:40,fontWeight:900,color:'#00e67a',marginBottom:4 }}>{v}</div>
              <div style={{ fontSize:14,color:'#64748b' }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding:'80px 24px' }}>
        <div style={{ maxWidth:1100,margin:'0 auto' }}>
          <div style={{ textAlign:'center',marginBottom:56 }}>
            <p style={{ color:'#00e67a',fontSize:12,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:12 }}>Everything You Need</p>
            <h2 style={{ fontFamily:'Space Grotesk,sans-serif',fontSize:'clamp(28px,4vw,48px)',fontWeight:800,marginBottom:14 }}>Built for serious traders</h2>
            <p style={{ color:'#64748b',fontSize:17,maxWidth:500,margin:'0 auto' }}>Every tool to automate, analyze, and execute — all in one dashboard.</p>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:18 }}>
            {FEATURES.map((f,i)=>(
              <div key={i} style={{ position:'relative',background:f.grad,border:`1px solid ${f.border}`,borderRadius:20,padding:28,transition:'transform 0.2s',cursor:'default' }}
                onMouseEnter={e=>(e.currentTarget.style.transform='scale(1.02)')}
                onMouseLeave={e=>(e.currentTarget.style.transform='scale(1)')}>
                {f.soon&&<span style={{ position:'absolute',top:16,right:16,fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:999,background:'rgba(245,158,11,0.15)',color:'#f59e0b',border:'1px solid rgba(245,158,11,0.25)' }}>SOON</span>}
                <div style={{ fontSize:32,marginBottom:16 }}>{f.icon}</div>
                <h3 style={{ fontFamily:'Space Grotesk,sans-serif',fontWeight:700,fontSize:18,marginBottom:10 }}>{f.title}</h3>
                <p style={{ color:'#64748b',fontSize:14,lineHeight:1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ padding:'80px 24px',background:'rgba(0,0,0,0.25)' }}>
        <div style={{ maxWidth:1000,margin:'0 auto' }}>
          <div style={{ textAlign:'center',marginBottom:56 }}>
            <p style={{ color:'#00e67a',fontSize:12,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:12 }}>Get Started</p>
            <h2 style={{ fontFamily:'Space Grotesk,sans-serif',fontSize:'clamp(28px,4vw,48px)',fontWeight:800 }}>Up and running in 3 steps</h2>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:20 }}>
            {[
              { n:'01',icon:'🔗',title:'Connect Deriv',desc:'Log in with your Deriv account via OAuth. Works with real and demo accounts.' },
              { n:'02',icon:'🎯',title:'Pick a Strategy',desc:'Choose from our free bot library, build your own, or run the analysis tool.' },
              { n:'03',icon:'💸',title:'Trade & Withdraw',desc:'Run bots, monitor P&L, and withdraw profits to M-Pesa via AbePay instantly.' },
            ].map((s,i)=>(
              <div key={i} style={{ background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:20,padding:28,textAlign:'center' }}>
                <div style={{ fontSize:36,marginBottom:14 }}>{s.icon}</div>
                <div style={{ color:'#00e67a',fontSize:11,fontWeight:800,letterSpacing:'0.15em',marginBottom:12 }}>{s.n}</div>
                <h3 style={{ fontFamily:'Space Grotesk,sans-serif',fontWeight:700,fontSize:20,marginBottom:12 }}>{s.title}</h3>
                <p style={{ color:'#64748b',fontSize:14,lineHeight:1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="traders" style={{ padding:'80px 24px' }}>
        <div style={{ maxWidth:1100,margin:'0 auto' }}>
          <div style={{ textAlign:'center',marginBottom:56 }}>
            <p style={{ color:'#00e67a',fontSize:12,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:12 }}>Real Traders</p>
            <h2 style={{ fontFamily:'Space Grotesk,sans-serif',fontSize:'clamp(28px,4vw,48px)',fontWeight:800 }}>Trusted across Africa</h2>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:18 }}>
            {[
              { initials:'MK',name:'Musa Kamau',role:'Algorithmic Trader',text:'"The bot builder changed everything. From 6 hours of manual trading to 3 automated strategies running overnight."' },
              { initials:'AF',name:'Amina Farah',role:'Forex Specialist',text:'"Free bots library alone is worth it. I copied the Boom/Crash strategy and have been consistently profitable."' },
              { initials:'JO',name:'James Okoro',role:'Independent Trader',text:'"Finally a platform built for serious traders. Charts are clean, execution is fast, and AbePay withdrawals are instant."' },
              { initials:'TW',name:'Tiffany Wanjiku',role:'Bot Developer',text:'"Better UX than anything else out there. More bot options and the support team actually responds."' },
            ].map((t,i)=>(
              <div key={i} style={{ background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:20,padding:24,display:'flex',flexDirection:'column',gap:14 }}>
                <div style={{ display:'flex',gap:3 }}>{Array.from({length:5}).map((_,j)=><span key={j} style={{ color:'#facc15',fontSize:14 }}>★</span>)}</div>
                <p style={{ color:'#64748b',fontSize:14,lineHeight:1.65,fontStyle:'italic',flex:1 }}>{t.text}</p>
                <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                  <div style={{ width:36,height:36,borderRadius:'50%',background:'rgba(0,230,122,0.12)',border:'1px solid rgba(0,230,122,0.2)',display:'flex',alignItems:'center',justifyContent:'center',color:'#00e67a',fontWeight:700,fontSize:12 }}>{t.initials}</div>
                  <div>
                    <div style={{ fontWeight:600,fontSize:14 }}>{t.name}</div>
                    <div style={{ color:'#64748b',fontSize:12 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:'80px 24px' }}>
        <div style={{ maxWidth:680,margin:'0 auto',textAlign:'center',background:'rgba(0,230,122,0.05)',border:'1px solid rgba(0,230,122,0.15)',borderRadius:28,padding:'64px 40px',boxShadow:'0 0 40px rgba(0,230,122,0.08)' }}>
          <div style={{ fontSize:56,marginBottom:24 }}>🚀</div>
          <h2 style={{ fontFamily:'Space Grotesk,sans-serif',fontSize:'clamp(28px,4vw,44px)',fontWeight:800,marginBottom:16 }}>Ready to trade smarter?</h2>
          <p style={{ color:'#64748b',fontSize:17,marginBottom:36,lineHeight:1.65 }}>Join thousands of traders automating their strategies on Deriv synthetic indices.</p>
          <button onClick={handleLogin}
            style={{ padding:'18px 44px',borderRadius:14,background:'linear-gradient(135deg,#00e67a,#00b85c)',border:'none',color:'#0a0b14',fontWeight:800,fontSize:17,cursor:'pointer',boxShadow:'0 4px 32px rgba(0,230,122,0.3)',transition:'transform 0.1s' }}
            onMouseEnter={e=>(e.currentTarget.style.transform='scale(1.02)')}
            onMouseLeave={e=>(e.currentTarget.style.transform='scale(1)')}>
            Connect Deriv Account →
          </button>
          <p style={{ color:'#334155',fontSize:13,marginTop:16 }}>Free · No credit card · Instant setup</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop:'1px solid rgba(255,255,255,0.05)',padding:'32px 24px' }}>
        <div style={{ maxWidth:1100,margin:'0 auto',display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:16 }}>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            <div style={{ width:24,height:24,borderRadius:6,background:'linear-gradient(135deg,#00e67a,#00b85c)',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <span style={{ color:'#0a0b14',fontWeight:900,fontSize:11 }}>TL</span>
            </div>
            <span style={{ fontFamily:'Space Grotesk,sans-serif',fontWeight:700,fontSize:15 }}>Traders Lounge</span>
          </div>
          <p style={{ color:'#334155',fontSize:13,textAlign:'center' }}>Trading involves risk. Only trade with funds you can afford to lose. Powered by Deriv.</p>
          <div style={{ display:'flex',gap:16,fontSize:13,color:'#334155' }}>
            <a href="https://app.abepayy.com" style={{ color:'#00e67a',textDecoration:'none' }}>AbePay</a>
            <span>© 2026 Traders Lounge</span>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(0,230,122,0.4); } 70% { box-shadow: 0 0 0 8px rgba(0,230,122,0); } 100% { box-shadow: 0 0 0 0 rgba(0,230,122,0); } }
        .fade-in { animation: fadeIn 0.4s ease-out both; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>
    </div>
  );
}
