import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { initializeDatabase, closeDatabase } from './database';
import { getOrchestrator } from './services/orchestrator';
import { getLLMService } from './services/llm';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services with real-world execution enabled
const ENABLE_REAL_WORLD = process.env.ENABLE_REAL_WORLD === 'true';
const REAL_WORLD_EXECUTOR_URL = process.env.REAL_WORLD_EXECUTOR_URL || 'http://localhost:5000';

console.log(`🌍 Real-world execution: ${ENABLE_REAL_WORLD ? 'ENABLED' : 'DISABLED'}`);
if (ENABLE_REAL_WORLD) {
  console.log(`   Executor URL: ${REAL_WORLD_EXECUTOR_URL}`);
}

const orchestrator = getOrchestrator(ENABLE_REAL_WORLD, REAL_WORLD_EXECUTOR_URL);
const llmService = getLLMService(ENABLE_REAL_WORLD, REAL_WORLD_EXECUTOR_URL);

// WebSocket connections
const clients = new Set<WebSocket>();

wss.on('connection', (ws: WebSocket) => {
  console.log('🔌 Client connected');
  clients.add(ws);

  ws.on('close', () => {
    console.log('🔌 Client disconnected');
    clients.delete(ws);
  });

  ws.on('message', async (message: string) => {
    try {
      const data = JSON.parse(message.toString());
      
      // Handle LLM chat messages
      if (data.type === 'llm_chat') {
        const response = await llmService.chat(data.message, orchestrator.getMetrics());
        
        // If LLM returned an action and real-world execution is enabled, execute it
        let actionResult = null;
        if (ENABLE_REAL_WORLD && response.action) {
          console.log('🤖 LLM requested real-world action:', response.action);
          actionResult = await llmService.executeAction(response.action);
        }
        
        ws.send(JSON.stringify({
          type: 'llm_response',
          payload: response,
          actionResult,
          timestamp: Date.now(),
        }));
      }
    } catch (error) {
      console.error('❌ WebSocket message error:', error);
    }
  });

  // Send initial state
  ws.send(JSON.stringify({
    type: 'state_update',
    payload: {
      agents: orchestrator.getAgents(),
      resources: orchestrator.getResources(),
      structures: orchestrator.getStructures(),
      threats: orchestrator.getThreats(),
      config: orchestrator.getConfig(),
      worldState: orchestrator.getWorldState(),
      metrics: orchestrator.getMetrics(),
    },
    timestamp: Date.now(),
  }));
});

// Broadcast state updates to all clients
function broadcastState() {
  const state = {
    type: 'state_update',
    payload: {
      agents: orchestrator.getAgents(),
      resources: orchestrator.getResources(),
      structures: orchestrator.getStructures(),
      threats: orchestrator.getThreats(),
      config: orchestrator.getConfig(),
      worldState: orchestrator.getWorldState(),
      metrics: orchestrator.getMetrics(),
    },
    timestamp: Date.now(),
  };

  const message = JSON.stringify(state);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Broadcast metrics updates
function broadcastMetrics() {
  const metrics = {
    type: 'metrics_update',
    payload: orchestrator.getMetrics(),
    timestamp: Date.now(),
  };

  const message = JSON.stringify(metrics);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// REST API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    llmConnected: llmService.getConnectionStatus(),
    simulationRunning: orchestrator.getMetrics().avgSpeed > 0,
    clientCount: clients.size,
  });
});

// Get current state
app.get('/api/state', (req, res) => {
  res.json({
    agents: orchestrator.getAgents(),
    resources: orchestrator.getResources(),
    structures: orchestrator.getStructures(),
    threats: orchestrator.getThreats(),
    config: orchestrator.getConfig(),
    worldState: orchestrator.getWorldState(),
    metrics: orchestrator.getMetrics(),
  });
});

// Get agents
app.get('/api/agents', (req, res) => {
  res.json(orchestrator.getAgents());
});

// Get resources
app.get('/api/resources', (req, res) => {
  res.json(orchestrator.getResources());
});

// Get metrics
app.get('/api/metrics', (req, res) => {
  res.json(orchestrator.getMetrics());
});

// Get world state
app.get('/api/world', (req, res) => {
  res.json(orchestrator.getWorldState());
});

// Get config
app.get('/api/config', (req, res) => {
  res.json(orchestrator.getConfig());
});

// Update config
app.post('/api/config', (req, res) => {
  try {
    orchestrator.updateConfig(req.body);
    res.json({ success: true, config: orchestrator.getConfig() });
  } catch (error) {
    res.status(400).json({ success: false, error: String(error) });
  }
});

// Add agent
app.post('/api/agents', (req, res) => {
  try {
    const { role } = req.body;
    const agent = orchestrator.addAgent(role);
    res.json({ success: true, agent });
  } catch (error) {
    res.status(400).json({ success: false, error: String(error) });
  }
});

// Remove agent
app.delete('/api/agents/:id', (req, res) => {
  try {
    const success = orchestrator.removeAgent(req.params.id);
    res.json({ success });
  } catch (error) {
    res.status(400).json({ success: false, error: String(error) });
  }
});

// Add resource
app.post('/api/resources', (req, res) => {
  try {
    const resource = orchestrator.addResource();
    res.json({ success: true, resource });
  } catch (error) {
    res.status(400).json({ success: false, error: String(error) });
  }
});

// Reset simulation
app.post('/api/reset', (req, res) => {
  try {
    orchestrator.reset();
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: String(error) });
  }
});

// LLM endpoints
app.get('/api/llm/status', (req, res) => {
  res.json({
    connected: llmService.getConnectionStatus(),
    config: llmService.getConfig(),
    stats: llmService.getStats(),
  });
});

app.post('/api/llm/test', async (req, res) => {
  try {
    const connected = await llmService.testConnection();
    res.json({ success: connected });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

app.post('/api/llm/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const response = await llmService.chat(message, orchestrator.getMetrics());
    
    // Execute action if LLM returned one and real-world is enabled
    let actionResult = null;
    if (ENABLE_REAL_WORLD && response.action) {
      console.log('🤖 REST API: LLM requested real-world action:', response.action);
      actionResult = await llmService.executeAction(response.action);
    }
    
    res.json({ ...response, actionResult });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// New endpoint for direct real-world action execution
app.post('/api/execute', async (req, res) => {
  if (!ENABLE_REAL_WORLD) {
    return res.status(403).json({ success: false, error: 'Real-world execution is disabled' });
  }
  
  try {
    const { action, params } = req.body;
    const result = await orchestrator.executeRealWorldAction(action, params);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

app.post('/api/llm/recommend', async (req, res) => {
  try {
    const response = await llmService.getStrategicRecommendation(orchestrator.getMetrics());
    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Start server
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🧬 Agent Swarm Intelligence Backend Server             ║
║                                                           ║
║   Server:     http://localhost:${PORT}                      ║
║   WebSocket:  ws://localhost:${PORT}                       ║
║                                                           ║
║   📊 Endpoints:                                           ║
║   • GET  /api/health       - Health check                ║
║   • GET  /api/state        - Full state                  ║
║   • GET  /api/agents       - Get agents                  ║
║   • GET  /api/resources    - Get resources               ║
║   • GET  /api/metrics      - Get metrics                 ║
║   • GET  /api/world        - Get world state             ║
║   • GET  /api/config       - Get config                  ║
║   • POST /api/config       - Update config               ║
║   • POST /api/agents       - Add agent                   ║
║   • POST /api/resources    - Add resource                ║
║   • POST /api/reset        - Reset simulation            ║
║   • GET  /api/llm/status   - LLM status                  ║
║   • POST /api/llm/test     - Test LLM connection         ║
║   • POST /api/llm/chat     - Chat with LLM               ║
║   • POST /api/llm/recommend - Get LLM recommendation     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);

  // Initialize database
  initializeDatabase();

  // Initialize orchestrator
  orchestrator.initialize();

  // Test LLM connection
  llmService.testConnection().then(connected => {
    if (connected) {
      console.log('✅ LLM connected successfully');
    } else {
      console.log('⚠️  LLM not available (start llama.cpp server for AI features)');
    }
  });

  // Start simulation
  orchestrator.start();

  // Broadcast state every 100ms (10 FPS)
  setInterval(broadcastState, 100);

  // Broadcast metrics every second
  setInterval(broadcastMetrics, 1000);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  orchestrator.stop();
  closeDatabase();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  orchestrator.stop();
  closeDatabase();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
