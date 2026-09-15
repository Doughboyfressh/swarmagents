import { SwarmMetrics } from '../types/swarm';

export interface AnalyticsSnapshot {
  timestamp: number;
  metrics: SwarmMetrics;
  derived: {
    coherenceTrend: 'increasing' | 'decreasing' | 'stable';
    speedTrend: 'increasing' | 'decreasing' | 'stable';
    connectionTrend: 'increasing' | 'decreasing' | 'stable';
    energyTrend: 'increasing' | 'decreasing' | 'stable';
  };
}

export interface Pattern {
  id: string;
  name: string;
  description: string;
  detectedAt: number;
  confidence: number;
  type: 'behavior' | 'efficiency' | 'anomaly' | 'optimization';
}

export interface AnalyticsInsight {
  id: string;
  title: string;
  description: string;
  recommendation: string;
  priority: 'low' | 'medium' | 'high';
  timestamp: number;
}

export class AnalyticsEngine {
  private snapshots: AnalyticsSnapshot[] = [];
  private patterns: Pattern[] = [];
  private insights: AnalyticsInsight[] = [];
  private readonly MAX_HISTORY = 100;
  private readonly TREND_WINDOW = 10;

  /**
   * Record a metrics snapshot
   */
  recordSnapshot(metrics: SwarmMetrics): void {
    const snapshot: AnalyticsSnapshot = {
      timestamp: Date.now(),
      metrics,
      derived: {
        coherenceTrend: this.calculateTrend('swarmCoherence'),
        speedTrend: this.calculateTrend('avgSpeed'),
        connectionTrend: this.calculateTrend('activeConnections'),
        energyTrend: this.calculateTrend('avgEnergy'),
      },
    };

    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.MAX_HISTORY) {
      this.snapshots.shift();
    }

    // Detect patterns
    this.detectPatterns();
  }

  /**
   * Calculate trend for a metric
   */
  private calculateTrend(metric: keyof SwarmMetrics): 'increasing' | 'decreasing' | 'stable' {
    if (this.snapshots.length < this.TREND_WINDOW) {
      return 'stable';
    }

    const recent = this.snapshots.slice(-this.TREND_WINDOW);
    const values = recent.map(s => s.metrics[metric] as number);
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const changePercent = (avgSecond - avgFirst) / avgFirst * 100;
    
    if (changePercent > 5) return 'increasing';
    if (changePercent < -5) return 'decreasing';
    return 'stable';
  }

  /**
   * Detect patterns in the data
   */
  private detectPatterns(): void {
    if (this.snapshots.length < 10) return;

    const latest = this.snapshots[this.snapshots.length - 1];
    const metrics = latest.metrics;

    // Pattern: High coherence swarm
    if (metrics.swarmCoherence > 0.8 && latest.derived.coherenceTrend === 'stable') {
      this.addPattern({
        id: 'high-coherence',
        name: 'Highly Cohesive Swarm',
        description: 'Swarm maintains high cohesion (>80%) with stable behavior',
        detectedAt: Date.now(),
        confidence: 0.9,
        type: 'behavior',
      });
    }

    // Pattern: Efficient exploration
    if (metrics.coverageArea > 200000 && metrics.resourcesFound > 5) {
      this.addPattern({
        id: 'efficient-exploration',
        name: 'Efficient Exploration',
        description: 'Swarm is efficiently exploring and finding resources',
        detectedAt: Date.now(),
        confidence: 0.8,
        type: 'efficiency',
      });
    }

    // Pattern: Strong connectivity
    if (metrics.activeConnections > 100 && latest.derived.connectionTrend === 'increasing') {
      this.addPattern({
        id: 'strong-connectivity',
        name: 'Strong Network Connectivity',
        description: 'Agents are forming strong communication networks',
        detectedAt: Date.now(),
        confidence: 0.85,
        type: 'behavior',
      });
    }

    // Pattern: Energy crisis
    if (metrics.avgEnergy < 30 && latest.derived.energyTrend === 'decreasing') {
      this.addPattern({
        id: 'energy-crisis',
        name: 'Energy Crisis',
        description: 'Swarm is experiencing energy depletion',
        detectedAt: Date.now(),
        confidence: 0.9,
        type: 'anomaly',
      });
    }

    // Pattern: Optimal speed
    if (metrics.avgSpeed > 2 && metrics.avgSpeed < 4 && latest.derived.speedTrend === 'stable') {
      this.addPattern({
        id: 'optimal-speed',
        name: 'Optimal Movement Speed',
        description: 'Swarm is moving at efficient speed (2-4 units)',
        detectedAt: Date.now(),
        confidence: 0.75,
        type: 'optimization',
      });
    }

    // Generate insights
    this.generateInsights();
  }

  /**
   * Add a pattern (avoid duplicates within 5 seconds)
   */
  private addPattern(pattern: Omit<Pattern, 'detectedAt'> & { detectedAt?: number }): void {
    const existing = this.patterns.find(p => 
      p.id === pattern.id && 
      Date.now() - p.detectedAt < 5000
    );
    
    if (!existing) {
      this.patterns.push({
        ...pattern,
        detectedAt: pattern.detectedAt || Date.now(),
      });
      
      // Keep only last 20 patterns
      if (this.patterns.length > 20) {
        this.patterns.shift();
      }
    }
  }

  /**
   * Generate insights based on current state
   */
  private generateInsights(): void {
    if (this.snapshots.length < 5) return;

    const latest = this.snapshots[this.snapshots.length - 1];
    const metrics = latest.metrics;

    // Insight: Increase cohesion
    if (metrics.swarmCoherence < 0.5 && latest.derived.coherenceTrend === 'stable') {
      this.addInsight({
        id: 'low-coherence',
        title: 'Low Swarm Coherence',
        description: `Swarm coherence is ${(metrics.swarmCoherence * 100).toFixed(0)}%, indicating agents are spread apart`,
        recommendation: 'Try increasing cohesionWeight to 2.0-3.0 to bring agents closer',
        priority: 'medium',
      });
    }

    // Insight: Too many connections
    if (metrics.activeConnections > 150) {
      this.addInsight({
        id: 'over-connected',
        title: 'Over-Connected Swarm',
        description: `${metrics.activeConnections} active connections may be causing communication overhead`,
        recommendation: 'Consider reducing communicationRange or agentCount',
        priority: 'low',
      });
    }

    // Insight: Low resource discovery
    if (metrics.resourcesFound < 3 && this.snapshots.length > 20) {
      this.addInsight({
        id: 'low-discovery',
        title: 'Low Resource Discovery',
        description: `Only ${metrics.resourcesFound} resources found, agents may not be exploring efficiently`,
        recommendation: 'Increase explorationWeight or switch to search_rescue behavior',
        priority: 'high',
      });
    }

    // Insight: High energy efficiency
    if (metrics.avgEnergy > 80 && metrics.resourcesFound > 5) {
      this.addInsight({
        id: 'high-efficiency',
        title: 'High Energy Efficiency',
        description: 'Agents are efficiently managing energy while finding resources',
        recommendation: 'Current configuration is working well - consider saving this state',
        priority: 'low',
      });
    }

    // Insight: Speed optimization
    if (metrics.avgSpeed > 4) {
      this.addInsight({
        id: 'high-speed',
        title: 'High Movement Speed',
        description: `Average speed is ${metrics.avgSpeed.toFixed(1)}, which may cause erratic movement`,
        recommendation: 'Consider reducing maxSpeed to 2-3 for more stable movement',
        priority: 'medium',
      });
    }
  }

  /**
   * Add an insight (avoid duplicates within 10 seconds)
   */
  private addInsight(insight: Omit<AnalyticsInsight, 'timestamp'>): void {
    const existing = this.insights.find(e => 
      e.id === insight.id && 
      Date.now() - e.timestamp < 10000
    );
    
    if (!existing) {
      const newInsight: AnalyticsInsight = {
        id: insight.id,
        title: insight.title,
        description: insight.description,
        recommendation: insight.recommendation,
        priority: insight.priority,
        timestamp: Date.now(),
      };
      this.insights.push(newInsight);
      
      // Keep only last 10 insights
      if (this.insights.length > 10) {
        this.insights.shift();
      }
    }
  }

  /**
   * Get current analytics
   */
  getAnalytics(): {
    snapshots: AnalyticsSnapshot[];
    patterns: Pattern[];
    insights: AnalyticsInsight[];
    summary: {
      avgCoherence: number;
      avgSpeed: number;
      avgEnergy: number;
      avgConnections: number;
      trendSummary: {
        increasing: number;
        decreasing: number;
        stable: number;
      };
    };
  } {
    const summary = {
      avgCoherence: this.calculateOverallAverage('swarmCoherence'),
      avgSpeed: this.calculateOverallAverage('avgSpeed'),
      avgEnergy: this.calculateOverallAverage('avgEnergy'),
      avgConnections: this.calculateOverallAverage('activeConnections'),
      trendSummary: this.getTrendSummary(),
    };

    return {
      snapshots: this.snapshots,
      patterns: this.patterns,
      insights: this.insights,
      summary,
    };
  }

  /**
   * Calculate overall average for a metric
   */
  private calculateOverallAverage(metric: keyof SwarmMetrics): number {
    if (this.snapshots.length === 0) return 0;
    const values = this.snapshots.map(s => s.metrics[metric] as number);
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Get trend summary
   */
  private getTrendSummary(): { increasing: number; decreasing: number; stable: number } {
    if (this.snapshots.length === 0) {
      return { increasing: 0, decreasing: 0, stable: 0 };
    }

    const latest = this.snapshots[this.snapshots.length - 1];
    const trends = [
      latest.derived.coherenceTrend,
      latest.derived.speedTrend,
      latest.derived.connectionTrend,
      latest.derived.energyTrend,
    ];

    return {
      increasing: trends.filter(t => t === 'increasing').length,
      decreasing: trends.filter(t => t === 'decreasing').length,
      stable: trends.filter(t => t === 'stable').length,
    };
  }

  /**
   * Clear all analytics
   */
  clear(): void {
    this.snapshots = [];
    this.patterns = [];
    this.insights = [];
  }

  /**
   * Get pattern by ID
   */
  getPattern(id: string): Pattern | undefined {
    return this.patterns.find(p => p.id === id);
  }

  /**
   * Export analytics as JSON
   */
  exportAnalytics(): string {
    return JSON.stringify({
      snapshots: this.snapshots,
      patterns: this.patterns,
      insights: this.insights,
      exportedAt: Date.now(),
    }, null, 2);
  }
}
