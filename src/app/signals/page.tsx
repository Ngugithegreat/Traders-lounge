"use client";

import { useState } from "react";
import { aiMarketSignalRecommendation, AiMarketSignalRecommendationOutput } from "@/ai/flows/ai-market-signal-recommendation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Zap, 
  BrainCircuit, 
  ArrowRight, 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SignalsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiMarketSignalRecommendationOutput | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    indexName: "Boom 500",
    currentPrice: 4522.34,
    marketTrend: "bullish",
    indexData: "Price has been consolidated around the EMA 200 for the last 3 hours. RSI is approaching oversold territory at 32. Volume is starting to pick up on the M15 timeframe."
  });

  async function handleAnalyze() {
    setLoading(true);
    try {
      const recommendation = await aiMarketSignalRecommendation(form);
      setResult(recommendation);
    } catch (error) {
      toast({
        title: "AI Analysis Failed",
        description: "The reasoning engine encountered an error. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-background">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Zap className="text-primary h-6 w-6" />
          <h1 className="text-3xl font-bold tracking-tight">AI Market Intelligence</h1>
        </div>
        <p className="text-muted-foreground">Leverage deep-reasoning AI to identify high-probability entry points on synthetic indices.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-primary" />
              Signal Parameters
            </CardTitle>
            <CardDescription>Input live data for the AI to process.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Index Asset</Label>
                <Select value={form.indexName} onValueChange={(v) => setForm({...form, indexName: v})}>
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="Select Index" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Boom 500">Boom 500</SelectItem>
                    <SelectItem value="Boom 1000">Boom 1000</SelectItem>
                    <SelectItem value="Crash 500">Crash 500</SelectItem>
                    <SelectItem value="Volatility 75">Volatility 75</SelectItem>
                    <SelectItem value="Jump 100">Jump 100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Current Price</Label>
                <Input 
                  type="number" 
                  className="bg-white/5 border-white/10" 
                  value={form.currentPrice} 
                  onChange={(e) => setForm({...form, currentPrice: parseFloat(e.target.value)})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reported Trend</Label>
              <Select value={form.marketTrend} onValueChange={(v) => setForm({...form, marketTrend: v})}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Select Trend" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bullish">Bullish (Uptrend)</SelectItem>
                  <SelectItem value="bearish">Bearish (Downtrend)</SelectItem>
                  <SelectItem value="sideways">Sideways (Ranging)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Real-time Raw Data / Observations</Label>
              <textarea 
                className="w-full h-32 bg-white/5 border border-white/10 rounded-md p-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="Describe current market patterns, indicator readings, or copy-paste market news..."
                value={form.indexData}
                onChange={(e) => setForm({...form, indexData: e.target.value})}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full h-12 text-lg font-bold neon-glow" 
              onClick={handleAnalyze}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Rationale...
                </>
              ) : (
                <>
                  <BrainCircuit className="mr-2 h-5 w-5" />
                  Initiate Analysis
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <div className="space-y-6">
          {result ? (
            <Card className="glass-card border-primary/20 overflow-hidden">
              <div className="h-1 bg-primary w-full shadow-[0_0_10px_rgba(0,255,163,0.5)]" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-2xl">Recommendation</CardTitle>
                  <CardDescription>Generated by GPT-Reasoning-v4</CardDescription>
                </div>
                <Badge className={`text-lg px-4 py-1 uppercase font-bold ${
                  result.action === 'buy' ? 'bg-primary text-primary-foreground' : 
                  result.action === 'sell' ? 'bg-destructive text-white' : 
                  'bg-muted text-muted-foreground'
                }`}>
                  {result.action}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                    <span className="text-xs text-muted-foreground uppercase font-bold">Entry Price</span>
                    <div className="text-2xl font-mono font-bold text-white mt-1">{result.entryPrice}</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                    <span className="text-xs text-muted-foreground uppercase font-bold">Confidence</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="text-2xl font-mono font-bold text-primary">{(result.confidence * 100).toFixed(0)}%</div>
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{width: `${result.confidence * 100}%`}} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    AI Rationale
                  </h4>
                  <p className="text-sm text-white/80 leading-relaxed bg-white/5 p-4 rounded-lg border border-white/5 italic">
                    "{result.recommendationRationale}"
                  </p>
                </div>
              </CardContent>
              <CardFooter className="bg-white/5 border-t border-white/5 gap-3">
                <Button variant="outline" className="flex-1">Add to Watchlist</Button>
                <Button className="flex-1 bg-primary text-primary-foreground font-bold">Execute Automated Trade</Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 border-2 border-dashed border-white/5 rounded-2xl bg-white/5">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                <Zap size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold">Awaiting Market Data</h3>
                <p className="text-muted-foreground max-w-[300px] mt-2 text-sm leading-relaxed">
                  Provide asset details and recent trends to trigger the AI analysis engine.
                </p>
              </div>
            </div>
          )}

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Historical Signal Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  <div>
                    <div className="text-2xl font-bold">88.4%</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Avg Accuracy</div>
                  </div>
                  <div className="border-r border-white/10" />
                  <div>
                    <div className="text-2xl font-bold">4.2x</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Profit Factor</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5,6,7].map(i => (
                    <div key={i} className={`w-2 h-6 rounded-sm ${i === 4 ? 'bg-destructive/50' : 'bg-primary'}`} />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
