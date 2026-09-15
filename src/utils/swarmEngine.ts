import { Agent, Vector2D, Resource, SwarmConfig, SwarmMetrics, AgentTraits, Structure, Threat, WorldState, HiveMemory, Particle, RecordingFrame, NeuralNet, AgentMemory } from '../types/swarm';

// Vector math
export const add = (v1: Vector2D, v2: Vector2D): Vector2D => ({ x: v1.x + v2.x, y: v1.y + v2.y });
export const sub = (v1: Vector2D, v2: Vector2D): Vector2D => ({ x: v1.x - v2.x, y: v1.y - v2.y });
export const mul = (v: Vector2D, s: number): Vector2D => ({ x: v.x * s, y: v.y * s });
export const div = (v: Vector2D, s: number): Vector2D => s !== 0 ? { x: v.x / s, y: v.y / s } : { x: 0, y: 0 };
export const mag = (v: Vector2D): number => Math.sqrt(v.x * v.x + v.y * v.y);
export const normalize = (v: Vector2D): Vector2D => { const m = mag(v); return m > 0 ? div(v, m) : { x: 0, y: 0 }; };
export const limit = (v: Vector2D, max: number): Vector2D => mag(v) > max ? mul(normalize(v), max) : v;
export const dist = (v1: Vector2D, v2: Vector2D): number => mag(sub(v1, v2));
export const random2D = (): Vector2D => { const a = Math.random() * Math.PI * 2; return { x: Math.cos(a), y: Math.sin(a) }; };

// Neural Network
export const createNeuralNet = (): NeuralNet => ({
  weights1: Array.from({ length: 8 }, () => Array.from({ length: 6 }, () => Math.random() * 2 - 1)),
  weights2: Array.from({ length: 4 }, () => Array.from({ length: 8 }, () => Math.random() * 2 - 1)),
  bias1: Array.from({ length: 8 }, () => Math.random() * 2 - 1),
  bias2: Array.from({ length: 4 }, () => Math.random() * 2 - 1),
});

export const forwardPass = (net: NeuralNet, inputs: number[]): number[] => {
  const hidden = net.bias1.map((bias, i) => {
    const sum = inputs.reduce((acc, input, j) => acc + input * net.weights1[i][j], bias);
    return Math.tanh(sum);
  });
  return net.bias2.map((bias, i) => {
    const sum = hidden.reduce((acc, h, j) => acc + h * net.weights2[i][j], bias);
    return Math.tanh(sum);
  });
};

export const getNeuralInputs = (distToTarget: number, angleToTarget: number, energy: number, neighborCount: number, pheromoneStrength: number, speed: number): number[] => [
  distToTarget / 500, angleToTarget / Math.PI, energy / 100, neighborCount / 10, pheromoneStrength, speed / 5,
];

// Traits & Memory
export const randomTraits = (): AgentTraits => ({
  curiosity: Math.random(), sociability: Math.random(), aggression: Math.random(),
  caution: Math.random(), efficiency: 0.5 + Math.random() * 0.5,
});

export const createEmptyMemory = (): AgentMemory => ({
  knownResources: [], knownDangers: [], visitedLocations: [],
});

// Agent creation
export const createAgent = (id: string, x: number, y: number, role: Agent['role']): Agent => {
  const colors: Record<Agent['role'], string> = {
    explorer: '#00d4ff', worker: '#00ff88', coordinator: '#ff6b00', scout: '#ff0066', carrier: '#aa66ff',
  };
  return {
    id, position: { x, y }, velocity: mul(random2D(), Math.random() * 2 + 0.5),
    acceleration: { x: 0, y: 0 }, maxSpeed: 2 + Math.random() * 1.5, maxForce: 0.1 + Math.random() * 0.05,
    radius: 6, role, state: 'moving', energy: 80 + Math.random() * 20, connections: [],
    perceptionRadius: 80 + Math.random() * 40, trail: [], color: colors[role],
    pulsePhase: Math.random() * Math.PI * 2, fitness: 0, age: 0, traits: randomTraits(),
    subSwarmId: -1, brain: createNeuralNet(), memory: createEmptyMemory(),
  };
};

export const createResource = (id: string, x: number, y: number): Resource => {
  const types: Resource['type'][] = ['energy', 'data', 'material'];
  return { id, position: { x, y }, amount: 50 + Math.random() * 50, type: types[Math.floor(Math.random() * types.length)], discovered: false, depletionRate: 0.05 + Math.random() * 0.1 };
};

// Boids
const separation = (agent: Agent, neighbors: Agent[], config: SwarmConfig): Vector2D => {
  let steer: Vector2D = { x: 0, y: 0 }; let count = 0;
  for (const other of neighbors) {
    const d = dist(agent.position, other.position);
    if (d > 0 && d < config.perceptionRadius * 0.5) {
      steer = add(steer, div(normalize(sub(agent.position, other.position)), d)); count++;
    }
  }
  if (count > 0) { steer = normalize(div(steer, count)); steer = limit(sub(mul(steer, agent.maxSpeed), agent.velocity), agent.maxForce); }
  return steer;
};

const alignment = (agent: Agent, neighbors: Agent[], config: SwarmConfig): Vector2D => {
  let avg: Vector2D = { x: 0, y: 0 }; let count = 0;
  for (const other of neighbors) {
    if (dist(agent.position, other.position) < config.perceptionRadius) { avg = add(avg, other.velocity); count++; }
  }
  if (count > 0) { avg = normalize(div(avg, count)); return limit(sub(mul(avg, agent.maxSpeed), agent.velocity), agent.maxForce); }
  return { x: 0, y: 0 };
};

const cohesion = (agent: Agent, neighbors: Agent[], config: SwarmConfig): Vector2D => {
  let center: Vector2D = { x: 0, y: 0 }; let count = 0;
  for (const other of neighbors) {
    if (dist(agent.position, other.position) < config.perceptionRadius) { center = add(center, other.position); count++; }
  }
  if (count > 0) { center = div(center, count); const desired = mul(normalize(sub(center, agent.position)), agent.maxSpeed); return limit(sub(desired, agent.velocity), agent.maxForce); }
  return { x: 0, y: 0 };
};

const seek = (agent: Agent, target: Vector2D): Vector2D => {
  const desired = mul(normalize(sub(target, agent.position)), agent.maxSpeed);
  return limit(sub(desired, agent.velocity), agent.maxForce * 2);
};

const wander = (agent: Agent, time: number): Vector2D => {
  const wf = mul(normalize(agent.velocity), 3);
  const disp = mul(random2D(), 2);
  return limit(add(wf, disp), agent.maxForce * 0.5);
};

const avoidEdges = (agent: Agent, w: number, h: number, margin = 60): Vector2D => {
  let s: Vector2D = { x: 0, y: 0 };
  if (agent.position.x < margin) s.x = agent.maxSpeed;
  if (agent.position.x > w - margin) s.x = -agent.maxSpeed;
  if (agent.position.y < margin) s.y = agent.maxSpeed;
  if (agent.position.y > h - margin) s.y = -agent.maxSpeed;
  if (s.x !== 0 || s.y !== 0) { s = limit(sub(mul(normalize(s), agent.maxSpeed), agent.velocity), agent.maxForce); }
  return s;
};

const getBehaviorForce = (agent: Agent, neighbors: Agent[], resources: Resource[], config: SwarmConfig, w: number, h: number, time: number): Vector2D => {
  let force: Vector2D = { x: 0, y: 0 };
  const soc = agent.traits.sociability;
  force = add(force, mul(separation(agent, neighbors, config), config.separationWeight));
  force = add(force, mul(alignment(agent, neighbors, config), config.alignmentWeight * soc));
  force = add(force, mul(cohesion(agent, neighbors, config), config.cohesionWeight * soc));
  force = add(force, mul(avoidEdges(agent, w, h), 2));

  switch (config.behavior) {
    case 'search_rescue':
      if (agent.role === 'explorer' || agent.role === 'scout') {
        force = add(force, mul(wander(agent, time), config.explorationWeight * 2));
      } else {
        const disc = resources.filter(r => r.discovered && r.amount > 0);
        if (disc.length > 0) {
          const nearest = disc.reduce((c, r) => dist(agent.position, r.position) < dist(agent.position, c.position) ? r : c);
          force = add(force, seek(agent, nearest.position));
        }
      }
      break;
    case 'resource_gathering': {
      const avail = resources.filter(r => r.amount > 0);
      if (avail.length > 0) {
        const nearest = avail.reduce((c, r) => dist(agent.position, r.position) < dist(agent.position, c.position) ? r : c);
        force = add(force, seek(agent, nearest.position));
      }
      break;
    }
    case 'formation': {
      const sorted = [...neighbors].sort((a, b) => a.id.localeCompare(b.id));
      const idx = sorted.findIndex(a => a.id === agent.id);
      if (idx === -1 || idx === 0) {
        force = add(force, mul({ x: Math.cos(time * 0.005), y: Math.sin(time * 0.005) }, agent.maxForce));
      } else {
        const side = idx % 2 === 0 ? 1 : -1; const row = Math.ceil(idx / 2); const leader = sorted[0];
        const offset: Vector2D = { x: -row * 40 * Math.cos(time * 0.005) - side * 30 * Math.sin(time * 0.005), y: -row * 40 * Math.sin(time * 0.005) + side * 30 * Math.cos(time * 0.005) };
        force = add(force, seek(agent, add(leader.position, offset)));
      }
      break;
    }
    case 'patrol': {
      const gs = 4; const ai = parseInt(agent.id.split('-')[1]) || 0; const row = Math.floor(ai / gs); const col = ai % gs;
      const cw = w / gs; const ch = h / gs;
      force = add(force, seek(agent, { x: cw * (col + 0.5) + Math.sin(time * 0.003 + ai) * cw * 0.3, y: ch * (row + 0.5) + Math.cos(time * 0.003 + ai) * ch * 0.3 }));
      break;
    }
    case 'consensus':
      force = add(force, seek(agent, { x: w / 2 + Math.sin(time * 0.002) * 200, y: h / 2 + Math.cos(time * 0.003) * 150 }));
      force = add(force, mul(cohesion(agent, neighbors, config), 0.5));
      break;
    case 'predator_prey':
      if (agent.role === 'scout') {
        const center = neighbors.length > 0 ? div(neighbors.reduce((a, n) => add(a, n.position), { x: 0, y: 0 }), neighbors.length) : agent.position;
        force = add(force, mul(seek(agent, add(center, mul(random2D(), 50))), 1.5));
      } else {
        const preds = neighbors.filter(n => n.role === 'scout');
        let flee: Vector2D = { x: 0, y: 0 };
        for (const p of preds) {
          if (dist(agent.position, p.position) < config.perceptionRadius * 1.5) {
            flee = add(flee, mul(normalize(sub(agent.position, p.position)), agent.maxSpeed * 1.5));
            agent.state = 'fleeing';
          }
        }
        force = add(force, mag(flee) > 0 ? flee : mul(cohesion(agent, neighbors, config), 1.5));
      }
      break;
    case 'neural_evolution': {
      const nearestRes = resources.filter(r => r.amount > 0).reduce((c, r) => dist(agent.position, r.position) < dist(agent.position, c.position) ? r : c, resources[0]);
      const targetDist = nearestRes ? dist(agent.position, nearestRes.position) : 250;
      const targetAngle = nearestRes ? Math.atan2(nearestRes.position.y - agent.position.y, nearestRes.position.x - agent.position.x) : 0;
      const inputs = getNeuralInputs(targetDist, targetAngle, agent.energy, neighbors.length, 0, mag(agent.velocity));
      const output = forwardPass(agent.brain, inputs);
      const steerForce: Vector2D = { x: output[0] * agent.maxForce * 2, y: output[1] * agent.maxForce * 2 };
      const exploreBias = (output[2] + 1) / 2;
      const wanderForce = mul(wander(agent, time), exploreBias * 0.5);
      force = add(force, add(steerForce, wanderForce));
      break;
    }
    case 'stigmergy':
      force = add(force, mul(wander(agent, time), config.explorationWeight * 1.5));
      break;
    default:
      force = add(force, mul(wander(agent, time), config.explorationWeight));
  }
  return force;
};

export const updateAgent = (agent: Agent, neighbors: Agent[], resources: Resource[], config: SwarmConfig, w: number, h: number, time: number): void => {
  agent.acceleration = getBehaviorForce(agent, neighbors, resources, config, w, h, time);
  agent.velocity = limit(add(agent.velocity, mul(agent.acceleration, config.speed)), agent.maxSpeed);
  agent.position = add(agent.position, mul(agent.velocity, config.speed));
  agent.trail.push({ ...agent.position });
  if (agent.trail.length > 25) agent.trail.shift();
  agent.energy -= 0.008 * config.speed * (1 - agent.traits.efficiency * 0.5);
  agent.energy = Math.max(0, Math.min(100, agent.energy));

  for (const r of resources) {
    if (!r.discovered && dist(agent.position, r.position) < agent.perceptionRadius) {
      r.discovered = true; r.discoveredBy = agent.id; agent.state = 'alert'; agent.fitness += 10;
    }
    if (r.discovered && dist(agent.position, r.position) < 15 && r.amount > 0) {
      r.amount -= r.depletionRate; agent.energy = Math.min(100, agent.energy + 0.3 * agent.traits.efficiency); agent.state = 'working'; agent.fitness += 0.5;
    }
  }

  if (agent.connections.length > 0 && Math.random() < 0.015) agent.state = 'communicating';
  else if (agent.state === 'communicating' && Math.random() < 0.1) agent.state = 'moving';

  agent.age++; agent.pulsePhase += 0.02;
};

export const establishConnections = (agents: Agent[], config: SwarmConfig): number => {
  let count = 0;
  for (const a of agents) {
    a.connections = [];
    for (const o of agents) {
      if (a.id !== o.id && dist(a.position, o.position) < config.communicationRange) { a.connections.push(o.id); count++; }
    }
  }
  return count / 2;
};

export const calculateMetrics = (agents: Agent[], resources: Resource[], connectionCount: number): SwarmMetrics => {
  if (agents.length === 0) {
    return { avgSpeed: 0, avgEnergy: 0, totalMessages: 0, resourcesFound: 0, tasksCompleted: 0, swarmCoherence: 0, coverageArea: 0, activeConnections: 0, avgFitness: 0, generation: 0, subSwarmCount: 0, eventRate: 0, hiveMemorySize: 0, structuresBuilt: 0, threatsActive: 0, worldTime: '12:00', worldWeather: 'clear', qLearningStats: { avgQValue: 0, explorationRate: 0, agentsTrained: 0 } };
  }
  const avgSpeed = agents.reduce((s, a) => s + mag(a.velocity), 0) / agents.length;
  const avgEnergy = agents.reduce((s, a) => s + a.energy, 0) / agents.length;
  const avgFitness = agents.reduce((s, a) => s + a.fitness, 0) / agents.length;
  const center = div(agents.reduce((a, b) => add(a, b.position), { x: 0, y: 0 }), agents.length);
  const avgDist = agents.reduce((s, a) => s + dist(a.position, center), 0) / agents.length;
  const swarmCoherence = Math.max(0, 1 - avgDist / 500);
  const positions = agents.map(a => a.position);
  const coverageArea = (Math.max(...positions.map(p => p.x)) - Math.min(...positions.map(p => p.x))) * (Math.max(...positions.map(p => p.y)) - Math.min(...positions.map(p => p.y)));
  return {
    avgSpeed, avgEnergy, totalMessages: 0,
    resourcesFound: resources.filter(r => r.discovered).length,
    tasksCompleted: resources.filter(r => r.amount <= 0).length,
    swarmCoherence, coverageArea, activeConnections: connectionCount,
    avgFitness, generation: 0, subSwarmCount: 0, eventRate: 0, hiveMemorySize: 0, structuresBuilt: 0, threatsActive: 0, worldTime: '12:00', worldWeather: 'clear',
    qLearningStats: { avgQValue: 0, explorationRate: 0, agentsTrained: 0 },
  };
};

// Hive Mind
export class HiveMind {
  private memory: HiveMemory = { knownLocations: [], decisionCount: 0, goalProgress: 0 };
  
  contribute(agentId: string, position: Vector2D, type: string, value: number): void {
    const existing = this.memory.knownLocations.find(l => dist(l.position, position) < 30 && l.type === type);
    if (existing) { existing.value = Math.min(100, existing.value + value); existing.contributors++; }
    else { this.memory.knownLocations.push({ position: { ...position }, type, value, contributors: 1 }); }
    if (this.memory.knownLocations.length > 50) this.memory.knownLocations.sort((a, b) => b.value - a.value).slice(0, 50);
  }
  
  decay(): void { for (const loc of this.memory.knownLocations) loc.value *= 0.995; this.memory.knownLocations = this.memory.knownLocations.filter(l => l.value > 0.1); }
  getStats(): HiveMemory { return { ...this.memory }; }
}

// World Simulation
export class WorldSimulation {
  private state: WorldState = { time: 8, timeOfDay: 'day', day: 1, season: 'spring', weather: 'clear', temperature: 20, visibility: 1, resourceAbundance: 1, threatLevel: 0.2 };
  
  update(dt: number): void {
    this.state.time += 0.001 * dt;
    if (this.state.time >= 24) { this.state.time -= 24; this.state.day++; if (this.state.day % 30 === 0) this.advanceSeason(); }
    this.state.timeOfDay = this.getTimeOfDay();
    if (Math.random() < 0.0001 * dt) this.changeWeather();
    this.updateEffects();
  }
  
  private getTimeOfDay(): WorldState['timeOfDay'] {
    const t = this.state.time;
    if (t >= 5 && t < 8) return 'dawn'; if (t >= 8 && t < 18) return 'day'; if (t >= 18 && t < 21) return 'dusk'; return 'night';
  }
  
  private advanceSeason(): void {
    const seasons: WorldState['season'][] = ['spring', 'summer', 'autumn', 'winter'];
    this.state.season = seasons[(seasons.indexOf(this.state.season) + 1) % 4];
  }
  
  private changeWeather(): void {
    const weathers: WorldState['weather'][] = ['clear', 'rain', 'storm', 'fog', 'wind'];
    this.state.weather = weathers[Math.floor(Math.random() * weathers.length)];
  }
  
  private updateEffects(): void {
    const seasonTemps: Record<string, number> = { spring: 15, summer: 25, autumn: 10, winter: 0 };
    this.state.temperature = seasonTemps[this.state.season] + (this.state.time >= 12 && this.state.time < 15 ? 5 : this.state.time >= 3 && this.state.time < 6 ? -5 : 0);
    const weatherVis: Record<string, number> = { clear: 1, rain: 0.7, storm: 0.4, fog: 0.3, wind: 0.9 };
    const timeVis = this.state.timeOfDay === 'night' ? 0.3 : 1;
    this.state.visibility = weatherVis[this.state.weather] * timeVis;
    const seasonAbundance: Record<string, number> = { spring: 1.2, summer: 1, autumn: 0.8, winter: 0.5 };
    this.state.resourceAbundance = seasonAbundance[this.state.season];
    this.state.threatLevel = Math.min(1, 0.2 + (this.state.timeOfDay === 'night' ? 0.3 : 0) + (this.state.weather === 'storm' ? 0.2 : 0));
  }
  
  getState(): WorldState { return { ...this.state }; }
  getTimeString(): string { const h = Math.floor(this.state.time); const m = Math.floor((this.state.time % 1) * 60); return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`; }
}

// Event Log
export class EventLog {
  private events: any[] = [];
  private counter = 0;
  
  add(type: string, description: string, severity: 'info' | 'warning' | 'critical' | 'success' = 'info', agentId?: string, position?: Vector2D): void {
    this.events.unshift({ id: `evt-${this.counter++}`, timestamp: Date.now(), type, description, severity, agentId, position });
    if (this.events.length > 100) this.events = this.events.slice(0, 100);
  }
  
  getEvents(): any[] { return this.events; }
  getRate(): number { const now = Date.now(); return this.events.filter(e => now - e.timestamp < 5000).length / 5; }
  clear(): void { this.events = []; }
}

// Particle System
export class ParticleSystem {
  private particles: Particle[] = [];
  
  emit(position: Vector2D, count: number, color: string, speed = 2, life = 30): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= 500) break;
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * speed;
      this.particles.push({
        position: { ...position },
        velocity: { x: Math.cos(angle) * spd, y: Math.sin(angle) * spd },
        life, maxLife: life, color, size: 1 + Math.random() * 2,
      });
    }
  }
  
  update(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.position.x += p.velocity.x;
      p.position.y += p.velocity.y;
      p.velocity.x *= 0.95;
      p.velocity.y *= 0.95;
      p.life--;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }
  
  getParticles(): Particle[] { return this.particles; }
  clear(): void { this.particles = []; }
}

// Recording System
export class RecordingSystem {
  private frames: RecordingFrame[] = [];
  private isRecording = false;
  private lastFrameTime = 0;
  
  startRecording(): void { this.frames = []; this.isRecording = true; }
  stopRecording(): void { this.isRecording = false; }
  
  recordFrame(agents: Agent[], resources: Resource[]): void {
    if (!this.isRecording) return;
    const now = Date.now();
    if (now - this.lastFrameTime < 100) return;
    this.lastFrameTime = now;
    
    this.frames.push({
      timestamp: now,
      agents: agents.map(a => ({ id: a.id, position: { ...a.position }, velocity: { ...a.velocity }, energy: a.energy, state: a.state })),
      resources: resources.map(r => ({ id: r.id, position: { ...r.position }, amount: r.amount, discovered: r.discovered })),
    });
    
    if (this.frames.length > 1000) this.frames.shift();
  }
  
  getStats(): { isRecording: boolean; frameCount: number; duration: number } {
    const duration = this.frames.length > 0 ? (this.frames[this.frames.length - 1].timestamp - this.frames[0].timestamp) / 1000 : 0;
    return { isRecording: this.isRecording, frameCount: this.frames.length, duration };
  }
  
  clear(): void { this.frames = []; this.isRecording = false; }
}

// Scenarios
export const scenarios = [
  { id: 'flocking', name: 'Basic Flocking', icon: '🐦', description: 'Classic boids', config: { behavior: 'flocking' as const, agentCount: 50, separationWeight: 1.5, alignmentWeight: 1, cohesionWeight: 1 } },
  { id: 'resource', name: 'Resource Rush', icon: '⛏️', description: 'Gather resources', config: { behavior: 'resource_gathering' as const, agentCount: 40, explorationWeight: 1.5 } },
  { id: 'neural', name: 'Neural Evo', icon: '🧬', description: 'Evolving networks', config: { behavior: 'neural_evolution' as const, agentCount: 60, neuralNetEnabled: true, evolutionEnabled: true } },
  { id: 'ant', name: 'Ant Colony', icon: '🐜', description: 'Pheromone trails', config: { behavior: 'stigmergy' as const, agentCount: 80, pheromoneEnabled: true, showHeatmap: true } },
  { id: 'predator', name: 'Predator/Prey', icon: '🐺', description: 'Chase dynamics', config: { behavior: 'predator_prey' as const, agentCount: 50 } },
  { id: 'formation', name: 'V-Formation', icon: '✈️', description: 'Formation flight', config: { behavior: 'formation' as const, agentCount: 30 } },
  { id: 'rescue', name: 'Search & Rescue', icon: '🔍', description: 'Find targets', config: { behavior: 'search_rescue' as const, agentCount: 45, explorationWeight: 2 } },
  { id: 'windy', name: 'Windy Env', icon: '🌊', description: 'Weather effects', config: { behavior: 'flocking' as const, agentCount: 40, environmentEnabled: true, showFlowField: true } },
  { id: 'consensus', name: 'Consensus', icon: '🤝', description: 'Collective decision', config: { behavior: 'consensus' as const, agentCount: 60, cohesionWeight: 2.5 } },
  { id: 'ecosystem', name: 'Ecosystem', icon: '🌱', description: 'Birth/death cycle', config: { behavior: 'resource_gathering' as const, agentCount: 30, lifecycleEnabled: true } },
  { id: 'patrol', name: 'Grid Patrol', icon: '🛡️', description: 'Area coverage', config: { behavior: 'patrol' as const, agentCount: 36 } },
  { id: 'mega', name: 'Mega Swarm', icon: '🌌', description: 'Large scale', config: { behavior: 'flocking' as const, agentCount: 120, perceptionRadius: 60 } },
];
