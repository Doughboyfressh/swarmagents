import { SwarmConfig } from '../types/swarm';

export interface SwarmAction {
  type: string;
  param?: string;
  value?: number;
  behavior?: string;
  feature?: string;
  enabled?: boolean;
}

export interface ActionResult {
  action: SwarmAction;
  success: boolean;
  message: string;
}

export interface DirectorContext {
  agentCount: number;
  behavior: string;
  avgEnergy: number;
  swarmCoherence: number;
  resourcesFound: number;
  totalResources: number;
  activeConnections: number;
  subSwarmCount: number;
  generation: number;
  recentEvents: string[];
  params: Record<string, number>;
  features: Record<string, boolean>;
  availableActions: string[];
  previousActions: ActionResult[];
  goal?: string;
}

export function buildDirectorPrompt(context: DirectorContext): string {
  return `You are the autonomous director of an agent swarm simulation. Your goal is to optimize swarm performance by adjusting parameters and behaviors.

Current State:
- Agents: ${context.agentCount}
- Behavior: ${context.behavior}
- Average Energy: ${context.avgEnergy.toFixed(1)}%
- Swarm Coherence: ${(context.swarmCoherence * 100).toFixed(1)}%
- Resources Found: ${context.resourcesFound}/${context.totalResources}
- Active Connections: ${context.activeConnections}
- Sub-swarms: ${context.subSwarmCount}
- Generation: ${context.generation}

Current Parameters:
${Object.entries(context.params).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

Active Features:
${Object.entries(context.features).filter(([, v]) => v).map(([k]) => `- ${k}`).join('\n') || 'None'}

Recent Events:
${context.recentEvents.slice(-5).join('\n') || 'None'}

Previous Actions:
${context.previousActions.slice(-3).map(a => `- ${a.action.type}: ${a.success ? '✓' : '✗'} ${a.message}`).join('\n') || 'None'}

${context.goal ? `Current Goal: ${context.goal}` : ''}

Available Actions:
${context.availableActions.join('\n')}

Respond with a JSON object containing:
1. "thought": Your reasoning about what to do next
2. "actions": Array of actions to execute
3. "nextCheckIn": Seconds until next decision (5-30)
4. "confidence": Your confidence in this plan (0-1)

Example response:
\`\`\`json
{
  "thought": "The swarm coherence is low at 45%. I should increase cohesion to bring agents together.",
  "actions": [
    {"type": "adjust_param", "param": "cohesionWeight", "value": 2.5}
  ],
  "nextCheckIn": 10,
  "confidence": 0.8
}
\`\`\`

Respond ONLY with JSON, no other text.`;
}

export function parseActionPlan(response: string): any {
  try {
    // Extract JSON from response
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                     response.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) return null;
    
    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const parsed = JSON.parse(jsonStr);
    
    // Validate structure
    if (!parsed.thought || !parsed.actions || !Array.isArray(parsed.actions)) {
      return null;
    }
    
    return {
      thought: parsed.thought,
      actions: parsed.actions,
      nextCheckIn: Math.max(5, Math.min(30, parsed.nextCheckIn || 10)),
      confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
    };
  } catch (error) {
    console.error('Failed to parse action plan:', error);
    return null;
  }
}
