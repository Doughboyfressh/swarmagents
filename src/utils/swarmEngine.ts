import { Agent, Vector2D, Resource, SwarmConfig, SwarmMetrics, AgentTraits } from '../types/swarm';

export function add(v1: Vector2D, v2: Vector2D): Vector2D {
  return { x: v1.x + v2.x, y: v1.y + v2.y };
}
export function sub(v1: Vector2D, v2: Vector2D): Vector2D {
  return { x: v1.x - v2.x, y: v1.y - v2.y };
}
export function mul(v: Vector2D, s: number): Vector2D {
  return { x: v.x * s, y: v.y * s };
}
export function div(v: Vector2D, s: number): Vector2D {
  return s !== 0 ? { x: v.x / s, y: v.y / s } : { x: 0, y: 0 };
}
export function mag(v: Vector2D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}
export function normalize(v: Vector2D): Vector2D {
  const m = mag(v);
  return m > 0 ? div(v, m) : { x: 0, y: 0 };
}
export function limit(v: Vector2D, max: number): Vector2D {
  return mag(v) > max ? mul(normalize(v), max) : v;
}
export function dist(v1: Vector2D, v2: Vector2D): number {
  return mag(sub(v1, v2));
}
export function random2D(): Vector2D {
  const a = Math.random() * Math.PI * 2;
  return { x: Math.cos(a), y: Math.sin(a) };
}

export function randomTraits(): AgentTraits {
  return {
    curiosity: Math.random(),
    sociability: Math.random(),
    aggression: Math.random(),
    caution: Math.random(),
    efficiency: 0.5 + Math.random() * 0.5,
  };
}

export function createAgent(id: string, x: number, y: number, role: Agent['role']): Agent {
  const colors: Record<Agent['role'], string> = {
    explorer: '#00d4ff',
    worker: '#00ff88',
    coordinator: '#ff6b00',
    scout: '#ff0066',
    carrier: '#aa66ff',
  };
  return {
    id,
    position: { x, y },
    velocity: mul(random2D(), Math.random() * 2 + 0.5),
    acceleration: { x: 0, y: 0 },
    maxSpeed: 2 + Math.random() * 1.5,
    maxForce: 0.1 + Math.random() * 0.05,
    radius: 6,
    role,
    state: 'moving',
    energy: 80 + Math.random() * 20,
    connections: [],
    perceptionRadius: 80 + Math.random() * 40,
    trail: [],
    color: colors[role],
    pulsePhase: Math.random() * Math.PI * 2,
    fitness: 0,
    age: 0,
    traits: randomTraits(),
  };
}

export function createResource(id: string, x: number, y: number): Resource {
  const types: Resource['type'][] = ['energy', 'data', 'material'];
  return {
    id,
    position: { x, y },
    amount: 50 + Math.random() * 50,
    type: types[Math.floor(Math.random() * types.length)],
    discovered: false,
    depletionRate: 0.05 + Math.random() * 0.1,
  };
}

function separation(agent: Agent, neighbors: Agent[], config: SwarmConfig): Vector2D {
  let steer: Vector2D = { x: 0, y: 0 };
  let count = 0;
  for (const other of neighbors) {
    const d = dist(agent.position, other.position);
    if (d > 0 && d < config.perceptionRadius * 0.5) {
      steer = add(steer, div(normalize(sub(agent.position, other.position)), d));
      count++;
    }
  }
  if (count > 0) {
    steer = normalize(div(steer, count));
    steer = limit(sub(mul(steer, agent.maxSpeed), agent.velocity), agent.maxForce);
  }
  return steer;
}

function alignment(agent: Agent, neighbors: Agent[], config: SwarmConfig): Vector2D {
  let avg: Vector2D = { x: 0, y: 0 };
  let count = 0;
  for (const other of neighbors) {
    if (dist(agent.position, other.position) < config.perceptionRadius) {
      avg = add(avg, other.velocity);
      count++;
    }
  }
  if (count > 0) {
    avg = normalize(div(avg, count));
    return limit(sub(mul(avg, agent.maxSpeed), agent.velocity), agent.maxForce);
  }
  return { x: 0, y: 0 };
}

function cohesion(agent: Agent, neighbors: Agent[], config: SwarmConfig): Vector2D {
  let center: Vector2D = { x: 0, y: 0 };
  let count = 0;
  for (const other of neighbors) {
    if (dist(agent.position, other.position) < config.perceptionRadius) {
      center = add(center, other.position);
      count++;
    }
  }
  if (count > 0) {
    center = div(center, count);
    const desired = mul(normalize(sub(center, agent.position)), agent.maxSpeed);
    return limit(sub(desired, agent.velocity), agent.maxForce);
  }
  return { x: 0, y: 0 };
}

function seek(agent: Agent, target: Vector2D): Vector2D {
  const desired = mul(normalize(sub(target, agent.position)), agent.maxSpeed);
  return limit(sub(desired, agent.velocity), agent.maxForce * 2);
}

function wander(agent: Agent, time: number): Vector2D {
  const wf = mul(normalize(agent.velocity), 3);
  const disp = mul(random2D(), 2);
  return limit(add(wf, disp), agent.maxForce * 0.5);
}

function avoidEdges(agent: Agent, w: number, h: number, margin = 60): Vector2D {
  let s: Vector2D = { x: 0, y: 0 };
  if (agent.position.x < margin) s.x = agent.maxSpeed;
  if (agent.position.x > w - margin) s.x = -agent.maxSpeed;
  if (agent.position.y < margin) s.y = agent.maxSpeed;
  if (agent.position.y > h - margin) s.y = -agent.maxSpeed;
  if (s.x !== 0 || s.y !== 0) {
    s = limit(sub(mul(normalize(s), agent.maxSpeed), agent.velocity), agent.maxForce);
  }
  return s;
}

function getBehaviorForce(
  agent: Agent, neighbors: Agent[], resources: Resource[],
  config: SwarmConfig, w: number, h: number, time: number
): Vector2D {
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
        const side = idx % 2 === 0 ? 1 : -1;
        const row = Math.ceil(idx / 2);
        const leader = sorted[0];
        const offset: Vector2D = {
          x: -row * 40 * Math.cos(time * 0.005) - side * 30 * Math.sin(time * 0.005),
          y: -row * 40 * Math.sin(time * 0.005) + side * 30 * Math.cos(time * 0.005),
        };
        force = add(force, seek(agent, add(leader.position, offset)));
      }
      break;
    }
    case 'patrol': {
      const gs = 4;
      const ai = parseInt(agent.id.split('-')[1]) || 0;
      const row = Math.floor(ai / gs);
      const col = ai % gs;
      const cw = w / gs;
      const ch = h / gs;
      force = add(force, seek(agent, {
        x: cw * (col + 0.5) + Math.sin(time * 0.003 + ai) * cw * 0.3,
        y: ch * (row + 0.5) + Math.cos(time * 0.003 + ai) * ch * 0.3,
      }));
      break;
    }
    case 'consensus':
      force = add(force, seek(agent, { x: w / 2 + Math.sin(time * 0.002) * 200, y: h / 2 + Math.cos(time * 0.003) * 150 }));
      force = add(force, mul(cohesion(agent, neighbors, config), 0.5));
      break;
    case 'predator_prey':
      if (agent.role === 'scout') {
        const center = neighbors.length > 0
          ? div(neighbors.reduce((a, n) => add(a, n.position), { x: 0, y: 0 }), neighbors.length)
          : agent.position;
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
    default:
      force = add(force, mul(wander(agent, time), config.explorationWeight));
  }
  return force;
}

export function updateAgent(
  agent: Agent, neighbors: Agent[], resources: Resource[],
  config: SwarmConfig, w: number, h: number, time: number
): void {
  agent.acceleration = getBehaviorForce(agent, neighbors, resources, config, w, h, time);
  agent.velocity = limit(add(agent.velocity, mul(agent.acceleration, config.speed)), agent.maxSpeed);
  agent.position = add(agent.position, mul(agent.velocity, config.speed));
  agent.trail.push({ ...agent.position });
  if (agent.trail.length > 25) agent.trail.shift();
  agent.energy -= 0.008 * config.speed * (1 - agent.traits.efficiency * 0.5);
  agent.energy = Math.max(0, Math.min(100, agent.energy));

  for (const r of resources) {
    if (!r.discovered && dist(agent.position, r.position) < agent.perceptionRadius) {
      r.discovered = true;
      r.discoveredBy = agent.id;
      agent.state = 'alert';
      agent.fitness += 10;
    }
    if (r.discovered && dist(agent.position, r.position) < 15 && r.amount > 0) {
      r.amount -= r.depletionRate;
      agent.energy = Math.min(100, agent.energy + 0.3 * agent.traits.efficiency);
      agent.state = 'working';
      agent.fitness += 0.5;
    }
  }

  if (agent.connections.length > 0 && Math.random() < 0.015) agent.state = 'communicating';
  else if (agent.state === 'communicating' && Math.random() < 0.1) agent.state = 'moving';

  agent.age++;
  agent.pulsePhase += 0.02;
}

export function establishConnections(agents: Agent[], config: SwarmConfig): number {
  let count = 0;
  for (const a of agents) {
    a.connections = [];
    for (const o of agents) {
      if (a.id !== o.id && dist(a.position, o.position) < config.communicationRange) {
        a.connections.push(o.id);
        count++;
      }
    }
  }
  return count / 2;
}

export function calculateMetrics(agents: Agent[], resources: Resource[], connectionCount: number): SwarmMetrics {
  if (agents.length === 0) {
    return {
      avgSpeed: 0, avgEnergy: 0, totalMessages: 0, resourcesFound: 0,
      tasksCompleted: 0, swarmCoherence: 0, coverageArea: 0, activeConnections: 0,
      avgFitness: 0, generation: 0, subSwarmCount: 0, eventRate: 0,
    };
  }
  const avgSpeed = agents.reduce((s, a) => s + mag(a.velocity), 0) / agents.length;
  const avgEnergy = agents.reduce((s, a) => s + a.energy, 0) / agents.length;
  const avgFitness = agents.reduce((s, a) => s + a.fitness, 0) / agents.length;
  const center = div(agents.reduce((a, b) => add(a, b.position), { x: 0, y: 0 }), agents.length);
  const avgDist = agents.reduce((s, a) => s + dist(a.position, center), 0) / agents.length;
  const swarmCoherence = Math.max(0, 1 - avgDist / 500);
  const positions = agents.map(a => a.position);
  const coverageArea = (Math.max(...positions.map(p => p.x)) - Math.min(...positions.map(p => p.x))) *
                       (Math.max(...positions.map(p => p.y)) - Math.min(...positions.map(p => p.y)));
  return {
    avgSpeed, avgEnergy, totalMessages: 0,
    resourcesFound: resources.filter(r => r.discovered).length,
    tasksCompleted: resources.filter(r => r.amount <= 0).length,
    swarmCoherence, coverageArea, activeConnections: connectionCount,
    avgFitness, generation: 0, subSwarmCount: 0, eventRate: 0,
  };
}
