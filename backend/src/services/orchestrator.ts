import { Agent, Resource, SwarmConfig, SwarmMetrics, WorldState, Structure, Threat, SwarmEvent } from '../types';
import { getDatabase } from '../database';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

export class AgentOrchestrator {
  private agents: Map<string, Agent> = new Map();
  private resources: Map<string, Resource> = new Map();
  private structures: Map<string, Structure> = new Map();
  private threats: Map<string, Threat> = new Map();
  private config: SwarmConfig;
  private worldState: WorldState;
  private metrics: SwarmMetrics;
  private events: SwarmEvent[] = [];
  private isRunning: boolean = false;
  private simulationInterval: NodeJS.Timeout | null = null;
  private realWorldExecutorUrl: string | null = null;

  constructor(config?: Partial<SwarmConfig>, enableRealWorld: boolean = false, executorUrl: string = 'http://localhost:5000') {
    this.config = this.getDefaultConfig();
    if (config) {
      this.config = { ...this.config, ...config };
    }

    if (enableRealWorld) {
      this.realWorldExecutorUrl = executorUrl;
    }

    this.worldState = this.getDefaultWorldState();
    this.metrics = this.getDefaultMetrics();
  }

  private getDefaultConfig(): SwarmConfig {
    return {
      agentCount: 40,
      perceptionRadius: 80,
      separationWeight: 1.5,
      alignmentWeight: 1.0,
      cohesionWeight: 1.0,
      explorationWeight: 0.5,
      communicationRange: 120,
      maxSpeed: 3,
      behavior: 'flocking',
      showTrails: true,
      showConnections: true,
      showPerception: false,
      speed: 1,
      showSubSwarms: true,
      obstacleMode: false,
      pheromoneEnabled: false,
      pheromoneDecay: 0.005,
      pheromoneDiffusion: 0.01,
      neuralNetEnabled: false,
      evolutionEnabled: false,
      evolutionRate: 0.05,
      memoryEnabled: true,
      environmentEnabled: false,
      windStrength: 0.5,
      windDirection: 0,
      showHeatmap: false,
      showFlowField: false,
      lifecycleEnabled: false,
      constructionEnabled: false,
      qLearningEnabled: false,
    };
  }

  private getDefaultWorldState(): WorldState {
    return {
      time: 8,
      timeOfDay: 'day',
      day: 1,
      season: 'spring',
      weather: 'clear',
      temperature: 20,
      visibility: 1,
      resourceAbundance: 1,
      threatLevel: 0.2,
    };
  }

  private getDefaultMetrics(): SwarmMetrics {
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
      eventRate: 0,
      hiveMemorySize: 0,
      structuresBuilt: 0,
      threatsActive: 0,
      worldTime: '08:00',
      worldWeather: 'clear',
      qLearningStats: { avgQValue: 0, explorationRate: 0.3, agentsTrained: 0 },
    };
  }

  initialize(): void {
    console.log('🚀 Initializing Agent Orchestrator...');

    // Create agents
    const roles: Array<'explorer' | 'worker' | 'coordinator' | 'scout' | 'carrier'> = 
      ['explorer', 'worker', 'coordinator', 'scout', 'carrier'];
    
    for (let i = 0; i < this.config.agentCount; i++) {
      const role = roles[i % roles.length];
      const agent = this.createAgent(`agent-${i}`, role);
      this.agents.set(agent.id, agent);
    }

    // Create resources
    const resourceCount = 8 + Math.floor(Math.random() * 6);
    for (let i = 0; i < resourceCount; i++) {
      const resource = this.createResource(`res-${i}`);
      this.resources.set(resource.id, resource);
    }

    console.log(`✅ Created ${this.agents.size} agents and ${this.resources.size} resources`);
  }

  private createAgent(id: string, role: 'explorer' | 'worker' | 'coordinator' | 'scout' | 'carrier'): Agent {
    const colors: Record<string, string> = {
      explorer: '#00d4ff',
      worker: '#00ff88',
      coordinator: '#ff6b00',
      scout: '#ff0066',
      carrier: '#aa66ff',
    };

    return {
      id,
      position: { x: 270 + Math.random() * 360, y: 180 + Math.random() * 240 },
      velocity: { x: (Math.random() - 0.5) * 4, y: (Math.random() - 0.5) * 4 },
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
      traits: {
        curiosity: Math.random(),
        sociability: Math.random(),
        aggression: Math.random(),
        caution: Math.random(),
        efficiency: 0.5 + Math.random() * 0.5,
      },
      subSwarmId: -1,
      brain: {
        weights1: Array.from({ length: 8 }, () => Array.from({ length: 6 }, () => Math.random() * 2 - 1)),
        weights2: Array.from({ length: 4 }, () => Array.from({ length: 8 }, () => Math.random() * 2 - 1)),
        bias1: Array.from({ length: 8 }, () => Math.random() * 2 - 1),
        bias2: Array.from({ length: 4 }, () => Math.random() * 2 - 1),
      },
      memory: {
        knownResources: [],
        knownDangers: [],
        visitedLocations: [],
      },
    };
  }

  private createResource(id: string): Resource {
    const types: Array<'energy' | 'data' | 'material'> = ['energy', 'data', 'material'];
    return {
      id,
      position: { x: 60 + Math.random() * 780, y: 60 + Math.random() * 480 },
      amount: 50 + Math.random() * 50,
      type: types[Math.floor(Math.random() * types.length)],
      discovered: false,
      depletionRate: 0.05 + Math.random() * 0.1,
    };
  }

  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('▶️ Starting simulation...');

    // Run simulation at 60 FPS
    this.simulationInterval = setInterval(() => {
      this.update();
    }, 1000 / 60);
  }

  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    console.log('⏸️ Simulation stopped');
  }

  private update(): void {
    const agents = Array.from(this.agents.values());
    const resources = Array.from(this.resources.values());

    // Update world state
    this.updateWorldState();

    // Update agents
    for (const agent of agents) {
      this.updateAgent(agent, agents, resources);
    }

    // Update metrics
    this.updateMetrics(agents, resources);

    // Save state to database periodically
    if (Math.random() < 0.01) { // ~every 1.6 seconds at 60 FPS
      this.saveState();
    }
  }

  private updateWorldState(): void {
    this.worldState.time += 0.001 * this.config.speed;
    
    if (this.worldState.time >= 24) {
      this.worldState.time -= 24;
      this.worldState.day++;
      
      if (this.worldState.day % 30 === 0) {
        const seasons: Array<'spring' | 'summer' | 'autumn' | 'winter'> = ['spring', 'summer', 'autumn', 'winter'];
        const currentIndex = seasons.indexOf(this.worldState.season);
        this.worldState.season = seasons[(currentIndex + 1) % 4];
      }
    }

    // Update time of day
    const t = this.worldState.time;
    if (t >= 5 && t < 8) this.worldState.timeOfDay = 'dawn';
    else if (t >= 8 && t < 18) this.worldState.timeOfDay = 'day';
    else if (t >= 18 && t < 21) this.worldState.timeOfDay = 'dusk';
    else this.worldState.timeOfDay = 'night';

    // Random weather changes
    if (Math.random() < 0.0001) {
      const weathers: Array<'clear' | 'rain' | 'storm' | 'fog' | 'wind'> = ['clear', 'rain', 'storm', 'fog', 'wind'];
      this.worldState.weather = weathers[Math.floor(Math.random() * weathers.length)];
    }
  }

  private updateAgent(agent: Agent, allAgents: Agent[], resources: Resource[]): void {
    // Simple flocking behavior
    const neighbors = allAgents.filter(a => 
      a.id !== agent.id && 
      this.distance(agent.position, a.position) < agent.perceptionRadius
    );

    // Separation
    let separation = { x: 0, y: 0 };
    let separationCount = 0;
    for (const other of neighbors) {
      const d = this.distance(agent.position, other.position);
      if (d > 0 && d < this.config.perceptionRadius * 0.5) {
        separation.x += (agent.position.x - other.position.x) / d;
        separation.y += (agent.position.y - other.position.y) / d;
        separationCount++;
      }
    }
    if (separationCount > 0) {
      separation.x /= separationCount;
      separation.y /= separationCount;
    }

    // Alignment
    let alignment = { x: 0, y: 0 };
    if (neighbors.length > 0) {
      for (const other of neighbors) {
        alignment.x += other.velocity.x;
        alignment.y += other.velocity.y;
      }
      alignment.x /= neighbors.length;
      alignment.y /= neighbors.length;
    }

    // Cohesion
    let cohesion = { x: 0, y: 0 };
    if (neighbors.length > 0) {
      for (const other of neighbors) {
        cohesion.x += other.position.x;
        cohesion.y += other.position.y;
      }
      cohesion.x = cohesion.x / neighbors.length - agent.position.x;
      cohesion.y = cohesion.y / neighbors.length - agent.position.y;
    }

    // Apply forces
    agent.acceleration.x = 
      separation.x * this.config.separationWeight +
      alignment.x * this.config.alignmentWeight +
      cohesion.x * this.config.cohesionWeight;
    
    agent.acceleration.y = 
      separation.y * this.config.separationWeight +
      alignment.y * this.config.alignmentWeight +
      cohesion.y * this.config.cohesionWeight;

    // Update velocity
    agent.velocity.x += agent.acceleration.x;
    agent.velocity.y += agent.acceleration.y;

    // Limit speed
    const speed = Math.sqrt(agent.velocity.x ** 2 + agent.velocity.y ** 2);
    if (speed > agent.maxSpeed) {
      agent.velocity.x = (agent.velocity.x / speed) * agent.maxSpeed;
      agent.velocity.y = (agent.velocity.y / speed) * agent.maxSpeed;
    }

    // Update position
    agent.position.x += agent.velocity.x * this.config.speed;
    agent.position.y += agent.velocity.y * this.config.speed;

    // Boundary wrapping
    if (agent.position.x < 0) agent.position.x = 900;
    if (agent.position.x > 900) agent.position.x = 0;
    if (agent.position.y < 0) agent.position.y = 600;
    if (agent.position.y > 600) agent.position.y = 0;

    // Update trail
    agent.trail.push({ x: agent.position.x, y: agent.position.y });
    if (agent.trail.length > 25) agent.trail.shift();

    // Update energy
    agent.energy -= 0.008 * this.config.speed * (1 - agent.traits.efficiency * 0.5);
    agent.energy = Math.max(0, Math.min(100, agent.energy));

    // Check for resources
    for (const resource of resources) {
      if (!resource.discovered && this.distance(agent.position, resource.position) < agent.perceptionRadius) {
        resource.discovered = true;
        resource.discoveredBy = agent.id;
        agent.state = 'alert';
        agent.fitness += 10;
      }
      if (resource.discovered && this.distance(agent.position, resource.position) < 15 && resource.amount > 0) {
        resource.amount -= resource.depletionRate;
        agent.energy = Math.min(100, agent.energy + 0.3 * agent.traits.efficiency);
        agent.state = 'working';
        agent.fitness += 0.5;
      }
    }

    // Update connections
    agent.connections = neighbors.map(n => n.id).slice(0, 10); // Limit connections

    // Update state
    if (agent.connections.length > 0 && Math.random() < 0.015) {
      agent.state = 'communicating';
    } else if (agent.state === 'communicating' && Math.random() < 0.1) {
      agent.state = 'moving';
    }

    agent.age++;
    agent.pulsePhase += 0.02;
  }

  private distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
  }

  private updateMetrics(agents: Agent[], resources: Resource[]): void {
    if (agents.length === 0) return;

    // Calculate average speed
    this.metrics.avgSpeed = agents.reduce((sum, a) => {
      return sum + Math.sqrt(a.velocity.x ** 2 + a.velocity.y ** 2);
    }, 0) / agents.length;

    // Calculate average energy
    this.metrics.avgEnergy = agents.reduce((sum, a) => sum + a.energy, 0) / agents.length;

    // Calculate average fitness
    this.metrics.avgFitness = agents.reduce((sum, a) => sum + a.fitness, 0) / agents.length;

    // Calculate swarm coherence
    const centerX = agents.reduce((sum, a) => sum + a.position.x, 0) / agents.length;
    const centerY = agents.reduce((sum, a) => sum + a.position.y, 0) / agents.length;
    const avgDist = agents.reduce((sum, a) => {
      return sum + this.distance(a.position, { x: centerX, y: centerY });
    }, 0) / agents.length;
    this.metrics.swarmCoherence = Math.max(0, 1 - avgDist / 500);

    // Calculate coverage area
    const minX = Math.min(...agents.map(a => a.position.x));
    const maxX = Math.max(...agents.map(a => a.position.x));
    const minY = Math.min(...agents.map(a => a.position.y));
    const maxY = Math.max(...agents.map(a => a.position.y));
    this.metrics.coverageArea = (maxX - minX) * (maxY - minY);

    // Count active connections
    this.metrics.activeConnections = agents.reduce((sum, a) => sum + a.connections.length, 0) / 2;

    // Count resources found
    this.metrics.resourcesFound = resources.filter(r => r.discovered).length;

    // Update world time
    const hours = Math.floor(this.worldState.time);
    const minutes = Math.floor((this.worldState.time % 1) * 60);
    this.metrics.worldTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    this.metrics.worldWeather = this.worldState.weather;
  }

  private saveState(): void {
    try {
      const db = getDatabase();
      
      // Save agents
      const agents = Array.from(this.agents.values());
      for (const agent of agents) {
        db.prepare(`
          INSERT OR REPLACE INTO agents 
          (id, position_x, position_y, velocity_x, velocity_y, role, state, energy, fitness, age, traits, brain, memory, sub_swarm_id, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          agent.id,
          agent.position.x,
          agent.position.y,
          agent.velocity.x,
          agent.velocity.y,
          agent.role,
          agent.state,
          agent.energy,
          agent.fitness,
          agent.age,
          JSON.stringify(agent.traits),
          JSON.stringify(agent.brain),
          JSON.stringify(agent.memory),
          agent.subSwarmId,
          Date.now()
        );
      }

      // Save resources
      const resources = Array.from(this.resources.values());
      for (const resource of resources) {
        db.prepare(`
          INSERT OR REPLACE INTO resources
          (id, position_x, position_y, amount, type, discovered, discovered_by, depletion_rate, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          resource.id,
          resource.position.x,
          resource.position.y,
          resource.amount,
          resource.type,
          resource.discovered ? 1 : 0,
          resource.discoveredBy || null,
          resource.depletionRate,
          Date.now()
        );
      }

      // Save metrics
      db.prepare(`
        INSERT INTO metrics_history (timestamp, metrics)
        VALUES (?, ?)
      `).run(Date.now(), JSON.stringify(this.metrics));

    } catch (error) {
      console.error('❌ Failed to save state:', error);
    }
  }

  // Public API methods
  getAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  getResources(): Resource[] {
    return Array.from(this.resources.values());
  }

  getStructures(): Structure[] {
    return Array.from(this.structures.values());
  }

  getThreats(): Threat[] {
    return Array.from(this.threats.values());
  }

  getConfig(): SwarmConfig {
    return { ...this.config };
  }

  getWorldState(): WorldState {
    return { ...this.worldState };
  }

  getMetrics(): SwarmMetrics {
    return { ...this.metrics };
  }

  getEvents(): SwarmEvent[] {
    return [...this.events];
  }

  updateConfig(newConfig: Partial<SwarmConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('✅ Config updated');
  }

  addAgent(role: 'explorer' | 'worker' | 'coordinator' | 'scout' | 'carrier'): Agent {
    const id = `agent-${uuidv4()}`;
    const agent = this.createAgent(id, role);
    this.agents.set(id, agent);
    return agent;
  }

  removeAgent(id: string): boolean {
    return this.agents.delete(id);
  }

  addResource(): Resource {
    const id = `res-${uuidv4()}`;
    const resource = this.createResource(id);
    this.resources.set(id, resource);
    return resource;
  }

  reset(): void {
    this.stop();
    this.agents.clear();
    this.resources.clear();
    this.structures.clear();
    this.threats.clear();
    this.events = [];
    this.worldState = this.getDefaultWorldState();
    this.metrics = this.getDefaultMetrics();
    this.initialize();
    console.log('🔄 Simulation reset');
  }

  /**
   * Execute a real-world action via the Python executor server
   */
  async executeRealWorldAction(action: string, params: Record<string, any> = {}): Promise<any> {
    if (!this.realWorldExecutorUrl) {
      console.warn('⚠️ Real-world execution is disabled');
      return { success: false, error: 'Real-world execution is disabled' };
    }

    try {
      const response = await axios.post(`${this.realWorldExecutorUrl}/execute`, {
        action,
        params,
      });
      
      console.log(`🌍 Executed real-world action: ${action}`, response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Real-world action failed:', error.message);
      return { success: false, error: error.message };
    }
  }
}

// Singleton instance
let orchestratorInstance: AgentOrchestrator | null = null;

export function getOrchestrator(enableRealWorld?: boolean, executorUrl?: string): AgentOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new AgentOrchestrator(undefined, enableRealWorld || false, executorUrl || 'http://localhost:5000');
  }
  return orchestratorInstance;
}
