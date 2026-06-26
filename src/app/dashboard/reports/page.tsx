'use client';
import { useState, useEffect, useCallback } from 'react';

const card: React.CSSProperties = { background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14 };

export default function ReportsPage() {
  const [transactions,setTransactions]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [filter,setFilter]=useState('all');

  const load=useCallback(async()=>{
    const acct=localStorage.getItem('tl_account')||'';
    if(!acct)return;
    try{
      const r=await fetch(`/api/deriv/statement?account=${acct}&limit=100`);
      const d=await r.json();
      if(d.success)setTransactions(d.transactions||[]);
    }catch(_){}
    setLoading(false);
  },[]);

  useEffect(()=>{load();},[load]);

  const filtered=filter==='all'?transactions:transactions.filter(t=>t.action_type===filter);
  const totalWon=transactions.filter(t=>parseFloat(t.amount||'0')>0).reduce((s,t)=>s+parseFloat(t.amount||'0'),0);
  const totalLost=transactions.filter(t=>parseFloat(t.amount||'0')<0).reduce((s,t)=>s+parseFloat(t.amount||'0'),0);
  const netPnl=totalWon+totalLost;
  const winCount=transactions.filter(t=>parseFloat(t.amount||'0')>0).length;
  const lossCount=transactions.filter(t=>parseFloat(t.amount||'0')<0).length;

  return(
    <div className="fade-in" style={{display:'flex',flexDirection:'column',gap:20}}>
      <div>
        <h1 style={{fontFamily:'Space Grotesk,sans-serif',fontSize:24,fontWeight:800,marginBottom:4}}>📈 Reports</h1>
        <p style={{color:'#64748b',fontSize:13}}>Your complete trading history and performance summary.</p>
      </div>

      {/* Summary cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:14}}>
        {[
          {label:'Net P&L',val:`${netPnl>=0?'+':''}$${Math.abs(netPnl).toFixed(2)}`,color:netPnl>=0?'#00e67a':'#f87171',icon:'💰'},
          {label:'Total Won',val:`+$${totalWon.toFixed(2)}`,color:'#00e67a',icon:'✅'},
          {label:'Total Lost',val:`-$${Math.abs(totalLost).toFixed(2)}`,color:'#f87171',icon:'❌'},
          {label:'Win Rate',val:transactions.length>0?`${((winCount/transactions.length)*100).toFixed(1)}%`:'—',color:'#818cf8',icon:'🎯'},
          {label:'Trades',val:String(transactions.length),color:'#94a3b8',icon:'📋'},
          {label:'W / L',val:`${winCount} / ${lossCount}`,color:'#f59e0b',icon:'📊'},
        ].map((s,i)=>(
          <div key={i} style={{...card,padding:'16px 18px'}}>
            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
              <span style={{fontSize:16}}>{s.icon}</span>
              <span style={{fontSize:11,color:'#475569',textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:600}}>{s.label}</span>
            </div>
            <div style={{fontFamily:'Space Grotesk,sans-serif',fontWeight:800,fontSize:22,color:s.color}}>{loading?'...':s.val}</div>
          </div>
        ))}
      </div>

      {/* Win rate bar */}
      {transactions.length>0&&(
        <div style={{...card,padding:'16px 20px'}}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:10}}>
            <span style={{color:'#64748b'}}>Win Rate</span>
            <span style={{fontWeight:700,color:'#00e67a'}}>{((winCount/transactions.length)*100).toFixed(1)}%</span>
          </div>
          <div style={{display:'flex',borderRadius:999,overflow:'hidden',height:8,background:'rgba(248,113,113,0.3)'}}>
            <div style={{width:`${(winCount/transactions.length)*100}%`,background:'#00e67a',transition:'width 0.5s'}}/>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#475569',marginTop:6}}>
            <span>Won: {winCount}</span><span>Lost: {lossCount}</span>
          </div>
        </div>
      )}

      {/* Filter */}
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        {[['all','All'],['buy','Buys'],['sell','Sells'],['deposit','Deposits'],['withdrawal','Withdrawals']].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{padding:'7px 16px',borderRadius:8,fontSize:13,fontWeight:500,cursor:'pointer',border:'1px solid',transition:'all 0.15s',background:filter===v?'#00e67a':'rgba(255,255,255,0.03)',color:filter===v?'#0a0b14':'#64748b',borderColor:filter===v?'#00e67a':'rgba(255,255,255,0.08)'}}>
            {l}
          </button>
        ))}
        <button onClick={load} style={{marginLeft:'auto',padding:'7px 16px',borderRadius:8,fontSize:13,fontWeight:500,cursor:'pointer',border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.03)',color:'#64748b'}}>
          🔄 Refresh
        </button>
      </div>

      {/* Table */}
      {loading?(
        <div style={{...card,padding:40,textAlign:'center',color:'#475569'}}>Loading your trading history...</div>
      ):filtered.length===0?(
        <div style={{...card,padding:48,textAlign:'center'}}>
          <div style={{fontSize:36,marginBottom:12}}>📭</div>
          <p style={{color:'#64748b',fontSize:14}}>No transactions found.</p>
        </div>
      ):(
        <div style={{...card,overflow:'hidden'}}>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{borderBottom:'1px solid rgba(255,255,255,0.06)',background:'rgba(0,0,0,0.2)'}}>
                  {['Date & Time','Description','Action','Amount','Balance After'].map(h=>(
                    <th key={h} style={{textAlign:'left',padding:'12px 16px',fontSize:11,color:'#475569',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0,50).map((tx:any,i:number)=>{
                  const amt=parseFloat(tx.amount||'0');
                  return(
                    <tr key={i} style={{borderBottom:'1px solid rgba(255,255,255,0.03)',transition:'background 0.1s'}}
                      onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.02)')}
                      onMouseLeave={e=>(e.currentTarget.style.background='none')}>
                      <td style={{padding:'12px 16px',fontSize:11,color:'#475569',whiteSpace:'nowrap'}}>{new Date((tx.transaction_time||0)*1000).toLocaleString()}</td>
                      <td style={{padding:'12px 16px',fontSize:11,color:'#64748b',maxWidth:220}}><span style={{display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{tx.longcode||tx.shortcode||'—'}</span></td>
                      <td style={{padding:'12px 16px'}}><span style={{padding:'2px 8px',borderRadius:5,fontSize:10,background:'rgba(255,255,255,0.04)',color:'#64748b',textTransform:'uppercase',fontWeight:600}}>{tx.action_type}</span></td>
                      <td style={{padding:'12px 16px',fontWeight:700,color:amt>=0?'#00e67a':'#f87171'}}>{amt>=0?'+':''}{amt.toFixed(2)}</td>
                      <td style={{padding:'12px 16px',color:'#94a3b8'}}>{parseFloat(tx.balance_after||'0').toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length>50&&<div style={{padding:'12px 16px',textAlign:'center',fontSize:12,color:'#475569',borderTop:'1px solid rgba(255,255,255,0.05)'}}>Showing 50 of {filtered.length} transactions</div>}
        </div>
      )}
    </div>
  );
}
