import { SwarmEvent, EventType, Vector2D } from '../types/swarm';

const MAX_EVENTS = 100;
let eventCounter = 0;

export function createEvent(
  type: EventType,
  description: string,
  severity: SwarmEvent['severity'] = 'info',
  agentId?: string,
  position?: Vector2D
): SwarmEvent {
  return {
    id: `evt-${eventCounter++}`,
    timestamp: Date.now(),
    type,
    agentId,
    description,
    position,
    severity,
  };
}

export class EventLog {
  private events: SwarmEvent[] = [];
  private listeners: ((events: SwarmEvent[]) => void)[] = [];

  add(event: SwarmEvent): void {
    this.events.unshift(event);
    if (this.events.length > MAX_EVENTS) {
      this.events = this.events.slice(0, MAX_EVENTS);
    }
    this.notifyListeners();
  }

  getEvents(): SwarmEvent[] {
    return this.events;
  }

  getRecent(count: number = 20): SwarmEvent[] {
    return this.events.slice(0, count);
  }

  getEventRate(): number {
    const now = Date.now();
    const recent = this.events.filter(e => now - e.timestamp < 5000);
    return recent.length / 5; // events per second
  }

  clear(): void {
    this.events = [];
    this.notifyListeners();
  }

  subscribe(listener: (events: SwarmEvent[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.events);
    }
  }
}

export const globalEventLog = new EventLog();
