import { useState, useEffect, useRef } from 'react';
import { LLMService } from '../utils/llmService';
import { SwarmMetrics, SwarmConfig } from '../types/swarm';
import { buildDirectorPrompt, parseActionPlan, SwarmAction, ActionResult } from '../utils/llmActionExecutor';

interface DirectorPanelProps {
  llmService: LLMService;
  getContext: () => SwarmMetrics;
  onExecuteAction: (action: SwarmAction) => Promise<ActionResult>;
  currentParams: Record<string, number>;
  currentFeatures: Record<string, boolean>;
}

export default function DirectorPanel({ 
  llmService, 
  getContext, 
  onExecuteAction,
  currentParams,
  currentFeatures 
}: DirectorPanelProps) {
  const [isDirecting, setIsDirecting] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [actionLog, setActionLog] = useState<ActionResult[]>([]);
  const [goal, setGoal] = useState('');
  const [nextCheckIn, setNextCheckIn] = useState(10);
  const [countdown, setCountdown] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isDirecting) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }

    const runDirectorCycle = async () => {
      const context = getContext();
      
      const prompt = buildDirectorPrompt({
        agentCount: 0, // Will be filled from context
        behavior: 'flocking',
        avgEnergy: context.avgEnergy,
        swarmCoherence: context.swarmCoherence,
        resourcesFound: context.resourcesFound,
        totalResources: 10,
        activeConnections: context.activeConnections,
        subSwarmCount: context.subSwarmCount,
        generation: context.generation,
        recentEvents: [],
        params: currentParams,
        features: currentFeatures,
        availableActions: [
          'set_behavior(behavior)',
          'adjust_param(param, value)',
          'pause()',
          'resume()',
          'toggle_feature(feature, enabled)',
        ],
        previousActions: actionLog.slice(-5),
        goal: goal || undefined,
      });

      const response = await llmService.chat(prompt);
      
      if (!response.success) {
        console.error('Director failed:', response.content);
        return;
      }

      const plan = parseActionPlan(response.content);
      if (!plan) {
        console.error('Failed to parse action plan');
        return;
      }

      setCurrentPlan(plan);
      setNextCheckIn(plan.nextCheckIn);
      setCountdown(plan.nextCheckIn);

      for (const action of plan.actions) {
        const result = await onExecuteAction(action);
        setActionLog(prev => [...prev, result]);
        
        if (actionLog.length > 50) {
          setActionLog(prev => prev.slice(-50));
        }
      }
    };

    runDirectorCycle();

    intervalRef.current = window.setInterval(() => {
      runDirectorCycle();
    }, nextCheckIn * 1000);

    countdownRef.current = window.setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isDirecting, nextCheckIn]);

  const handleToggleDirecting = () => {
    setIsDirecting(!isDirecting);
    if (!isDirecting) {
      setActionLog([]);
      setCurrentPlan(null);
    }
  };

  const handleSetGoal = (newGoal: string) => {
    setGoal(newGoal);
  };

  return (
    <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isDirecting ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`}></div>
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
            🧠 Qwen Director
          </h3>
        </div>
        <button
          onClick={handleToggleDirecting}
          className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
            isDirecting
              ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
              : 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
          }`}
        >
          {isDirecting ? '⏸ Stop' : '▶ Start'}
        </button>
      </div>

      <div className="space-y-1">
        <label className="text-[9px] text-gray-500 uppercase">Director Goal</label>
        <input
          type="text"
          value={goal}
          onChange={(e) => handleSetGoal(e.target.value)}
          placeholder="e.g., Maximize resource collection"
          disabled={isDirecting}
          className="w-full px-2 py-1 rounded text-[10px] bg-gray-800 border border-gray-700 text-gray-300 placeholder-gray-600 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
        />
      </div>

      {isDirecting && (
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-2 space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-cyan-400">Next decision in:</span>
            <span className="text-cyan-300 font-mono">{countdown}s</span>
          </div>
          {currentPlan && (
            <div className="text-[9px] text-cyan-200/70 italic">
              "{currentPlan.thought}"
            </div>
          )}
        </div>
      )}

      <div className="space-y-1">
        <div className="text-[9px] text-gray-500 uppercase">Action Log</div>
        <div className="max-h-[200px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          {actionLog.length === 0 ? (
            <div className="text-[10px] text-gray-600 text-center py-4">
              {isDirecting ? 'Waiting for Qwen to make decisions...' : 'Start directing to see actions'}
            </div>
          ) : (
            actionLog.slice().reverse().map((result, idx) => (
              <div
                key={idx}
                className={`rounded p-1.5 text-[9px] border ${
                  result.success
                    ? 'bg-green-500/10 border-green-500/30 text-green-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}
              >
                <div className="flex items-start gap-1">
                  <span>{result.success ? '✓' : '✗'}</span>
                  <div className="flex-1">
                    <div className="font-semibold">{result.action.type}</div>
                    <div className="text-[8px] opacity-70">{result.message}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="text-[8px] text-gray-600 text-center pt-1 border-t border-gray-800">
        Qwen autonomously controls the swarm every {nextCheckIn}s
      </div>
    </div>
  );
}
