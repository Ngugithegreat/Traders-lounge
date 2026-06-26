'use client';
import Link from 'next/link';
export default function Page() {
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: 24 }}>
      <div style={{ fontSize: 72, marginBottom: 24 }}>🧠</div>
      <div style={{ padding: '6px 20px', borderRadius: 999, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: 'hsl(38 92% 50%)', fontSize: 13, fontWeight: 700, marginBottom: 24 }}>Coming Soon</div>
      <h1 className="font-display" style={{ fontSize: 36, fontWeight: 800, marginBottom: 14 }}>AI Software</h1>
      <p style={{ color: 'hsl(215 20% 55%)', fontSize: 16, maxWidth: 420, lineHeight: 1.65, marginBottom: 32 }}>AI-powered market analysis and smart trade signals for Deriv synthetic indices based on live data patterns.</p>
      <Link href="/dashboard" className="btn-primary" style={{ padding: '14px 36px', fontSize: 15 }}>Back to Dashboard</Link>
    </div>
  );
}