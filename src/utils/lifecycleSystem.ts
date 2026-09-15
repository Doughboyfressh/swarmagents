import { Agent, Vector2D } from '../types/swarm';
import { createAgent } from './swarmEngine';
import { randomTraits } from './evolutionSystem';
import { createNeuralNet } from './neuralNet';
import { globalEventLog, createEvent } from './eventLog';

export interface LifecycleConfig {
  maxAge: number;
  maturityAge: number;
  reproductionThreshold: number;
  deathEnergyThreshold: number;
  birthRate: number;
  enableAging: boolean;
  enableDeath: boolean;
  enableReproduction: boolean;
}

const defaultLifecycleConfig: LifecycleConfig = {
  maxAge: 5000,
  maturityAge: 500,
  reproductionThreshold: 85,
  deathEnergyThreshold: 5,
  birthRate: 0.001,
  enableAging: true,
  enableDeath: true,
  enableReproduction: true,
};

let agentIdCounter = 1000;

export function updateLifecycle(
  agents: Agent[],
  config: LifecycleConfig = defaultLifecycleConfig,
  canvasWidth: number = 900,
  canvasHeight: number = 600
): {
  births: Agent[];
  deaths: string[];
  updatedAgents: Agent[];
} {
  const births: Agent[] = [];
  const deaths: string[] = [];
  const updatedAgents: Agent[] = [];

  for (const agent of agents) {
    if (config.enableAging) {
      agent.age += 1;
    }

    if (config.enableDeath) {
      const shouldDie =
        (config.maxAge > 0 && agent.age > config.maxAge) ||
        agent.energy < config.deathEnergyThreshold;

      if (shouldDie) {
        deaths.push(agent.id);
        globalEventLog.add(createEvent(
          'agent_failure',
          `${agent.id} died (age: ${agent.age}, energy: ${agent.energy.toFixed(0)})`,
          'critical',
          agent.id,
          agent.position
        ));
        continue;
      }
    }

    if (config.enableReproduction && agent.energy > config.reproductionThreshold) {
      if (Math.random() < config.birthRate) {
        const child = reproduceAgent(agent, canvasWidth, canvasHeight);
        births.push(child);
        agent.energy -= 30;
        globalEventLog.add(createEvent(
          'agent_birth',
          `${child.id} born from ${agent.id}`,
          'success',
          agent.id,
          child.position
        ));
      }
    }

    if (config.enableAging && agent.age < config.maturityAge) {
      const maturity = agent.age / config.maturityAge;
      agent.maxSpeed = (2 + Math.random() * 1.5) * maturity;
      agent.maxForce = (0.1 + Math.random() * 0.05) * maturity;
    }

    updatedAgents.push(agent);
  }

  return { births, deaths, updatedAgents };
}

function reproduceAgent(parent: Agent, canvasWidth: number, canvasHeight: number): Agent {
  const roles: Agent['role'][] = ['explorer', 'worker', 'coordinator', 'scout', 'carrier'];
  const role = roles[Math.floor(Math.random() * roles.length)];
  const id = `agent-${agentIdCounter++}`;

  const offset = {
    x: (Math.random() - 0.5) * 40,
    y: (Math.random() - 0.5) * 40,
  };
  const x = Math.max(20, Math.min(canvasWidth - 20, parent.position.x + offset.x));
  const y = Math.max(20, Math.min(canvasHeight - 20, parent.position.y + offset.y));

  const child = createAgent(id, x, y, role);

  child.traits = {
    curiosity: mutateTrait(parent.traits.curiosity),
    sociability: mutateTrait(parent.traits.sociability),
    aggression: mutateTrait(parent.traits.aggression),
    caution: mutateTrait(parent.traits.caution),
    efficiency: mutateTrait(parent.traits.efficiency),
  };

  child.brain = mutateNeuralNet(parent.brain);

  child.energy = 50;
  child.age = 0;

  return child;
}

function mutateTrait(value: number): number {
  const mutation = (Math.random() - 0.5) * 0.2;
  return Math.max(0, Math.min(1, value + mutation));
}

function mutateNeuralNet(net: ReturnType<typeof createNeuralNet>): ReturnType<typeof createNeuralNet> {
  return {
    weights1: net.weights1.map(row =>
      row.map(w => w + (Math.random() - 0.5) * 0.1)
    ),
    weights2: net.weights2.map(row =>
      row.map(w => w + (Math.random() - 0.5) * 0.1)
    ),
    bias1: net.bias1.map(b => b + (Math.random() - 0.5) * 0.1),
    bias2: net.bias2.map(b => b + (Math.random() - 0.5) * 0.1),
  };
}

export function shareEnergy(agents: Agent[], sharingRate: number = 0.05): void {
  for (const agent of agents) {
    if (agent.connections.length === 0) continue;

    for (const connId of agent.connections) {
      const connected = agents.find(a => a.id === connId);
      if (!connected) continue;

      const energyDiff = agent.energy - connected.energy;
      if (energyDiff > 20 && agent.energy > 50) {
        const transfer = energyDiff * sharingRate;
        agent.energy -= transfer;
        connected.energy += transfer * 0.9;
      }
    }
  }
}

export function getLifecycleStats(agents: Agent[]): {
  avgAge: number;
  maxAge: number;
  minAge: number;
  matureCount: number;
  youngCount: number;
  elderlyCount: number;
} {
  if (agents.length === 0) {
    return { avgAge: 0, maxAge: 0, minAge: 0, matureCount: 0, youngCount: 0, elderlyCount: 0 };
  }

  const ages = agents.map(a => a.age);
  const avgAge = ages.reduce((a, b) => a + b, 0) / ages.length;
  const maxAge = Math.max(...ages);
  const minAge = Math.min(...ages);

  return {
    avgAge,
    maxAge,
    minAge,
    matureCount: agents.filter(a => a.age > 500).length,
    youngCount: agents.filter(a => a.age < 200).length,
    elderlyCount: agents.filter(a => a.age > 3000).length,
  };
}
