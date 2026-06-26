import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  Star, 
  Eye, 
  TrendingUp,
  Search,
  Zap,
  Filter
} from "lucide-react";
import { Input } from "@/components/ui/input";

const strategies = [
  {
    name: "Spike Master Pro",
    author: "AlphaTraderX",
    rating: 4.8,
    downloads: "2.4k",
    type: "Boom/Crash",
    accuracy: "92%",
    description: "Specialized in detecting pre-spike volume surges on Boom 500/1000 with low drawdown."
  },
  {
    name: "Jump Velocity Scalper",
    author: "CodeWizard",
    rating: 4.9,
    downloads: "1.1k",
    type: "Jump Indices",
    accuracy: "84%",
    description: "High-frequency scalping bot optimized for the sudden momentum shifts in Jump 10, 25, and 100."
  },
  {
    name: "Vol-Stabilizer",
    author: "MarketZen",
    rating: 4.5,
    downloads: "840",
    type: "Volatility",
    accuracy: "79%",
    description: "Mean-reversion strategy designed for Volatility 75 using Bollinger Bands and stochastic oscillators."
  },
  {
    name: "SafeCrash v4",
    author: "SafetyFirst",
    rating: 4.7,
    downloads: "4.2k",
    type: "Crash 1000",
    accuracy: "95%",
    description: "Conservative approach focused on small consistent gains while avoiding major crash events."
  },
  {
    name: "Step Master",
    author: "StepByStep",
    rating: 4.2,
    downloads: "520",
    type: "Step Index",
    accuracy: "71%",
    description: "Trend-following bot for the unique step movements of the synthetic step index."
  },
  {
    name: "Ghost Spiker",
    author: "NightTrader",
    rating: 4.9,
    downloads: "3.1k",
    type: "Boom 300",
    accuracy: "89%",
    description: "Advanced ghost pattern recognition for Boom 300 micro-spikes."
  }
];

export default function LibraryPage() {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-background">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Strategy Library</h1>
          <p className="text-muted-foreground">Free high-performance bots shared by the Traders Lounge community.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-10 bg-white/5 border-white/10" placeholder="Search strategies..." />
          </div>
          <Button variant="outline" className="border-white/10">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {strategies.map((strategy) => (
          <Card key={strategy.name} className="glass-card group hover:border-primary/50 transition-all flex flex-col h-full">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">{strategy.type}</Badge>
                <div className="flex items-center gap-1 text-xs font-bold text-primary">
                  <TrendingUp size={12} /> {strategy.accuracy} Acc.
                </div>
              </div>
              <CardTitle className="group-hover:text-primary transition-colors">{strategy.name}</CardTitle>
              <CardDescription>by @{strategy.author}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-white/60 leading-relaxed italic">"{strategy.description}"</p>
              <div className="flex items-center gap-4 mt-6">
                <div className="flex items-center gap-1">
                  <Star size={14} className="fill-primary text-primary" />
                  <span className="text-xs font-bold">{strategy.rating}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Download size={14} />
                  <span className="text-xs">{strategy.downloads}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Eye size={14} />
                  <span className="text-xs">12k</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-white/5 border-t border-white/5 gap-3 p-4">
              <Button variant="ghost" className="flex-1 h-9 text-xs">View Details</Button>
              <Button className="flex-1 h-9 text-xs bg-primary text-primary-foreground font-bold">
                <Download size={14} className="mr-2" /> Import
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="pt-8 text-center border-t border-white/5">
        <div className="bg-primary/5 p-8 rounded-3xl border border-primary/10 max-w-2xl mx-auto">
          <Zap className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Become a Strategy Contributor</h2>
          <p className="text-muted-foreground mb-6">
            Share your high-performing Neural Bots with the community and earn rewards in LLM Credits.
          </p>
          <Button className="bg-primary text-primary-foreground font-bold neon-glow px-8 h-12">
            Upload Your Strategy
          </Button>
        </div>
      </div>
    </div>
  );
}
