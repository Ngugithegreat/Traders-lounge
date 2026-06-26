'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const APP_ID = process.env.NEXT_PUBLIC_DERIV_APP_ID || '33BguwaY1RGDz9J48qvkJ';

function CallbackContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    async function run() {
      try {
        const accounts: { loginid: string; token: string }[] = [];
        for (let i = 1; i <= 10; i++) {
          const loginid = params.get(`acct${i}`);
          const token = params.get(`token${i}`);
          if (!loginid || !token) break;
          accounts.push({ loginid: loginid.toUpperCase(), token });
        }
        if (!accounts.length) { setError('No accounts returned. Please try again.'); return; }

        const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);
        const authData = await new Promise<any>((resolve, reject) => {
          const t = setTimeout(() => { ws.close(); reject(new Error('Timeout')); }, 15000);
          ws.onopen = () => ws.send(JSON.stringify({ authorize: accounts[0].token }));
          ws.onmessage = (e) => {
            const d = JSON.parse(e.data);
            if (d.error) { clearTimeout(t); ws.close(); reject(new Error(d.error.message)); return; }
            if (d.authorize) { clearTimeout(t); ws.close(); resolve(d.authorize); }
          };
          ws.onerror = () => { clearTimeout(t); ws.close(); reject(new Error('WebSocket error')); };
        });

        const list: any[] = authData.account_list || [];
        const enriched = accounts.map(a => {
          const match = list.find((al: any) => al.loginid.toUpperCase() === a.loginid);
          return { ...a, currency: match?.currency || 'USD', is_virtual: match?.is_virtual === 1 };
        });
        const real = enriched.filter(a => !a.is_virtual && a.currency === 'USD');
        const chosen = real[0] || enriched[0];

        await fetch('/api/auth/save-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            account: chosen.loginid, token: chosen.token,
            email: authData.email, fullname: authData.fullname,
            currency: chosen.currency, is_virtual: chosen.is_virtual,
            all_accounts: enriched,
          }),
        });

        localStorage.setItem('tl_account', chosen.loginid);
        localStorage.setItem('tl_token', chosen.token);
        localStorage.setItem('tl_name', authData.fullname || '');
        localStorage.setItem('tl_virtual', String(chosen.is_virtual));
        router.replace('/dashboard');
      } catch (e: any) {
        setError(e.message || 'Authentication failed.');
      }
    }
    run();
  }, [params, router]);

  if (error) return (
    <div style={{ minHeight: '100vh', background: 'hsl(220 30% 7%)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
      <div>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 22, color: 'hsl(210 40% 96%)', marginBottom: 12 }}>Connection failed</h2>
        <p style={{ color: 'hsl(215 20% 55%)', marginBottom: 24 }}>{error}</p>
        <a href="/" className="btn-primary" style={{ padding: '12px 28px', fontSize: 15 }}>Try Again</a>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(220 30% 7%)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(0,230,130,0.15)', border: '1px solid rgba(0,230,130,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <div style={{ width: 28, height: 28, border: '2.5px solid hsl(158 100% 44%)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
        <h2 style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 20, color: 'hsl(210 40% 96%)', marginBottom: 8 }}>Connecting your account</h2>
        <p style={{ color: 'hsl(215 20% 55%)', fontSize: 14 }}>Verifying with Deriv...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function AuthCallback() {
  return <Suspense><CallbackContent /></Suspense>;
}