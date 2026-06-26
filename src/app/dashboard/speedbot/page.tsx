'use client';
import Link from 'next/link';
export default function Page() {
  return (
    <div className="fade-in" style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'65vh',textAlign:'center',padding:24,fontFamily:'Inter,sans-serif',color:'#e2e8f0' }}>
      <div style={{ width:80,height:80,borderRadius:20,background:'rgba(0,230,122,0.12)',border:'1px solid rgba(0,230,122,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:36,marginBottom:24 }}>🚀</div>
      <div style={{ padding:'6px 18px',borderRadius:999,background:'rgba(245,158,11,0.1)',border:'1px solid rgba(245,158,11,0.25)',color:'#f59e0b',fontSize:12,fontWeight:700,marginBottom:20,letterSpacing:'0.08em',textTransform:'uppercase' }}>Coming Soon</div>
      <h1 style={{ fontFamily:'Space Grotesk,sans-serif',fontSize:34,fontWeight:800,marginBottom:12 }}>Speedbot</h1>
      <p style={{ color:'#64748b',fontSize:15,maxWidth:420,lineHeight:1.65,marginBottom:32 }}>Ultra-fast execution engine for high-frequency synthetic index trading. Sub-second response times.</p>
      <Link href="/dashboard" style={{ padding:'13px 32px',background:'#00e67a',color:'#0a0b14',borderRadius:12,fontWeight:700,textDecoration:'none',fontSize:15 }}>Back to Dashboard</Link>
    </div>
  );
}
