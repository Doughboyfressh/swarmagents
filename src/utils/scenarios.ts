import { SwarmConfig } from '../types/swarm';
import { LifecycleConfig } from './lifecycleSystem';

export interface Scenario {
  id: string;
  name: string;
  description: string;
  icon: string;
  config: Partial<SwarmConfig>;
  lifecycleConfig?: Partial<LifecycleConfig>;
  setup?: string;
}

export const scenarios: Scenario[] = [
  {
    id: 'basic_flocking',
    name: 'Basic Flocking',
    description: 'Classic boids flocking behavior with separation, alignment, and cohesion',
    icon: '🐦',
    config: {
      behavior: 'flocking',
      agentCount: 50,
      separationWeight: 1.5,
      alignmentWeight: 1.0,
      cohesionWeight: 1.0,
      explorationWeight: 0.5,
      showTrails: true,
      showConnections: true,
    },
  },
  {
    id: 'resource_rush',
    name: 'Resource Rush',
    description: 'Agents compete to gather scattered resources efficiently',
    icon: '⛏️',
    config: {
      behavior: 'resource_gathering',
      agentCount: 40,
      separationWeight: 2.0,
      alignmentWeight: 0.5,
      cohesionWeight: 0.8,
      explorationWeight: 1.5,
      memoryEnabled: true,
      showTrails: true,
    },
  },
  {
    id: 'neural_evolution',
    name: 'Neural Evolution',
    description: 'Watch neural networks evolve through natural selection',
    icon: '🧬',
    config: {
      behavior: 'neural_evolution',
      agentCount: 60,
      neuralNetEnabled: true,
      evolutionEnabled: true,
      evolutionRate: 0.08,
      showTrails: false,
      showConnections: true,
    },
  },
  {
    id: 'ant_colony',
    name: 'Ant Colony',
    description: 'Stigmergic communication through pheromone trails',
    icon: '🐜',
    config: {
      behavior: 'stigmergy',
      agentCount: 80,
      pheromoneEnabled: true,
      pheromoneDecay: 0.008,
      pheromoneDiffusion: 0.02,
      showHeatmap: true,
      showTrails: true,
      separationWeight: 1.8,
      cohesionWeight: 0.5,
    },
  },
  {
    id: 'predator_prey',
    name: 'Predator & Prey',
    description: 'Scouts hunt while workers evade in dynamic chase',
    icon: '🐺',
    config: {
      behavior: 'predator_prey',
      agentCount: 50,
      separationWeight: 2.5,
      alignmentWeight: 1.5,
      cohesionWeight: 2.0,
      showTrails: true,
      showConnections: true,
    },
  },
  {
    id: 'v_formation',
    name: 'V-Formation Flight',
    description: 'Agents maintain aerodynamic V-formation pattern',
    icon: '✈️',
    config: {
      behavior: 'formation',
      agentCount: 30,
      separationWeight: 1.2,
      alignmentWeight: 2.0,
      cohesionWeight: 1.5,
      showTrails: true,
      showConnections: true,
    },
  },
  {
    id: 'search_rescue',
    name: 'Search & Rescue',
    description: 'Explorers find targets while workers converge',
    icon: '🔍',
    config: {
      behavior: 'search_rescue',
      agentCount: 45,
      separationWeight: 1.5,
      alignmentWeight: 0.8,
      cohesionWeight: 1.0,
      explorationWeight: 2.0,
      memoryEnabled: true,
      showTrails: true,
    },
  },
  {
    id: 'windy_environment',
    name: 'Windy Environment',
    description: 'Agents navigate through dynamic wind fields',
    icon: '🌊',
    config: {
      behavior: 'flocking',
      agentCount: 40,
      environmentEnabled: true,
      windStrength: 1.5,
      windDirection: 0.5,
      showFlowField: true,
      separationWeight: 2.0,
      alignmentWeight: 1.2,
    },
  },
  {
    id: 'consensus',
    name: 'Consensus Decision',
    description: 'All agents converge on collective decision point',
    icon: '🤝',
    config: {
      behavior: 'consensus',
      agentCount: 60,
      separationWeight: 1.0,
      alignmentWeight: 1.5,
      cohesionWeight: 2.5,
      showTrails: true,
      showConnections: true,
    },
  },
  {
    id: 'ecosystem',
    name: 'Living Ecosystem',
    description: 'Agents with lifecycle: birth, aging, death, reproduction',
    icon: '🌱',
    config: {
      behavior: 'resource_gathering',
      agentCount: 30,
      memoryEnabled: true,
      showTrails: true,
      separationWeight: 1.5,
    },
    lifecycleConfig: {
      enableAging: true,
      enableDeath: true,
      enableReproduction: true,
      maxAge: 4000,
      birthRate: 0.002,
      reproductionThreshold: 80,
    },
  },
  {
    id: 'grid_patrol',
    name: 'Grid Patrol',
    description: 'Systematic area coverage in grid pattern',
    icon: '🛡️',
    config: {
      behavior: 'patrol',
      agentCount: 36,
      separationWeight: 2.5,
      alignmentWeight: 0.5,
      cohesionWeight: 0.3,
      showTrails: true,
    },
  },
  {
    id: 'mega_swarm',
    name: 'Mega Swarm',
    description: 'Large-scale swarm with spatial optimization',
    icon: '🌌',
    config: {
      behavior: 'flocking',
      agentCount: 120,
      separationWeight: 1.8,
      alignmentWeight: 1.0,
      cohesionWeight: 0.8,
      perceptionRadius: 60,
      communicationRange: 100,
      showTrails: false,
      showConnections: false,
    },
  },
];

export function getScenarioById(id: string): Scenario | undefined {
  return scenarios.find(s => s.id === id);
}
