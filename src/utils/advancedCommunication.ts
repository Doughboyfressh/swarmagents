import { Vector2D } from '../types/swarm';
import { dist } from './swarmEngine';

export type MessageType = 
  | 'discovery'
  | 'warning'
  | 'request_help'
  | 'offer_help'
  | 'status_update'
  | 'coordination'
  | 'strategic_command'
  | 'consensus_vote';

export interface StructuredMessage {
  id: string;
  from: string;
  to: string | 'broadcast';
  type: MessageType;
  content: MessageContent;
  timestamp: number;
  priority: number; // 0-1, higher = more urgent
  ttl: number;
  hopCount: number;
  signature: string;
  semanticHash?: string;
}

export interface MessageContent {
  text?: string;
  position?: { x: number; y: number };
  resourceType?: string;
  threatLevel?: number;
  urgency?: number;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface AgentTrustProfile {
  agentId: string;
  trustScore: number; // 0-1
  reliabilityHistory: number[];
  messageAccuracy: number;
  responseTime: number;
  specializationBonus: Record<MessageType, number>;
}

export class AdvancedCommunicationProtocol {
  private messageQueue: StructuredMessage[] = [];
  private messageHistory: StructuredMessage[] = [];
  private maxHistory = 500;
  private messageIdCounter = 0;
  
  // Trust system
  private trustProfiles: Map<string, AgentTrustProfile> = new Map();
  private defaultTrust = 0.5;
  private trustDecay = 0.995;
  private minTrustThreshold = 0.2;
  
  // Gossip protocol
  private gossipProbability = 0.3;
  private seenMessages: Set<string> = new Set();
  private maxSeenMessages = 1000;
  
  // Semantic compression
  private messageTemplates: Map<string, string> = new Map();
  private templateIdCounter = 0;

  constructor() {
    this.initializeTrustProfiles();
  }

  private initializeTrustProfiles(): void {
    // Trust profiles are created dynamically as agents communicate
  }

  getOrCreateTrustProfile(agentId: string): AgentTrustProfile {
    if (!this.trustProfiles.has(agentId)) {
      this.trustProfiles.set(agentId, {
        agentId,
        trustScore: this.defaultTrust,
        reliabilityHistory: [],
        messageAccuracy: 0.5,
        responseTime: 1000,
        specializationBonus: {
          discovery: 0,
          warning: 0,
          request_help: 0,
          offer_help: 0,
          status_update: 0,
          coordination: 0,
          strategic_command: 0,
          consensus_vote: 0,
        },
      });
    }
    return this.trustProfiles.get(agentId)!;
  }

  updateTrust(
    agentId: string,
    messageType: MessageType,
    wasAccurate: boolean,
    responseTimeMs: number
  ): void {
    const profile = this.getOrCreateTrustProfile(agentId);
    
    // Update accuracy
    const accuracyDelta = wasAccurate ? 0.05 : -0.03;
    profile.messageAccuracy = Math.max(0, Math.min(1, profile.messageAccuracy + accuracyDelta));
    
    // Update response time (exponential moving average)
    profile.responseTime = profile.responseTime * 0.9 + responseTimeMs * 0.1;
    
    // Update specialization bonus
    const specDelta = wasAccurate ? 0.02 : -0.01;
    profile.specializationBonus[messageType] = Math.max(-0.5, Math.min(0.5, 
      profile.specializationBonus[messageType] + specDelta
    ));
    
    // Recalculate overall trust
    const avgSpecBonus = Object.values(profile.specializationBonus).reduce((a, b) => a + b, 0) / 7;
    profile.trustScore = (
      profile.messageAccuracy * 0.4 +
      (1 - Math.min(profile.responseTime / 5000, 1)) * 0.3 +
      (0.5 + avgSpecBonus) * 0.3
    );
    
    // Apply decay to history
    profile.reliabilityHistory.push(wasAccurate ? 1 : 0);
    if (profile.reliabilityHistory.length > 50) {
      profile.reliabilityHistory.shift();
    }
  }

  /**
   * Create message with priority calculation and semantic compression
   */
  createMessage(
    from: string,
    to: string | 'broadcast',
    type: MessageType,
    content: MessageContent,
    basePriority: number = 0.5
  ): StructuredMessage {
    const profile = this.getOrCreateTrustProfile(from);
    
    // Adjust priority based on sender trust
    const trustAdjustedPriority = basePriority * (0.7 + profile.trustScore * 0.3);
    
    // Compress message if it matches a template
    const compressed = this.compressMessage(content);
    
    const message: StructuredMessage = {
      id: `msg-${this.messageIdCounter++}`,
      from, 
      to, 
      type, 
      content: compressed.content,
      timestamp: Date.now(),
      priority: Math.min(1, trustAdjustedPriority),
      ttl: this.calculateTTL(type, basePriority),
      hopCount: 0,
      signature: this.generateSignature(from, type, content),
      semanticHash: compressed.hash,
    };

    this.messageQueue.push(message);
    this.addToHistory(message);

    return message;
  }

  private calculateTTL(type: MessageType, priority: number): number {
    const baseTTLs: Record<MessageType, number> = {
      warning: 30,
      strategic_command: 25,
      request_help: 40,
      offer_help: 30,
      discovery: 50,
      coordination: 45,
      consensus_vote: 60,
      status_update: 20,
    };
    
    const base = baseTTLs[type] || 30;
    return Math.floor(base * (0.5 + priority));
  }

  private compressMessage(content: MessageContent): { content: MessageContent; hash?: string } {
    // Simple template-based compression
    const templateKey = JSON.stringify(Object.keys(content).sort());
    
    if (!this.messageTemplates.has(templateKey)) {
      this.messageTemplates.set(templateKey, `tpl-${this.templateIdCounter++}`);
      
      // Limit template cache size
      if (this.messageTemplates.size > 100) {
        const firstKey = this.messageTemplates.keys().next().value;
        if (firstKey) {
          this.messageTemplates.delete(firstKey);
        }
      }
    }
    
    const hash = this.messageTemplates.get(templateKey);
    return { content, hash };
  }

  private generateSignature(from: string, type: MessageType, content: MessageContent): string {
    // Simple signature for message authenticity
    const data = `${from}-${type}-${Date.now()}-${JSON.stringify(content)}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `sig-${Math.abs(hash).toString(16)}`;
  }

  /**
   * Send high-priority warning message
   */
  sendWarning(from: string, position: { x: number; y: number }, threatLevel: number): void {
    const priority = 0.8 + threatLevel * 0.2;
    this.createMessage(from, 'broadcast', 'warning', {
      text: 'Critical danger detected!',
      position, 
      threatLevel, 
      urgency: threatLevel,
      confidence: 0.9,
    }, priority);
  }

  /**
   * Send strategic command from leader
   */
  sendStrategicCommand(
    from: string, 
    targetPosition: { x: number; y: number }, 
    action: string,
    priority: number = 0.9
  ): void {
    this.createMessage(from, 'broadcast', 'strategic_command', {
      text: `Strategic order: ${action}`,
      position: targetPosition,
      metadata: { action, commander: from },
      confidence: 0.95,
    }, priority);
  }

  /**
   * Initiate consensus voting
   */
  initiateConsensusVote(
    from: string,
    proposal: string,
    options: string[],
    deadline: number
  ): void {
    this.createMessage(from, 'broadcast', 'consensus_vote', {
      text: `Vote on: ${proposal}`,
      metadata: { proposal, options, deadline },
      urgency: 0.7,
    }, 0.75);
  }

  /**
   * Process messages with trust-based filtering and gossip propagation
   */
  processMessages(
    agents: Array<{ 
      id: string; 
      position: { x: number; y: number }; 
      perceptionRadius: number;
      role?: string;
    }>
  ): {
    received: Map<string, StructuredMessage[]>;
    expired: number;
    propagated: number;
    filtered: number;
  } {
    const received = new Map<string, StructuredMessage[]>();
    let expired = 0;
    let propagated = 0;
    let filtered = 0;

    for (const agent of agents) {
      received.set(agent.id, []);
    }

    const remaining: StructuredMessage[] = [];
    
    for (const message of this.messageQueue) {
      message.ttl--;
      message.hopCount++;

      // Check expiration
      if (message.ttl <= 0) {
        expired++;
        continue;
      }

      // Check if already seen (gossip loop prevention)
      if (this.seenMessages.has(message.id)) {
        continue;
      }
      this.addToSeen(message.id);

      // Trust-based filtering
      const senderProfile = this.trustProfiles.get(message.from);
      if (senderProfile && senderProfile.trustScore < this.minTrustThreshold) {
        filtered++;
        continue;
      }

      // Deliver messages
      if (message.to === 'broadcast') {
        for (const agent of agents) {
          if (agent.id === message.from) continue;
          
          const msgPos = message.content.position;
          const distance = msgPos 
            ? Math.hypot(agent.position.x - msgPos.x, agent.position.y - msgPos.y)
            : 0;
          
          // Priority affects reception range
          const effectiveRange = agent.perceptionRadius * (1.5 + message.priority);
          
          if (!msgPos || distance < effectiveRange) {
            received.get(agent.id)!.push(message);
          }
        }

        // Gossip propagation
        if (Math.random() < this.gossipProbability && message.hopCount < 5) {
          propagated++;
          const newMessage = { ...message, hopCount: message.hopCount + 1 };
          remaining.push(newMessage);
        }
      } else {
        const target = agents.find(a => a.id === message.to);
        if (target) {
          received.get(target.id)!.push(message);
        }
      }

      remaining.push(message);
    }

    this.messageQueue = remaining;

    // Decay trust scores periodically
    this.decayTrustScores();

    return { received, expired, propagated, filtered };
  }

  private addToSeen(messageId: string): void {
    this.seenMessages.add(messageId);
    if (this.seenMessages.size > this.maxSeenMessages) {
      const first = this.seenMessages.values().next().value;
      if (first) {
        this.seenMessages.delete(first);
      }
    }
  }

  private addToHistory(message: StructuredMessage): void {
    this.messageHistory.push(message);
    if (this.messageHistory.length > this.maxHistory) {
      this.messageHistory.shift();
    }
  }

  private decayTrustScores(): void {
    for (const profile of this.trustProfiles.values()) {
      profile.trustScore *= this.trustDecay;
      profile.trustScore = Math.max(this.minTrustThreshold, profile.trustScore);
    }
  }

  /**
   * Get communication statistics
   */
  getStats(): {
    queueSize: number;
    historySize: number;
    messagesByType: Record<MessageType, number>;
    avgTrustScore: number;
    trustDistribution: { high: number; medium: number; low: number };
    recentMessages: StructuredMessage[];
    propagationRate: number;
  } {
    const messagesByType: Record<MessageType, number> = {
      discovery: 0, 
      warning: 0, 
      request_help: 0, 
      offer_help: 0, 
      status_update: 0, 
      coordination: 0,
      strategic_command: 0,
      consensus_vote: 0,
    };

    for (const msg of this.messageHistory) {
      messagesByType[msg.type]++;
    }

    const trustScores = Array.from(this.trustProfiles.values()).map(p => p.trustScore);
    const avgTrust = trustScores.length > 0 
      ? trustScores.reduce((a, b) => a + b, 0) / trustScores.length 
      : 0.5;

    const highTrust = trustScores.filter(t => t > 0.7).length;
    const mediumTrust = trustScores.filter(t => t >= 0.4 && t <= 0.7).length;
    const lowTrust = trustScores.filter(t => t < 0.4).length;

    return {
      queueSize: this.messageQueue.length,
      historySize: this.messageHistory.length,
      messagesByType,
      avgTrustScore: avgTrust,
      trustDistribution: { high: highTrust, medium: mediumTrust, low: lowTrust },
      recentMessages: this.messageHistory.slice(-15),
      propagationRate: this.gossipProbability,
    };
  }

  /**
   * Adjust gossip probability dynamically
   */
  setGossipProbability(prob: number): void {
    this.gossipProbability = Math.max(0.1, Math.min(0.8, prob));
  }

  /**
   * Clear all queues and reset state
   */
  clear(): void {
    this.messageQueue = [];
    this.messageHistory = [];
    this.seenMessages.clear();
  }

  getHistory(): StructuredMessage[] {
    return [...this.messageHistory];
  }

  getTrustProfile(agentId: string): AgentTrustProfile | null {
    return this.trustProfiles.get(agentId) || null;
  }
}
