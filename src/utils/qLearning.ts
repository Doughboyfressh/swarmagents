import { Agent, Vector2D } from '../types/swarm';
import { dist } from './swarmEngine';

/**
 * Q-Learning system for adaptive agent behavior
 * Each agent maintains a Q-table mapping states to action values
 */

export type QState = 'low_energy' | 'medium_energy' | 'high_energy' | 'threatened' | 'isolated' | 'crowded';
export type QAction = 'explore' | 'seek_resource' | 'flee' | 'communicate' | 'rest' | 'follow_pheromone';

export interface QTable {
  [key: string]: { [action: string]: number };
}

export class QLearningSystem {
  private qTables: Map<string, QTable> = new Map();
  private learningRate = 0.1;
  private discountFactor = 0.95;
  private explorationRate = 0.3;
  private explorationDecay = 0.999;
  private minExploration = 0.05;

  constructor() {
    // Initialize with default values
  }

  getState(agent: Agent, neighbors: Agent[], resources: any[], threats: any[]): QState {
    // Energy-based state
    if (agent.energy < 30) return 'low_energy';
    if (agent.energy > 70) return 'high_energy';
    
    // Threat-based state
    const nearestThreat = threats.reduce((nearest, threat) => {
      const d = dist(agent.position, threat.position);
      return d < nearest.dist ? { dist: d, threat } : nearest;
    }, { dist: Infinity, threat: null });
    
    if (nearestThreat.dist < agent.perceptionRadius) return 'threatened';
    
    // Social state
    if (neighbors.length === 0) return 'isolated';
    if (neighbors.length > 5) return 'crowded';
    
    return 'medium_energy';
  }

  getQTable(agentId: string): QTable {
    if (!this.qTables.has(agentId)) {
      this.qTables.set(agentId, {});
    }
    return this.qTables.get(agentId)!;
  }

  getQValue(agentId: string, state: QState, action: QAction): number {
    const qTable = this.getQTable(agentId);
    if (!qTable[state]) {
      qTable[state] = {
        explore: 0,
        seek_resource: 0,
        flee: 0,
        communicate: 0,
        rest: 0,
        follow_pheromone: 0,
      };
    }
    return qTable[state][action];
  }

  chooseAction(agentId: string, state: QState): QAction {
    // Epsilon-greedy policy
    if (Math.random() < this.explorationRate) {
      const actions: QAction[] = ['explore', 'seek_resource', 'flee', 'communicate', 'rest', 'follow_pheromone'];
      return actions[Math.floor(Math.random() * actions.length)];
    }

    const qTable = this.getQTable(agentId);
    if (!qTable[state]) {
      return 'explore';
    }

    // Choose best action
    let bestAction: QAction = 'explore';
    let bestValue = -Infinity;

    for (const action in qTable[state]) {
      if (qTable[state][action] > bestValue) {
        bestValue = qTable[state][action];
        bestAction = action as QAction;
      }
    }

    return bestAction;
  }

  update(agentId: string, state: QState, action: QAction, reward: number, nextState: QState): void {
    const qTable = this.getQTable(agentId);
    
    if (!qTable[state]) {
      qTable[state] = {
        explore: 0,
        seek_resource: 0,
        flee: 0,
        communicate: 0,
        rest: 0,
        follow_pheromone: 0,
      };
    }

    if (!qTable[nextState]) {
      qTable[nextState] = {
        explore: 0,
        seek_resource: 0,
        flee: 0,
        communicate: 0,
        rest: 0,
        follow_pheromone: 0,
      };
    }

    // Q-learning update formula
    const currentValue = qTable[state][action];
    const maxNextValue = Math.max(...Object.values(qTable[nextState]));
    const newValue = currentValue + this.learningRate * (reward + this.discountFactor * maxNextValue - currentValue);
    
    qTable[state][action] = newValue;
  }

  decayExploration(): void {
    this.explorationRate = Math.max(this.minExploration, this.explorationRate * this.explorationDecay);
  }

  getStats(): { avgQValue: number; explorationRate: number; agentsTrained: number } {
    let totalQ = 0;
    let count = 0;

    for (const qTable of this.qTables.values()) {
      for (const state in qTable) {
        for (const action in qTable[state]) {
          totalQ += qTable[state][action];
          count++;
        }
      }
    }

    return {
      avgQValue: count > 0 ? totalQ / count : 0,
      explorationRate: this.explorationRate,
      agentsTrained: this.qTables.size,
    };
  }

  reset(): void {
    this.qTables.clear();
    this.explorationRate = 0.3;
  }
}
