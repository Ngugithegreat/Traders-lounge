"use client";

import { MarketTicker } from "@/components/dashboard/market-ticker";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity, 
  Wallet, 
  History, 
  TrendingUp,
  Play,
  Pause
} from "lucide-react";

const data = [
  { time: '09:00', pl: 400 },
  { time: '10:00', pl: 300 },
  { time: '11:00', pl: 600 },
  { time: '12:00', pl: 800 },
  { time: '13:00', pl: 700 },
  { time: '14:00', pl: 1100 },
  { time: '15:00', pl: 1540 },
];

export default function DashboardPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      <MarketTicker />
      
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Executive Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, trader. Your bots are performing optimally.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-white/10 hover:bg-white/5">
              <History className="mr-2 h-4 w-4" />
              Full History
            </Button>
            <Button className="neon-glow font-bold">
              <TrendingUp className="mr-2 h-4 w-4" />
              Analyze Markets
            </Button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Equity</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$12,450.00</div>
              <div className="flex items-center text-xs text-primary mt-1 font-bold">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +14.2% from yesterday
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Net P&L (Today)</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">+$1,540.24</div>
              <Progress value={75} className="h-1.5 mt-3" />
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Bots</CardTitle>
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">03</div>
              <p className="text-xs text-muted-foreground mt-1">
                Optimized for Boom/Crash
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Market Status</CardTitle>
              <Badge variant="outline" className="text-[10px] border-primary text-primary bg-primary/5 uppercase tracking-wider font-bold">Open</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Vol. High</div>
              <p className="text-xs text-muted-foreground mt-1">
                Optimal for Scalping
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance & Active Bots */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 glass-card">
            <CardHeader>
              <CardTitle>Session Performance</CardTitle>
              <CardDescription>Live equity curve for current trading session.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorPl" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(158, 100%, 44%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(158, 100%, 44%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 12}}
                  />
                  <YAxis 
                    hide 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(220, 30%, 10%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(158, 100%, 44%)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="pl" 
                    stroke="hsl(158, 100%, 44%)" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorPl)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Active Strategy Status</CardTitle>
              <CardDescription>Monitor your automated systems.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "Boom Hunter v2", status: "running", pl: "+$420.20", color: "text-primary" },
                { name: "Vol-Spike Scalper", status: "running", pl: "-$12.50", color: "text-destructive" },
                { name: "Crash Safety Bot", status: "paused", pl: "+$1,132.00", color: "text-primary" }
              ].map((bot) => (
                <div key={bot.name} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 group transition-all hover:bg-white/10">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md ${bot.status === 'running' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {bot.status === 'running' ? <Play size={14} /> : <Pause size={14} />}
                    </div>
                    <div>
                      <div className="text-sm font-bold">{bot.name}</div>
                      <div className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">{bot.status}</div>
                    </div>
                  </div>
                  <div className={`text-sm font-mono font-bold ${bot.color}`}>{bot.pl}</div>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-2 border-dashed border-white/20 hover:border-primary/50 text-muted-foreground hover:text-primary">
                + Deploy New Bot
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
