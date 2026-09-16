import { Agent, Vector2D, Resource, Threat, SubSwarm } from '../types/swarm';
import { dist, add, sub, mul, normalize, limit, mag } from './swarmEngine';
import { Task, TaskAllocator } from './taskAllocation';

export interface SwarmLeader {
  id: string;
  role: 'explorer' | 'worker' | 'coordinator' | 'scout' | 'carrier';
  leadershipScore: number;
  followers: string[];
  specialization: SwarmSpecialization;
}

export type SwarmSpecialization = 'exploration' | 'gathering' | 'defense' | 'construction' | 'coordination';

export interface HierarchicalSwarm {
  id: number;
  leader: SwarmLeader;
  subSwarms: Map<SwarmSpecialization, SubSwarm>;
  agents: Map<string, Agent>;
  coordinationLevel: number;
  formationPattern?: FormationPattern;
}

export type FormationPattern = 'line' | 'wedge' | 'circle' | 'cluster' | 'grid';

export class HierarchicalSwarmManager {
  private swarms: Map<number, HierarchicalSwarm> = new Map();
  private swarmIdCounter = 0;
  private taskAllocator: TaskAllocator;

  constructor() {
    this.taskAllocator = new TaskAllocator();
  }

  /**
   * Create hierarchical swarm structure from flat agent list
   */
  organizeIntoHierarchies(agents: Agent[], resources: Resource[], threats: Threat[]): HierarchicalSwarm[] {
    // First, detect natural clusters
    const clusters = this.detectNaturalClusters(agents);
    
    const hierarchies: HierarchicalSwarm[] = [];

    for (const cluster of clusters) {
      if (cluster.length < 3) continue;

      // Elect leader based on traits and role
      const leader = this.electLeader(cluster);
      
      // Create specialized sub-swarms
      const subSwarms = this.createSpecializedSubSwarms(cluster, leader);
      
      // Assign agents to leader's follower list
      leader.followers = cluster.filter(a => a.id !== leader.id).map(a => a.id);

      const hierarchy: HierarchicalSwarm = {
        id: this.swarmIdCounter++,
        leader,
        subSwarms,
        agents: new Map(cluster.map(a => [a.id, a])),
        coordinationLevel: this.calculateCoordinationLevel(cluster),
      };

      hierarchies.push(hierarchy);
    }

    // Handle unassigned agents
    const assignedIds = new Set(
      hierarchies.flatMap(h => Array.from(h.agents.keys()))
    );
    
    const unassigned = agents.filter(a => !assignedIds.has(a.id));
    if (unassigned.length >= 3) {
      const leader = this.electLeader(unassigned);
      const subSwarms = this.createSpecializedSubSwarms(unassigned, leader);
      leader.followers = unassigned.filter(a => a.id !== leader.id).map(a => a.id);

      hierarchies.push({
        id: this.swarmIdCounter++,
        leader,
        subSwarms,
        agents: new Map(unassigned.map(a => [a.id, a])),
        coordinationLevel: this.calculateCoordinationLevel(unassigned),
      });
    }

    return hierarchies;
  }

  /**
   * Detect natural clusters using density-based approach
   */
  private detectNaturalClusters(agents: Agent[], threshold: number = 150): Agent[][] {
    const clusters: Agent[][] = [];
    const visited = new Set<string>();

    for (const agent of agents) {
      if (visited.has(agent.id)) continue;

      const cluster: Agent[] = [];
      const queue: Agent[] = [agent];
      visited.add(agent.id);

      while (queue.length > 0) {
        const current = queue.shift()!;
        cluster.push(current);

        for (const other of agents) {
          if (!visited.has(other.id) && dist(current.position, other.position) < threshold) {
            visited.add(other.id);
            queue.push(other);
          }
        }
      }

      if (cluster.length > 0) {
        clusters.push(cluster);
      }
    }

    return clusters;
  }

  /**
   * Elect leader based on traits, energy, and role suitability
   */
  private electLeader(agents: Agent[]): Agent {
    let bestLeader = agents[0];
    let bestScore = -Infinity;

    for (const agent of agents) {
      let score = 0;

      // Leadership traits
      score += agent.traits.sociability * 30;
      score += agent.traits.efficiency * 20;
      score += (1 - agent.traits.caution) * 15; // Less cautious = more leadership

      // Energy level
      score += agent.energy * 0.3;

      // Role bonus (coordinators make good leaders)
      if (agent.role === 'coordinator') score += 40;
      else if (agent.role === 'scout') score += 20;

      // Age/experience bonus
      score += Math.min(agent.age * 0.05, 20);

      // Fitness
      score += agent.fitness * 0.5;

      if (score > bestScore) {
        bestScore = score;
        bestLeader = agent;
      }
    }

    return bestLeader;
  }

  /**
   * Create specialized sub-swarms based on agent roles and current needs
   */
  private createSpecializedSubSwarms(
    agents: Agent[], 
    leader: Agent
  ): Map<SwarmSpecialization, SubSwarm> {
    const subSwarms = new Map<SwarmSpecialization, SubSwarm>();
    const specializationAgents: Map<SwarmSpecialization, Agent[]> = new Map();

    // Initialize specialization buckets
    const specializations: SwarmSpecialization[] = ['exploration', 'gathering', 'defense', 'construction', 'coordination'];
    for (const spec of specializations) {
      specializationAgents.set(spec, []);
    }

    // Assign agents to specializations based on role and traits
    for (const agent of agents) {
      if (agent.id === leader.id) continue;

      let primarySpec: SwarmSpecialization = 'coordination';
      let secondarySpec: SwarmSpecialization | null = null;

      // Role-based assignment
      switch (agent.role) {
        case 'explorer':
        case 'scout':
          primarySpec = 'exploration';
          secondarySpec = 'defense';
          break;
        case 'worker':
        case 'carrier':
          primarySpec = 'gathering';
          secondarySpec = 'construction';
          break;
        case 'coordinator':
          primarySpec = 'coordination';
          break;
      }

      // Trait-based refinement
      if (agent.traits.aggression > 0.7 && secondarySpec !== 'defense') {
        secondarySpec = 'defense';
      }
      if (agent.traits.curiosity > 0.7 && primarySpec !== 'exploration') {
        primarySpec = 'exploration';
      }
      if (agent.traits.efficiency > 0.8 && primarySpec !== 'gathering') {
        primarySpec = 'gathering';
      }

      specializationAgents.get(primarySpec)!.push(agent);
      if (secondarySpec) {
        specializationAgents.get(secondarySpec)!.push(agent);
      }
    }

    // Create sub-swarm objects
    for (const [spec, specAgents] of specializationAgents.entries()) {
      if (specAgents.length === 0) continue;

      const center = specAgents.reduce(
        (acc, a) => add(acc, a.position),
        { x: 0, y: 0 }
      );
      center.x /= specAgents.length;
      center.y /= specAgents.length;

      const colors: Record<SwarmSpecialization, string> = {
        exploration: '#00d4ff',
        gathering: '#00ff88',
        defense: '#ff4444',
        construction: '#ffaa00',
        coordination: '#aa66ff',
      };

      subSwarms.set(spec, {
        id: specAgents[0].subSwarmId,
        agentIds: specAgents.map(a => a.id),
        center,
        color: colors[spec],
        purpose: spec.charAt(0).toUpperCase() + spec.slice(1),
      });
    }

    return subSwarms;
  }

  /**
   * Calculate coordination level of a swarm (0-1)
   */
  private calculateCoordinationLevel(agents: Agent[]): number {
    if (agents.length < 2) return 0;

    // Average sociability
    const avgSociability = agents.reduce((sum, a) => sum + a.traits.sociability, 0) / agents.length;

    // Connection density
    const totalPossibleConnections = agents.length * (agents.length - 1);
    const actualConnections = agents.reduce((sum, a) => sum + a.connections.length, 0);
    const connectionDensity = totalPossibleConnections > 0 ? actualConnections / totalPossibleConnections : 0;

    // Role diversity bonus
    const uniqueRoles = new Set(agents.map(a => a.role)).size;
    const roleDiversityBonus = Math.min(uniqueRoles / 5, 1) * 0.3;

    return Math.min(1, (avgSociability * 0.4 + connectionDensity * 0.4 + roleDiversityBonus) * 1.2);
  }

  /**
   * Assign tasks to specialized sub-swarms
   */
  assignTasksToSubSwarms(
    hierarchy: HierarchicalSwarm,
    resources: Resource[],
    threats: Threat[]
  ): Task[] {
    const tasks: Task[] = [];

    // Exploration sub-swarm gets exploration tasks
    const explorationSwarm = hierarchy.subSwarms.get('exploration');
    if (explorationSwarm) {
      const undiscoveredResources = resources.filter(r => !r.discovered);
      for (const resource of undiscoveredResources.slice(0, 3)) {
        tasks.push(this.taskAllocator.createTask('explore', resource.position, 0.7));
      }
    }

    // Gathering sub-swarm gets collection tasks
    const gatheringSwarm = hierarchy.subSwarms.get('gathering');
    if (gatheringSwarm) {
      const discoveredResources = resources.filter(r => r.discovered && r.amount > 0);
      for (const resource of discoveredResources.slice(0, 5)) {
        tasks.push(this.taskAllocator.createTask('gather', resource.position, resource.amount / 100));
      }
    }

    // Defense sub-swarm gets defense tasks
    const defenseSwarm = hierarchy.subSwarms.get('defense');
    if (defenseSwarm && threats.length > 0) {
      for (const threat of threats.slice(0, 3)) {
        tasks.push(this.taskAllocator.createTask('defend', threat.position, threat.severity));
      }
    }

    // Run auction for task assignment
    this.taskAllocator.runAuction();

    return tasks;
  }

  /**
   * Update formation pattern for a sub-swarm
   */
  setFormationPattern(
    hierarchy: HierarchicalSwarm,
    specialization: SwarmSpecialization,
    pattern: FormationPattern
  ): void {
    hierarchy.formationPattern = pattern;
    
    const subSwarm = hierarchy.subSwarms.get(specialization);
    if (!subSwarm) return;

    // Apply formation behavior to agents
    const agents = Array.from(hierarchy.agents.values()).filter(
      a => subSwarm.agentIds.includes(a.id)
    );

    this.applyFormationBehavior(agents, pattern, hierarchy.leader);
  }

  /**
   * Apply formation behavior to agents
   */
  private applyFormationBehavior(
    agents: Agent[],
    pattern: FormationPattern,
    leader: SwarmLeader
  ): void {
    const sortedAgents = agents.sort((a, b) => a.id.localeCompare(b.id));
    const leaderAgent = Array.from(hierarchy.agents.values()).find(a => a.id === leader.id);
    
    if (!leaderAgent) return;

    sortedAgents.forEach((agent, idx) => {
      if (agent.id === leader.id) return;

      let offset: Vector2D = { x: 0, y: 0 };
      const spacing = 40;

      switch (pattern) {
        case 'line':
          offset = { x: -(idx * spacing) * Math.cos(0), y: -(idx * spacing) * Math.sin(0) };
          break;
        case 'wedge':
          const row = Math.floor(idx / 2);
          const side = idx % 2 === 0 ? 1 : -1;
          offset = { x: -row * spacing * 0.7, y: side * (Math.ceil(row / 2) + 1) * spacing };
          break;
        case 'circle':
          const angle = (idx / agents.length) * Math.PI * 2;
          offset = { x: Math.cos(angle) * spacing * 2, y: Math.sin(angle) * spacing * 2 };
          break;
        case 'cluster':
          offset = { x: (Math.random() - 0.5) * spacing * 2, y: (Math.random() - 0.5) * spacing * 2 };
          break;
        case 'grid':
          const cols = Math.ceil(Math.sqrt(agents.length));
          const col = idx % cols;
          const gridRow = Math.floor(idx / cols);
          offset = { x: (col - cols / 2) * spacing, y: (gridRow - cols / 2) * spacing };
          break;
      }

      // Target position is leader position + offset
      // This would be applied in the main update loop
    });
  }

  /**
   * Get stats for all hierarchies
   */
  getStats(): {
    totalHierarchies: number;
    avgCoordinationLevel: number;
    specializationDistribution: Record<SwarmSpecialization, number>;
  } {
    const hierarchies = Array.from(this.swarms.values());
    
    return {
      totalHierarchies: hierarchies.length,
      avgCoordinationLevel: hierarchies.length > 0
        ? hierarchies.reduce((sum, h) => sum + h.coordinationLevel, 0) / hierarchies.length
        : 0,
      specializationDistribution: this.getSpecializationDistribution(hierarchies),
    };
  }

  private getSpecializationDistribution(
    hierarchies: HierarchicalSwarm[]
  ): Record<SwarmSpecialization, number> {
    const dist: Record<SwarmSpecialization, number> = {
      exploration: 0,
      gathering: 0,
      defense: 0,
      construction: 0,
      coordination: 0,
    };

    for (const hierarchy of hierarchies) {
      for (const [spec, subSwarm] of hierarchy.subSwarms.entries()) {
        dist[spec] += subSwarm.agentIds.length;
      }
    }

    return dist;
  }
}
