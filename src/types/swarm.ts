export interface Vector2D { x: number; y: number }

export interface Agent {
  id: string;
  position: Vector2D;
  velocity: Vector2D;
  acceleration: Vector2D;
  maxSpeed: number;
  maxForce: number;
  radius: number;
  role: AgentRole;
  state: AgentState;
  energy: number;
  connections: string[];
  perceptionRadius: number;
  trail: Vector2D[];
  color: string;
  pulsePhase: number;
  fitness: number;
  age: number;
  traits: AgentTraits;
}

export type AgentRole = 'explorer' | 'worker' | 'coordinator' | 'scout' | 'carrier';
export type AgentState = 'idle' | 'moving' | 'communicating' | 'working' | 'returning' | 'alert' | 'fleeing';

export interface Resource {
  id: string;
  position: Vector2D;
  amount: number;
  type: 'energy' | 'data' | 'material';
  discovered: boolean;
  discoveredBy?: string;
  depletionRate: number;
}

export interface SwarmConfig {
  agentCount: number;
  perceptionRadius: number;
  separationWeight: number;
  alignmentWeight: number;
  cohesionWeight: number;
  explorationWeight: number;
  communicationRange: number;
  maxSpeed: number;
  behavior: SwarmBehavior;
  showTrails: boolean;
  showConnections: boolean;
  showPerception: boolean;
  speed: number;
  showSubSwarms: boolean;
  obstacleMode: boolean;
}

export type SwarmBehavior =
  | 'flocking' | 'search_rescue' | 'resource_gathering'
  | 'formation' | 'patrol' | 'consensus'
  | 'predator_prey' | 'neural_evolution';

export interface SwarmMetrics {
  avgSpeed: number;
  avgEnergy: number;
  totalMessages: number;
  resourcesFound: number;
  tasksCompleted: number;
  swarmCoherence: number;
  coverageArea: number;
  activeConnections: number;
  avgFitness: number;
  generation: number;
  subSwarmCount: number;
  eventRate: number;
}

export interface AgentTraits {
  curiosity: number;
  sociability: number;
  aggression: number;
  caution: number;
  efficiency: number;
}

export interface SwarmEvent {
  id: string;
  timestamp: number;
  type: string;
  agentId?: string;
  description: string;
  position?: Vector2D;
  severity: 'info' | 'warning' | 'critical' | 'success';
}

export interface SubSwarm {
  id: number;
  agentIds: string[];
  center: Vector2D;
  color: string;
  purpose: string;
}
