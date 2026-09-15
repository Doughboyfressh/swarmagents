export interface Vector2D {
  x: number;
  y: number;
}

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
  brain: NeuralNet;
  memory: AgentMemory;
  subSwarmId: number;
  fitness: number;
  age: number;
  traits: AgentTraits;
}

export type AgentRole = 'explorer' | 'worker' | 'coordinator' | 'scout' | 'carrier';
export type AgentState = 'idle' | 'moving' | 'communicating' | 'working' | 'returning' | 'alert' | 'fleeing' | 'learning';

export interface Message {
  from: string;
  to: string;
  type: MessageType;
  timestamp: number;
  content: string;
}

export type MessageType = 'discovery' | 'alert' | 'task_assignment' | 'status' | 'coordination' | 'warning' | 'memory_share';

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
  pheromoneEnabled: boolean;
  pheromoneDecay: number;
  pheromoneDiffusion: number;
  neuralNetEnabled: boolean;
  evolutionEnabled: boolean;
  evolutionRate: number;
  environmentEnabled: boolean;
  windStrength: number;
  windDirection: number;
  showHeatmap: boolean;
  showFlowField: boolean;
  showSubSwarms: boolean;
  memoryEnabled: boolean;
  obstacleMode: boolean;
}

export type SwarmBehavior =
  | 'flocking'
  | 'search_rescue'
  | 'resource_gathering'
  | 'formation'
  | 'patrol'
  | 'consensus'
  | 'predator_prey'
  | 'neural_evolution'
  | 'stigmergy';

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
  pheromoneIntensity: number;
  memoryAccuracy: number;
  eventRate: number;
}

export interface Obstacle {
  id: string;
  position: Vector2D;
  radius: number;
  type: 'static' | 'dynamic' | 'attractor';
  velocity?: Vector2D;
}

export interface NeuralNet {
  weights1: number[][];
  weights2: number[][];
  bias1: number[];
  bias2: number[];
}

export interface AgentMemory {
  knownResources: { position: Vector2D; timestamp: number; quality: number }[];
  knownDangers: { position: Vector2D; timestamp: number }[];
  visitedLocations: { position: Vector2D; timestamp: number }[];
  socialKnowledge: { from: string; content: string; timestamp: number }[];
}

export interface AgentTraits {
  curiosity: number;
  sociability: number;
  aggression: number;
  caution: number;
  efficiency: number;
}

export interface PheromoneGrid {
  data: Float32Array;
  width: number;
  height: number;
  cellSize: number;
}

export interface Environment {
  windField: Vector2D[][];
  obstacles: Obstacle[];
  temperature: number;
  time: number;
}

export interface SwarmEvent {
  id: string;
  timestamp: number;
  type: EventType;
  agentId?: string;
  description: string;
  position?: Vector2D;
  severity: 'info' | 'warning' | 'critical' | 'success';
}

export type EventType =
  | 'discovery'
  | 'communication'
  | 'state_change'
  | 'evolution'
  | 'subswarm_form'
  | 'subswarm_merge'
  | 'resource_depleted'
  | 'agent_failure'
  | 'agent_birth'
  | 'memory_share'
  | 'obstacle_placed'
  | 'threat_detected'
  | 'pattern_formed'
  | 'task_assigned';

export interface SubSwarm {
  id: number;
  agentIds: string[];
  center: Vector2D;
  color: string;
  purpose: string;
}
