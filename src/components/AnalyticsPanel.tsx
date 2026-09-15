import React from 'react';
import { AnalyticsEngine } from '../utils/analyticsEngine';

interface AnalyticsPanelProps {
  analytics: ReturnType<AnalyticsEngine['getAnalytics']>;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ analytics }) => {
  const { patterns, insights, summary } = analytics;

  const getTrendIcon = (trend: 'increasing' | 'decreasing' | 'stable') => {
    if (trend === 'increasing') return '↑';
    if (trend === 'decreasing') return '↓';
    return '→';
  };

  const getTrendColor = (trend: 'increasing' | 'decreasing' | 'stable') => {
    if (trend === 'increasing') return 'text-green-400';
    if (trend === 'decreasing') return 'text-red-400';
    return 'text-gray-400';
  };

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    if (priority === 'high') return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (priority === 'medium') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  };

  const getPatternTypeColor = (type: string) => {
    if (type === 'behavior') return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    if (type === 'efficiency') return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (type === 'anomaly') return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (type === 'optimization') return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  return (
    <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-xl p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-1.5">
          📊 Analytics
        </h3>
        <div className="text-[9px] text-gray-500">
          {analytics.snapshots.length} snapshots
        </div>
      </div>

      {/* Trend Summary */}
      <div className="bg-gray-800/30 border border-gray-700/30 rounded-lg p-2 space-y-1.5">
        <div className="text-[9px] text-gray-500 uppercase font-semibold">Trend Overview</div>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Coherence:</span>
            <span className={`font-mono ${getTrendColor(summary.trendSummary.increasing > 0 ? 'increasing' : summary.trendSummary.decreasing > 0 ? 'decreasing' : 'stable')}`}>
              {getTrendIcon(summary.trendSummary.increasing > 0 ? 'increasing' : summary.trendSummary.decreasing > 0 ? 'decreasing' : 'stable')}
              {(summary.avgCoherence * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Speed:</span>
            <span className={`font-mono ${getTrendColor(summary.trendSummary.increasing > 0 ? 'increasing' : summary.trendSummary.decreasing > 0 ? 'decreasing' : 'stable')}`}>
              {getTrendIcon(summary.trendSummary.increasing > 0 ? 'increasing' : summary.trendSummary.decreasing > 0 ? 'decreasing' : 'stable')}
              {summary.avgSpeed.toFixed(1)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Energy:</span>
            <span className={`font-mono ${getTrendColor(summary.trendSummary.increasing > 0 ? 'increasing' : summary.trendSummary.decreasing > 0 ? 'decreasing' : 'stable')}`}>
              {getTrendIcon(summary.trendSummary.increasing > 0 ? 'increasing' : summary.trendSummary.decreasing > 0 ? 'decreasing' : 'stable')}
              {summary.avgEnergy.toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Links:</span>
            <span className={`font-mono ${getTrendColor(summary.trendSummary.increasing > 0 ? 'increasing' : summary.trendSummary.decreasing > 0 ? 'decreasing' : 'stable')}`}>
              {getTrendIcon(summary.trendSummary.increasing > 0 ? 'increasing' : summary.trendSummary.decreasing > 0 ? 'decreasing' : 'stable')}
              {summary.avgConnections.toFixed(0)}
            </span>
          </div>
        </div>
      </div>

      {/* Detected Patterns */}
      {patterns.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[9px] text-gray-500 uppercase font-semibold">
            Patterns ({patterns.length})
          </div>
          <div className="space-y-1 max-h-[150px] overflow-y-auto custom-scrollbar">
            {patterns.slice().reverse().map((pattern) => (
              <div
                key={pattern.id}
                className={`border rounded-lg p-1.5 ${getPatternTypeColor(pattern.type)}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold">{pattern.name}</div>
                    <div className="text-[9px] opacity-80">{pattern.description}</div>
                    <div className="text-[8px] opacity-60 mt-0.5">
                      Confidence: {(pattern.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-gray-800/50 border border-gray-700/30 capitalize">
                    {pattern.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights & Recommendations */}
      {insights.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[9px] text-gray-500 uppercase font-semibold">
            Insights ({insights.length})
          </div>
          <div className="space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar">
            {insights.slice().reverse().map((insight) => (
              <div
                key={insight.id}
                className={`border rounded-lg p-1.5 ${getPriorityColor(insight.priority)}`}
              >
                <div className="text-[10px] font-semibold mb-0.5">{insight.title}</div>
                <div className="text-[9px] opacity-80 mb-1">{insight.description}</div>
                <div className="text-[9px] font-semibold">
                  💡 {insight.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {patterns.length === 0 && insights.length === 0 && (
        <div className="text-[10px] text-gray-600 text-center py-4">
          Collecting data... Patterns will appear as the swarm evolves
        </div>
      )}
    </div>
  );
};
