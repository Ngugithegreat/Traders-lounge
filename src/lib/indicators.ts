// Lightweight technical-analysis helpers used by the Signals & AI engines.
// All functions operate on a chronological array of prices (oldest → newest).

export function sma(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

export function ema(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const k = 2 / (period + 1);
  // Seed with the SMA of the first `period` values.
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
  }
  return prev;
}

export function rsi(values: number[], period = 14): number | null {
  if (values.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let i = values.length - period; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

// Rate of change over the last `period` ticks, expressed as a percentage.
export function momentum(values: number[], period = 10): number | null {
  if (values.length < period + 1) return null;
  const past = values[values.length - 1 - period];
  const now = values[values.length - 1];
  if (past === 0) return null;
  return ((now - past) / past) * 100;
}

// Standard deviation of the last `period` values (volatility proxy).
export function stdDev(values: number[], period = 20): number | null {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period;
  return Math.sqrt(variance);
}

export type SignalAction = 'BUY' | 'SELL' | 'NEUTRAL';

export type SignalResult = {
  action: SignalAction;
  strength: number; // 0-100 confidence
  reasons: string[];
  indicators: {
    emaFast: number | null;
    emaSlow: number | null;
    rsi: number | null;
    momentum: number | null;
  };
};

// Combine several classic indicators into a single directional signal.
// Rise/Fall on Deriv synthetics maps naturally to BUY (CALL) / SELL (PUT).
export function computeSignal(prices: number[]): SignalResult {
  const emaFast = ema(prices, 9);
  const emaSlow = ema(prices, 21);
  const rsiVal = rsi(prices, 14);
  const mom = momentum(prices, 14);

  let score = 0; // positive → bullish, negative → bearish
  const reasons: string[] = [];

  if (emaFast != null && emaSlow != null) {
    const spread = ((emaFast - emaSlow) / emaSlow) * 100;
    if (spread > 0.02) {
      score += 2;
      reasons.push(`EMA 9 above EMA 21 (+${spread.toFixed(3)}%) — uptrend`);
    } else if (spread < -0.02) {
      score -= 2;
      reasons.push(`EMA 9 below EMA 21 (${spread.toFixed(3)}%) — downtrend`);
    } else {
      reasons.push('EMA 9/21 flat — no clear trend');
    }
  }

  if (rsiVal != null) {
    if (rsiVal < 30) {
      score += 1.5;
      reasons.push(`RSI ${rsiVal.toFixed(0)} — oversold, reversal likely`);
    } else if (rsiVal > 70) {
      score -= 1.5;
      reasons.push(`RSI ${rsiVal.toFixed(0)} — overbought, pullback likely`);
    } else if (rsiVal >= 50) {
      score += 0.5;
      reasons.push(`RSI ${rsiVal.toFixed(0)} — momentum leaning up`);
    } else {
      score -= 0.5;
      reasons.push(`RSI ${rsiVal.toFixed(0)} — momentum leaning down`);
    }
  }

  if (mom != null) {
    if (mom > 0.05) {
      score += 1;
      reasons.push(`Momentum +${mom.toFixed(3)}% — buyers in control`);
    } else if (mom < -0.05) {
      score -= 1;
      reasons.push(`Momentum ${mom.toFixed(3)}% — sellers in control`);
    }
  }

  const maxScore = 4.5;
  const strength = Math.min(100, Math.round((Math.abs(score) / maxScore) * 100));

  let action: SignalAction = 'NEUTRAL';
  if (score >= 1.5) action = 'BUY';
  else if (score <= -1.5) action = 'SELL';

  return {
    action,
    strength,
    reasons,
    indicators: { emaFast, emaSlow, rsi: rsiVal, momentum: mom },
  };
}
