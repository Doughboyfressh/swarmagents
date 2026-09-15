import { SwarmConfig } from '../types/swarm';

export interface SavedState {
  version: string;
  timestamp: number;
  name: string;
  description: string;
  config: SwarmConfig;
  metrics?: {
    avgSpeed: number;
    swarmCoherence: number;
    activeConnections: number;
  };
}

export class StateManager {
  private savedStates: SavedState[] = [];
  private readonly STORAGE_KEY = 'swarm-saved-states';

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Save current state
   */
  saveState(name: string, description: string, config: SwarmConfig, metrics?: any): SavedState {
    const state: SavedState = {
      version: '1.0.0',
      timestamp: Date.now(),
      name,
      description,
      config: { ...config },
      metrics,
    };

    this.savedStates.push(state);
    this.persistToStorage();
    
    return state;
  }

  /**
   * Load a saved state
   */
  loadState(index: number): SavedState | null {
    if (index >= 0 && index < this.savedStates.length) {
      return this.savedStates[index];
    }
    return null;
  }

  /**
   * Delete a saved state
   */
  deleteState(index: number): void {
    if (index >= 0 && index < this.savedStates.length) {
      this.savedStates.splice(index, 1);
      this.persistToStorage();
    }
  }

  /**
   * Get all saved states
   */
  getAllStates(): SavedState[] {
    return [...this.savedStates];
  }

  /**
   * Export state as JSON
   */
  exportState(index: number): string {
    const state = this.loadState(index);
    if (!state) return '';
    return JSON.stringify(state, null, 2);
  }

  /**
   * Import state from JSON
   */
  importState(json: string): SavedState | null {
    try {
      const state = JSON.parse(json) as SavedState;
      
      // Validate structure
      if (!state.version || !state.config || !state.name) {
        throw new Error('Invalid state format');
      }

      this.savedStates.push(state);
      this.persistToStorage();
      
      return state;
    } catch (error) {
      console.error('Failed to import state:', error);
      return null;
    }
  }

  /**
   * Export all states as JSON
   */
  exportAllStates(): string {
    return JSON.stringify(this.savedStates, null, 2);
  }

  /**
   * Import all states from JSON
   */
  importAllStates(json: string): number {
    try {
      const states = JSON.parse(json) as SavedState[];
      
      if (!Array.isArray(states)) {
        throw new Error('Invalid format: expected array');
      }

      // Validate each state
      const validStates = states.filter(state => 
        state.version && state.config && state.name
      );

      this.savedStates.push(...validStates);
      this.persistToStorage();
      
      return validStates.length;
    } catch (error) {
      console.error('Failed to import states:', error);
      return 0;
    }
  }

  /**
   * Clear all saved states
   */
  clearAll(): void {
    this.savedStates = [];
    this.persistToStorage();
  }

  /**
   * Get state count
   */
  getStateCount(): number {
    return this.savedStates.length;
  }

  /**
   * Persist to localStorage
   */
  private persistToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.savedStates));
    } catch (error) {
      console.error('Failed to persist states:', error);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.savedStates = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load states:', error);
      this.savedStates = [];
    }
  }

  /**
   * Get storage size in KB
   */
  getStorageSize(): number {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? new Blob([stored]).size / 1024 : 0;
  }
}
