import { useState, useEffect, useRef, useCallback } from 'react';
import { Agent, Resource, SwarmConfig, SwarmMetrics, Vector2D } from './types/swarm';
import { createAgent, createResource, establishConnections, calculateMetrics, updateAgent, dist, mag } from './utils/swarmEngine';

const W = 900, H = 600;

const defaultConfig: SwarmConfig = {
  agentCount: 40, perceptionRadius: 80,
  separationWeight: 1.5, alignmentWeight: 1.0, cohesionWeight: 1.0,
  explorationWeight: 0.5, communicationRange: 120, maxSpeed: 3,
  behavior: 'flocking', showTrails: true, showConnections: true,
  showPerception: false, speed: 1, showSubSwarms: true, obstacleMode: false,
};

export default function App() {
  const [config, setConfig] = useState<SwarmConfig>(defaultConfig);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [metrics, setMetrics] = useState<SwarmMetrics>({
    avgSpeed: 0, avgEnergy: 0, totalMessages: 0, resourcesFound: 0,
    tasksCompleted: 0, swarmCoherence: 0, coverageArea: 0, activeConnections: 0,
    avgFitness: 0, generation: 0, subSwarmCount: 0, eventRate: 0,
  });
  const [isPaused, setIsPaused] = useState(false);
  const [messageCount, setMessageCount] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const agentsRef = useRef<Agent[]>([]);
  const resourcesRef = useRef<Resource[]>([]);
  const configRef = useRef(config);
  const pausedRef = useRef(isPaused);
  const msgCountRef = useRef(0);
  const timeRef = useRef(0);

  useEffect(() => { configRef.current = config; }, [config]);
  useEffect(() => { pausedRef.current = isPaused; }, [isPaused]);

  const init = useCallback(() => {
    const a: Agent[] = [];
    const roles: Agent['role'][] = ['explorer', 'worker', 'coordinator', 'scout', 'carrier'];
    for (let i = 0; i < config.agentCount; i++) {
      a.push(createAgent(`agent-${i}`,
        W * 0.3 + Math.random() * W * 0.4,
        H * 0.3 + Math.random() * H * 0.4,
        roles[i % roles.length]));
    }
    const r: Resource[] = [];
    for (let i = 0; i < 8 + Math.floor(Math.random() * 6); i++) {
      r.push(createResource(`res-${i}`, 60 + Math.random() * (W - 120), 60 + Math.random() * (H - 120)));
    }
    agentsRef.current = a;
    resourcesRef.current = r;
    msgCountRef.current = 0;
    timeRef.current = 0;
    setAgents([...a]);
    setResources([...r]);
    setMessageCount(0);
  }, [config.agentCount]);

  useEffect(() => { init(); }, []);

  useEffect(() => {
    let frame: number;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 16.67, 3);
      last = now;
      if (!pausedRef.current) {
        const cfg = configRef.current;
        const ca = agentsRef.current;
        const cr = resourcesRef.current;
        timeRef.current += cfg.speed * dt;
        const t = timeRef.current;
        const cc = establishConnections(ca, cfg);
        for (const a of ca) {
          const nb = ca.filter(o => o.id !== a.id && dist(a.position, o.position) < a.perceptionRadius);
          updateAgent(a, nb, cr, cfg, W, H, t);
          if (a.state === 'communicating') msgCountRef.current += 0.1;
        }
        if (Math.floor(t * 10) % 30 === 0) {
          const m = calculateMetrics(ca, cr, cc);
          setMetrics({ ...m, totalMessages: Math.floor(msgCountRef.current) });
          setMessageCount(Math.floor(msgCountRef.current));
        }
        setAgents([...ca]);
        setResources([...cr]);
      }
      // Render
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) render(ctx, agentsRef.current, resourcesRef.current, configRef.current, W, H, timeRef.current);
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleCanvasClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = W / rect.width;
    const sy = H / rect.height;
    const x = (e.clientX - rect.left) * sx;
    const y = (e.clientY - rect.top) * sy;
    const r = createResource(`res-${resourcesRef.current.length}`, x, y);
    resourcesRef.current.push(r);
    setResources([...resourcesRef.current]);
  };

  const behaviors = [
    { v: 'flocking', l: 'Flocking', i: '🐦' },
    { v: 'search_rescue', l: 'Search & Rescue', i: '🔍' },
    { v: 'resource_gathering', l: 'Gathering', i: '⛏️' },
    { v: 'formation', l: 'V-Formation', i: '✈️' },
    { v: 'patrol', l: 'Grid Patrol', i: '🛡️' },
    { v: 'consensus', l: 'Consensus', i: '🤝' },
    { v: 'predator_prey', l: 'Predator/Prey', i: '🐺' },
    { v: 'neural_evolution', l: 'Neural Evo', i: '🧠' },
  ];

  return (
    <div className="min-h-screen bg-[#060a14] text-white">
      <header className="border-b border-gray-800/50 bg-gray-900/30 backdrop-blur-sm">
        <div className="max-w-[1900px] mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
              <span className="text-sm">🧬</span>
            </div>
            <div>
              <h1 className="text-base font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Agent Swarm Intelligence
              </h1>
              <p className="text-[9px] text-gray-500 -mt-0.5">Advanced Multi-Agent System</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-gray-500">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>Online</span>
            <span>Agents: {agents.length}</span>
            <button onClick={() => setIsPaused(p => !p)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium ${isPaused ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
              {isPaused ? '▶' : '⏸'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1900px] mx-auto p-3">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_240px] gap-3">
          {/* Left Panel */}
          <div className="order-2 lg:order-1 bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-xl p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-100px)]">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-cyan-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>Controls
              </h2>
              <button onClick={init} className="px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 border border-red-500/30">↻ Reset</button>
            </div>

            <div className="space-y-1.5">
              <div className="text-[9px] font-semibold text-gray-500 uppercase">Behavior</div>
              {behaviors.map(b => (
                <button key={b.v} onClick={() => setConfig(c => ({ ...c, behavior: b.v as any }))}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-[11px] ${
                    config.behavior === b.v ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300' : 'bg-gray-800/50 border border-gray-700/30 text-gray-400 hover:bg-gray-800'
                  }`}>
                  <span>{b.i}</span><span className="font-medium">{b.l}</span>
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <div className="text-[9px] font-semibold text-gray-500 uppercase">Agents ({config.agentCount})</div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setConfig(c => ({ ...c, agentCount: Math.max(5, c.agentCount - 5) }))} className="px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700 text-xs">−</button>
                <input type="range" min="5" max="120" value={config.agentCount}
                  onChange={e => setConfig(c => ({ ...c, agentCount: +e.target.value }))}
                  className="flex-1 h-1 bg-gray-700 rounded appearance-none accent-cyan-500" />
                <button onClick={() => setConfig(c => ({ ...c, agentCount: Math.min(120, c.agentCount + 5) }))} className="px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700 text-xs">+</button>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[9px] font-semibold text-gray-500 uppercase">Flocking</div>
              <Slider l="Separation" v={config.separationWeight} min={0} max={5} step={0.1} onChange={v => setConfig(c => ({ ...c, separationWeight: v }))} />
              <Slider l="Alignment" v={config.alignmentWeight} min={0} max={5} step={0.1} onChange={v => setConfig(c => ({ ...c, alignmentWeight: v }))} />
              <Slider l="Cohesion" v={config.cohesionWeight} min={0} max={5} step={0.1} onChange={v => setConfig(c => ({ ...c, cohesionWeight: v }))} />
              <Slider l="Exploration" v={config.explorationWeight} min={0} max={5} step={0.1} onChange={v => setConfig(c => ({ ...c, explorationWeight: v }))} />
              <Slider l="Perception" v={config.perceptionRadius} min={20} max={200} step={5} onChange={v => setConfig(c => ({ ...c, perceptionRadius: v }))} />
              <Slider l="Speed" v={config.maxSpeed} min={1} max={8} step={0.5} onChange={v => setConfig(c => ({ ...c, maxSpeed: v }))} />
            </div>

            <div className="space-y-1.5">
              <div className="text-[9px] font-semibold text-gray-500 uppercase">Visualization</div>
              <Toggle l="Trails" v={config.showTrails} onChange={v => setConfig(c => ({ ...c, showTrails: v }))} />
              <Toggle l="Connections" v={config.showConnections} onChange={v => setConfig(c => ({ ...c, showConnections: v }))} />
              <Toggle l="Perception" v={config.showPerception} onChange={v => setConfig(c => ({ ...c, showPerception: v }))} />
            </div>

            <div className="space-y-1.5 pt-2 border-t border-gray-700/50">
              <div className="text-[9px] font-semibold text-gray-500 uppercase">Roles</div>
              <div className="grid grid-cols-2 gap-0.5 text-[9px]">
                {[['#00d4ff','Explorer'],['#00ff88','Worker'],['#ff6b00','Coordinator'],['#ff0066','Scout'],['#aa66ff','Carrier']].map(([c,l]) => (
                  <div key={l} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{backgroundColor:c}}></span>
                    <span className="text-gray-400">{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center */}
          <div className="order-1 lg:order-2 flex flex-col items-center gap-2">
            <canvas ref={canvasRef} width={W} height={H} onClick={handleCanvasClick}
              className="w-full max-w-[900px] rounded-xl border border-gray-800/50 shadow-2xl cursor-crosshair"
              style={{aspectRatio:`${W}/${H}`}} />
            <div className="w-full max-w-[900px] bg-gray-900/60 border border-gray-700/30 rounded-lg px-3 py-1.5 flex items-center justify-between text-[9px] text-gray-500">
              <span>💡 Click canvas to add resources</span>
              <span>🔄 Behavior: {config.behavior.replace('_',' ')}</span>
              <span>⚡ Speed: {config.speed.toFixed(1)}x</span>
            </div>
            <div className="w-full max-w-[900px] grid grid-cols-6 gap-1.5">
              <Stat l="Speed" v={metrics.avgSpeed.toFixed(1)} c="cyan" />
              <Stat l="Coherence" v={`${(metrics.swarmCoherence*100).toFixed(0)}%`} c="green" />
              <Stat l="Messages" v={messageCount.toString()} c="yellow" />
              <Stat l="Resources" v={metrics.resourcesFound.toString()} c="purple" />
              <Stat l="Fitness" v={metrics.avgFitness.toFixed(0)} c="pink" />
              <Stat l="Links" v={metrics.activeConnections.toString()} c="orange" />
            </div>
          </div>

          {/* Right Panel */}
          <div className="order-3 space-y-3">
            <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-xl p-3 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                <h2 className="text-[10px] font-bold text-gray-300 uppercase">Metrics</h2>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <Card l="Speed" v={metrics.avgSpeed.toFixed(1)} c="cyan" p={metrics.avgSpeed/5} />
                <Card l="Coherence" v={`${(metrics.swarmCoherence*100).toFixed(0)}%`} c="green" p={metrics.swarmCoherence} />
                <Card l="Fitness" v={metrics.avgFitness.toFixed(0)} c="pink" p={metrics.avgFitness/100} />
                <Card l="Links" v={metrics.activeConnections.toString()} c="yellow" p={Math.min(1,metrics.activeConnections/(agents.length*2))} />
              </div>
              <div className="grid grid-cols-3 gap-1 text-center">
                <Mini l="Msgs" v={messageCount} c="text-cyan-400" />
                <Mini l="Res" v={metrics.resourcesFound} c="text-yellow-400" />
                <Mini l="Energy" v={metrics.avgEnergy.toFixed(0)} c="text-green-400" />
              </div>
              <div className="space-y-1">
                <div className="text-[8px] text-gray-500 uppercase">Roles</div>
                {(['explorer','worker','coordinator','scout','carrier'] as const).map(role => {
                  const count = agents.filter(a => a.role === role).length;
                  const pct = (count / agents.length) * 100;
                  const colors: Record<string,string> = {explorer:'#00d4ff',worker:'#00ff88',coordinator:'#ff6b00',scout:'#ff0066',carrier:'#aa66ff'};
                  return (
                    <div key={role} className="flex items-center gap-1.5">
                      <span className="text-[8px] text-gray-500 w-14 capitalize">{role}</span>
                      <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{width:`${pct}%`,backgroundColor:colors[role]}} />
                      </div>
                      <span className="text-[8px] text-gray-500 font-mono w-4 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
              <div className="space-y-1">
                <div className="text-[8px] text-gray-500 uppercase">States</div>
                <div className="flex flex-wrap gap-0.5">
                  {Object.entries(agents.reduce((a,b) => { a[b.state]=(a[b.state]||0)+1; return a; }, {} as Record<string,number>)).map(([s,c]) => {
                    const sc: Record<string,string> = {idle:'bg-gray-600',moving:'bg-blue-500',communicating:'bg-cyan-400',working:'bg-green-500',returning:'bg-yellow-500',alert:'bg-red-500',fleeing:'bg-orange-500'};
                    return <span key={s} className={`px-1 py-0 rounded text-[8px] text-white ${sc[s]||'bg-gray-600'}`}>{s.slice(0,4)}:{c}</span>;
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Slider({l,v,min,max,step,onChange}:{l:string;v:number;min:number;max:number;step:number;onChange:(v:number)=>void}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-gray-500 w-16">{l}</span>
      <input type="range" min={min} max={max} step={step} value={v} onChange={e=>onChange(+e.target.value)}
        className="flex-1 h-1 bg-gray-700 rounded appearance-none accent-cyan-500" />
      <span className="text-[9px] text-gray-400 font-mono w-8 text-right">{v.toFixed(1)}</span>
    </div>
  );
}

function Toggle({l,v,onChange}:{l:string;v:boolean;onChange:(v:boolean)=>void}) {
  return (
    <div className="flex items-center justify-between py-0.5 cursor-pointer" onClick={()=>onChange(!v)}>
      <span className="text-[10px] text-gray-400">{l}</span>
      <div className={`w-7 h-3.5 rounded-full transition-all relative ${v?'bg-cyan-500/40':'bg-gray-700'}`}>
        <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all ${v?'bg-cyan-400':'bg-gray-500'}`}
          style={{left:v?'15px':'2px'}} />
      </div>
    </div>
  );
}

function Stat({l,v,c}:{l:string;v:string;c:string}) {
  const m: Record<string,string> = {
    cyan:'text-cyan-400 border-cyan-500/20 bg-cyan-500/5',
    green:'text-green-400 border-green-500/20 bg-green-500/5',
    yellow:'text-yellow-400 border-yellow-500/20 bg-yellow-500/5',
    purple:'text-purple-400 border-purple-500/20 bg-purple-500/5',
    pink:'text-pink-400 border-pink-500/20 bg-pink-500/5',
    orange:'text-orange-400 border-orange-500/20 bg-orange-500/5',
  };
  return (
    <div className={`rounded-lg px-2 py-1.5 border ${m[c]||m.cyan}`}>
      <div className="text-[8px] text-gray-500 uppercase">{l}</div>
      <div className={`text-xs font-mono font-bold ${m[c]?.split(' ')[0]}`}>{v}</div>
    </div>
  );
}

function Card({l,v,c,p}:{l:string;v:string;c:string;p:number}) {
  const m: Record<string,{t:string;b:string;bg:string}> = {
    cyan:{t:'text-cyan-400',b:'bg-cyan-500',bg:'bg-cyan-500/10'},
    green:{t:'text-green-400',b:'bg-green-500',bg:'bg-green-500/10'},
    pink:{t:'text-pink-400',b:'bg-pink-500',bg:'bg-pink-500/10'},
    yellow:{t:'text-yellow-400',b:'bg-yellow-500',bg:'bg-yellow-500/10'},
  };
  const cc = m[c]||m.cyan;
  return (
    <div className={`${cc.bg} rounded p-1.5 border border-gray-700/30`}>
      <div className="text-[8px] text-gray-500">{l}</div>
      <div className={`text-[11px] font-mono font-bold ${cc.t}`}>{v}</div>
      <div className="h-0.5 bg-gray-800 rounded-full mt-0.5 overflow-hidden">
        <div className={`h-full ${cc.b} rounded-full`} style={{width:`${Math.min(100,p*100)}%`}} />
      </div>
    </div>
  );
}

function Mini({l,v,c}:{l:string;v:number|string;c:string}) {
  return (
    <div className="bg-gray-800/50 rounded p-1">
      <div className="text-[7px] text-gray-500 uppercase">{l}</div>
      <div className={`text-[10px] font-mono ${c}`}>{v}</div>
    </div>
  );
}

// Rendering
function render(ctx: CanvasRenderingContext2D, agents: Agent[], resources: Resource[], config: SwarmConfig, w: number, h: number, time: number) {
  ctx.fillStyle = '#060a14';
  ctx.fillRect(0, 0, w, h);

  // Grid
  ctx.strokeStyle = '#0d1525';
  ctx.lineWidth = 0.5;
  for (let x = 0; x < w; x += 60) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
  for (let y = 0; y < h; y += 60) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }

  // Scan line
  const scanY = (time * 0.5) % h;
  const g = ctx.createLinearGradient(0, scanY-30, 0, scanY+30);
  g.addColorStop(0, 'transparent');
  g.addColorStop(0.5, 'rgba(0,212,255,0.02)');
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.fillRect(0, scanY-30, w, 60);

  // Resources
  for (const r of resources) {
    const pulse = Math.sin(time*0.05+r.position.x)*0.3+0.7;
    const size = 8 + (r.amount/100)*8;
    const colors: Record<string,string> = {energy:'#ffdd00',data:'#00ffcc',material:'#ff6600'};
    const color = colors[r.type];
    const glow = ctx.createRadialGradient(r.position.x,r.position.y,0,r.position.x,r.position.y,size*3);
    glow.addColorStop(0, `${color}${r.discovered?'30':'15'}`);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(r.position.x-size*3,r.position.y-size*3,size*6,size*6);

    ctx.save();
    ctx.translate(r.position.x,r.position.y);
    ctx.rotate(time*0.02);
    ctx.beginPath();
    if (r.type === 'energy') {
      ctx.moveTo(0,-size*pulse); ctx.lineTo(size*pulse,0); ctx.lineTo(0,size*pulse); ctx.lineTo(-size*pulse,0);
    } else if (r.type === 'data') {
      for (let i=0;i<6;i++) {
        const a=(Math.PI/3)*i-Math.PI/6;
        const x=Math.cos(a)*size*pulse, y=Math.sin(a)*size*pulse;
        if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
    } else {
      const s=size*pulse*0.8; ctx.rect(-s,-s,s*2,s*2);
    }
    ctx.closePath();
    ctx.fillStyle = `${color}${r.discovered?'cc':'44'}`;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    if (r.discovered) {
      ctx.fillStyle = `${color}88`;
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(r.amount)}`, r.position.x, r.position.y+size+12);
    }
  }

  // Connections
  if (config.showConnections) {
    const drawn = new Set<string>();
    for (const a of agents) {
      for (const cid of a.connections) {
        const key = [a.id,cid].sort().join('-');
        if (drawn.has(key)) continue;
        drawn.add(key);
        const o = agents.find(x => x.id === cid);
        if (!o) continue;
        const d = dist(a.position,o.position);
        const alpha = Math.max(0.02, 0.12*(1-d/config.communicationRange));
        ctx.beginPath();
        ctx.moveTo(a.position.x,a.position.y);
        ctx.lineTo(o.position.x,o.position.y);
        ctx.strokeStyle = `rgba(100,180,255,${alpha})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }

  // Perception
  if (config.showPerception) {
    for (const a of agents) {
      ctx.beginPath();
      ctx.arc(a.position.x,a.position.y,a.perceptionRadius,0,Math.PI*2);
      ctx.strokeStyle = `${a.color}10`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }

  // Trails
  if (config.showTrails) {
    for (const a of agents) {
      if (a.trail.length < 2) continue;
      for (let i=1;i<a.trail.length;i++) {
        const alpha = (i/a.trail.length)*0.3;
        ctx.beginPath();
        ctx.moveTo(a.trail[i-1].x,a.trail[i-1].y);
        ctx.lineTo(a.trail[i].x,a.trail[i].y);
        ctx.strokeStyle = `${a.color}${Math.floor(alpha*255).toString(16).padStart(2,'0')}`;
        ctx.lineWidth = 1+(i/a.trail.length);
        ctx.stroke();
      }
    }
  }

  // Agents
  for (const a of agents) {
    const pulse = Math.sin(time*0.08+a.pulsePhase)*0.3+0.7;
    const angle = Math.atan2(a.velocity.y,a.velocity.x);
    ctx.save();
    ctx.translate(a.position.x,a.position.y);
    ctx.rotate(angle);

    // Glow
    const gs = a.radius*3*pulse;
    const glow = ctx.createRadialGradient(0,0,0,0,0,gs);
    glow.addColorStop(0,`${a.color}25`);
    glow.addColorStop(1,'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(0,0,gs,0,Math.PI*2); ctx.fill();

    // Body
    const sz = a.radius*(a.state==='alert'?1.3:a.state==='fleeing'?1.1:1);
    ctx.beginPath();
    ctx.moveTo(sz*1.5,0);
    ctx.lineTo(-sz,-sz*0.8);
    ctx.lineTo(-sz*0.5,0);
    ctx.lineTo(-sz,sz*0.8);
    ctx.closePath();
    const sc: Record<string,string> = {
      idle:`${a.color}88`,moving:`${a.color}cc`,communicating:`${a.color}ff`,
      working:`${a.color}ee`,returning:`${a.color}aa`,alert:'#ff0000dd',fleeing:'#ff4444cc',
    };
    ctx.fillStyle = sc[a.state]||`${a.color}cc`;
    ctx.fill();
    ctx.strokeStyle = a.color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Energy bar
    ctx.rotate(-angle);
    const bw=16,bh=2,by=-sz-6;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(-bw/2,by,bw,bh);
    ctx.fillStyle = a.energy>60?'#00ff88':a.energy>30?'#ffdd00':'#ff3344';
    ctx.fillRect(-bw/2,by,bw*(a.energy/100),bh);

    ctx.restore();
  }

  // HUD
  ctx.fillStyle = 'rgba(0,212,255,0.5)';
  ctx.font = '9px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`SWARM ACTIVE | N:${agents.length} | ${config.behavior.toUpperCase()}`, 10, 16);
  ctx.fillText(`T+${Math.floor(time/60)}s`, 10, 28);

  // Corners
  ctx.strokeStyle = 'rgba(0,212,255,0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(4,24); ctx.lineTo(4,4); ctx.lineTo(24,4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w-24,4); ctx.lineTo(w-4,4); ctx.lineTo(w-4,24); ctx.stroke();
}
