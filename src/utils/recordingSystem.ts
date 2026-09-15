import { Agent, Resource, SwarmMetrics } from '../types/swarm';

export interface SimulationFrame {
  timestamp: number;
  agents: {
    id: string;
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    energy: number;
    state: string;
    role: string;
  }[];
  resources: {
    id: string;
    position: { x: number; y: number };
    amount: number;
    discovered: boolean;
  }[];
  metrics: {
    avgSpeed: number;
    swarmCoherence: number;
    activeConnections: number;
  };
}

export class RecordingSystem {
  private frames: SimulationFrame[] = [];
  private isRecording = false;
  private isPlaying = false;
  private playbackIndex = 0;
  private playbackSpeed = 1;
  private frameInterval = 100; // ms between frames
  private lastFrameTime = 0;

  startRecording(): void {
    this.frames = [];
    this.isRecording = true;
    this.isPlaying = false;
  }

  stopRecording(): void {
    this.isRecording = false;
  }

  recordFrame(agents: Agent[], resources: Resource[], metrics: any): void {
    if (!this.isRecording) return;

    const now = Date.now();
    if (now - this.lastFrameTime < this.frameInterval) return;
    this.lastFrameTime = now;

    const frame: SimulationFrame = {
      timestamp: now,
      agents: agents.map(a => ({
        id: a.id,
        position: { x: a.position.x, y: a.position.y },
        velocity: { x: a.velocity.x, y: a.velocity.y },
        energy: a.energy,
        state: a.state,
        role: a.role,
      })),
      resources: resources.map(r => ({
        id: r.id,
        position: { x: r.position.x, y: r.position.y },
        amount: r.amount,
        discovered: r.discovered,
      })),
      metrics: {
        avgSpeed: metrics.avgSpeed,
        swarmCoherence: metrics.swarmCoherence,
        activeConnections: metrics.activeConnections,
      },
    };

    this.frames.push(frame);

    // Limit to last 1000 frames
    if (this.frames.length > 1000) {
      this.frames.shift();
    }
  }

  startPlayback(): void {
    if (this.frames.length === 0) return;
    this.isPlaying = true;
    this.playbackIndex = 0;
  }

  stopPlayback(): void {
    this.isPlaying = false;
  }

  getNextFrame(): SimulationFrame | null {
    if (!this.isPlaying || this.frames.length === 0) return null;

    const frame = this.frames[this.playbackIndex];
    this.playbackIndex++;

    if (this.playbackIndex >= this.frames.length) {
      this.playbackIndex = 0; // Loop
    }

    return frame;
  }

  setPlaybackSpeed(speed: number): void {
    this.playbackSpeed = Math.max(0.1, Math.min(10, speed));
  }

  getStats(): {
    isRecording: boolean;
    isPlaying: boolean;
    frameCount: number;
    duration: number;
    playbackSpeed: number;
  } {
    const duration = this.frames.length > 0
      ? (this.frames[this.frames.length - 1].timestamp - this.frames[0].timestamp) / 1000
      : 0;

    return {
      isRecording: this.isRecording,
      isPlaying: this.isPlaying,
      frameCount: this.frames.length,
      duration,
      playbackSpeed: this.playbackSpeed,
    };
  }

  exportRecording(): string {
    return JSON.stringify(this.frames, null, 2);
  }

  clear(): void {
    this.frames = [];
    this.isRecording = false;
    this.isPlaying = false;
    this.playbackIndex = 0;
  }
}
