import { Agent, Vector2D } from '../types/swarm';
import { dist } from './swarmEngine';

export interface AgentBiography {
  id: string;
  role: string;
  birthTime: number;
  deathTime?: number;
  achievements: Achievement[];
  stats: AgentStats;
  personality: PersonalityProfile;
  relationships: Map<string, number>;
  lifeEvents: LifeEvent[];
}

export interface Achievement {
  type: 'discovery' | 'construction' | 'survival' | 'social' | 'exploration';
  description: string;
  timestamp: number;
  value: number;
}

export interface AgentStats {
  distanceTraveled: number;
  resourcesCollected: number;
  threatsAvoided: number;
  messagesSent: number;
  agentsHelped: number;
  structuresBuilt: number;
  areasExplored: number;
  nearMisses: number;
}

export interface PersonalityProfile {
  curiosity: number;
  sociability: number;
  aggression: number;
  caution: number;
  efficiency: number;
  leadership: number;
  creativity: number;
}

export interface LifeEvent {
  type: 'birth' | 'discovery' | 'danger' | 'success' | 'failure' | 'social' | 'death';
  description: string;
  timestamp: number;
  position?: Vector2D;
  significance: number;
}

export class BiographySystem {
  private biographies: Map<string, AgentBiography> = new Map();
  private lastPositions: Map<string, Vector2D> = new Map();

  createBiography(agent: Agent): void {
    this.biographies.set(agent.id, {
      id: agent.id,
      role: agent.role,
      birthTime: Date.now(),
      achievements: [],
      stats: {
        distanceTraveled: 0,
        resourcesCollected: 0,
        threatsAvoided: 0,
        messagesSent: 0,
        agentsHelped: 0,
        structuresBuilt: 0,
        areasExplored: 0,
        nearMisses: 0,
      },
      personality: {
        curiosity: agent.traits.curiosity,
        sociability: agent.traits.sociability,
        aggression: agent.traits.aggression,
        caution: agent.traits.caution,
        efficiency: agent.traits.efficiency,
        leadership: 0.5,
        creativity: 0.5,
      },
      relationships: new Map(),
      lifeEvents: [{
        type: 'birth',
        description: `Agent ${agent.id} born as ${agent.role}`,
        timestamp: Date.now(),
        position: { ...agent.position },
        significance: 0.5,
      }],
    });
    this.lastPositions.set(agent.id, { ...agent.position });
  }

  updateBiography(agent: Agent, actions: {
    distanceTraveled?: number;
    resourceCollected?: boolean;
    threatAvoided?: boolean;
    messageSent?: boolean;
    agentHelped?: string;
    structureBuilt?: boolean;
    areaExplored?: boolean;
    nearMiss?: boolean;
  }): void {
    const bio = this.biographies.get(agent.id);
    if (!bio) return;

    if (actions.distanceTraveled) bio.stats.distanceTraveled += actions.distanceTraveled;
    if (actions.resourceCollected) {
      bio.stats.resourcesCollected++;
      this.addAchievement(agent.id, {
        type: 'discovery',
        description: 'Collected a resource',
        timestamp: Date.now(),
        value: 10,
      });
    }
    if (actions.threatAvoided) {
      bio.stats.threatsAvoided++;
      this.addLifeEvent(agent.id, {
        type: 'danger',
        description: 'Successfully avoided a threat',
        timestamp: Date.now(),
        position: { ...agent.position },
        significance: 0.6,
      });
    }
    if (actions.messageSent) bio.stats.messagesSent++;
    if (actions.agentHelped) {
      bio.stats.agentsHelped++;
      const currentAffinity = bio.relationships.get(actions.agentHelped) || 0;
      bio.relationships.set(actions.agentHelped, Math.min(1, currentAffinity + 0.1));
    }
    if (actions.structureBuilt) {
      bio.stats.structuresBuilt++;
      this.addAchievement(agent.id, {
        type: 'construction',
        description: 'Built a structure',
        timestamp: Date.now(),
        value: 20,
      });
    }
    if (actions.areaExplored) {
      bio.stats.areasExplored++;
      bio.personality.curiosity = Math.min(1, bio.personality.curiosity + 0.01);
    }
    if (actions.nearMiss) {
      bio.stats.nearMisses++;
      bio.personality.caution = Math.min(1, bio.personality.caution + 0.02);
    }

    this.lastPositions.set(agent.id, { ...agent.position });
  }

  addAchievement(agentId: string, achievement: Achievement): void {
    const bio = this.biographies.get(agentId);
    if (!bio) return;
    bio.achievements.push(achievement);
    if (bio.achievements.length > 20) bio.achievements.shift();
  }

  addLifeEvent(agentId: string, event: LifeEvent): void {
    const bio = this.biographies.get(agentId);
    if (!bio) return;
    bio.lifeEvents.push(event);
    if (bio.lifeEvents.length > 50) bio.lifeEvents.shift();
  }

  recordDeath(agentId: string, cause: string): void {
    const bio = this.biographies.get(agentId);
    if (!bio) return;
    bio.deathTime = Date.now();
    this.addLifeEvent(agentId, {
      type: 'death',
      description: `Died: ${cause}`,
      timestamp: Date.now(),
      significance: 1.0,
    });
  }

  getBiography(agentId: string): AgentBiography | undefined {
    return this.biographies.get(agentId);
  }

  getAllBiographies(): AgentBiography[] {
    return Array.from(this.biographies.values());
  }

  getTopPerformers(metric: keyof AgentStats, count: number = 5): AgentBiography[] {
    return this.getAllBiographies()
      .filter(b => !b.deathTime)
      .sort((a, b) => b.stats[metric] - a.stats[metric])
      .slice(0, count);
  }

  getMostSocial(count: number = 5): AgentBiography[] {
    return this.getAllBiographies()
      .filter(b => !b.deathTime)
      .sort((a, b) => b.stats.agentsHelped - a.stats.agentsHelped)
      .slice(0, count);
  }

  getMostExperienced(count: number = 5): AgentBiography[] {
    return this.getAllBiographies()
      .filter(b => !b.deathTime)
      .sort((a, b) => {
        const ageA = Date.now() - a.birthTime;
        const ageB = Date.now() - b.birthTime;
        return ageB - ageA;
      })
      .slice(0, count);
  }

  getSummary(): {
    totalAgents: number;
    livingAgents: number;
    totalAchievements: number;
    avgResourcesCollected: number;
    avgDistanceTraveled: number;
    topExplorer?: AgentBiography;
    topCollector?: AgentBiography;
    topSocial?: AgentBiography;
  } {
    const all = this.getAllBiographies();
    const living = all.filter(b => !b.deathTime);
    
    return {
      totalAgents: all.length,
      livingAgents: living.length,
      totalAchievements: all.reduce((sum, b) => sum + b.achievements.length, 0),
      avgResourcesCollected: living.length > 0 
        ? living.reduce((sum, b) => sum + b.stats.resourcesCollected, 0) / living.length 
        : 0,
      avgDistanceTraveled: living.length > 0
        ? living.reduce((sum, b) => sum + b.stats.distanceTraveled, 0) / living.length
        : 0,
      topExplorer: this.getTopPerformers('areasExplored', 1)[0],
      topCollector: this.getTopPerformers('resourcesCollected', 1)[0],
      topSocial: this.getMostSocial(1)[0],
    };
  }

  cleanup(): void {
    const all = this.getAllBiographies();
    const dead = all.filter(b => b.deathTime);
    if (dead.length > 100) {
      dead.sort((a, b) => (b.deathTime || 0) - (a.deathTime || 0));
      for (let i = 100; i < dead.length; i++) {
        this.biographies.delete(dead[i].id);
      }
    }
  }
}
