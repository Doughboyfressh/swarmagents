import axios from 'axios';
import { LLMConfig, LLMMessage, LLMResponse } from '../types';
import { getDatabase } from '../database';

export class LLMService {
  private config: LLMConfig;
  private conversationHistory: LLMMessage[] = [];
  private isConnected: boolean = false;

  constructor(config?: Partial<LLMConfig>) {
    this.config = {
      endpoint: process.env.LLM_ENDPOINT || 'http://localhost:8080',
      model: process.env.LLM_MODEL || 'qwen-3.6-27b',
      temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
      maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '512'),
      enabled: process.env.LLM_ENABLED !== 'false',
      ...config,
    };

    this.initializeSystemPrompt();
  }

  private initializeSystemPrompt(): void {
    this.conversationHistory = [{
      role: 'system',
      content: `You are the central intelligence coordinator for an advanced agent swarm simulation. You control autonomous agents that exhibit emergent collective behavior.

Your responsibilities:
1. Analyze swarm state and provide strategic guidance
2. Make autonomous decisions to optimize swarm performance
3. Identify patterns, anomalies, and opportunities
4. Coordinate agent behaviors for collective goals
5. Adapt strategies based on environmental conditions

Current capabilities:
- Flocking behaviors (separation, alignment, cohesion)
- Neural network-controlled agents with evolution
- Pheromone-based stigmergic communication
- Memory systems and knowledge sharing
- Task allocation via market auctions
- Construction and collaborative building
- Threat detection and collective defense
- Q-learning for adaptive behavior
- Multi-swarm dynamics

Be concise, strategic, and decisive. Provide actionable commands when appropriate.`,
    }];
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.config.endpoint}/v1/models`, {
        timeout: 5000,
      });
      this.isConnected = response.status === 200;
      return this.isConnected;
    } catch (error) {
      this.isConnected = false;
      console.error('❌ LLM connection failed:', error);
      return false;
    }
  }

  async chat(userMessage: string, context?: any): Promise<LLMResponse> {
    if (!this.config.enabled) {
      return {
        content: 'LLM is disabled',
        tokensUsed: 0,
        latency: 0,
        success: false,
      };
    }

    const startTime = Date.now();

    try {
      // Build message with context
      let fullMessage = userMessage;
      if (context) {
        fullMessage = `[Swarm State: ${context.agentCount} agents, ${context.behavior} mode, ${(context.swarmCoherence * 100).toFixed(0)}% coherence, ${context.resourcesFound} resources found, ${context.activeConnections} connections]\n\n${userMessage}`;
      }

      this.conversationHistory.push({
        role: 'user',
        content: fullMessage,
      });

      // Keep conversation history manageable
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = [
          this.conversationHistory[0], // Keep system prompt
          ...this.conversationHistory.slice(-19),
        ];
      }

      const response = await axios.post(
        `${this.config.endpoint}/v1/chat/completions`,
        {
          model: this.config.model,
          messages: this.conversationHistory,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
          stream: false,
        },
        {
          timeout: 60000, // 60 second timeout for large models
        }
      );

      const assistantMessage = response.data.choices[0]?.message?.content || 'No response';
      const tokensUsed = response.data.usage?.total_tokens || 0;
      const latency = Date.now() - startTime;

      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage,
      });

      this.isConnected = true;

      // Save to database
      this.saveConversation('user', fullMessage, 0, 0);
      this.saveConversation('assistant', assistantMessage, tokensUsed, latency);

      return {
        content: assistantMessage,
        tokensUsed,
        latency,
        success: true,
      };
    } catch (error) {
      this.isConnected = false;
      const latency = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error('❌ LLM chat failed:', errorMessage);

      return {
        content: `Error: ${errorMessage}`,
        tokensUsed: 0,
        latency,
        success: false,
      };
    }
  }

  async getStrategicRecommendation(context: any): Promise<LLMResponse> {
    const prompt = `Analyze the current swarm state and provide ONE specific, actionable recommendation to improve performance. Focus on parameter adjustments or behavior changes.

Current state:
- ${context.agentCount} agents in ${context.behavior} mode
- Average energy: ${context.avgEnergy.toFixed(0)}%
- Swarm coherence: ${(context.swarmCoherence * 100).toFixed(0)}%
- Resources found: ${context.resourcesFound}
- Active connections: ${context.activeConnections}
- Sub-swarms: ${context.subSwarmCount}
- Generation: ${context.generation}

Provide your recommendation in this format:
RECOMMENDATION: [one-line recommendation]
REASONING: [brief explanation]
PARAMETERS: [specific parameter changes if applicable]`;

    return this.chat(prompt, context);
  }

  private saveConversation(role: string, content: string, tokensUsed: number, latency: number): void {
    try {
      const db = getDatabase();
      db.prepare(`
        INSERT INTO llm_conversations (timestamp, role, content, tokens_used, latency)
        VALUES (?, ?, ?, ?, ?)
      `).run(Date.now(), role, content, tokensUsed, latency);
    } catch (error) {
      console.error('❌ Failed to save conversation:', error);
    }
  }

  getConfig(): LLMConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getConversationHistory(): LLMMessage[] {
    return [...this.conversationHistory];
  }

  clearHistory(): void {
    this.initializeSystemPrompt();
  }

  getStats(): { totalCalls: number; totalTokens: number; avgLatency: number } {
    try {
      const db = getDatabase();
      const stats = db.prepare(`
        SELECT 
          COUNT(*) as totalCalls,
          SUM(tokens_used) as totalTokens,
          AVG(latency) as avgLatency
        FROM llm_conversations
        WHERE role = 'assistant'
      `).get() as any;

      return {
        totalCalls: stats.totalCalls || 0,
        totalTokens: stats.totalTokens || 0,
        avgLatency: stats.avgLatency || 0,
      };
    } catch (error) {
      return { totalCalls: 0, totalTokens: 0, avgLatency: 0 };
    }
  }
}

// Singleton instance
let llmServiceInstance: LLMService | null = null;

export function getLLMService(): LLMService {
  if (!llmServiceInstance) {
    llmServiceInstance = new LLMService();
  }
  return llmServiceInstance;
}
