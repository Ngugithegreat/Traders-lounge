export const APP_ID = process.env.NEXT_PUBLIC_DERIV_APP_ID || '33BguwaY1RGDz9J48qvkJ';

export const DERIV_WS = `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`;

export function derivSocket(): WebSocket {
  return new WebSocket(DERIV_WS);
}

export type SyntheticSymbol = {
  symbol: string;
  name: string;
  short: string;
  category: 'Volatility' | 'Boom & Crash' | 'Step & Range' | 'Jump';
  icon: string;
};

// Curated set of Deriv synthetic indices used across the app.
export const SYNTHETIC_SYMBOLS: SyntheticSymbol[] = [
  { symbol: 'R_10', name: 'Volatility 10 Index', short: 'Vol 10', category: 'Volatility', icon: '🔵' },
  { symbol: 'R_25', name: 'Volatility 25 Index', short: 'Vol 25', category: 'Volatility', icon: '🔵' },
  { symbol: 'R_50', name: 'Volatility 50 Index', short: 'Vol 50', category: 'Volatility', icon: '🟣' },
  { symbol: 'R_75', name: 'Volatility 75 Index', short: 'Vol 75', category: 'Volatility', icon: '🟣' },
  { symbol: 'R_100', name: 'Volatility 100 Index', short: 'Vol 100', category: 'Volatility', icon: '🔴' },
  { symbol: '1HZ100V', name: 'Volatility 100 (1s) Index', short: 'Vol 100 (1s)', category: 'Volatility', icon: '⚡' },
  { symbol: '1HZ75V', name: 'Volatility 75 (1s) Index', short: 'Vol 75 (1s)', category: 'Volatility', icon: '⚡' },
  { symbol: 'BOOM1000', name: 'Boom 1000 Index', short: 'Boom 1000', category: 'Boom & Crash', icon: '💥' },
  { symbol: 'BOOM500', name: 'Boom 500 Index', short: 'Boom 500', category: 'Boom & Crash', icon: '💥' },
  { symbol: 'CRASH1000', name: 'Crash 1000 Index', short: 'Crash 1000', category: 'Boom & Crash', icon: '📉' },
  { symbol: 'CRASH500', name: 'Crash 500 Index', short: 'Crash 500', category: 'Boom & Crash', icon: '📉' },
  { symbol: 'STPIDX', name: 'Step Index', short: 'Step', category: 'Step & Range', icon: '🪜' },
  { symbol: 'RDBULL', name: 'Bull Market Index', short: 'Bull', category: 'Jump', icon: '🐂' },
  { symbol: 'RDBEAR', name: 'Bear Market Index', short: 'Bear', category: 'Jump', icon: '🐻' },
];

export const SYMBOL_BY_ID: Record<string, SyntheticSymbol> = Object.fromEntries(
  SYNTHETIC_SYMBOLS.map((s) => [s.symbol, s])
);
