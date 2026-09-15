import { useState, useEffect, useRef, useCallback } from 'react';
import { Agent, Resource, SwarmConfig, SwarmMetrics, Vector2D, SwarmEvent, Structure, Threat } from './types/swarm';
import { createAgent, createResource, establishConnections, calculateMetrics, updateAgent, dist, mag, HiveMind, WorldSimulation, EventLog, ParticleSystem, RecordingSystem, scenarios } from './utils/swarmEngine';
import { SpatialHash } from './utils/spatialHash';
import { MultiSwarmSystem } from './utils/multiSwarm';
import { CommunicationProtocol } from './utils/communicationProtocol';
import { createPheromoneGrid, decayPheromone, diffusePheromone, depositPheromone, getTotalPheromoneIntensity, PheromoneGrid } from './utils/pheromoneSystem';
import { LLMService } from './utils/llmService';
import { SwarmAction, ActionResult } from './utils/llmActionExecutor';
import LLMPanel from './components/LLMPanel';
import DirectorPanel from './components/DirectorPanel';

const W = 900, H = 600;

const defaultConfig: SwarmConfig = {
  agentCount: 40, perceptionRadius: 80,
  separationWeight: 1.5, alignmentWeight: 1.0, cohesionWeight: 1.0,
  explorationWeight: 0.5, communicationRange: 120, maxSpeed: 3,
  behavior: 'flocking', showTrails: true, showConnections: true,
  showPerception: false, speed: 1, showSubSwarms: true, obstacleMode: false,
  pheromoneEnabled: false, pheromoneDecay: 0.005, pheromoneDiffusion: 0.01,
  neuralNetEnabled: false, evolutionEnabled: false, evolutionRate: 0.05,
  memoryEnabled: true, environmentEnabled: false, windStrength: 0.5, windDirection: 0,
  showHeatmap: false, showFlowField: false, lifecycleEnabled: false,
  constructionEnabled: false, qLearningEnabled: false,
};

export default function App() {
  const [config, setConfig] = useState<SwarmConfig>(defaultConfig);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [structures, setStructures] = useState<Structure[]>([]);
  const [threats, setThreats] = useState<Threat[]>([]);
  const [metrics, setMetrics] = useState<SwarmMetrics>({
    avgSpeed: 0, avgEnergy: 0, totalMessages: 0, resourcesFound: 0,
    tasksCompleted: 0, swarmCoherence: 0, coverageArea: 0, activeConnections: 0,
    avgFitness: 0, generation: 0, subSwarmCount: 0, eventRate: 0,
    hiveMemorySize: 0, structuresBuilt: 0, threatsActive: 0, worldTime: '12:00', worldWeather: 'clear',
    qLearningStats: { avgQValue: 0, explorationRate: 0, agentsTrained: 0 },
  });
  const [isPaused, setIsPaused] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [events, setEvents] = useState<SwarmEvent[]>([]);
  const [worldState, setWorldState] = useState<{ time: number; timeOfDay: 'dawn' | 'day' | 'dusk' | 'night'; day: number; season: 'spring' | 'summer' | 'autumn' | 'winter'; weather: 'clear' | 'rain' | 'storm' | 'fog' | 'wind'; temperature: number; visibility: number; resourceAbundance: number; threatLevel: number }>({ time: 8, timeOfDay: 'day', day: 1, season: 'spring', weather: 'clear', temperature: 20, visibility: 1, resourceAbundance: 1, threatLevel: 0.2 });
  const [hiveStats, setHiveStats] = useState({ knownLocations: [] as any[], decisionCount: 0, goalProgress: 0 });
  const [metricsHistory, setMetricsHistory] = useState({ speed: [] as number[], coherence: [] as number[], energy: [] as number[], connections: [] as number[] });
  const [isDirectorMode, setIsDirectorMode] = useState(false);
  const [directorGoal, setDirectorGoal] = useState('');
  const [actionLog, setActionLog] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isLLMProcessing, setIsLLMProcessing] = useState(false);
  const [recordingStats, setRecordingStats] = useState({ isRecording: false, frameCount: 0, duration: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const agentsRef = useRef<Agent[]>([]);
  const resourcesRef = useRef<Resource[]>([]);
  const structuresRef = useRef<Structure[]>([]);
  const threatsRef = useRef<Threat[]>([]);
  const configRef = useRef(config);
  const pausedRef = useRef(isPaused);
  const msgCountRef = useRef(0);
  const timeRef = useRef(0);
  const hiveMindRef = useRef(new HiveMind());
  const worldSimRef = useRef(new WorldSimulation());
  const eventLogRef = useRef(new EventLog());
  const particleSystemRef = useRef(new ParticleSystem());
  const recordingRef = useRef(new RecordingSystem());
  const spatialHashRef = useRef(new SpatialHash<Agent>(80));
  const multiSwarmRef = useRef(new MultiSwarmSystem());
  const commProtocolRef = useRef(new CommunicationProtocol());
  const pheromoneGridRef = useRef<PheromoneGrid>(createPheromoneGrid(W, H, 10));
  const llmServiceRef = useRef(new LLMService({ enabled: false }));

  useEffect(() => { configRef.current = config; }, [config]);
  useEffect(() => { pausedRef.current = isPaused; }, [isPaused]);

  const init = useCallback(() => {
    const a: Agent[] = [];
    const roles: Agent['role'][] = ['explorer', 'worker', 'coordinator', 'scout', 'carrier'];
    for (let i = 0; i < config.agentCount; i++) {
      a.push(createAgent(`agent-${i}`, W * 0.3 + Math.random() * W * 0.4, H * 0.3 + Math.random() * H * 0.4, roles[i % roles.length]));
    }
    const r: Resource[] = [];
    for (let i = 0; i < 8 + Math.floor(Math.random() * 6); i++) {
      r.push(createResource(`res-${i}`, 60 + Math.random() * (W - 120), 60 + Math.random() * (H - 120)));
    }
    agentsRef.current = a;
    resourcesRef.current = r;
    structuresRef.current = [];
    threatsRef.current = [];
    msgCountRef.current = 0;
    timeRef.current = 0;
    eventLogRef.current.clear();
    particleSystemRef.current.clear();
    recordingRef.current.clear();
    setAgents([...a]);
    setResources([...r]);
    setStructures([]);
    setThreats([]);
    setMessageCount(0);
    setEvents([]);
    setActionLog([]);
    setRecordingStats({ isRecording: false, frameCount: 0, duration: 0 });
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

        if (cfg.environmentEnabled) {
          worldSimRef.current.update(cfg.speed * dt);
          setWorldState(worldSimRef.current.getState());
        }

        if (cfg.memoryEnabled) {
          hiveMindRef.current.decay();
          for (const a of ca) {
            for (const r of cr) {
              if (r.discovered && dist(a.position, r.position) < a.perceptionRadius) {
                hiveMindRef.current.contribute(a.id, r.position, r.type, r.amount);
              }
            }
          }
          setHiveStats(hiveMindRef.current.getStats());
        }

        // Update spatial hash for efficient neighbor lookups
        spatialHashRef.current.insertAll(ca);

        // Update pheromone grid
        if (cfg.pheromoneEnabled) {
          decayPheromone(pheromoneGridRef.current, cfg.pheromoneDecay);
          diffusePheromone(pheromoneGridRef.current, cfg.pheromoneDiffusion);
          
          // Agents deposit pheromones
          for (const a of ca) {
            if (a.state === 'working' || a.state === 'alert') {
              depositPheromone(pheromoneGridRef.current, a.position, 0.1);
            }
          }
        }

        const cc = establishConnections(ca, cfg);
        for (const a of ca) {
          const nb = ca.filter(o => o.id !== a.id && dist(a.position, o.position) < a.perceptionRadius);
          updateAgent(a, nb, cr, cfg, W, H, t);
          if (a.state === 'communicating') {
            msgCountRef.current += 0.1;
            // Send status update via communication protocol
            commProtocolRef.current.sendStatusUpdate(a.id, a.energy, a.state);
          }
          if (a.state === 'alert' && Math.random() < 0.1) {
            particleSystemRef.current.emit(a.position, 3, a.color, 1.5, 20);
            // Send discovery message
            const nearbyResource = cr.find(r => r.discovered && dist(a.position, r.position) < a.perceptionRadius);
            if (nearbyResource) {
              commProtocolRef.current.sendDiscovery(a.id, nearbyResource.position, nearbyResource.type);
            }
          }
        }

        // Process communication messages
        commProtocolRef.current.processMessages(ca.map(a => ({ id: a.id, position: a.position, perceptionRadius: a.perceptionRadius })));

        particleSystemRef.current.update();
        recordingRef.current.recordFrame(ca, cr);
        setRecordingStats(recordingRef.current.getStats());

        if (Math.floor(t * 10) % 30 === 0) {
          const m = calculateMetrics(ca, cr, cc);
          const updatedMetrics = {
            ...m,
            totalMessages: Math.floor(msgCountRef.current),
            hiveMemorySize: hiveMindRef.current.getStats().knownLocations.length,
            structuresBuilt: structuresRef.current.filter(s => s.completed).length,
            threatsActive: threatsRef.current.length,
            worldTime: worldSimRef.current.getTimeString(),
            worldWeather: worldSimRef.current.getState().weather,
            eventRate: eventLogRef.current.getRate(),
            pheromoneIntensity: cfg.pheromoneEnabled ? getTotalPheromoneIntensity(pheromoneGridRef.current) : 0,
            communicationStats: commProtocolRef.current.getStats(),
          };
          setMetrics(updatedMetrics);
          setMessageCount(Math.floor(msgCountRef.current));
          setEvents(eventLogRef.current.getEvents().slice(0, 20));

          setMetricsHistory(prev => ({
            speed: [...prev.speed, m.avgSpeed].slice(-60),
            coherence: [...prev.coherence, m.swarmCoherence * 100].slice(-60),
            energy: [...prev.energy, m.avgEnergy].slice(-60),
            connections: [...prev.connections, cc].slice(-60),
          }));
        }
        setAgents([...ca]);
        setResources([...cr]);
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) render(ctx, agentsRef.current, resourcesRef.current, structuresRef.current, threatsRef.current, particleSystemRef.current.getParticles(), configRef.current, W, H, timeRef.current, configRef.current.pheromoneEnabled ? pheromoneGridRef.current : undefined);
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
    
    if (config.obstacleMode) {
      const threat: Threat = { id: `threat-${threatsRef.current.length}`, position: { x, y }, radius: 30, severity: 0.7, type: 'hazard' };
      threatsRef.current.push(threat);
      setThreats([...threatsRef.current]);
      eventLogRef.current.add('threat', `Threat added at (${Math.round(x)}, ${Math.round(y)})`, 'warning', undefined, { x, y });
    } else if (config.constructionEnabled) {
      const types: Structure['type'][] = ['wall', 'tower', 'beacon', 'shelter'];
      const colors: Record<string, string> = { wall: '#886644', tower: '#4488ff', beacon: '#ffdd00', shelter: '#ff8844' };
      const type = types[Math.floor(Math.random() * types.length)];
      const structure: Structure = { id: `struct-${structuresRef.current.length}`, type, position: { x, y }, size: 40, progress: 0, completed: false, builderIds: [], color: colors[type] };
      structuresRef.current.push(structure);
      setStructures([...structuresRef.current]);
      eventLogRef.current.add('construction', `${type} construction started`, 'info', undefined, { x, y });
    } else {
      const r = createResource(`res-${resourcesRef.current.length}`, x, y);
      resourcesRef.current.push(r);
      setResources([...resourcesRef.current]);
      particleSystemRef.current.emit({ x, y }, 10, '#00ffcc', 2, 30);
      eventLogRef.current.add('discovery', `Resource added at (${Math.round(x)}, ${Math.round(y)})`, 'success', undefined, { x, y });
    }
  };

  const loadScenario = (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (scenario) {
      setConfig(c => ({ ...c, ...scenario.config }));
      eventLogRef.current.add('scenario', `Loaded: ${scenario.name}`, 'info');
      setTimeout(() => init(), 100);
    }
  };

  const handleStartRecording = () => { recordingRef.current.startRecording(); setRecordingStats(recordingRef.current.getStats()); };
  const handleStopRecording = () => { recordingRef.current.stopRecording(); setRecordingStats(recordingRef.current.getStats()); };

  const behaviors = [
    { v: 'flocking', l: 'Flocking', i: '🐦' }, { v: 'search_rescue', l: 'Search & Rescue', i: '🔍' },
    { v: 'resource_gathering', l: 'Gathering', i: '⛏️' }, { v: 'formation', l: 'V-Formation', i: '✈️' },
    { v: 'patrol', l: 'Grid Patrol', i: '🛡️' }, { v: 'consensus', l: 'Consensus', i: '🤝' },
    { v: 'predator_prey', l: 'Predator/Prey', i: '🐺' }, { v: 'neural_evolution', l: 'Neural Evo', i: '🧠' },
    { v: 'stigmergy', l: 'Stigmergy', i: '🐜' },
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
              <p className="text-[9px] text-gray-500 -mt-0.5">Advanced Multi-Agent System • Neural • Evolutionary • Stigmergic</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-gray-500">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>Online</span>
            <span>Gen: {metrics.generation}</span>
            <span>Agents: {agents.length}</span>
            <button onClick={() => setIsPaused(p => !p)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium ${isPaused ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
              {isPaused ? '▶' : '⏸'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1900px] mx-auto p-3">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-3">
          {/* Left Panel */}
          <div className="order-2 lg:order-1 space-y-3">
            <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-xl p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-100px)]">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-cyan-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>Controls
                </h2>
                <button onClick={init} className="px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 border border-red-500/30">↻ Reset</button>
              </div>

              {/* Scenarios */}
              <div className="space-y-1.5">
                <div className="text-[9px] font-semibold text-gray-500 uppercase">🎬 Scenarios</div>
                <div className="grid grid-cols-2 gap-1">
                  {scenarios.map(s => (
                    <button key={s.id} onClick={() => loadScenario(s.id)} title={s.description}
                      className="flex items-center gap-1 px-2 py-1 rounded text-[9px] bg-gray-800/50 border border-gray-700/30 text-gray-400 hover:bg-gray-800 hover:text-gray-300 transition-all">
                      <span>{s.icon}</span><span className="truncate">{s.name}</span>
                    </button>
                  ))}
                </div>
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
                <div className="text-[9px] font-semibold text-gray-500 uppercase">Advanced Systems</div>
                <Toggle l="🧠 Neural Networks" v={config.neuralNetEnabled} onChange={v => setConfig(c => ({ ...c, neuralNetEnabled: v }))} />
                <Toggle l="🧬 Evolution" v={config.evolutionEnabled} onChange={v => setConfig(c => ({ ...c, evolutionEnabled: v }))} />
                <Toggle l="🐜 Pheromones" v={config.pheromoneEnabled} onChange={v => setConfig(c => ({ ...c, pheromoneEnabled: v }))} />
                <Toggle l="💾 Memory" v={config.memoryEnabled} onChange={v => setConfig(c => ({ ...c, memoryEnabled: v }))} />
                <Toggle l="🌊 Environment" v={config.environmentEnabled} onChange={v => setConfig(c => ({ ...c, environmentEnabled: v }))} />
                <Toggle l="🎂 Lifecycle" v={config.lifecycleEnabled} onChange={v => setConfig(c => ({ ...c, lifecycleEnabled: v }))} />
                <Toggle l="🏗️ Construction" v={config.constructionEnabled} onChange={v => setConfig(c => ({ ...c, constructionEnabled: v }))} />
                <Toggle l="🧠 Q-Learning" v={config.qLearningEnabled} onChange={v => setConfig(c => ({ ...c, qLearningEnabled: v }))} />
              </div>

              <div className="space-y-1.5">
                <div className="text-[9px] font-semibold text-gray-500 uppercase">Visualization</div>
                <Toggle l="Trails" v={config.showTrails} onChange={v => setConfig(c => ({ ...c, showTrails: v }))} />
                <Toggle l="Connections" v={config.showConnections} onChange={v => setConfig(c => ({ ...c, showConnections: v }))} />
                <Toggle l="Perception" v={config.showPerception} onChange={v => setConfig(c => ({ ...c, showPerception: v }))} />
                <Toggle l="Heatmap" v={config.showHeatmap} onChange={v => setConfig(c => ({ ...c, showHeatmap: v }))} />
                <Toggle l="Flow Field" v={config.showFlowField} onChange={v => setConfig(c => ({ ...c, showFlowField: v }))} />
                <Toggle l="Sub-Swarms" v={config.showSubSwarms} onChange={v => setConfig(c => ({ ...c, showSubSwarms: v }))} />
                <Toggle l="🚧 Obstacle Mode" v={config.obstacleMode} onChange={v => setConfig(c => ({ ...c, obstacleMode: v }))} />
              </div>

              {/* Recording */}
              <div className="space-y-1.5">
                <div className="text-[9px] font-semibold text-gray-500 uppercase">📹 Recording</div>
                <div className="flex gap-1">
                  {!recordingStats.isRecording ? (
                    <button onClick={handleStartRecording} className="flex-1 px-2 py-1 rounded text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30">● Record</button>
                  ) : (
                    <button onClick={handleStopRecording} className="flex-1 px-2 py-1 rounded text-[9px] bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600">■ Stop</button>
                  )}
                </div>
                <div className="text-[8px] text-gray-500 text-center">
                  {recordingStats.frameCount} frames • {recordingStats.duration.toFixed(1)}s
                </div>
              </div>
            </div>
          </div>

          {/* Center */}
          <div className="order-1 lg:order-2 flex flex-col items-center gap-2">
            <canvas ref={canvasRef} width={W} height={H} onClick={handleCanvasClick}
              className="w-full max-w-[900px] rounded-xl border border-gray-800/50 shadow-2xl cursor-crosshair"
              style={{aspectRatio:`${W}/${H}`}} />
            <div className="w-full max-w-[900px] bg-gray-900/60 border border-gray-700/30 rounded-lg px-3 py-1.5 flex items-center justify-between text-[9px] text-gray-500">
              <span>💡 Click to {config.obstacleMode ? 'place threats' : config.constructionEnabled ? 'build structures' : 'add resources'}</span>
              <span>🔄 {config.behavior.replace('_',' ')} | 🌍 {worldState.timeOfDay} | 🌤️ {worldState.weather}</span>
              <span>⚡ {config.speed.toFixed(1)}x</span>
            </div>
            <div className="w-full max-w-[900px] grid grid-cols-6 gap-1.5">
              <Stat l="Speed" v={metrics.avgSpeed.toFixed(1)} c="cyan" />
              <Stat l="Coherence" v={`${(metrics.swarmCoherence*100).toFixed(0)}%`} c="green" />
              <Stat l="Messages" v={messageCount.toString()} c="yellow" />
              <Stat l="Resources" v={metrics.resourcesFound.toString()} c="purple" />
              <Stat l="Fitness" v={metrics.avgFitness.toFixed(0)} c="pink" />
              <Stat l="Links" v={metrics.activeConnections.toString()} c="orange" />
            </div>

            {/* Metrics Charts */}
            <div className="w-full max-w-[900px] grid grid-cols-2 gap-2">
              <Chart title="Speed" data={metricsHistory.speed} color="#06b6d4" />
              <Chart title="Coherence" data={metricsHistory.coherence} color="#10b981" />
              <Chart title="Energy" data={metricsHistory.energy} color="#f59e0b" />
              <Chart title="Connections" data={metricsHistory.connections} color="#8b5cf6" />
            </div>
          </div>

          {/* Right Panel */}
          <div className="order-3 space-y-3">
            {/* Qwen Director Panel */}
            <DirectorPanel
              llmService={llmServiceRef.current}
              getContext={() => metrics}
              onExecuteAction={async (action: SwarmAction): Promise<ActionResult> => {
                // Execute the action based on type
                if (action.type === 'adjust_param' && action.param && action.value !== undefined) {
                  setConfig(prev => ({ ...prev, [action.param!]: action.value }));
                  return { action, success: true, message: `Adjusted ${action.param} to ${action.value}` };
                }
                if (action.type === 'set_behavior' && action.behavior) {
                  setConfig(prev => ({ ...prev, behavior: action.behavior as any }));
                  return { action, success: true, message: `Set behavior to ${action.behavior}` };
                }
                if (action.type === 'toggle_feature' && action.feature && action.enabled !== undefined) {
                  setConfig(prev => ({ ...prev, [action.feature!]: action.enabled }));
                  return { action, success: true, message: `Toggled ${action.feature} ${action.enabled ? 'on' : 'off'}` };
                }
                if (action.type === 'pause') {
                  setIsPaused(true);
                  return { action, success: true, message: 'Paused simulation' };
                }
                if (action.type === 'resume') {
                  setIsPaused(false);
                  return { action, success: true, message: 'Resumed simulation' };
                }
                return { action, success: false, message: 'Unknown action type' };
              }}
              currentParams={{
                separationWeight: config.separationWeight,
                alignmentWeight: config.alignmentWeight,
                cohesionWeight: config.cohesionWeight,
                explorationWeight: config.explorationWeight,
                perceptionRadius: config.perceptionRadius,
                maxSpeed: config.maxSpeed,
              }}
              currentFeatures={{
                pheromoneEnabled: config.pheromoneEnabled,
                neuralNetEnabled: config.neuralNetEnabled,
                evolutionEnabled: config.evolutionEnabled,
                memoryEnabled: config.memoryEnabled,
                environmentEnabled: config.environmentEnabled,
              }}
            />

            {/* Qwen Chat Panel */}
            <LLMPanel
              llmService={llmServiceRef.current}
              getContext={() => metrics}
            />

            {/* World Status */}
            <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">{worldState.timeOfDay === 'dawn' ? '🌅' : worldState.timeOfDay === 'day' ? '☀️' : worldState.timeOfDay === 'dusk' ? '🌆' : '🌙'}</span>
                <h3 className="text-xs font-bold text-gray-300 uppercase">World Status</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-gray-800/50 rounded p-1.5">
                  <div className="text-gray-500 text-[8px] uppercase">Time</div>
                  <div className="font-mono font-bold text-yellow-400">{metrics.worldTime}</div>
                  <div className="text-gray-400 capitalize">{worldState.timeOfDay}</div>
                </div>
                <div className="bg-gray-800/50 rounded p-1.5">
                  <div className="text-gray-500 text-[8px] uppercase">Day</div>
                  <div className="font-mono font-bold text-gray-300">{worldState.day}</div>
                  <div className="text-gray-400">{worldState.season === 'spring' ? '🌸' : worldState.season === 'summer' ? '☀️' : worldState.season === 'autumn' ? '🍂' : '❄️'} {worldState.season}</div>
                </div>
                <div className="bg-gray-800/50 rounded p-1.5">
                  <div className="text-gray-500 text-[8px] uppercase">Weather</div>
                  <div className="text-gray-300">{worldState.weather === 'clear' ? '☀️' : worldState.weather === 'rain' ? '🌧️' : worldState.weather === 'storm' ? '⛈️' : worldState.weather === 'fog' ? '🌫️' : '💨'} {worldState.weather}</div>
                </div>
                <div className="bg-gray-800/50 rounded p-1.5">
                  <div className="text-gray-500 text-[8px] uppercase">Temp</div>
                  <div className={`font-mono font-bold ${worldState.temperature < 5 ? 'text-blue-400' : worldState.temperature > 30 ? 'text-red-400' : 'text-green-400'}`}>{worldState.temperature.toFixed(0)}°C</div>
                </div>
              </div>
            </div>

            {/* Metrics */}
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

              {/* Hive Mind Stats */}
              {config.memoryEnabled && (
                <div className="bg-purple-500/10 rounded p-1.5 border border-purple-500/30">
                  <div className="text-[8px] text-purple-400 uppercase mb-0.5">🧠 Hive Mind</div>
                  <div className="flex justify-between text-[9px]">
                    <span className="text-gray-400">Known Locations:</span>
                    <span className="text-purple-400 font-mono">{hiveStats.knownLocations.length}</span>
                  </div>
                  <div className="flex justify-between text-[9px]">
                    <span className="text-gray-400">Decisions:</span>
                    <span className="text-cyan-400 font-mono">{hiveStats.decisionCount}</span>
                  </div>
                </div>
              )}

              {/* Construction Stats */}
              {config.constructionEnabled && structures.length > 0 && (
                <div className="bg-orange-500/10 rounded p-1.5 border border-orange-500/30">
                  <div className="text-[8px] text-orange-400 uppercase mb-0.5">🏗️ Construction</div>
                  <div className="flex justify-between text-[9px]">
                    <span className="text-gray-400">Completed/Total:</span>
                    <span className="text-orange-400 font-mono">{structures.filter(s => s.completed).length}/{structures.length}</span>
                  </div>
                </div>
              )}

              {/* Threat Stats */}
              {threats.length > 0 && (
                <div className="bg-red-500/10 rounded p-1.5 border border-red-500/30">
                  <div className="text-[8px] text-red-400 uppercase mb-0.5">⚠️ Threats</div>
                  <div className="flex justify-between text-[9px]">
                    <span className="text-gray-400">Active:</span>
                    <span className="text-red-400 font-mono">{threats.length}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Event Log */}
            <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                  <h3 className="text-xs font-bold text-gray-300 uppercase">Event Log</h3>
                </div>
                <span className="text-[10px] text-gray-500 font-mono">{metrics.eventRate.toFixed(1)} evt/s</span>
              </div>
              <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
                {events.slice(0, 15).map((event) => (
                  <div key={event.id} className={`flex items-start gap-1.5 px-2 py-1 rounded border text-[10px] ${
                    event.severity === 'info' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                    event.severity === 'warning' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' :
                    event.severity === 'critical' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                    'text-green-400 bg-green-500/10 border-green-500/20'
                  }`}>
                    <span className="flex-shrink-0">{event.type === 'discovery' ? '🔍' : event.type === 'scenario' ? '🎬' : event.type === 'threat' ? '⚠️' : event.type === 'construction' ? '🏗️' : '📋'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{event.description}</div>
                      <div className="text-[9px] opacity-50">{new Date(event.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
                {events.length === 0 && <div className="text-[10px] text-gray-600 text-center py-4">Waiting for events...</div>}
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

function Chart({title,data,color}:{title:string;data:number[];color:string}) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const h = 50;
  const w = 200;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <div className="bg-gray-900/60 border border-gray-700/30 rounded-lg p-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] text-gray-400 uppercase font-semibold">{title}</span>
        <span className="text-[9px] font-mono" style={{color}}>{data[data.length-1].toFixed(1)}</span>
      </div>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
      </svg>
    </div>
  );
}

// Rendering
function render(ctx: CanvasRenderingContext2D, agents: Agent[], resources: Resource[], structures: Structure[], threats: Threat[], particles: any[], config: SwarmConfig, w: number, h: number, time: number, pheromoneGrid?: PheromoneGrid) {
  ctx.fillStyle = '#060a14';
  ctx.fillRect(0, 0, w, h);

  // Grid
  ctx.strokeStyle = '#0d1525';
  ctx.lineWidth = 0.5;
  for (let x = 0; x < w; x += 60) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
  for (let y = 0; y < h; y += 60) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }

  // Pheromone heatmap
  if (pheromoneGrid && config.showHeatmap) {
    for (let y = 0; y < pheromoneGrid.height; y++) {
      for (let x = 0; x < pheromoneGrid.width; x++) {
        const val = pheromoneGrid.data[y * pheromoneGrid.width + x];
        if (val > 0.01) {
          const alpha = Math.min(0.6, val * 0.8);
          const hue = 180 + val * 60; // cyan to green
          ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${alpha})`;
          ctx.fillRect(x * pheromoneGrid.cellSize, y * pheromoneGrid.cellSize, pheromoneGrid.cellSize, pheromoneGrid.cellSize);
        }
      }
    }
  }

  // Scan line
  const scanY = (time * 0.5) % h;
  const g = ctx.createLinearGradient(0, scanY-30, 0, scanY+30);
  g.addColorStop(0, 'transparent');
  g.addColorStop(0.5, 'rgba(0,212,255,0.02)');
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.fillRect(0, scanY-30, w, 60);

  // Threats
  for (const threat of threats) {
    const pulse = Math.sin(time * 0.1) * 0.2 + 0.8;
    const alpha = threat.severity * 0.3 * pulse;
    const glow = ctx.createRadialGradient(threat.position.x, threat.position.y, 0, threat.position.x, threat.position.y, threat.radius * 2);
    glow.addColorStop(0, `rgba(255, 0, 0, ${alpha})`);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(threat.position.x, threat.position.y, threat.radius * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(threat.position.x, threat.position.y, threat.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 0, 0, ${threat.severity * 0.8})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.lineDashOffset = -time * 0.5;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = `rgba(255, 50, 50, ${threat.severity})`;
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚠', threat.position.x, threat.position.y + 4);
  }

  // Structures
  for (const structure of structures) {
    const glow = ctx.createRadialGradient(structure.position.x, structure.position.y, 0, structure.position.x, structure.position.y, structure.size * 1.5);
    glow.addColorStop(0, `${structure.color}${structure.completed ? '40' : '20'}`);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(structure.position.x, structure.position.y, structure.size * 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(structure.position.x, structure.position.y);
    const alpha = structure.completed ? 'cc' : '88';
    ctx.fillStyle = `${structure.color}${alpha}`;
    ctx.strokeStyle = structure.color;
    ctx.lineWidth = 2;
    switch (structure.type) {
      case 'wall':
        ctx.fillRect(-structure.size / 2, -structure.size / 4, structure.size, structure.size / 2);
        ctx.strokeRect(-structure.size / 2, -structure.size / 4, structure.size, structure.size / 2);
        break;
      case 'tower':
        ctx.beginPath();
        ctx.moveTo(0, -structure.size / 2);
        ctx.lineTo(structure.size / 3, structure.size / 2);
        ctx.lineTo(-structure.size / 3, structure.size / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
      case 'beacon':
        const pulse = Math.sin(time * 0.1) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.arc(0, 0, structure.size / 3 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
      case 'shelter':
        ctx.beginPath();
        ctx.arc(0, 0, structure.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
    }
    ctx.restore();
    if (!structure.completed) {
      const barWidth = structure.size;
      const barHeight = 3;
      const barY = structure.position.y + structure.size / 2 + 5;
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(structure.position.x - barWidth / 2, barY, barWidth, barHeight);
      ctx.fillStyle = structure.color;
      ctx.fillRect(structure.position.x - barWidth / 2, barY, barWidth * (structure.progress / 100), barHeight);
      ctx.fillStyle = '#ffffff88';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(structure.progress)}%`, structure.position.x, barY + barHeight + 10);
    }
  }

  // Resources
  for (const r of resources) {
    const pulse = Math.sin(time*0.05+r.position.x)*0.3+0.7;
    const size = 8 + (r.amount/100)*8;
    const colors: Record<string,string> = {energy:'#ffdd00', data:'#00ffcc',material:'#ff6600'};
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
      working:`${a.color}ee`,returning:`${a.color}aa`,alert:'#ff0000dd',fleeing:'#ff4444cc',learning:'#aa66ffcc',building:'#ff8844cc',
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

  // Particles
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    ctx.beginPath();
    ctx.arc(p.position.x, p.position.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
    ctx.fill();
  }

  // HUD
  ctx.fillStyle = 'rgba(0,212,255,0.5)';
  ctx.font = '9px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`SWARM ACTIVE | N:${agents.length} | ${config.behavior.toUpperCase()}`, 10, 16);
  ctx.fillText(`T+${Math.floor(time/60)}s`, 10, 28);

  // Active features
  const features: string[] = [];
  if (config.neuralNetEnabled) features.push('🧠');
  if (config.pheromoneEnabled) features.push('🐜');
  if (config.evolutionEnabled) features.push('🧬');
  if (config.memoryEnabled) features.push('💾');
  if (config.environmentEnabled) features.push('🌊');
  if (features.length > 0) ctx.fillText(features.join(' '), 10, 40);

  // Corners
  ctx.strokeStyle = 'rgba(0,212,255,0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(4,24); ctx.lineTo(4,4); ctx.lineTo(24,4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w-24,4); ctx.lineTo(w-4,4); ctx.lineTo(w-4,24); ctx.stroke();
}
