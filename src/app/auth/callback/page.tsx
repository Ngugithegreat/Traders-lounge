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

        // Save to localStorage (persists across sessions)
        localStorage.setItem('tl_account', chosen.loginid);
        localStorage.setItem('tl_token', chosen.token);
        localStorage.setItem('tl_name', authData.fullname || '');
        localStorage.setItem('tl_virtual', String(chosen.is_virtual));
        localStorage.setItem('tl_all_accounts', JSON.stringify(enriched));
        localStorage.setItem('tl_currency', chosen.currency || 'USD');

        // Save expiry — token lasts 30 days, refresh after 25 days
        const expiresAt = Date.now() + 25 * 24 * 60 * 60 * 1000;
        localStorage.setItem('tl_token_expires', String(expiresAt));

        router.replace('/dashboard');
      } catch (e: any) {
        setError(e.message || 'Authentication failed.');
      }
    }
    run();
  }, [params, router]);

  const S: React.CSSProperties = { minHeight: '100vh', background: '#0d0e1a', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24, fontFamily: 'Inter,sans-serif', color: '#e2e8f0' };

  if (error) return (
    <div style={S}>
      <div>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 22, marginBottom: 12 }}>Connection failed</h2>
        <p style={{ color: '#64748b', marginBottom: 24, fontSize: 14 }}>{error}</p>
        <a href="/" style={{ padding: '12px 28px', background: '#00e67a', color: '#0a0b14', borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: 15 }}>Try Again</a>
      </div>
    </div>
  );

  return (
    <div style={S}>
      <div>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(0,230,122,0.12)', border: '1px solid rgba(0,230,122,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <div style={{ width: 26, height: 26, border: '2.5px solid #00e67a', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
        <h2 style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Connecting your account</h2>
        <p style={{ color: '#64748b', fontSize: 14 }}>Verifying with Deriv...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function AuthCallback() {
  return <Suspense><CallbackContent /></Suspense>;
}
