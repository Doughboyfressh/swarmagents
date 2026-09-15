import { Agent, Vector2D, Resource } from '../types/swarm';
import { dist } from './swarmEngine';

export interface Task {
  id: string;
  type: 'gather' | 'explore' | 'defend' | 'transport';
  location: Vector2D;
  priority: number;
  assignedTo?: string;
  bids: Bid[];
  createdAt: number;
  deadline?: number;
}

export interface Bid {
  agentId: string;
  cost: number;
  capability: number;
  timestamp: number;
}

export class TaskAllocator {
  private tasks: Map<string, Task> = new Map();
  private taskIdCounter = 0;

  createTask(
    type: Task['type'],
    location: Vector2D,
    priority: number = 1,
    deadline?: number
  ): Task {
    const task: Task = {
      id: `task-${this.taskIdCounter++}`,
      type,
      location,
      priority,
      bids: [],
      createdAt: Date.now(),
      deadline,
    };
    this.tasks.set(task.id, task);
    return task;
  }

  submitBid(taskId: string, bid: Bid): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.bids.push(bid);
    }
  }

  runAuction(): { taskId: string; agentId: string; cost: number }[] {
    const assignments: { taskId: string; agentId: string; cost: number }[] = [];

    for (const [taskId, task] of this.tasks) {
      if (task.assignedTo || task.bids.length === 0) continue;

      if (task.deadline && Date.now() > task.deadline) {
        this.tasks.delete(taskId);
        continue;
      }

      const bestBid = task.bids.reduce((best, bid) => {
        const score = bid.capability / bid.cost;
        const bestScore = best.capability / best.cost;
        return score > bestScore ? bid : best;
      });

      task.assignedTo = bestBid.agentId;
      assignments.push({
        taskId,
        agentId: bestBid.agentId,
        cost: bestBid.cost,
      });

      task.bids = [];
    }

    return assignments;
  }

  calculateBidCost(agent: Agent, task: Task): number {
    const distance = dist(agent.position, task.location);
    const energyCost = (100 - agent.energy) * 0.5;
    const timeCost = distance / agent.maxSpeed;

    let capability = 0.5;
    if (task.type === 'gather' && (agent.role === 'worker' || agent.role === 'carrier')) {
      capability = 0.9;
    } else if (task.type === 'explore' && (agent.role === 'explorer' || agent.role === 'scout')) {
      capability = 0.9;
    } else if (task.type === 'defend' && agent.role === 'scout') {
      capability = 0.8;
    }

    return distance * 0.1 + energyCost + timeCost * 0.2;
  }

  getUnassignedTasks(): Task[] {
    return Array.from(this.tasks.values()).filter(t => !t.assignedTo);
  }

  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  cleanupCompleted(): void {
    for (const [taskId, task] of this.tasks) {
      if (task.assignedTo && Date.now() - task.createdAt > 60000) {
        this.tasks.delete(taskId);
      }
    }
  }

  getStats(): { total: number; assigned: number; unassigned: number } {
    const tasks = Array.from(this.tasks.values());
    return {
      total: tasks.length,
      assigned: tasks.filter(t => t.assignedTo).length,
      unassigned: tasks.filter(t => !t.assignedTo).length,
    };
  }
}

export function createTasksFromResources(
  resources: Resource[],
  allocator: TaskAllocator
): void {
  for (const resource of resources) {
    if (resource.discovered && resource.amount > 10) {
      const existing = allocator.getUnassignedTasks().find(
        t => dist(t.location, resource.position) < 20
      );
      if (!existing) {
        allocator.createTask('gather', resource.position, resource.amount / 100);
      }
    }
  }
}
