"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Cpu, 
  MousePointer2, 
  GitBranch, 
  Terminal, 
  Save, 
  Play, 
  Plus,
  Box,
  Settings2,
  Trash2
} from "lucide-react";

export default function BotBuilderPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden">
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 shrink-0 bg-black/20">
        <div className="flex items-center gap-3">
          <Cpu className="text-primary" />
          <h1 className="text-xl font-bold tracking-tight font-headline uppercase">Neural Bot Architect</h1>
          <Badge variant="outline" className="border-primary text-primary text-[10px] font-bold">v3.0.4 - BETA</Badge>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
            <Save className="mr-2 h-4 w-4" /> Save Strategy
          </Button>
          <div className="h-4 w-px bg-white/10 mx-2" />
          <Button size="sm" className="bg-primary text-primary-foreground font-bold neon-glow">
            <Play className="mr-2 h-4 w-4" /> Deploy to Cloud
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Toolbox Sidebar */}
        <aside className="w-64 border-r border-white/5 p-4 flex flex-col gap-6 bg-black/10">
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Market Nodes</h3>
            <div className="space-y-2">
              {["Price Tick", "Candle Close", "Volume Delta", "Order Book"].map((item) => (
                <div key={item} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5 hover:border-primary/50 cursor-grab active:cursor-grabbing transition-all group">
                  <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                    <Box size={14} />
                  </div>
                  <span className="text-sm font-medium">{item}</span>
                  <Plus size={14} className="ml-auto text-white/20 group-hover:text-primary" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Logic Gates</h3>
            <div className="space-y-2">
              {["If Statement", "Switch Node", "RSI Cross", "Moving Average"].map((item) => (
                <div key={item} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5 hover:border-primary/50 cursor-grab transition-all group">
                  <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400">
                    <GitBranch size={14} />
                  </div>
                  <span className="text-sm font-medium">{item}</span>
                  <Plus size={14} className="ml-auto text-white/20 group-hover:text-blue-400" />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-xs text-primary font-bold mb-1">PRO TIP</p>
              <p className="text-[10px] text-white/60 leading-relaxed">
                Combine the <b>Boom Spike</b> detector with a <b>Relative Strength Index</b> node to reduce false breakouts.
              </p>
            </div>
          </div>
        </aside>

        {/* Canvas Area */}
        <main className="flex-1 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03)_1px,_transparent_1px)] bg-[size:40px_40px] relative p-8">
          {/* Mock Node 1 */}
          <div className="absolute top-20 left-20 w-64 glass-card rounded-xl p-4 cursor-move">
            <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
              <Box size={16} className="text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider">Tick Source</span>
              <Settings2 size={14} className="ml-auto text-muted-foreground cursor-pointer hover:text-white" />
            </div>
            <div className="space-y-1">
              <div className="text-[10px] text-muted-foreground">ASSET</div>
              <div className="text-sm font-bold">Volatility 75 Index</div>
            </div>
            <div className="mt-4 flex justify-end">
              <div className="w-3 h-3 rounded-full bg-primary ring-4 ring-primary/20 -mr-5 cursor-crosshair" title="Output Link" />
            </div>
          </div>

          {/* Connection Line Simulation */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
            <path d="M 312 120 L 450 180" stroke="hsl(158, 100%, 44%)" strokeWidth="2" fill="none" />
          </svg>

          {/* Mock Node 2 */}
          <div className="absolute top-40 left-[450px] w-64 glass-card rounded-xl p-4 cursor-move border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
            <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
              <GitBranch size={16} className="text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-wider">RSI Condition</span>
              <Settings2 size={14} className="ml-auto text-muted-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-[10px] text-muted-foreground uppercase font-bold">Period</div>
                <div className="text-sm font-bold">14</div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] text-muted-foreground uppercase font-bold">Level</div>
                <div className="text-sm font-bold">Overbought (70)</div>
              </div>
            </div>
            <div className="mt-4 flex justify-between">
              <div className="w-3 h-3 rounded-full bg-blue-400 ring-4 blue-400/20 -ml-5" />
              <div className="flex flex-col gap-4 -mr-5">
                <div className="w-3 h-3 rounded-full bg-primary ring-4 ring-primary/20" title="True Output" />
                <div className="w-3 h-3 rounded-full bg-destructive ring-4 ring-destructive/20" title="False Output" />
              </div>
            </div>
          </div>

          {/* Canvas Tools */}
          <div className="absolute bottom-8 right-8 flex gap-2">
            <Button size="icon" variant="outline" className="rounded-full bg-card/80 backdrop-blur-md border-white/10 hover:bg-white/5">
              <MousePointer2 size={18} />
            </Button>
            <Button size="icon" variant="outline" className="rounded-full bg-card/80 backdrop-blur-md border-white/10 hover:bg-white/5">
              <Trash2 size={18} className="text-destructive" />
            </Button>
            <Button size="icon" variant="outline" className="rounded-full bg-card/80 backdrop-blur-md border-white/10 hover:bg-white/5">
              <Plus size={18} className="text-primary" />
            </Button>
          </div>
        </main>

        {/* Console/Info Panel */}
        <aside className="w-80 border-l border-white/5 bg-black/30 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-white/5">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Terminal size={14} className="text-primary" />
              Real-time Simulation
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] space-y-1">
            <p className="text-primary/70">[12:44:01] System initialized. Version 3.0.4 loaded.</p>
            <p className="text-white/40">[12:44:02] Connected to Volatility 75 Feed...</p>
            <p className="text-white/40">[12:44:05] Tick: 28491.55</p>
            <p className="text-white/40">[12:44:06] Tick: 28492.10</p>
            <p className="text-blue-400">[12:44:10] Node [RSI Condition] input: 54.3</p>
            <p className="text-white/40">[12:44:15] Tick: 28489.20</p>
            <p className="text-white/40">[12:44:17] Tick: 28488.95</p>
            <p className="text-primary">[12:44:20] Logic Validation Successful. Ready to deploy.</p>
          </div>
          <div className="p-4 bg-white/5 border-t border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">Estimated Win Rate</span>
              <span className="text-xs font-mono font-bold text-primary">74.2%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">Complexity</span>
              <span className="text-xs font-mono font-bold">LOW</span>
            </div>
            <Button className="w-full bg-white/5 border border-white/10 hover:bg-white/10">Run Backtest</Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
