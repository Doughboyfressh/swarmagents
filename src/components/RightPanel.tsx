import { useState } from 'react';
import DirectorPanel from './DirectorPanel';
import LLMPanel from './LLMPanel';
import { StateManagerPanel } from './StateManagerPanel';
import { AnalyticsPanel } from './AnalyticsPanel';
import { SwarmConfig, SwarmMetrics } from '../types/swarm';
import { LLMService } from '../utils/llmService';
import { StateManager } from '../utils/stateManager';
import { AnalyticsEngine } from '../utils/analyticsEngine';
import { SwarmAction, ActionResult } from '../utils/llmActionExecutor';

interface RightPanelProps {
  config: SwarmConfig;
  setConfig: (config: SwarmConfig) => void;
  metrics: SwarmMetrics;
  llmService: LLMService;
  stateManager: StateManager;
  analyticsEngine: AnalyticsEngine;
  onExecuteAction: (action: SwarmAction) => Promise<ActionResult>;
  worldState: any;
  hiveStats: any;
  structures: any[];
  threats: any[];
  events: any[];
  isPaused: boolean;
  setIsPaused: (paused: boolean) => void;
}

type TabId = 'ai' | 'analytics' | 'system' | 'logs';

export default function RightPanel({
  config,
  setConfig,
  metrics,
  llmService,
  stateManager,
  analyticsEngine,
  onExecuteAction,
  worldState,
  hiveStats,
  structures,
  threats,
  events,
  isPaused,
  setIsPaused,
}: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('ai');

  const tabs = [
    { id: 'ai' as TabId, label: 'AI Controls', icon: '🤖' },
    { id: 'analytics' as TabId, label: 'Analytics', icon: '📊' },
    { id: 'system' as TabId, label: 'System', icon: '⚙️' },
    { id: 'logs' as TabId, label: 'Logs', icon: '📝' },
  ];

  return (
    <div className="order-3 flex flex-col h-[calc(100vh-100px)]">
      {/* Tab Navigation */}
      <div className="flex gap-1 mb-3 bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-xl p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : 'bg-gray-800/50 text-gray-400 border border-gray-700/30 hover:bg-gray-800 hover:text-gray-300'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
        {activeTab === 'ai' && (
          <>
            <DirectorPanel
              llmService={llmService}
              getContext={() => metrics}
              onExecuteAction={onExecuteAction}
              currentParams={{
                separationWeight: config.separationWeight,
                alignmentWeight: config.alignmentWeight,
                cohesionWeight: config.cohesionWeight,
                explorationWeight: config.explorationWeight,
                perceptionRadius: config.perceptionRadius,
                maxSpeed: config.maxSpeed,
              }}
              currentFeatures={{
                pheromoneEnabled: config.pheromoneEnabled,
                neuralNetEnabled: config.neuralNetEnabled,
                evolutionEnabled: config.evolutionEnabled,
                memoryEnabled: config.memoryEnabled,
                environmentEnabled: config.environmentEnabled,
              }}
            />
            <LLMPanel
              llmService={llmService}
              getContext={() => metrics}
            />
          </>
        )}

        {activeTab === 'analytics' && (
          <>
            <AnalyticsPanel analytics={analyticsEngine.getAnalytics()} />
            <MetricsPanel
              metrics={metrics}
              hiveStats={hiveStats}
              structures={structures}
              threats={threats}
              config={config}
            />
          </>
        )}

        {activeTab === 'system' && (
          <>
            <StateManagerPanel
              stateManager={stateManager}
              currentConfig={config}
              onLoadState={(newConfig) => {
                setConfig(newConfig);
              }}
              currentMetrics={metrics}
            />
            <WorldStatusPanel worldState={worldState} metrics={metrics} />
          </>
        )}

        {activeTab === 'logs' && (
          <EventLogPanel events={events} eventRate={metrics.eventRate} />
        )}
      </div>
    </div>
  );
}

// Metrics Panel Component
function MetricsPanel({ metrics, hiveStats, structures, threats, config }: any) {
  return (
    <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
        <h2 className="text-base font-bold text-gray-300 uppercase">Metrics</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <MetricCard l="Speed" v={metrics.avgSpeed.toFixed(1)} c="cyan" p={metrics.avgSpeed/5} />
        <MetricCard l="Coherence" v={`${(metrics.swarmCoherence*100).toFixed(0)}%`} c="green" p={metrics.swarmCoherence} />
        <MetricCard l="Fitness" v={metrics.avgFitness.toFixed(0)} c="pink" p={metrics.avgFitness/100} />
        <MetricCard l="Links" v={metrics.activeConnections.toString()} c="yellow" p={Math.min(1,metrics.activeConnections/100)} />
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-center">
        <MiniStat l="Msgs" v={metrics.totalMessages} c="text-cyan-400" />
        <MiniStat l="Res" v={metrics.resourcesFound} c="text-yellow-400" />
        <MiniStat l="Energy" v={metrics.avgEnergy.toFixed(0)} c="text-green-400" />
      </div>

      {config.memoryEnabled && (
        <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/30">
          <div className="text-sm text-purple-400 uppercase mb-1 font-semibold">🧠 Hive Mind</div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Known Locations:</span>
            <span className="text-purple-400 font-mono">{hiveStats.knownLocations.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Decisions:</span>
            <span className="text-cyan-400 font-mono">{hiveStats.decisionCount}</span>
          </div>
        </div>
      )}

      {config.constructionEnabled && structures.length > 0 && (
        <div className="bg-orange-500/10 rounded-lg p-3 border border-orange-500/30">
          <div className="text-sm text-orange-400 uppercase mb-1 font-semibold">🏗️ Construction</div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Completed/Total:</span>
            <span className="text-orange-400 font-mono">{structures.filter((s: any) => s.completed).length}/{structures.length}</span>
          </div>
        </div>
      )}

      {threats.length > 0 && (
        <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/30">
          <div className="text-sm text-red-400 uppercase mb-1 font-semibold">⚠️ Threats</div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Active:</span>
            <span className="text-red-400 font-mono">{threats.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// World Status Panel
function WorldStatusPanel({ worldState, metrics }: any) {
  return (
    <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{worldState.timeOfDay === 'dawn' ? '🌅' : worldState.timeOfDay === 'day' ? '☀️' : worldState.timeOfDay === 'dusk' ? '🌆' : '🌙'}</span>
        <h3 className="text-base font-bold text-gray-300 uppercase">World Status</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-gray-500 text-xs uppercase mb-1">Time</div>
          <div className="font-mono font-bold text-yellow-400 text-lg">{metrics.worldTime}</div>
          <div className="text-gray-400 capitalize text-sm">{worldState.timeOfDay}</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-gray-500 text-xs uppercase mb-1">Day</div>
          <div className="font-mono font-bold text-gray-300 text-lg">{worldState.day}</div>
          <div className="text-gray-400 text-sm">
            {worldState.season === 'spring' ? '🌸' : worldState.season === 'summer' ? '☀️' : worldState.season === 'autumn' ? '🍂' : '❄️'} {worldState.season}
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-gray-500 text-xs uppercase mb-1">Weather</div>
          <div className="text-gray-300 text-lg">
            {worldState.weather === 'clear' ? '☀️' : worldState.weather === 'rain' ? '🌧️' : worldState.weather === 'storm' ? '⛈️' : worldState.weather === 'fog' ? '🌫️' : '💨'} {worldState.weather}
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-gray-500 text-xs uppercase mb-1">Temp</div>
          <div className={`font-mono font-bold text-lg ${worldState.temperature < 5 ? 'text-blue-400' : worldState.temperature > 30 ? 'text-red-400' : 'text-green-400'}`}>
            {worldState.temperature.toFixed(0)}°C
          </div>
        </div>
      </div>
    </div>
  );
}

// Event Log Panel
function EventLogPanel({ events, eventRate }: any) {
  return (
    <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
          <h3 className="text-base font-bold text-gray-300 uppercase">Event Log</h3>
        </div>
        <span className="text-sm text-gray-500 font-mono">{eventRate.toFixed(1)} evt/s</span>
      </div>
      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {events.slice(0, 30).map((event: any) => (
          <div key={event.id} className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-sm ${
            event.severity === 'info' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
            event.severity === 'warning' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' :
            event.severity === 'critical' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
            'text-green-400 bg-green-500/10 border-green-500/20'
          }`}>
            <span className="flex-shrink-0 text-lg">
              {event.type === 'discovery' ? '🔍' : event.type === 'scenario' ? '🎬' : event.type === 'threat' ? '⚠️' : event.type === 'construction' ? '🏗️' : '📋'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-medium">{event.description}</div>
              <div className="text-xs opacity-60">{new Date(event.timestamp).toLocaleTimeString()}</div>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <div className="text-sm text-gray-600 text-center py-8">
            Waiting for events...
          </div>
        )}
      </div>
    </div>
  );
}

// Helper Components
function MetricCard({l, v, c, p}: {l: string; v: string; c: string; p: number}) {
  const colors: Record<string, {text: string; bg: string; bar: string}> = {
    cyan: {text: 'text-cyan-400', bg: 'bg-cyan-500/10', bar: 'bg-cyan-500'},
    green: {text: 'text-green-400', bg: 'bg-green-500/10', bar: 'bg-green-500'},
    pink: {text: 'text-pink-400', bg: 'bg-pink-500/10', bar: 'bg-pink-500'},
    yellow: {text: 'text-yellow-400', bg: 'bg-yellow-500/10', bar: 'bg-yellow-500'},
  };
  const color = colors[c] || colors.cyan;
  
  return (
    <div className={`${color.bg} rounded-lg p-3 border border-gray-700/30`}>
      <div className="text-xs text-gray-500 uppercase mb-1">{l}</div>
      <div className={`text-xl font-mono font-bold ${color.text}`}>{v}</div>
      <div className="h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
        <div className={`h-full ${color.bar} rounded-full transition-all`} style={{width: `${Math.min(100, p * 100)}%`}} />
      </div>
    </div>
  );
}

function MiniStat({l, v, c}: {l: string; v: number; c: string}) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-2">
      <div className="text-xs text-gray-500 uppercase mb-1">{l}</div>
      <div className={`text-base font-mono font-bold ${c}`}>{v}</div>
    </div>
  );
}
