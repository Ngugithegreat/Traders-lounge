
"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";

const mockMarkets = [
  { name: "Boom 500", price: "4522.34", change: "+1.2%", positive: true },
  { name: "Crash 1000", price: "12304.12", change: "-0.4%", positive: false },
  { name: "Volatility 75", price: "28491.55", change: "+0.85%", positive: true },
  { name: "Jump 100", price: "8411.02", change: "+2.1%", positive: true },
  { name: "Step Index", price: "411.55", change: "-1.15%", positive: false },
  { name: "Range Break", price: "9942.33", change: "+0.33%", positive: true },
];

export function MarketTicker() {
  const [tickerItems, setTickerItems] = useState(mockMarkets);

  // Simulation of slight price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerItems(prev => prev.map(m => ({
        ...m,
        price: (parseFloat(m.price) + (Math.random() - 0.5) * 5).toFixed(2)
      })));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-black/40 border-b border-white/5 h-10 overflow-hidden relative">
      <div className="flex animate-ticker whitespace-nowrap items-center h-full">
        {[...tickerItems, ...tickerItems].map((market, idx) => (
          <div key={idx} className="flex items-center gap-4 px-8 border-r border-white/5 h-full">
            <span className="text-xs font-bold text-white/70">{market.name}</span>
            <span className="text-xs font-mono font-medium">{market.price}</span>
            <span className={`text-[10px] flex items-center gap-1 font-bold ${market.positive ? 'text-primary' : 'text-destructive'}`}>
              {market.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {market.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
