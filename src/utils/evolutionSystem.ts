import { Agent, Vector2D, AgentTraits } from '../types/swarm';
import { dist } from './swarmEngine';

export function detectSubSwarms(agents: Agent[], threshold: number = 100): { id: number; agentIds: string[]; center: Vector2D; color: string; purpose: string }[] {
  const assigned = new Set<string>();
  const clusters: { id: number; agentIds: string[]; center: Vector2D; color: string; purpose: string }[] = [];
  let clusterId = 0;

  const SUB_SWARM_COLORS = [
    '#00d4ff', '#00ff88', '#ff6b00', '#ff0066', '#aa66ff',
    '#ffdd00', '#00ffcc', '#ff4488', '#44ffaa', '#8866ff',
  ];

  for (const agent of agents) {
    if (assigned.has(agent.id)) continue;

    const cluster: string[] = [];
    const queue = [agent];
    assigned.add(agent.id);

    while (queue.length > 0) {
      const current = queue.shift()!;
      cluster.push(current.id);

      for (const other of agents) {
        if (!assigned.has(other.id) && dist(current.position, other.position) < threshold) {
          assigned.add(other.id);
          queue.push(other);
        }
      }
    }

    if (cluster.length >= 2) {
      const clusterAgents = agents.filter(a => cluster.includes(a.id));
      const center = clusterAgents.reduce(
        (acc, a) => ({ x: acc.x + a.position.x, y: acc.y + a.position.y }),
        { x: 0, y: 0 }
      );
      center.x /= clusterAgents.length;
      center.y /= clusterAgents.length;

      clusters.push({
        id: clusterId,
        agentIds: cluster,
        center,
        color: SUB_SWARM_COLORS[clusterId % SUB_SWARM_COLORS.length],
        purpose: getClusterPurpose(clusterAgents),
      });
      clusterId++;
    }
  }

  for (const cluster of clusters) {
    for (const agentId of cluster.agentIds) {
      const agent = agents.find(a => a.id === agentId);
      if (agent) agent.subSwarmId = cluster.id;
    }
  }

  for (const agent of agents) {
    if (!assigned.has(agent.id)) {
      agent.subSwarmId = -1;
    }
  }

  return clusters;
}

function getClusterPurpose(agents: Agent[]): string {
  const roles = agents.map(a => a.role);
  const explorers = roles.filter(r => r === 'explorer' || r === 'scout').length;
  const workers = roles.filter(r => r === 'worker' || r === 'carrier').length;

  if (explorers > workers) return 'Exploration';
  if (workers > explorers) return 'Collection';
  return 'Mixed Operations';
}

export function evolvePopulation(agents: Agent[], mutationRate: number): Agent[] {
  const sorted = [...agents].sort((a, b) => b.fitness - a.fitness);
  
  const survivors = sorted.slice(0, Math.ceil(sorted.length * 0.5));
  
  const offspring: Agent[] = [];
  const newAgents = [...agents];
  
  for (let i = agents.length - 1; i >= Math.ceil(agents.length * 0.5); i--) {
    const parent1 = survivors[Math.floor(Math.random() * survivors.length)];
    const parent2 = survivors[Math.floor(Math.random() * survivors.length)];
    
    const child = newAgents[i];
    child.brain = {
      weights1: parent1.brain.weights1.map((row: number[], ri: number) =>
        row.map((val: number, ci: number) => {
          const p2val = parent2.brain.weights1[ri]?.[ci] ?? val;
          const base = Math.random() < 0.5 ? val : p2val;
          return Math.random() < mutationRate ? base + (Math.random() * 2 - 1) * 0.3 : base;
        })
      ),
      weights2: parent1.brain.weights2.map((row: number[], ri: number) =>
        row.map((val: number, ci: number) => {
          const p2val = parent2.brain.weights2[ri]?.[ci] ?? val;
          const base = Math.random() < 0.5 ? val : p2val;
          return Math.random() < mutationRate ? base + (Math.random() * 2 - 1) * 0.3 : base;
        })
      ),
      bias1: parent1.brain.bias1.map((val: number, bi: number) => {
        const p2val = parent2.brain.bias1[bi] ?? val;
        const base = Math.random() < 0.5 ? val : p2val;
        return Math.random() < mutationRate ? base + (Math.random() * 2 - 1) * 0.2 : base;
      }),
      bias2: parent1.brain.bias2.map((val: number, bi: number) => {
        const p2val = parent2.brain.bias2[bi] ?? val;
        const base = Math.random() < 0.5 ? val : p2val;
        return Math.random() < mutationRate ? base + (Math.random() * 2 - 1) * 0.2 : base;
      }),
    };
    
    child.traits = {
      curiosity: mixTrait(parent1.traits.curiosity, parent2.traits.curiosity, mutationRate),
      sociability: mixTrait(parent1.traits.sociability, parent2.traits.sociability, mutationRate),
      aggression: mixTrait(parent1.traits.aggression, parent2.traits.aggression, mutationRate),
      caution: mixTrait(parent1.traits.caution, parent2.traits.caution, mutationRate),
      efficiency: mixTrait(parent1.traits.efficiency, parent2.traits.efficiency, mutationRate),
    };
    
    child.fitness = 0;
    child.age = 0;
    offspring.push(child);
  }
  
  return newAgents;
}

function mixTrait(a: number, b: number, mutationRate: number): number {
  const base = Math.random() < 0.5 ? a : b;
  if (Math.random() < mutationRate) {
    return Math.max(0, Math.min(1, base + (Math.random() * 2 - 1) * 0.2));
  }
  return base;
}

export function calculateFitness(
  agent: Agent,
  resourcesFound: number,
  messagesSent: number,
  distanceTraveled: number
): number {
  let fitness = 0;
  
  fitness += resourcesFound * 10;
  fitness += messagesSent * 2;
  fitness += agent.energy * 0.5;
  fitness -= distanceTraveled * 0.001;
  fitness += agent.age * 0.1;
  fitness += agent.traits.efficiency * 5;
  
  return Math.max(0, fitness);
}

export function randomTraits(): AgentTraits {
  return {
    curiosity: Math.random(),
    sociability: Math.random(),
    aggression: Math.random(),
    caution: Math.random(),
    efficiency: 0.3 + Math.random() * 0.7,
  };
}
