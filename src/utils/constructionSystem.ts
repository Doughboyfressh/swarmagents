import { Vector2D, Agent } from '../types/swarm';
import { dist, add, sub, normalize, mul } from './swarmEngine';
import { globalEventLog, createEvent } from './eventLog';

export interface Structure {
  id: string;
  type: 'wall' | 'tower' | 'bridge' | 'shelter' | 'beacon';
  position: Vector2D;
  size: number;
  progress: number; // 0-100
  completed: boolean;
  builderIds: string[];
  color: string;
  effect?: 'protection' | 'visibility' | 'resource_boost';
}

export class ConstructionSystem {
  private structures: Map<string, Structure> = new Map();
  private structureIdCounter = 0;

  createStructure(
    type: Structure['type'],
    position: Vector2D,
    size: number = 40
  ): Structure {
    const colors: Record<Structure['type'], string> = {
      wall: '#886644',
      tower: '#4488ff',
      bridge: '#88aa44',
      shelter: '#ff8844',
      beacon: '#ffdd00',
    };

    const effects: Record<Structure['type'], Structure['effect']> = {
      wall: 'protection',
      tower: 'visibility',
      bridge: 'resource_boost',
      shelter: 'protection',
      beacon: 'visibility',
    };

    const structure: Structure = {
      id: `structure-${this.structureIdCounter++}`,
      type,
      position: { ...position },
      size,
      progress: 0,
      completed: false,
      builderIds: [],
      color: colors[type],
      effect: effects[type],
    };

    this.structures.set(structure.id, structure);
    
    globalEventLog.add(createEvent(
      'state_change',
      `New ${type} construction started`,
      'info',
      undefined,
      position
    ));

    return structure;
  }

  contributeToConstruction(agent: Agent, structureId: string, workAmount: number = 1): boolean {
    const structure = this.structures.get(structureId);
    if (!structure || structure.completed) return false;

    if (dist(agent.position, structure.position) > structure.size + 20) {
      return false;
    }

    structure.progress = Math.min(100, structure.progress + workAmount);
    
    if (!structure.builderIds.includes(agent.id)) {
      structure.builderIds.push(agent.id);
    }

    agent.energy -= 0.5;
    agent.state = 'working';

    if (structure.progress >= 100 && !structure.completed) {
      structure.completed = true;
      globalEventLog.add(createEvent(
        'state_change',
        `${structure.type} construction completed!`,
        'success',
        undefined,
        structure.position
      ));
    }

    return true;
  }

  findNearestStructure(position: Vector2D, maxDist: number = 200): Structure | null {
    let nearest: Structure | null = null;
    let minDist = maxDist;

    for (const structure of this.structures.values()) {
      if (structure.completed) continue;
      const d = dist(position, structure.position);
      if (d < minDist) {
        minDist = d;
        nearest = structure;
      }
    }

    return nearest;
  }

  getStructureEffects(agent: Agent): { protection: number; visibility: number; resourceBoost: number } {
    let protection = 0;
    let visibility = 0;
    let resourceBoost = 0;

    for (const structure of this.structures.values()) {
      if (!structure.completed) continue;
      
      const d = dist(agent.position, structure.position);
      if (d > structure.size * 2) continue;

      const influence = 1 - (d / (structure.size * 2));

      switch (structure.effect) {
        case 'protection':
          protection += influence * 0.3;
          break;
        case 'visibility':
          visibility += influence * 0.2;
          break;
        case 'resource_boost':
          resourceBoost += influence * 0.25;
          break;
      }
    }

    return { protection, visibility, resourceBoost };
  }

  getStructures(): Structure[] {
    return Array.from(this.structures.values());
  }

  getStats(): { total: number; completed: number; inProgress: number; totalBuilders: number } {
    const structures = Array.from(this.structures.values());
    return {
      total: structures.length,
      completed: structures.filter(s => s.completed).length,
      inProgress: structures.filter(s => !s.completed).length,
      totalBuilders: structures.reduce((sum, s) => sum + s.builderIds.length, 0),
    };
  }
}
