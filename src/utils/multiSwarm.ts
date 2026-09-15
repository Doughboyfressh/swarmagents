import { Agent, Vector2D } from '../types/swarm';
import { dist, sub, normalize, mul, add } from './swarmEngine';

export interface SwarmGroup {
  id: string;
  name: string;
  color: string;
  agentIds: string[];
  relationship: 'neutral' | 'friendly' | 'hostile';
  resources: number;
  strength: number;
}

export class MultiSwarmSystem {
  private swarms: Map<string, SwarmGroup> = new Map();
  private relationships: Map<string, Map<string, 'neutral' | 'friendly' | 'hostile'>> = new Map();

  constructor() {
    this.createSwarm('alpha', 'Alpha Swarm', '#00d4ff');
  }

  createSwarm(id: string, name: string, color: string): SwarmGroup {
    const swarm: SwarmGroup = {
      id, name, color, agentIds: [], relationship: 'neutral', resources: 0, strength: 0,
    };
    this.swarms.set(id, swarm);
    this.relationships.set(id, new Map());
    return swarm;
  }

  assignAgentToSwarm(agentId: string, swarmId: string): void {
    for (const swarm of this.swarms.values()) {
      const idx = swarm.agentIds.indexOf(agentId);
      if (idx !== -1) swarm.agentIds.splice(idx, 1);
    }
    const swarm = this.swarms.get(swarmId);
    if (swarm && !swarm.agentIds.includes(agentId)) swarm.agentIds.push(agentId);
  }

  setRelationship(swarm1Id: string, swarm2Id: string, relationship: 'neutral' | 'friendly' | 'hostile'): void {
    const rel1 = this.relationships.get(swarm1Id);
    const rel2 = this.relationships.get(swarm2Id);
    if (rel1) rel1.set(swarm2Id, relationship);
    if (rel2) rel2.set(swarm1Id, relationship);
  }

  getRelationship(swarm1Id: string, swarm2Id: string): 'neutral' | 'friendly' | 'hostile' {
    return this.relationships.get(swarm1Id)?.get(swarm2Id) ?? 'neutral';
  }

  getAgentSwarm(agentId: string): SwarmGroup | null {
    for (const swarm of this.swarms.values()) {
      if (swarm.agentIds.includes(agentId)) return swarm;
    }
    return null;
  }

  calculateInterSwarmForce(agent: Agent, agents: Agent[]): Vector2D {
    const mySwarm = this.getAgentSwarm(agent.id);
    if (!mySwarm) return { x: 0, y: 0 };

    let force: Vector2D = { x: 0, y: 0 };

    for (const other of agents) {
      if (other.id === agent.id) continue;
      const otherSwarm = this.getAgentSwarm(other.id);
      if (!otherSwarm || otherSwarm.id === mySwarm.id) continue;

      const relationship = this.getRelationship(mySwarm.id, otherSwarm.id);
      const d = dist(agent.position, other.position);

      if (d < agent.perceptionRadius) {
        if (relationship === 'hostile') {
          const fleeDir = normalize(sub(agent.position, other.position));
          const urgency = 1 - (d / agent.perceptionRadius);
          force = add(force, mul(fleeDir, urgency * 2));
        } else if (relationship === 'friendly') {
          const attractDir = normalize(sub(other.position, agent.position));
          const attraction = 1 - (d / agent.perceptionRadius);
          force = add(force, mul(attractDir, attraction * 0.5));
        }
      }
    }

    return force;
  }

  updateSwarmStats(agents: Agent[]): void {
    for (const swarm of this.swarms.values()) {
      const swarmAgents = agents.filter(a => swarm.agentIds.includes(a.id));
      swarm.strength = swarmAgents.reduce((sum, a) => sum + a.energy, 0);
      swarm.resources = swarmAgents.reduce((sum, a) => sum + a.memory.knownResources.length, 0);
    }
  }

  getSwarms(): SwarmGroup[] {
    return Array.from(this.swarms.values());
  }

  getStats(): { swarmCount: number; totalAgents: number; avgStrength: number } {
    const swarms = Array.from(this.swarms.values());
    return {
      swarmCount: swarms.length,
      totalAgents: swarms.reduce((sum, s) => sum + s.agentIds.length, 0),
      avgStrength: swarms.length > 0 ? swarms.reduce((sum, s) => sum + s.strength, 0) / swarms.length : 0,
    };
  }
}
