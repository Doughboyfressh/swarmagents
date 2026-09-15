// Shared types for Agent Swarm Intelligence System
// Single source of truth for both frontend and backend

export interface Vector2D {
  x: number;
  y: number;
}

export type AgentRole = 'explorer' | 'worker' | 'coordinator' | 'scout' | 'carrier';
export type AgentState = 'idle' | 'moving' | 'communicating' | 'working' | 'returning' | 'alert' | 'fleeing' | 'learning' | 'building';

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
  subSwarmId: number;
  brain: NeuralNet;
  memory: AgentMemory;
}

export interface Resource {
  id: string;
  position: Vector2D;
  amount: number;
  type: 'energy' | 'data' | 'material';
  discovered: boolean;
  discoveredBy?: string;
  depletionRate: number;
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
  pheromoneEnabled: boolean;
  pheromoneDecay: number;
  pheromoneDiffusion: number;
  neuralNetEnabled: boolean;
  evolutionEnabled: boolean;
  evolutionRate: number;
  memoryEnabled: boolean;
  environmentEnabled: boolean;
  windStrength: number;
  windDirection: number;
  showHeatmap: boolean;
  showFlowField: boolean;
  lifecycleEnabled: boolean;
  constructionEnabled: boolean;
  qLearningEnabled: boolean;
}

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
  hiveMemorySize: number;
  structuresBuilt: number;
  threatsActive: number;
  worldTime: string;
  worldWeather: string;
  qLearningStats: {
    avgQValue: number;
    explorationRate: number;
    agentsTrained: number;
  };
  pheromoneIntensity?: number;
  communicationStats?: any;
}

export interface AgentTraits {
  curiosity: number;
  sociability: number;
  aggression: number;
  caution: number;
  efficiency: number;
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
  | 'task_assigned'
  | 'scenario'
  | 'threat'
  | 'construction';

export interface SwarmEvent {
  id: string;
  timestamp: number;
  type: EventType;
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

export interface Structure {
  id: string;
  type: 'wall' | 'tower' | 'bridge' | 'shelter' | 'beacon';
  position: Vector2D;
  size: number;
  progress: number;
  completed: boolean;
  builderIds: string[];
  color: string;
  effect?: 'protection' | 'visibility' | 'resource_boost';
}

export interface Threat {
  id: string;
  position: Vector2D;
  radius: number;
  severity: number;
  type: 'predator' | 'hazard' | 'territory';
  velocity?: Vector2D;
  createdAt: number;
}

export interface WorldState {
  time: number;
  timeOfDay: 'dawn' | 'day' | 'dusk' | 'night';
  day: number;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  weather: 'clear' | 'rain' | 'storm' | 'fog' | 'wind';
  temperature: number;
  visibility: number;
  resourceAbundance: number;
  threatLevel: number;
}

export interface NeuralNet {
  weights1: number[][];
  weights2: number[][];
  bias1: number[];
  bias2: number[];
}

export interface AgentMemory {
  knownResources: Array<{ position: Vector2D; timestamp: number; quality: number }>;
  knownDangers: Array<{ position: Vector2D; timestamp: number }>;
  visitedLocations: Array<{ position: Vector2D; timestamp: number }>;
}

export interface HiveMemory {
  knownLocations: Array<{ position: Vector2D; type: string; value: number; contributors: number }>;
  decisionCount: number;
  goalProgress: number;
}

export interface Particle {
  position: Vector2D;
  velocity: Vector2D;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface RecordingFrame {
  timestamp: number;
  agents: Array<{
    id: string;
    position: Vector2D;
    velocity: Vector2D;
    energy: number;
    state: string;
    role: string;
  }>;
  resources: Array<{
    id: string;
    position: Vector2D;
    amount: number;
    discovered: boolean;
  }>;
  metrics?: {
    avgSpeed: number;
    swarmCoherence: number;
    activeConnections: number;
  };
}

// LLM Types
export interface LLMConfig {
  endpoint: string;
  model: string;
  temperature: number;
  maxTokens: number;
  enabled: boolean;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  tokensUsed: number;
  latency: number;
  success: boolean;
}

// WebSocket Message Types
export type WSMessageType =
  | 'state_update'
  | 'metrics_update'
  | 'event_log'
  | 'llm_response'
  | 'command'
  | 'error';

export interface WSMessage {
  type: WSMessageType;
  payload: any;
  timestamp: number;
}
