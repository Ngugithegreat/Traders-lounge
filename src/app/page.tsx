'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

const APP_ID = process.env.NEXT_PUBLIC_DERIV_APP_ID || '33BguwaY1RGDz9J48qvkJ';

const TICKER = [
  { label: 'Vol 100(1s)', price: '8241.23', up: true },
  { label: 'Vol 75', price: '5109.87', up: false },
  { label: 'Vol 50', price: '3847.12', up: true },
  { label: 'Vol 25', price: '2190.44', up: false },
  { label: 'Vol 10', price: '1023.67', up: true },
  { label: 'Boom 1000', price: '6782.33', up: true },
  { label: 'Crash 1000', price: '4391.18', up: false },
  { label: 'Step Index', price: '892.54', up: true },
  { label: 'Bull Market', price: '1064.13', up: true },
  { label: 'Bear Market', price: '909.58', up: false },
];

const FEATURES = [
  { icon: '🤖', title: 'Bot Builder', desc: 'Build automated bots with a visual editor. Set stake, duration, martingale, take profit and stop loss — no coding needed.', grad: 'linear-gradient(135deg,rgba(0,230,130,.12),rgba(0,180,100,.06))', border: 'rgba(0,230,130,.2)' },
  { icon: '⚡', title: 'Free Bots', desc: 'Browse our library of ready-to-run strategies for Boom/Crash, Volatility, and Digit indices.', grad: 'linear-gradient(135deg,rgba(99,102,241,.12),rgba(79,70,229,.06))', border: 'rgba(99,102,241,.2)' },
  { icon: '📊', title: 'Live Charts', desc: 'Full TradingView charts with 100+ indicators, all Deriv synthetic pairs, multiple timeframes.', grad: 'linear-gradient(135deg,rgba(168,85,247,.12),rgba(139,92,246,.06))', border: 'rgba(168,85,247,.2)' },
  { icon: '📋', title: 'Copy Trading', desc: 'Follow and auto-copy top-performing traders in real time. Set risk limits per trader.', grad: 'linear-gradient(135deg,rgba(249,115,22,.12),rgba(239,68,68,.06))', border: 'rgba(249,115,22,.2)', soon: true },
  { icon: '🧠', title: 'AI Software', desc: 'AI-powered market analysis and smart trade signals based on live synthetic index data.', grad: 'linear-gradient(135deg,rgba(6,182,212,.12),rgba(14,165,233,.06))', border: 'rgba(6,182,212,.2)', soon: true },
  { icon: '🚀', title: 'Speedbot', desc: 'Ultra-fast execution engine for high-frequency synthetic index trading with sub-second response.', grad: 'linear-gradient(135deg,rgba(234,179,8,.12),rgba(245,158,11,.06))', border: 'rgba(234,179,8,.2)', soon: true },
];

const TESTIMONIALS = [
  { initials: 'MK', name: 'Musa Kamau', role: 'Algorithmic Trader', text: '"The bot builder changed everything. From 6 hours of manual trading a day to 3 automated strategies running overnight."', stars: 5 },
  { initials: 'AF', name: 'Amina Farah', role: 'Forex Specialist', text: '"Free bots library alone is worth it. Copied the Boom/Crash strategy, tweaked the stake sizes, and have been consistently profitable."', stars: 5 },
  { initials: 'JO', name: 'James Okoro', role: 'Independent Trader', text: '"Finally a platform built for serious traders. Charts are clean, execution is fast, and withdrawals via AbePay are instant."', stars: 5 },
  { initials: 'TW', name: 'Tiffany Wanjiku', role: 'Bot Developer', text: '"Better UX than DBTraders, more bot options, and the support actually responds. This is the one."', stars: 5 },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const handleLogin = () => {
    const state = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('oauth_state', state);
    window.location.href = `https://oauth.deriv.com/oauth2/authorize?app_id=${APP_ID}&brand=deriv&redirect=home&state=${state}`;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(220 30% 7%)', color: 'hsl(210 40% 96%)', overflowX: 'hidden' }}>

      {/* ── Ticker ── */}
      <div style={{ background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '8px 0' }} className="ticker-wrap">
        <div className="ticker-track">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontFamily: 'monospace' }}>
              <span style={{ color: 'hsl(215 20% 55%)' }}>{t.label}</span>
              <span style={{ color: t.up ? '#34d399' : '#f87171', fontWeight: 600 }}>{t.price}</span>
              <span style={{ color: t.up ? '#34d399' : '#f87171' }}>{t.up ? '▲' : '▼'}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Navbar ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: scrolled ? 'rgba(12,14,22,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : 'none',
        transition: 'all 0.3s',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'hsl(158 100% 44%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'hsl(220 30% 7%)', fontWeight: 800, fontSize: 13, fontFamily: 'Space Grotesk, sans-serif' }}>TL</span>
            </div>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 17 }}>Traders Lounge</span>
          </div>
          <nav style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {[['#features','Features'],['#how-it-works','How It Works'],['#testimonials','Traders']].map(([href, label]) => (
              <a key={href} href={href} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500, color: 'hsl(215 20% 55%)', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'hsl(210 40% 96%)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'hsl(215 20% 55%)')}>{label}</a>
            ))}
          </nav>
          <button onClick={handleLogin} className="btn-primary glow-green-sm" style={{ padding: '10px 22px', fontSize: 14 }}>
            Login with Deriv →
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{ position: 'relative', padding: '100px 24px 80px', textAlign: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: 800, height: 500, background: 'radial-gradient(ellipse,rgba(0,230,130,0.09),transparent 70%)', borderRadius: '50%' }} />
        </div>
        <div style={{ position: 'relative', maxWidth: 860, margin: '0 auto' }}>
          <div className="slide-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 999, background: 'rgba(0,230,130,0.08)', border: '1px solid rgba(0,230,130,0.2)', fontSize: 13, color: 'hsl(158 100% 44%)', fontWeight: 500, marginBottom: 32 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'hsl(158 100% 44%)' }} className="pulse-green" />
            Trusted by 12,000+ Traders Worldwide
          </div>

          <h1 className="slide-up font-display" style={{ fontSize: 'clamp(40px,7vw,76px)', fontWeight: 800, lineHeight: 1.05, marginBottom: 24, animationDelay: '0.05s' }}>
            Trade with{' '}
            <span style={{ color: 'hsl(158 100% 44%)', position: 'relative' }}>smarter tools</span>
          </h1>

          <p className="slide-up" style={{ fontSize: 18, color: 'hsl(215 20% 55%)', maxWidth: 580, margin: '0 auto 40px', lineHeight: 1.65, animationDelay: '0.1s' }}>
            Professional bots, live charts, and automated strategies for Deriv synthetic indices. Build your edge — no code required.
          </p>

          <div className="slide-up" style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40, animationDelay: '0.15s' }}>
            <button onClick={handleLogin} className="btn-primary glow-green" style={{ padding: '16px 36px', fontSize: 16 }}>
              Start Trading Now →
            </button>
            <a href="#features" className="btn-ghost" style={{ padding: '16px 36px', fontSize: 16 }}>
              Explore Features
            </a>
          </div>

          <div className="slide-up" style={{ display: 'flex', gap: 28, justifyContent: 'center', flexWrap: 'wrap', fontSize: 14, color: 'hsl(215 20% 55%)', animationDelay: '0.2s' }}>
            {['No Credit Card','$10,000 Demo Account','Instant Withdrawals via AbePay'].map(t => (
              <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'hsl(158 100% 44%)' }}>✓</span> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '48px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 24, textAlign: 'center' }}>
          {[['12K+','Active Traders'],['$890M+','Trading Volume'],['99.9%','Uptime'],['150+','Synthetic Pairs']].map(([v,l]) => (
            <div key={l}>
              <div className="font-display" style={{ fontSize: 40, fontWeight: 800, color: 'hsl(158 100% 44%)', marginBottom: 4 }}>{v}</div>
              <div style={{ fontSize: 14, color: 'hsl(215 20% 55%)' }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ color: 'hsl(158 100% 44%)', fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Everything You Need</p>
            <h2 className="font-display" style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, marginBottom: 16 }}>Built for serious traders</h2>
            <p style={{ color: 'hsl(215 20% 55%)', fontSize: 17, maxWidth: 500, margin: '0 auto' }}>Every tool to automate, analyze, and execute — all in one dashboard.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ position: 'relative', background: f.grad, border: `1px solid ${f.border}`, borderRadius: 20, padding: 28, transition: 'transform 0.2s', cursor: 'default' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
                {f.soon && (
                  <span style={{ position: 'absolute', top: 16, right: 16, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(245,158,11,0.15)', color: 'hsl(38 92% 50%)', border: '1px solid rgba(245,158,11,0.3)' }}>SOON</span>
                )}
                <div style={{ fontSize: 32, marginBottom: 16 }}>{f.icon}</div>
                <h3 className="font-display" style={{ fontWeight: 700, fontSize: 18, marginBottom: 10 }}>{f.title}</h3>
                <p style={{ color: 'hsl(215 20% 55%)', fontSize: 14, lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" style={{ padding: '80px 24px', background: 'rgba(0,0,0,0.2)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ color: 'hsl(158 100% 44%)', fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Get Started</p>
            <h2 className="font-display" style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800 }}>Up and running in 3 steps</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 24 }}>
            {[
              { n:'01', icon:'🔗', title:'Connect Deriv', desc:'Log in with your existing Deriv account via OAuth. Works with real and demo accounts.' },
              { n:'02', icon:'🎯', title:'Pick a Strategy', desc:'Choose from our free bot library, build your own in the visual editor, or import an XML bot.' },
              { n:'03', icon:'💸', title:'Trade & Earn', desc:'Run your bots, monitor live P&L, and withdraw profits instantly to M-Pesa via AbePay.' },
            ].map((s, i) => (
              <div key={i} className="glass" style={{ borderRadius: 20, padding: 28, textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{s.icon}</div>
                <div style={{ color: 'hsl(158 100% 44%)', fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', marginBottom: 12 }}>{s.n}</div>
                <h3 className="font-display" style={{ fontWeight: 700, fontSize: 20, marginBottom: 12 }}>{s.title}</h3>
                <p style={{ color: 'hsl(215 20% 55%)', fontSize: 14, lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ color: 'hsl(158 100% 44%)', fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Real Traders</p>
            <h2 className="font-display" style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800 }}>Trusted across Africa</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 20 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="glass" style={{ borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', gap: 4 }}>{Array.from({length:t.stars}).map((_,j)=><span key={j} style={{color:'#facc15',fontSize:14}}>★</span>)}</div>
                <p style={{ color: 'hsl(215 20% 55%)', fontSize: 14, lineHeight: 1.65, fontStyle: 'italic', flex: 1 }}>{t.text}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,230,130,0.15)', border: '1px solid rgba(0,230,130,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(158 100% 44%)', fontWeight: 700, fontSize: 12 }}>{t.initials}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                    <div style={{ color: 'hsl(215 20% 55%)', fontSize: 12 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '80px 24px' }}>
        <div className="glass glow-green" style={{ maxWidth: 680, margin: '0 auto', borderRadius: 28, padding: '64px 40px', textAlign: 'center', border: '1px solid rgba(0,230,130,0.2)' }}>
          <div style={{ fontSize: 56, marginBottom: 24 }}>🚀</div>
          <h2 className="font-display" style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, marginBottom: 16 }}>Ready to trade smarter?</h2>
          <p style={{ color: 'hsl(215 20% 55%)', fontSize: 17, marginBottom: 36, lineHeight: 1.65 }}>Join thousands of traders automating their strategies on Deriv synthetic indices.</p>
          <button onClick={handleLogin} className="btn-primary glow-green" style={{ padding: '18px 44px', fontSize: 17 }}>
            Connect Deriv Account →
          </button>
          <p style={{ color: 'hsl(215 20% 55%)', fontSize: 13, marginTop: 16 }}>Free to use · No credit card · Instant setup</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: 'hsl(158 100% 44%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'hsl(220 30% 7%)', fontWeight: 800, fontSize: 11 }}>TL</span>
            </div>
            <span className="font-display" style={{ fontWeight: 700, fontSize: 15 }}>Traders Lounge</span>
          </div>
          <p style={{ color: 'hsl(215 20% 55%)', fontSize: 13, textAlign: 'center' }}>Trading involves risk. Only trade with funds you can afford to lose. Powered by Deriv.</p>
          <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'hsl(215 20% 55%)' }}>
            <a href="https://abepayy.com" style={{ color: 'hsl(158 100% 44%)', textDecoration: 'none' }}>AbePay</a>
            <span>© 2026 Traders Lounge</span>
          </div>
        </div>
      </footer>
    </div>
  );
}