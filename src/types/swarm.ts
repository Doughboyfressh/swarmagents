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
  subSwarmId: number;
}

export type AgentRole = 'explorer' | 'worker' | 'coordinator' | 'scout' | 'carrier';
export type AgentState = 'idle' | 'moving' | 'communicating' | 'working' | 'returning' | 'alert' | 'fleeing' | 'learning' | 'building';

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
  pheromoneEnabled: boolean;
  neuralNetEnabled: boolean;
  evolutionEnabled: boolean;
  memoryEnabled: boolean;
  environmentEnabled: boolean;
  showHeatmap: boolean;
  showFlowField: boolean;
  lifecycleEnabled: boolean;
  constructionEnabled: boolean;
}

export type SwarmBehavior =
  | 'flocking' | 'search_rescue' | 'resource_gathering'
  | 'formation' | 'patrol' | 'consensus'
  | 'predator_prey' | 'neural_evolution' | 'stigmergy';

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

export interface Structure {
  id: string;
  type: 'wall' | 'tower' | 'beacon' | 'shelter';
  position: Vector2D;
  size: number;
  progress: number;
  completed: boolean;
  builderIds: string[];
  color: string;
}

export interface Threat {
  id: string;
  position: Vector2D;
  radius: number;
  severity: number;
  type: 'predator' | 'hazard';
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

export interface AgentBiography {
  id: string;
  role: string;
  birthTime: number;
  achievements: number;
  resourcesCollected: number;
  distanceTraveled: number;
  threatsAvoided: number;
  messagesSent: number;
}

export interface HiveMemory {
  knownLocations: { position: Vector2D; type: string; value: number; contributors: number }[];
  decisionCount: number;
  goalProgress: number;
}

export interface Scenario {
  id: string;
  name: string;
  icon: string;
  description: string;
  config: Partial<SwarmConfig>;
}
