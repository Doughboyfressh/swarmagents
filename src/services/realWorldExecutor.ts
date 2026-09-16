import axios from 'axios';

export interface RealWorldAction {
  action: string;
  params?: Record<string, any>;
}

export interface RealWorldResult {
  success: boolean;
  error?: string;
  [key: string]: any;
}

export interface BatchExecutionResult {
  success: boolean;
  results: (RealWorldResult & { index: number })[];
  completed: number;
  total: number;
}

export interface SystemInfo {
  success: boolean;
  cpu_percent: number;
  memory_percent: number;
  memory_available_gb: number;
  memory_total_gb: number;
  disk_percent: number;
  disk_free_gb: number;
  cwd: string;
  python_version: string;
  platform: string;
}

export interface QueueStatus {
  queue_size: number;
  is_executing: boolean;
  actions: RealWorldAction[];
}

/**
 * Real World Executor Client
 * Connects your agent swarm to real-world actions via the Python API server
 */
export class RealWorldExecutorClient {
  private baseUrl: string;
  private enabled: boolean;

  constructor(baseUrl: string = 'http://localhost:5000', enabled: boolean = true) {
    this.baseUrl = baseUrl;
    this.enabled = enabled;
  }

  /**
   * Check if the executor server is running
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`);
      return response.data.status === 'ok';
    } catch (error) {
      console.error('❌ Real World Executor not available:', error);
      return false;
    }
  }

  /**
   * Execute a single action
   */
  async execute(action: string, params: Record<string, any> = {}): Promise<RealWorldResult> {
    if (!this.enabled) {
      return { success: false, error: 'Real World Executor is disabled' };
    }

    try {
      const response = await axios.post(`${this.baseUrl}/execute`, {
        action,
        params,
      }, {
        timeout: 120000, // 2 minutes timeout for complex tasks (vision, file ops)
        maxBodyLength: 50 * 1024 * 1024, // 50MB for screenshots
        maxContentLength: 50 * 1024 * 1024
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Execute multiple actions in sequence
   */
  async executeBatch(
    actions: RealWorldAction[],
    stopOnFailure: boolean = false
  ): Promise<BatchExecutionResult> {
    if (!this.enabled) {
      return { success: false, results: [], completed: 0, total: actions.length };
    }

    try {
      const response = await axios.post(`${this.baseUrl}/execute/batch`, {
        actions,
        stop_on_failure: stopOnFailure,
      }, {
        timeout: 300000, // 5 minutes for batch operations
        maxBodyLength: 100 * 1024 * 1024, // 100MB
        maxContentLength: 100 * 1024 * 1024
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        results: [],
        completed: 0,
        total: actions.length,
      };
    }
  }

  /**
   * Add action to execution queue
   */
  async addToQueue(action: string, params: Record<string, any> = {}): Promise<{ success: boolean; queue_size: number; position: number }> {
    if (!this.enabled) {
      return { success: false, queue_size: 0, position: 0 };
    }

    try {
      const response = await axios.post(`${this.baseUrl}/queue/add`, {
        action,
        params,
      });
      return response.data;
    } catch (error: any) {
      return { success: false, queue_size: 0, position: 0 };
    }
  }

  /**
   * Get queue status
   */
  async getQueueStatus(): Promise<QueueStatus | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/queue/status`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Clear the execution queue
   */
  async clearQueue(): Promise<boolean> {
    try {
      const response = await axios.post(`${this.baseUrl}/queue/clear`);
      return response.data.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get detailed system information
   */
  async getSystemInfo(): Promise<SystemInfo | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/system/info`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(path: string = ''): Promise<{ success: boolean; path: string; files: any[]; count: number } | null> {
    try {
      const response = await axios.post(`${this.baseUrl}/files/list`, { path });
      return response.data;
    } catch (error) {
      return null;
    }
  }

  // === Convenience Methods ===

  /**
   * Run a shell command
   */
  async runShell(command: string): Promise<RealWorldResult> {
    return this.execute('run_shell', { command });
  }

  /**
   * Write content to a file
   */
  async writeFile(path: string, content: string): Promise<RealWorldResult> {
    return this.execute('file_write', { path, content });
  }

  /**
   * Read a file
   */
  async readFile(path: string): Promise<RealWorldResult> {
    return this.execute('file_read', { path });
  }

  /**
   * Open a URL in browser
   */
  async openBrowser(url: string): Promise<RealWorldResult> {
    return this.execute('browser_open', { url });
  }

  /**
   * Type text using keyboard
   */
  async typeText(text: string): Promise<RealWorldResult> {
    return this.execute('type_text', { text });
  }

  /**
   * Click mouse at position (or current position)
   */
  async clickMouse(x?: number, y?: number): Promise<RealWorldResult> {
    return this.execute('click_mouse', { x, y });
  }

  /**
   * Get current system stats
   */
  async getSystemStats(): Promise<RealWorldResult> {
    return this.execute('get_system_info', {});
  }
}

// Singleton instance
let executorClientInstance: RealWorldExecutorClient | null = null;

export function getRealWorldExecutor(baseUrl?: string, enabled?: boolean): RealWorldExecutorClient {
  if (!executorClientInstance) {
    executorClientInstance = new RealWorldExecutorClient(baseUrl, enabled);
  }
  return executorClientInstance;
}
