import { Agent, Vector2D, Resource, SwarmConfig, SwarmMetrics, NeuralNet, AgentMemory, AgentTraits } from '../types/swarm';

// Vector math utilities
export function add(v1: Vector2D, v2: Vector2D): Vector2D {
  return { x: v1.x + v2.x, y: v1.y + v2.y };
}

export function sub(v1: Vector2D, v2: Vector2D): Vector2D {
  return { x: v1.x - v2.x, y: v1.y - v2.y };
}

export function mul(v: Vector2D, scalar: number): Vector2D {
  return { x: v.x * scalar, y: v.y * scalar };
}

export function div(v: Vector2D, scalar: number): Vector2D {
  return scalar !== 0 ? { x: v.x / scalar, y: v.y / scalar } : { x: 0, y: 0 };
}

export function mag(v: Vector2D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function normalize(v: Vector2D): Vector2D {
  const m = mag(v);
  return m > 0 ? div(v, m) : { x: 0, y: 0 };
}

export function limit(v: Vector2D, max: number): Vector2D {
  const m = mag(v);
  if (m > max) {
    return mul(normalize(v), max);
  }
  return v;
}

export function dist(v1: Vector2D, v2: Vector2D): number {
  return mag(sub(v1, v2));
}

export function random2D(): Vector2D {
  const angle = Math.random() * Math.PI * 2;
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

// Neural network utilities
export function createNeuralNet(): NeuralNet {
  return {
    weights1: Array.from({ length: 8 }, () => Array.from({ length: 6 }, () => Math.random() * 2 - 1)),
    weights2: Array.from({ length: 4 }, () => Array.from({ length: 8 }, () => Math.random() * 2 - 1)),
    bias1: Array.from({ length: 8 }, () => Math.random() * 2 - 1),
    bias2: Array.from({ length: 4 }, () => Math.random() * 2 - 1),
  };
}

export function forwardPass(net: NeuralNet, inputs: number[]): number[] {
  // Hidden layer
  const hidden = net.bias1.map((bias, i) => {
    const sum = inputs.reduce((acc, input, j) => acc + input * net.weights1[i][j], bias);
    return Math.tanh(sum);
  });

  // Output layer
  return net.bias2.map((bias, i) => {
    const sum = hidden.reduce((acc, h, j) => acc + h * net.weights2[i][j], bias);
    return Math.tanh(sum);
  });
}

export function getNeuralInputs(
  distToTarget: number,
  angleToTarget: number,
  energy: number,
  neighborCount: number,
  pheromoneStrength: number,
  speed: number
): number[] {
  return [
    distToTarget / 500,
    angleToTarget / Math.PI,
    energy / 100,
    neighborCount / 10,
    pheromoneStrength,
    speed / 5,
  ];
}

// Agent traits
export function randomTraits(): AgentTraits {
  return {
    curiosity: Math.random(),
    sociability: Math.random(),
    aggression: Math.random(),
    caution: Math.random(),
    efficiency: 0.5 + Math.random() * 0.5,
  };
}

// Agent memory
export function createEmptyMemory(): AgentMemory {
  return {
    knownResources: [],
    knownDangers: [],
    visitedLocations: [],
    socialKnowledge: [],
  };
}

// Create agent
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
    brain: createNeuralNet(),
    memory: createEmptyMemory(),
    subSwarmId: -1,
    fitness: 0,
    age: 0,
    traits: randomTraits(),
  };
}

// Create resource
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

// Boids algorithm
export function separation(agent: Agent, neighbors: Agent[], config: SwarmConfig): Vector2D {
  let steer: Vector2D = { x: 0, y: 0 };
  let count = 0;

  for (const other of neighbors) {
    const d = dist(agent.position, other.position);
    if (d > 0 && d < config.perceptionRadius * 0.5) {
      const diff = normalize(sub(agent.position, other.position));
      steer = add(steer, div(diff, d));
      count++;
    }
  }

  if (count > 0) {
    steer = div(steer, count);
    steer = normalize(steer);
    steer = mul(steer, agent.maxSpeed);
    steer = sub(steer, agent.velocity);
    steer = limit(steer, agent.maxForce);
  }

  return steer;
}

export function alignment(agent: Agent, neighbors: Agent[], config: SwarmConfig): Vector2D {
  let avg: Vector2D = { x: 0, y: 0 };
  let count = 0;

  for (const other of neighbors) {
    const d = dist(agent.position, other.position);
    if (d > 0 && d < config.perceptionRadius) {
      avg = add(avg, other.velocity);
      count++;
    }
  }

  if (count > 0) {
    avg = div(avg, count);
    avg = normalize(avg);
    avg = mul(avg, agent.maxSpeed);
    let steer = sub(avg, agent.velocity);
    steer = limit(steer, agent.maxForce);
    return steer;
  }

  return { x: 0, y: 0 };
}

export function cohesion(agent: Agent, neighbors: Agent[], config: SwarmConfig): Vector2D {
  let center: Vector2D = { x: 0, y: 0 };
  let count = 0;

  for (const other of neighbors) {
    const d = dist(agent.position, other.position);
    if (d > 0 && d < config.perceptionRadius) {
      center = add(center, other.position);
      count++;
    }
  }

  if (count > 0) {
    center = div(center, count);
    let desired = sub(center, agent.position);
    desired = normalize(desired);
    desired = mul(desired, agent.maxSpeed);
    let steer = sub(desired, agent.velocity);
    steer = limit(steer, agent.maxForce);
    return steer;
  }

  return { x: 0, y: 0 };
}

export function seek(agent: Agent, target: Vector2D): Vector2D {
  let desired = sub(target, agent.position);
  desired = normalize(desired);
  desired = mul(desired, agent.maxSpeed);
  let steer = sub(desired, agent.velocity);
  steer = limit(steer, agent.maxForce * 2);
  return steer;
}

export function wander(agent: Agent, time: number): Vector2D {
  const angle = Math.sin(time * 0.01 + agent.pulsePhase) * Math.PI;
  const wanderForce = mul(normalize(agent.velocity), 3);
  const displacement = mul(random2D(), 2);
  return limit(add(wanderForce, displacement), agent.maxForce * 0.5);
}

export function avoidEdges(agent: Agent, width: number, height: number, margin: number = 60): Vector2D {
  let steer: Vector2D = { x: 0, y: 0 };

  if (agent.position.x < margin) steer.x = agent.maxSpeed;
  if (agent.position.x > width - margin) steer.x = -agent.maxSpeed;
  if (agent.position.y < margin) steer.y = agent.maxSpeed;
  if (agent.position.y > height - margin) steer.y = -agent.maxSpeed;

  if (steer.x !== 0 || steer.y !== 0) {
    steer = normalize(steer);
    steer = mul(steer, agent.maxSpeed);
    steer = sub(steer, agent.velocity);
    steer = limit(steer, agent.maxForce);
  }

  return steer;
}

// Behavior-specific forces
export function getBehaviorForce(
  agent: Agent,
  neighbors: Agent[],
  resources: Resource[],
  config: SwarmConfig,
  width: number,
  height: number,
  time: number
): Vector2D {
  let force: Vector2D = { x: 0, y: 0 };

  // Base flocking
  const sociability = agent.traits.sociability;
  const sep = mul(separation(agent, neighbors, config), config.separationWeight);
  const ali = mul(alignment(agent, neighbors, config), config.alignmentWeight * sociability);
  const coh = mul(cohesion(agent, neighbors, config), config.cohesionWeight * sociability);

  force = add(force, sep);
  force = add(force, ali);
  force = add(force, coh);

  // Edge avoidance
  force = add(force, mul(avoidEdges(agent, width, height), 2));

  // Behavior-specific
  switch (config.behavior) {
    case 'search_rescue':
      if (agent.role === 'explorer' || agent.role === 'scout') {
        const wanderForce = mul(wander(agent, time), config.explorationWeight * 2);
        force = add(force, wanderForce);
      } else {
        const discovered = resources.filter(r => r.discovered && r.amount > 0);
        if (discovered.length > 0) {
          const nearest = discovered.reduce((c, r) =>
            dist(agent.position, r.position) < dist(agent.position, c.position) ? r : c
          );
          force = add(force, seek(agent, nearest.position));
        }
      }
      break;

    case 'resource_gathering':
      const available = resources.filter(r => r.amount > 0);
      if (available.length > 0) {
        const nearest = available.reduce((c, r) =>
          dist(agent.position, r.position) < dist(agent.position, c.position) ? r : c
        );
        force = add(force, seek(agent, nearest.position));
      }
      break;

    case 'formation':
      const sortedAgents = [...neighbors].sort((a, b) => a.id.localeCompare(b.id));
      const index = sortedAgents.findIndex(a => a.id === agent.id);
      if (index === -1 || index === 0) {
        const leaderDir = { x: Math.cos(time * 0.005), y: Math.sin(time * 0.005) };
        force = add(force, mul(leaderDir, agent.maxForce));
      } else {
        const side = index % 2 === 0 ? 1 : -1;
        const row = Math.ceil(index / 2);
        const offset: Vector2D = {
          x: -row * 40 * Math.cos(time * 0.005) - side * 30 * Math.sin(time * 0.005),
          y: -row * 40 * Math.sin(time * 0.005) + side * 30 * Math.cos(time * 0.005),
        };
        const leader = sortedAgents[0];
        force = add(force, seek(agent, add(leader.position, offset)));
      }
      break;

    case 'patrol':
      const gridSize = 4;
      const agentIndex = parseInt(agent.id.split('-')[1]) || 0;
      const row = Math.floor(agentIndex / gridSize);
      const col = agentIndex % gridSize;
      const cellWidth = width / gridSize;
      const cellHeight = height / gridSize;
      const targetX = cellWidth * (col + 0.5) + Math.sin(time * 0.003 + agentIndex) * cellWidth * 0.3;
      const targetY = cellHeight * (row + 0.5) + Math.cos(time * 0.003 + agentIndex) * cellHeight * 0.3;
      force = add(force, seek(agent, { x: targetX, y: targetY }));
      break;

    case 'consensus':
      const consensusPoint: Vector2D = {
        x: width / 2 + Math.sin(time * 0.002) * 200,
        y: height / 2 + Math.cos(time * 0.003) * 150,
      };
      force = add(force, seek(agent, consensusPoint));
      force = add(force, mul(cohesion(agent, neighbors, config), 0.5));
      break;

    case 'predator_prey':
      if (agent.role === 'scout') {
        const center = neighbors.length > 0
          ? div(neighbors.reduce((acc, n) => add(acc, n.position), { x: 0, y: 0 }), neighbors.length)
          : agent.position;
        force = add(force, mul(seek(agent, add(center, mul(random2D(), 50))), 1.5));
      } else {
        const predators = neighbors.filter(n => n.role === 'scout');
        let fleeForce: Vector2D = { x: 0, y: 0 };
        for (const pred of predators) {
          const d = dist(agent.position, pred.position);
          if (d < config.perceptionRadius * 1.5) {
            const fleeDir = normalize(sub(agent.position, pred.position));
            fleeForce = add(fleeForce, mul(fleeDir, agent.maxSpeed * 1.5));
            agent.state = 'fleeing';
          }
        }
        if (mag(fleeForce) > 0) {
          force = add(force, fleeForce);
        } else {
          agent.state = 'moving';
          force = add(force, mul(cohesion(agent, neighbors, config), 1.5));
        }
      }
      break;

    case 'neural_evolution':
      const nearestRes = resources.filter(r => r.amount > 0).reduce((c, r) =>
        dist(agent.position, r.position) < dist(agent.position, c.position) ? r : c, resources[0]);
      const targetDist = nearestRes ? dist(agent.position, nearestRes.position) : 250;
      const targetAngle = nearestRes ? Math.atan2(nearestRes.position.y - agent.position.y, nearestRes.position.x - agent.position.x) : 0;

      const inputs = getNeuralInputs(
        targetDist,
        targetAngle,
        agent.energy,
        neighbors.length,
        0,
        mag(agent.velocity)
      );
      const output = forwardPass(agent.brain, inputs);

      const steerForce: Vector2D = { x: output[0] * agent.maxForce * 2, y: output[1] * agent.maxForce * 2 };
      const exploreBias = (output[2] + 1) / 2;
      const wanderForce = mul(wander(agent, time), exploreBias * 0.5);

      force = add(force, steerForce);
      force = add(force, wanderForce);
      break;

    default:
      force = add(force, mul(wander(agent, time), config.explorationWeight));
  }

  return force;
}

// Update agent
export function updateAgent(
  agent: Agent,
  neighbors: Agent[],
  resources: Resource[],
  config: SwarmConfig,
  width: number,
  height: number,
  time: number
): void {
  const force = getBehaviorForce(agent, neighbors, resources, config, width, height, time);

  agent.acceleration = force;
  agent.velocity = add(agent.velocity, mul(agent.acceleration, config.speed));
  agent.velocity = limit(agent.velocity, agent.maxSpeed);
  agent.position = add(agent.position, mul(agent.velocity, config.speed));

  agent.trail.push({ ...agent.position });
  if (agent.trail.length > 25) agent.trail.shift();

  const energyDrain = 0.008 * config.speed * (1 - agent.traits.efficiency * 0.5);
  agent.energy -= energyDrain;
  if (agent.energy < 0) agent.energy = 0;
  if (agent.energy > 100) agent.energy = 100;

  for (const resource of resources) {
    if (!resource.discovered && dist(agent.position, resource.position) < agent.perceptionRadius) {
      resource.discovered = true;
      resource.discoveredBy = agent.id;
      agent.state = 'alert';
      agent.fitness += 10;
    }
    if (resource.discovered && dist(agent.position, resource.position) < 15 && resource.amount > 0) {
      resource.amount -= resource.depletionRate;
      agent.energy = Math.min(100, agent.energy + 0.3 * agent.traits.efficiency);
      agent.state = 'working';
      agent.fitness += 0.5;
    }
  }

  if (agent.connections.length > 0 && Math.random() < 0.015) {
    agent.state = 'communicating';
    agent.fitness += 0.2;
  } else if (agent.state === 'communicating' && Math.random() < 0.1) {
    agent.state = 'moving';
  }

  agent.age += 1;
  agent.pulsePhase += 0.02;
}

// Establish connections
export function establishConnections(agents: Agent[], config: SwarmConfig): number {
  let connectionCount = 0;

  for (const agent of agents) {
    agent.connections = [];
    for (const other of agents) {
      if (agent.id !== other.id) {
        const d = dist(agent.position, other.position);
        if (d < config.communicationRange) {
          agent.connections.push(other.id);
          connectionCount++;
        }
      }
    }
  }

  return connectionCount / 2;
}

// Calculate metrics
export function calculateMetrics(agents: Agent[], resources: Resource[], connectionCount: number): SwarmMetrics {
  if (agents.length === 0) {
    return {
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
    };
  }

  const speeds = agents.map(a => mag(a.velocity));
  const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
  const avgEnergy = agents.reduce((a, b) => a + b.energy, 0) / agents.length;
  const avgFitness = agents.reduce((a, b) => a + b.fitness, 0) / agents.length;

  const center = agents.reduce((acc, a) => add(acc, a.position), { x: 0, y: 0 });
  const avgCenter = div(center, agents.length);
  const avgDistToCenter = agents.reduce((acc, a) => acc + dist(a.position, avgCenter), 0) / agents.length;
  const swarmCoherence = Math.max(0, 1 - avgDistToCenter / 500);

  const positions = agents.map(a => a.position);
  const minX = Math.min(...positions.map(p => p.x));
  const maxX = Math.max(...positions.map(p => p.x));
  const minY = Math.min(...positions.map(p => p.y));
  const maxY = Math.max(...positions.map(p => p.y));
  const coverageArea = (maxX - minX) * (maxY - minY);

  return {
    avgSpeed,
    avgEnergy,
    totalMessages: 0,
    resourcesFound: resources.filter(r => r.discovered).length,
    tasksCompleted: resources.filter(r => r.amount <= 0).length,
    swarmCoherence,
    coverageArea,
    activeConnections: connectionCount,
    avgFitness,
    generation: 0,
    subSwarmCount: 0,
    pheromoneIntensity: 0,
    memoryAccuracy: 0,
    eventRate: 0,
  };
}
