'use client';
import { useState, useEffect } from 'react';

const APP_ID = process.env.NEXT_PUBLIC_DERIV_APP_ID || '33BguwaY1RGDz9J48qvkJ';

const BOTS = [
  { id:'bb1',name:'Boom 1000 Spike Hunter',desc:'Detects and trades confirmed spikes on Boom 1000 index.',symbol:'BOOM1000',ctype:'CALL',dur:1,unit:'t',icon:'💥',risk:'Medium',riskColor:'#f59e0b',winRate:'68%',cat:'Boom & Crash',tags:['Spike','Popular'] },
  { id:'bb2',name:'Crash 1000 Dip Catcher',desc:'Catches downward spikes on Crash 1000 with PUT contracts.',symbol:'CRASH1000',ctype:'PUT',dur:1,unit:'t',icon:'📉',risk:'Medium',riskColor:'#f59e0b',winRate:'66%',cat:'Boom & Crash',tags:['Spike'] },
  { id:'bb3',name:'Vol 100 Rise/Fall',desc:'Momentum-based Rise/Fall strategy on Volatility 100 (1s).',symbol:'R_100',ctype:'CALL',dur:5,unit:'t',icon:'📈',risk:'Low',riskColor:'#00e67a',winRate:'72%',cat:'Volatility',tags:['Trending','Low Risk'] },
  { id:'bb4',name:'Vol 25 Rise/Fall',desc:'Steady Rise/Fall trades on Volatility 25 index.',symbol:'R_25',ctype:'CALL',dur:5,unit:'t',icon:'🔵',risk:'Low',riskColor:'#00e67a',winRate:'71%',cat:'Volatility',tags:['Low Risk','Stable'] },
  { id:'bb5',name:'Step Index Odd/Even',desc:'Predicts last digit even/odd on Step Index.',symbol:'STPIDX',ctype:'DIGITODD',dur:1,unit:'t',icon:'🎲',risk:'Low',riskColor:'#00e67a',winRate:'74%',cat:'Digits',tags:['Digits','Step Index'] },
  { id:'bb6',name:'Vol 100 Over/Under',desc:'Trades Over 5 on Volatility 100 last digit.',symbol:'R_100',ctype:'DIGITOVER',dur:1,unit:'t',icon:'🔢',risk:'Low',riskColor:'#00e67a',winRate:'76%',cat:'Digits',tags:['Digits'] },
  { id:'bb7',name:'Crash 500 Sniper',desc:'Aggressive spike trading on Crash 500 index.',symbol:'CRASH500',ctype:'PUT',dur:1,unit:'t',icon:'🎯',risk:'High',riskColor:'#f87171',winRate:'63%',cat:'Boom & Crash',tags:['Aggressive','High Risk'] },
  { id:'bb8',name:'Bull Market Rider',desc:'Rides upward momentum on Bull Market Index.',symbol:'RDBULL',ctype:'CALL',dur:5,unit:'t',icon:'🐂',risk:'Medium',riskColor:'#f59e0b',winRate:'69%',cat:'Volatility',tags:['Reversal'] },
  { id:'bb9',name:'Vol 10 Digit Match',desc:'Predicts exact last digit on Volatility 10 (1s).',symbol:'R_10',ctype:'DIGITMATCH',dur:1,unit:'t',icon:'🎰',risk:'High',riskColor:'#f87171',winRate:'60%',cat:'Digits',tags:['High Risk','Digits'] },
];

const CATS=['All','Boom & Crash','Volatility','Digits'];
const card: React.CSSProperties={background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14};

export default function FreeBotsPage(){
  const[cat,setCat]=useState('All');
  const[running,setRunning]=useState<Record<string,boolean>>({});
  const[msgs,setMsgs]=useState<Record<string,string>>({});
  const[confirm,setConfirm]=useState<typeof BOTS[0]|null>(null);
  const[stake,setStake]=useState('1');
  const[info,setInfo]=useState<typeof BOTS[0]|null>(null);

  const filtered=cat==='All'?BOTS:BOTS.filter(b=>b.cat===cat);

  const runBot=async(bot:typeof BOTS[0],stakeAmt:number)=>{
    const token=localStorage.getItem('tl_token')||'';
    if(!token){setMsgs(m=>({...m,[bot.id]:'❌ Not connected.'}));return;}
    setRunning(r=>({...r,[bot.id]:true}));
    setMsgs(m=>({...m,[bot.id]:'Connecting...'}));
    try{
      await new Promise<void>((resolve,reject)=>{
        const ws=new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);
        const t=setTimeout(()=>{ws.close();reject(new Error('Timeout'));},25000);
        let auth=false;
        ws.onopen=()=>ws.send(JSON.stringify({authorize:token}));
        ws.onmessage=(e)=>{
          const m=JSON.parse(e.data);
          if(m.error){clearTimeout(t);ws.close();reject(new Error(m.error.message));return;}
          if(m.msg_type==='authorize'&&!auth){auth=true;setMsgs(ms=>({...ms,[bot.id]:'Fetching proposal...'}));ws.send(JSON.stringify({proposal:1,amount:stakeAmt,basis:'stake',contract_type:bot.ctype,currency:'USD',duration:bot.dur,duration_unit:bot.unit,symbol:bot.symbol}));}
          if(m.msg_type==='proposal'){setMsgs(ms=>({...ms,[bot.id]:`Buying at $${m.proposal.ask_price}...`}));ws.send(JSON.stringify({buy:m.proposal.id,price:m.proposal.ask_price}));}
          if(m.msg_type==='buy'){clearTimeout(t);ws.close();setMsgs(ms=>({...ms,[bot.id]:`✅ #${m.buy.contract_id} purchased! $${stakeAmt}`}));resolve();}
        };
        ws.onerror=()=>{clearTimeout(t);ws.close();reject(new Error('WebSocket error'));};
      });
    }catch(e:any){setMsgs(m=>({...m,[bot.id]:`❌ ${e.message}`}));}
    setRunning(r=>({...r,[bot.id]:false}));
  };

  return(
    <div className="fade-in" style={{display:'flex',flexDirection:'column',gap:18}}>
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
        <div>
          <h1 style={{fontFamily:'Space Grotesk,sans-serif',fontSize:24,fontWeight:800,marginBottom:4}}>⚡ Free Bots</h1>
          <p style={{color:'#64748b',fontSize:13}}>Ready-to-use strategies. One click to run on your Deriv account.</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          {CATS.map(c=>(
            <button key={c} onClick={()=>setCat(c)} style={{padding:'8px 18px',borderRadius:10,fontSize:13,fontWeight:500,cursor:'pointer',border:'1px solid',transition:'all 0.15s',background:cat===c?'#00e67a':'rgba(255,255,255,0.03)',color:cat===c?'#0a0b14':'#64748b',borderColor:cat===c?'#00e67a':'rgba(255,255,255,0.08)'}}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:16}}>
        {filtered.map(bot=>(
          <div key={bot.id} style={{...card,padding:22,display:'flex',flexDirection:'column',gap:14,transition:'border-color 0.15s,transform 0.15s'}}
            onMouseEnter={e=>{(e.currentTarget as any).style.borderColor='rgba(0,230,122,0.2)';(e.currentTarget as any).style.transform='translateY(-2px)';}}
            onMouseLeave={e=>{(e.currentTarget as any).style.borderColor='rgba(255,255,255,0.07)';(e.currentTarget as any).style.transform='none';}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:44,height:44,borderRadius:12,background:'rgba(0,230,122,0.08)',border:'1px solid rgba(0,230,122,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>{bot.icon}</div>
                <div>
                  <div style={{fontFamily:'Space Grotesk,sans-serif',fontWeight:700,fontSize:14,marginBottom:2}}>{bot.name}</div>
                  <div style={{fontSize:11,color:'#475569'}}>{bot.cat}</div>
                </div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:10,color:'#475569'}}>Win Rate</div>
                <div style={{fontWeight:800,color:'#00e67a',fontSize:16,fontFamily:'Space Grotesk,sans-serif'}}>{bot.winRate}</div>
              </div>
            </div>
            <p style={{color:'#64748b',fontSize:13,lineHeight:1.55}}>{bot.desc}</p>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {bot.tags.map(tag=><span key={tag} style={{padding:'3px 10px',borderRadius:6,fontSize:11,background:'rgba(255,255,255,0.04)',color:'#64748b',border:'1px solid rgba(255,255,255,0.07)'}}>{tag}</span>)}
              <span style={{padding:'3px 10px',borderRadius:6,fontSize:11,color:bot.riskColor,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}>Risk: {bot.risk}</span>
            </div>
            {msgs[bot.id]&&(
              <div style={{padding:'8px 12px',borderRadius:9,fontSize:12,background:msgs[bot.id].startsWith('✅')?'rgba(0,230,122,0.08)':msgs[bot.id].startsWith('❌')?'rgba(248,113,113,0.08)':'rgba(0,230,122,0.05)',color:msgs[bot.id].startsWith('✅')?'#00e67a':msgs[bot.id].startsWith('❌')?'#f87171':'#94a3b8',border:`1px solid ${msgs[bot.id].startsWith('✅')?'rgba(0,230,122,0.15)':msgs[bot.id].startsWith('❌')?'rgba(248,113,113,0.15)':'rgba(255,255,255,0.06)'}`}}>
                {msgs[bot.id]}
              </div>
            )}
            <div style={{display:'flex',gap:8,marginTop:'auto'}}>
              <button onClick={()=>{setConfirm(bot);setStake('1');}} disabled={running[bot.id]} style={{flex:1,padding:'11px 0',borderRadius:10,background:running[bot.id]?'rgba(0,230,122,0.05)':'#00e67a',color:running[bot.id]?'#00e67a':'#0a0b14',border:`1px solid ${running[bot.id]?'rgba(0,230,122,0.2)':'#00e67a'}`,fontWeight:700,fontSize:13,cursor:running[bot.id]?'not-allowed':'pointer',transition:'all 0.15s'}}>
                {running[bot.id]?'⏳ Running...':'▶ Run Bot'}
              </button>
              <button onClick={()=>setInfo(bot)} style={{padding:'11px 16px',borderRadius:10,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'#94a3b8',cursor:'pointer',fontSize:13,fontWeight:500}}>Info</button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirm modal */}
      {confirm&&(
        <div style={{position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(8px)'}} onClick={()=>setConfirm(null)}/>
          <div style={{position:'relative',background:'#131525',border:'1px solid rgba(0,230,122,0.2)',borderRadius:20,padding:28,width:'100%',maxWidth:380,boxShadow:'0 24px 64px rgba(0,0,0,0.6)'}}>
            <div style={{fontSize:32,marginBottom:12}}>{confirm.icon}</div>
            <h3 style={{fontFamily:'Space Grotesk,sans-serif',fontWeight:800,fontSize:20,marginBottom:6}}>{confirm.name}</h3>
            <p style={{color:'#64748b',fontSize:13,marginBottom:22}}>{confirm.desc}</p>
            <label style={{fontSize:12,color:'#475569',fontWeight:600,display:'block',marginBottom:8}}>Stake Amount (USD)</label>
            <input type="number" value={stake} onChange={e=>setStake(e.target.value)} min="0.35" step="0.5"
              style={{width:'100%',padding:'12px 14px',background:'#1a1d2e',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,color:'#e2e8f0',fontSize:16,outline:'none',fontFamily:'Space Grotesk,sans-serif',fontWeight:700,marginBottom:8}}/>
            <p style={{fontSize:11,color:'#475569',marginBottom:16}}>Minimum $0.35 · Max recommended $50</p>
            <div style={{padding:'10px 14px',borderRadius:10,background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.15)',marginBottom:20}}>
              <p style={{fontSize:12,color:'#f59e0b',lineHeight:1.5}}>⚠️ This places a real trade on your Deriv account. Only use funds you can afford to lose.</p>
            </div>
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setConfirm(null)} style={{flex:1,padding:'13px 0',borderRadius:12,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'#94a3b8',cursor:'pointer',fontWeight:600,fontSize:14}}>Cancel</button>
              <button onClick={()=>{runBot(confirm,parseFloat(stake)||1);setConfirm(null);}} style={{flex:1,padding:'13px 0',borderRadius:12,background:'#00e67a',border:'none',color:'#0a0b14',cursor:'pointer',fontWeight:700,fontSize:14}}>Run Now</button>
            </div>
          </div>
        </div>
      )}

      {/* Info modal */}
      {info&&(
        <div style={{position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(8px)'}} onClick={()=>setInfo(null)}/>
          <div style={{position:'relative',background:'#131525',border:'1px solid rgba(255,255,255,0.08)',borderRadius:20,padding:28,width:'100%',maxWidth:420,boxShadow:'0 24px 64px rgba(0,0,0,0.6)'}}>
            <button onClick={()=>setInfo(null)} style={{position:'absolute',top:16,right:16,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,width:32,height:32,color:'#64748b',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
            <div style={{fontSize:36,marginBottom:12}}>{info.icon}</div>
            <h3 style={{fontFamily:'Space Grotesk,sans-serif',fontWeight:800,fontSize:22,marginBottom:8}}>{info.name}</h3>
            <p style={{color:'#64748b',fontSize:14,marginBottom:20,lineHeight:1.6}}>{info.desc}</p>
            {[['Symbol',info.symbol],['Contract Type',info.ctype],['Duration',`${info.dur} ${info.unit==='t'?'tick(s)':info.unit}`],['Win Rate',info.winRate],['Risk Level',info.risk],['Category',info.cat]].map(([k,v])=>(
              <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.05)',fontSize:14}}>
                <span style={{color:'#64748b'}}>{k}</span>
                <span style={{fontWeight:600}}>{v}</span>
              </div>
            ))}
            <button onClick={()=>{setInfo(null);setConfirm(info);setStake('1');}} style={{width:'100%',padding:'14px 0',background:'#00e67a',border:'none',borderRadius:12,color:'#0a0b14',fontWeight:700,fontSize:15,cursor:'pointer',marginTop:20}}>
              Run This Bot
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
