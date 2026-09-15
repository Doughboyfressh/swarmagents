import { Vector2D } from '../types/swarm';
import { dist } from './swarmEngine';

export type MessageType = 
  | 'discovery'
  | 'warning'
  | 'request_help'
  | 'offer_help'
  | 'status_update'
  | 'coordination';

export interface StructuredMessage {
  id: string;
  from: string;
  to: string | 'broadcast';
  type: MessageType;
  content: MessageContent;
  timestamp: number;
  priority: number;
  ttl: number;
}

export interface MessageContent {
  text?: string;
  position?: { x: number; y: number };
  resourceType?: string;
  threatLevel?: number;
  urgency?: number;
}

export class CommunicationProtocol {
  private messageQueue: StructuredMessage[] = [];
  private messageHistory: StructuredMessage[] = [];
  private maxHistory = 200;
  private messageIdCounter = 0;

  createMessage(
    from: string,
    to: string | 'broadcast',
    type: MessageType,
    content: MessageContent,
    priority: number = 0.5
  ): StructuredMessage {
    const message: StructuredMessage = {
      id: `msg-${this.messageIdCounter++}`,
      from, to, type, content,
      timestamp: Date.now(),
      priority, ttl: 60,
    };

    this.messageQueue.push(message);
    this.messageHistory.push(message);

    if (this.messageHistory.length > this.maxHistory) this.messageHistory.shift();

    return message;
  }

  sendDiscovery(from: string, position: { x: number; y: number }, resourceType: string): void {
    this.createMessage(from, 'broadcast', 'discovery', {
      text: `Found ${resourceType}`,
      position, resourceType,
    }, 0.7);
  }

  sendWarning(from: string, position: { x: number; y: number }, threatLevel: number): void {
    this.createMessage(from, 'broadcast', 'warning', {
      text: 'Danger ahead!',
      position, threatLevel, urgency: threatLevel,
    }, 0.9);
  }

  sendHelpRequest(from: string, position: { x: number; y: number }, reason: string): void {
    this.createMessage(from, 'broadcast', 'request_help', {
      text: `Need help: ${reason}`,
      position, urgency: 0.8,
    }, 0.8);
  }

  sendHelpOffer(from: string, to: string, position: { x: number; y: number }): void {
    this.createMessage(from, to, 'offer_help', {
      text: 'Coming to help',
      position,
    }, 0.6);
  }

  sendStatusUpdate(from: string, energy: number, state: string): void {
    this.createMessage(from, 'broadcast', 'status_update', {
      text: `Energy: ${Math.round(energy)}%, State: ${state}`,
    }, 0.3);
  }

  sendCoordination(from: string, targetPosition: { x: number; y: number }, action: string): void {
    this.createMessage(from, 'broadcast', 'coordination', {
      text: `Let's ${action} at target`,
      position: targetPosition,
    }, 0.7);
  }

  processMessages(agents: { id: string; position: { x: number; y: number }; perceptionRadius: number }[]): {
    received: Map<string, StructuredMessage[]>;
    expired: number;
  } {
    const received = new Map<string, StructuredMessage[]>();
    let expired = 0;

    for (const agent of agents) received.set(agent.id, []);

    const remaining: StructuredMessage[] = [];
    for (const message of this.messageQueue) {
      message.ttl--;

      if (message.ttl <= 0) {
        expired++;
        continue;
      }

      if (message.to === 'broadcast') {
        for (const agent of agents) {
          if (agent.id === message.from) continue;
          const msgPos = message.content.position;
          if (!msgPos) {
            received.get(agent.id)!.push(message);
            continue;
          }
          const d = Math.hypot(agent.position.x - msgPos.x, agent.position.y - msgPos.y);
          if (d < agent.perceptionRadius * 2) received.get(agent.id)!.push(message);
        }
      } else {
        const target = agents.find(a => a.id === message.to);
        if (target) {
          const msgPos = message.content.position;
          if (!msgPos) {
            received.get(target.id)!.push(message);
          } else {
            const d = Math.hypot(target.position.x - msgPos.x, target.position.y - msgPos.y);
            if (d < target.perceptionRadius * 2) received.get(target.id)!.push(message);
          }
        }
      }

      remaining.push(message);
    }

    this.messageQueue = remaining;

    return { received, expired };
  }

  getStats(): {
    queueSize: number;
    historySize: number;
    messagesByType: Record<MessageType, number>;
    recentMessages: StructuredMessage[];
  } {
    const messagesByType: Record<MessageType, number> = {
      discovery: 0, warning: 0, request_help: 0, offer_help: 0, status_update: 0, coordination: 0,
    };

    for (const msg of this.messageHistory) messagesByType[msg.type]++;

    return {
      queueSize: this.messageQueue.length,
      historySize: this.messageHistory.length,
      messagesByType,
      recentMessages: this.messageHistory.slice(-10),
    };
  }

  clearQueue(): void { this.messageQueue = []; }
  getHistory(): StructuredMessage[] { return [...this.messageHistory]; }
}
