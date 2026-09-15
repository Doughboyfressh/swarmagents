import { Agent, Vector2D } from '../types/swarm';
import { dist, sub, normalize, mul, add, mag } from './swarmEngine';
import { globalEventLog, createEvent } from './eventLog';

export interface Threat {
  id: string;
  position: Vector2D;
  radius: number;
  severity: number; // 0-1
  type: 'predator' | 'hazard' | 'territory';
  velocity?: Vector2D;
  createdAt: number;
}

export class ThreatMap {
  private threats: Map<string, Threat> = new Map();
  private threatIdCounter = 0;

  addThreat(position: Vector2D, radius: number, severity: number, type: Threat['type'] = 'hazard'): Threat {
    const threat: Threat = {
      id: `threat-${this.threatIdCounter++}`,
      position: { ...position },
      radius,
      severity,
      type,
      createdAt: Date.now(),
    };
    this.threats.set(threat.id, threat);
    globalEventLog.add(createEvent(
      'threat_detected',
      `New ${type} threat detected (severity: ${(severity * 100).toFixed(0)}%)`,
      severity > 0.7 ? 'critical' : 'warning',
      undefined,
      position
    ));
    return threat;
  }

  removeThreat(id: string): void {
    this.threats.delete(id);
  }

  updateThreats(dt: number): void {
    for (const [id, threat] of this.threats) {
      if (threat.velocity) {
        threat.position.x += threat.velocity.x * dt;
        threat.position.y += threat.velocity.y * dt;
      }
    }
  }

  getThreats(): Threat[] {
    return Array.from(this.threats.values());
  }

  getNearestThreat(position: Vector2D, maxDist: number = 200): Threat | null {
    let nearest: Threat | null = null;
    let minDist = maxDist;

    for (const threat of this.threats.values()) {
      const d = dist(position, threat.position);
      if (d < minDist) {
        minDist = d;
        nearest = threat;
      }
    }

    return nearest;
  }

  getFleeForce(position: Vector2D, perceptionRadius: number): Vector2D {
    let force: Vector2D = { x: 0, y: 0 };

    for (const threat of this.threats.values()) {
      const d = dist(position, threat.position);
      if (d < perceptionRadius + threat.radius) {
        const fleeDir = normalize(sub(position, threat.position));
        const urgency = threat.severity * (1 - d / (perceptionRadius + threat.radius));
        force = add(force, mul(fleeDir, urgency * 3));
      }
    }

    return force;
  }

  shareThreatInfo(agents: Agent[]): void {
    for (const agent of agents) {
      if (agent.connections.length === 0) continue;

      const nearbyThreat = this.getNearestThreat(agent.position, agent.perceptionRadius);
      if (nearbyThreat) {
        for (const connId of agent.connections) {
          const connected = agents.find(a => a.id === connId);
          if (connected) {
            connected.memory.knownDangers.push({
              position: { ...nearbyThreat.position },
              timestamp: Date.now(),
            });
            if (connected.memory.knownDangers.length > 5) {
              connected.memory.knownDangers.shift();
            }
          }
        }
      }
    }
  }

  getStats(): { count: number; avgSeverity: number; maxSeverity: number } {
    const threats = Array.from(this.threats.values());
    if (threats.length === 0) return { count: 0, avgSeverity: 0, maxSeverity: 0 };
    return {
      count: threats.length,
      avgSeverity: threats.reduce((a, b) => a + b.severity, 0) / threats.length,
      maxSeverity: Math.max(...threats.map(t => t.severity)),
    };
  }
}

export type PatternType = 'circle' | 'line' | 'grid' | 'spiral' | 'random';

export interface PatternConfig {
  type: PatternType;
  center: Vector2D;
  radius: number;
  spacing: number;
  active: boolean;
}

export function getPatternTarget(
  agent: Agent,
  agents: Agent[],
  pattern: PatternConfig
): Vector2D | null {
  if (!pattern.active) return null;

  const sortedAgents = [...agents].sort((a, b) => a.id.localeCompare(b.id));
  const index = sortedAgents.findIndex(a => a.id === agent.id);
  if (index === -1) return null;

  const count = agents.length;

  switch (pattern.type) {
    case 'circle': {
      const angle = (index / count) * Math.PI * 2;
      return {
        x: pattern.center.x + Math.cos(angle) * pattern.radius,
        y: pattern.center.y + Math.sin(angle) * pattern.radius,
      };
    }
    case 'line': {
      const offset = (index - count / 2) * pattern.spacing;
      return {
        x: pattern.center.x + offset,
        y: pattern.center.y,
      };
    }
    case 'grid': {
      const cols = Math.ceil(Math.sqrt(count));
      const row = Math.floor(index / cols);
      const col = index % cols;
      return {
        x: pattern.center.x + (col - cols / 2) * pattern.spacing,
        y: pattern.center.y + (row - Math.ceil(count / cols) / 2) * pattern.spacing,
      };
    }
    case 'spiral': {
      const angle = (index / count) * Math.PI * 6;
      const r = (index / count) * pattern.radius;
      return {
        x: pattern.center.x + Math.cos(angle) * r,
        y: pattern.center.y + Math.sin(angle) * r,
      };
    }
    default:
      return null;
  }
}

export interface Particle {
  position: Vector2D;
  velocity: Vector2D;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private maxParticles = 500;

  emit(position: Vector2D, count: number, color: string, speed: number = 2, life: number = 30): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * speed;
      this.particles.push({
        position: { ...position },
        velocity: { x: Math.cos(angle) * spd, y: Math.sin(angle) * spd },
        life,
        maxLife: life,
        color,
        size: 1 + Math.random() * 2,
      });
    }
  }

  update(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.position.x += p.velocity.x;
      p.position.y += p.velocity.y;
      p.velocity.x *= 0.95;
      p.velocity.y *= 0.95;
      p.life--;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  getParticles(): Particle[] {
    return this.particles;
  }

  clear(): void {
    this.particles = [];
  }
}
