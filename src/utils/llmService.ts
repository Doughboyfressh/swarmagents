import { SwarmMetrics } from '../types/swarm';

export interface LLMConfig {
  endpoint: string;
  model: string;
  temperature: number;
  maxTokens: number;
  enabled: boolean;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class LLMService {
  private config: LLMConfig;
  private history: ChatMessage[] = [];
  private isProcessing = false;
  private lastCallTime = 0;
  private totalTokens = 0;
  private totalCalls = 0;
  private failedCalls = 0;
  private isConnected = false;

  constructor(config: Partial<LLMConfig> = {}) {
    this.config = { endpoint: 'http://localhost:8080', model: 'qwen-3.6-27b', temperature: 0.7, maxTokens: 512, enabled: true, ...config };
    this.initSystemPrompt();
  }

  private initSystemPrompt(): void {
    this.history = [{
      role: 'system',
      content: `You are the central intelligence coordinator for an advanced agent swarm simulation. You control autonomous agents that exhibit emergent collective behavior.

Your responsibilities:
1. Analyze swarm state and provide strategic guidance
2. Suggest parameter adjustments to improve performance
3. Identify patterns or anomalies
4. Answer questions about swarm behavior

Current capabilities:
- Flocking behaviors (separation, alignment, cohesion)
- Neural network-controlled agents with evolution
- Pheromone-based stigmergic communication
- Memory systems and knowledge sharing
- Task allocation via market auctions
- Construction and collaborative building
- Threat detection and defense
- Q-learning for adaptive behavior
- Multi-swarm dynamics

Be concise, technical, and insightful. Keep responses under 200 words.`,
    }];
  }

  updateConfig(config: Partial<LLMConfig>): void { this.config = { ...this.config, ...config }; }
  getConfig(): LLMConfig { return { ...this.config }; }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.endpoint}/v1/models`, { method: 'GET', signal: AbortSignal.timeout(5000) });
      this.isConnected = response.ok;
      return response.ok;
    } catch { this.isConnected = false; return false; }
  }

  async chat(userMessage: string, context?: SwarmMetrics): Promise<{ content: string; success: boolean; tokens: number; latency: number }> {
    if (!this.config.enabled) return { content: 'LLM disabled', success: false, tokens: 0, latency: 0 };
    if (this.isProcessing) return { content: 'Processing...', success: false, tokens: 0, latency: 0 };
    if (Date.now() - this.lastCallTime < 2000) return { content: 'Rate limited', success: false, tokens: 0, latency: 0 };

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      let fullMessage = userMessage;
      if (context) {
        fullMessage = `[Swarm: ${context.resourcesFound} resources, ${(context.swarmCoherence * 100).toFixed(0)}% coherence, ${context.activeConnections} connections]\n\n${userMessage}`;
      }

      this.history.push({ role: 'user', content: fullMessage });
      if (this.history.length > 20) this.history = [this.history[0], ...this.history.slice(-19)];

      const response = await fetch(`${this.config.endpoint}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.config.model, messages: this.history, temperature: this.config.temperature, max_tokens: this.config.maxTokens, stream: false }),
        signal: AbortSignal.timeout(60000),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const assistantMessage = data.choices[0]?.message?.content || 'No response';
      const tokens = data.usage?.total_tokens || 0;

      this.history.push({ role: 'assistant', content: assistantMessage });
      this.lastCallTime = Date.now();
      this.totalTokens += tokens;
      this.totalCalls++;
      this.isConnected = true;

      return { content: assistantMessage, success: true, tokens, latency: Date.now() - startTime };
    } catch (error) {
      this.failedCalls++;
      this.isConnected = false;
      return { content: `Error: ${error instanceof Error ? error.message : 'Unknown'}`, success: false, tokens: 0, latency: Date.now() - startTime };
    } finally {
      this.isProcessing = false;
    }
  }

  getStats(): { totalCalls: number; failedCalls: number; totalTokens: number; isConnected: boolean } {
    return { totalCalls: this.totalCalls, failedCalls: this.failedCalls, totalTokens: this.totalTokens, isConnected: this.isConnected };
  }

  clearHistory(): void { this.initSystemPrompt(); }
  getHistory(): ChatMessage[] { return [...this.history]; }
}
