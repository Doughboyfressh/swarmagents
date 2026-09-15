import { useState, useEffect, useRef, useCallback } from 'react';
import SwarmCanvas, { renderSwarm } from './components/SwarmCanvas';
import { Agent, Resource, SwarmConfig, SwarmMetrics, Vector2D, SwarmEvent } from './types/swarm';
import {
  createAgent,
  createResource,
  establishConnections,
  calculateMetrics,
  updateAgent,
  dist,
} from './utils/swarmEngine';

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 600;

const defaultConfig: SwarmConfig = {
  agentCount: 40,
  perceptionRadius: 80,
  separationWeight: 1.5,
  alignmentWeight: 1.0,
  cohesionWeight: 1.0,
  explorationWeight: 0.5,
  communicationRange: 120,
  maxSpeed: 3,
  behavior: 'flocking',
  showTrails: true,
  showConnections: true,
  showPerception: false,
  speed: 1,
  pheromoneEnabled: false,
  pheromoneDecay: 0.005,
  pheromoneDiffusion: 0.01,
  neuralNetEnabled: false,
  evolutionEnabled: false,
  evolutionRate: 0.05,
  environmentEnabled: false,
  windStrength: 0.5,
  windDirection: 0,
  showHeatmap: false,
  showFlowField: false,
  showSubSwarms: true,
  memoryEnabled: true,
  obstacleMode: false,
};

export default function App() {
  const [config, setConfig] = useState<SwarmConfig>(defaultConfig);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [metrics, setMetrics] = useState<SwarmMetrics>({
    avgSpeed: 0,
    avgEnergy: 0,
    totalMessages: 0,
    resourcesFound: 0,
    tasksCompleted: 0,
    swarmCoherence: 0,
    coverageArea: 0,
    activeConnections: 0,
    avgFitness: 0,
    generation: 0,
    subSwarmCount: 0,
    pheromoneIntensity: 0,
    memoryAccuracy: 0,
    eventRate: 0,
  });
  const [isPaused, setIsPaused] = useState(false);
  const [messageCount, setMessageCount] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const agentsRef = useRef<Agent[]>([]);
  const resourcesRef = useRef<Resource[]>([]);
  const configRef = useRef<SwarmConfig>(config);
  const pausedRef = useRef(isPaused);
  const messageCountRef = useRef(0);
  const simTimeRef = useRef(0);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  // Initialize swarm
  const initializeSwarm = useCallback(() => {
    const newAgents: Agent[] = [];
    const roles: Agent['role'][] = ['explorer', 'worker', 'coordinator', 'scout', 'carrier'];

    for (let i = 0; i < config.agentCount; i++) {
      const role = roles[i % roles.length];
      const x = CANVAS_WIDTH * 0.3 + Math.random() * CANVAS_WIDTH * 0.4;
      const y = CANVAS_HEIGHT * 0.3 + Math.random() * CANVAS_HEIGHT * 0.4;
      newAgents.push(createAgent(`agent-${i}`, x, y, role));
    }

    const newResources: Resource[] = [];
    const resourceCount = 8 + Math.floor(Math.random() * 6);
    for (let i = 0; i < resourceCount; i++) {
      const x = 60 + Math.random() * (CANVAS_WIDTH - 120);
      const y = 60 + Math.random() * (CANVAS_HEIGHT - 120);
      newResources.push(createResource(`res-${i}`, x, y));
    }

    agentsRef.current = newAgents;
    resourcesRef.current = newResources;
    messageCountRef.current = 0;
    simTimeRef.current = 0;

    setAgents([...newAgents]);
    setResources([...newResources]);
    setMessageCount(0);
  }, [config.agentCount]);

  useEffect(() => {
    initializeSwarm();
  }, []);

  // Main simulation loop
  useEffect(() => {
    let animFrame: number;
    let lastTime = performance.now();

    const simulate = (currentTime: number) => {
      const deltaTime = Math.min((currentTime - lastTime) / 16.67, 3);
      lastTime = currentTime;

      if (!pausedRef.current) {
        const cfg = configRef.current;
        const currentAgents = agentsRef.current;
        const currentResources = resourcesRef.current;
        simTimeRef.current += cfg.speed * deltaTime;
        const time = simTimeRef.current;

        // Establish connections
        const connectionCount = establishConnections(currentAgents, cfg);

        // Update each agent
        for (const agent of currentAgents) {
          const neighbors = currentAgents.filter(
            (a) => a.id !== agent.id && dist(agent.position, a.position) < agent.perceptionRadius
          );

          updateAgent(agent, neighbors, currentResources, cfg, CANVAS_WIDTH, CANVAS_HEIGHT, time);

          if (agent.state === 'communicating') {
            messageCountRef.current += 0.1;
          }
        }

        // Update metrics
        if (Math.floor(time * 10) % 30 === 0) {
          const m = calculateMetrics(currentAgents, currentResources, connectionCount);
          setMetrics({
            ...m,
            totalMessages: Math.floor(messageCountRef.current),
          });
          setMessageCount(Math.floor(messageCountRef.current));
        }

        setAgents([...currentAgents]);
        setResources([...currentResources]);
      }

      // Render
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderSwarm(ctx, agentsRef.current, resourcesRef.current, configRef.current, CANVAS_WIDTH, CANVAS_HEIGHT, simTimeRef.current);
        }
      }

      animFrame = requestAnimationFrame(simulate);
    };

    animFrame = requestAnimationFrame(simulate);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  const handleConfigChange = useCallback((changes: Partial<SwarmConfig>) => {
    setConfig(prev => ({ ...prev, ...changes }));
  }, []);

  const handleReset = useCallback(() => {
    initializeSwarm();
  }, [initializeSwarm]);

  const handlePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  const handleAddAgent = useCallback(() => {
    const roles: Agent['role'][] = ['explorer', 'worker', 'coordinator', 'scout', 'carrier'];
    const role = roles[Math.floor(Math.random() * roles.length)];
    const x = CANVAS_WIDTH * 0.3 + Math.random() * CANVAS_WIDTH * 0.4;
    const y = CANVAS_HEIGHT * 0.3 + Math.random() * CANVAS_HEIGHT * 0.4;
    const newAgent = createAgent(`agent-${agentsRef.current.length}`, x, y, role);
    agentsRef.current.push(newAgent);
    setConfig(prev => ({ ...prev, agentCount: prev.agentCount + 1 }));
    setAgents([...agentsRef.current]);
  }, []);

  const handleRemoveAgent = useCallback(() => {
    if (agentsRef.current.length > 3) {
      agentsRef.current.pop();
      setConfig(prev => ({ ...prev, agentCount: prev.agentCount - 1 }));
      setAgents([...agentsRef.current]);
    }
  }, []);

  const handleCanvasClick = useCallback((pos: Vector2D) => {
    if (config.obstacleMode) {
      // Obstacle mode not implemented yet
    } else {
      const newResource = createResource(`res-${resourcesRef.current.length}`, pos.x, pos.y);
      resourcesRef.current.push(newResource);
      setResources([...resourcesRef.current]);
    }
  }, [config.obstacleMode]);

  const behaviors = [
    { value: 'flocking', label: 'Flocking', icon: '🐦' },
    { value: 'search_rescue', label: 'Search & Rescue', icon: '🔍' },
    { value: 'resource_gathering', label: 'Gathering', icon: '⛏️' },
    { value: 'formation', label: 'V-Formation', icon: '✈️' },
    { value: 'patrol', label: 'Grid Patrol', icon: '🛡️' },
    { value: 'consensus', label: 'Consensus', icon: '🤝' },
    { value: 'predator_prey', label: 'Predator/Prey', icon: '🐺' },
    { value: 'neural_evolution', label: 'Neural Evo', icon: '🧠' },
  ];

  return (
    <div className="min-h-screen bg-[#060a14] text-white overflow-hidden">
      {/* Header */}
      <header className="border-b border-gray-800/50 bg-gray-900/30 backdrop-blur-sm">
        <div className="max-w-[1900px] mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <span className="text-sm">🧬</span>
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse border border-gray-900"></div>
            </div>
            <div>
              <h1 className="text-base font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Agent Swarm Intelligence
              </h1>
              <p className="text-[9px] text-gray-500 -mt-0.5">Advanced Multi-Agent System</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
              Online
            </span>
            <span>Agents: {agents.length}</span>
            <button
              onClick={handlePause}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                isPaused ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              }`}
            >
              {isPaused ? '▶' : '⏸'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1900px] mx-auto p-3">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_240px] gap-3">
          {/* Left Panel - Controls */}
          <div className="order-2 lg:order-1 space-y-3">
            <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-xl p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-100px)]">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-cyan-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  Controls
                </h2>
                <button onClick={handleReset} className="px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30">↻</button>
              </div>

              {/* Behavior */}
              <div className="space-y-1.5">
                <div className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Behavior Mode</div>
                <div className="grid grid-cols-1 gap-1">
                  {behaviors.map((b) => (
                    <button
                      key={b.value}
                      onClick={() => handleConfigChange({ behavior: b.value as any })}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all text-[11px] ${
                        config.behavior === b.value
                          ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300'
                          : 'bg-gray-800/50 border border-gray-700/30 text-gray-400 hover:bg-gray-800'
                      }`}
                    >
                      <span className="text-sm">{b.icon}</span>
                      <span className="font-medium text-[10px]">{b.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Agent Count */}
              <div className="space-y-1.5">
                <div className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Agents ({config.agentCount})</div>
                <div className="flex items-center gap-1.5">
                  <button onClick={handleRemoveAgent} className="px-2 py-0.5 rounded bg-gray-800 text-gray-400 hover:bg-gray-700 text-xs border border-gray-700">−</button>
                  <input
                    type="range"
                    min="5"
                    max="120"
                    value={config.agentCount}
                    onChange={(e) => handleConfigChange({ agentCount: parseInt(e.target.value) })}
                    className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <button onClick={handleAddAgent} className="px-2 py-0.5 rounded bg-gray-800 text-gray-400 hover:bg-gray-700 text-xs border border-gray-700">+</button>
                </div>
              </div>

              {/* Flocking Parameters */}
              <div className="space-y-1.5">
                <div className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Flocking</div>
                <SliderControl label="Separation" value={config.separationWeight} min={0} max={5} step={0.1} onChange={(v) => handleConfigChange({ separationWeight: v })} />
                <SliderControl label="Alignment" value={config.alignmentWeight} min={0} max={5} step={0.1} onChange={(v) => handleConfigChange({ alignmentWeight: v })} />
                <SliderControl label="Cohesion" value={config.cohesionWeight} min={0} max={5} step={0.1} onChange={(v) => handleConfigChange({ cohesionWeight: v })} />
                <SliderControl label="Exploration" value={config.explorationWeight} min={0} max={5} step={0.1} onChange={(v) => handleConfigChange({ explorationWeight: v })} />
                <SliderControl label="Perception" value={config.perceptionRadius} min={20} max={200} step={5} onChange={(v) => handleConfigChange({ perceptionRadius: v })} />
                <SliderControl label="Speed" value={config.maxSpeed} min={1} max={8} step={0.5} onChange={(v) => handleConfigChange({ maxSpeed: v })} />
              </div>

              {/* Visualization */}
              <div className="space-y-1.5">
                <div className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Visualization</div>
                <Toggle label="Trails" checked={config.showTrails} onChange={(v) => handleConfigChange({ showTrails: v })} />
                <Toggle label="Connections" checked={config.showConnections} onChange={(v) => handleConfigChange({ showConnections: v })} />
                <Toggle label="Perception Range" checked={config.showPerception} onChange={(v) => handleConfigChange({ showPerception: v })} />
              </div>
            </div>
          </div>

          {/* Center - Canvas */}
          <div className="order-1 lg:order-2 flex flex-col items-center gap-2">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                handleCanvasClick({ x, y });
              }}
              className="w-full max-w-[900px] rounded-xl border border-gray-800/50 shadow-2xl shadow-blue-900/20 cursor-crosshair"
              style={{ aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}` }}
            />
            <div className="w-full max-w-[900px] bg-gray-900/60 border border-gray-700/30 rounded-lg px-3 py-1.5 flex items-center justify-between text-[9px] text-gray-500">
              <span>💡 Click to add resources</span>
              <span>Behavior: {config.behavior.replace('_', ' ')}</span>
            </div>
            <div className="w-full max-w-[900px] grid grid-cols-6 gap-1.5">
              <QuickStat label="Speed" value={metrics.avgSpeed.toFixed(1)} color="cyan" />
              <QuickStat label="Coherence" value={`${(metrics.swarmCoherence * 100).toFixed(0)}%`} color="green" />
              <QuickStat label="Messages" value={messageCount.toString()} color="yellow" />
              <QuickStat label="Resources" value={metrics.resourcesFound.toString()} color="purple" />
              <QuickStat label="Fitness" value={metrics.avgFitness.toFixed(0)} color="pink" />
              <QuickStat label="Links" value={metrics.activeConnections.toString()} color="orange" />
            </div>
          </div>

          {/* Right Panel - Metrics */}
          <div className="order-3 space-y-3">
            <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-xl p-3 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                <h2 className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">Metrics</h2>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <MetricCard label="Speed" value={metrics.avgSpeed.toFixed(1)} color="cyan" pct={metrics.avgSpeed / 5} />
                <MetricCard label="Coherence" value={`${(metrics.swarmCoherence * 100).toFixed(0)}%`} color="green" pct={metrics.swarmCoherence} />
                <MetricCard label="Fitness" value={metrics.avgFitness.toFixed(0)} color="pink" pct={metrics.avgFitness / 100} />
                <MetricCard label="Links" value={metrics.activeConnections.toString()} color="yellow" pct={Math.min(1, metrics.activeConnections / (agents.length * 2))} />
              </div>

              <div className="grid grid-cols-3 gap-1 text-center">
                <MiniStat label="Msgs" value={messageCount} color="text-cyan-400" />
                <MiniStat label="Res" value={metrics.resourcesFound} color="text-yellow-400" />
                <MiniStat label="Energy" value={metrics.avgEnergy.toFixed(0)} color="text-green-400" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function SliderControl({ label, value, min, max, step, onChange }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-gray-500 w-16 flex-shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
      />
      <span className="text-[9px] text-gray-400 font-mono w-8 text-right">{value.toFixed(1)}</span>
    </div>
  );
}

function Toggle({ label, checked, onChange }: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-0.5 cursor-pointer group" onClick={() => onChange(!checked)}>
      <span className="text-[10px] text-gray-400 group-hover:text-gray-300">{label}</span>
      <div className={`w-7 h-3.5 rounded-full transition-all relative ${checked ? 'bg-cyan-500/40' : 'bg-gray-700'}`}>
        <div
          className={`absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all ${checked ? 'bg-cyan-400' : 'bg-gray-500'}`}
          style={{ left: checked ? '15px' : '2px' }}
        />
      </div>
    </div>
  );
}

function QuickStat({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    cyan: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5',
    green: 'text-green-400 border-green-500/20 bg-green-500/5',
    yellow: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5',
    purple: 'text-purple-400 border-purple-500/20 bg-purple-500/5',
    pink: 'text-pink-400 border-pink-500/20 bg-pink-500/5',
    orange: 'text-orange-400 border-orange-500/20 bg-orange-500/5',
  };
  return (
    <div className={`rounded-lg px-2 py-1.5 border ${colorMap[color] || colorMap.cyan}`}>
      <div className="text-[8px] text-gray-500 uppercase">{label}</div>
      <div className={`text-xs font-mono font-bold ${colorMap[color]?.split(' ')[0]}`}>{value}</div>
    </div>
  );
}

function MetricCard({ label, value, color, pct }: { label: string; value: string; color: string; pct: number }) {
  const colorMap: Record<string, { text: string; bar: string; bg: string }> = {
    cyan: { text: 'text-cyan-400', bar: 'bg-cyan-500', bg: 'bg-cyan-500/10' },
    green: { text: 'text-green-400', bar: 'bg-green-500', bg: 'bg-green-500/10' },
    pink: { text: 'text-pink-400', bar: 'bg-pink-500', bg: 'bg-pink-500/10' },
    yellow: { text: 'text-yellow-400', bar: 'bg-yellow-500', bg: 'bg-yellow-500/10' },
  };
  const c = colorMap[color] || colorMap.cyan;
  return (
    <div className={`${c.bg} rounded p-1.5 border border-gray-700/30`}>
      <div className="text-[8px] text-gray-500">{label}</div>
      <div className={`text-[11px] font-mono font-bold ${c.text}`}>{value}</div>
      <div className="h-0.5 bg-gray-800 rounded-full mt-0.5 overflow-hidden">
        <div
          className={`h-full ${c.bar} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(100, pct * 100)}%` }}
        />
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-gray-800/50 rounded p-1">
      <div className="text-[7px] text-gray-500 uppercase">{label}</div>
      <div className={`text-[10px] font-mono ${color}`}>{value}</div>
    </div>
  );
}
