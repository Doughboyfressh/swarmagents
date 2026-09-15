# 🧬 Agent Swarm Intelligence - Backend Server

Real-time backend server for the Agent Swarm Intelligence System with LLM integration, persistent storage, and WebSocket communication.

## 🎯 Features

- **Real-time Simulation**: 60 FPS agent simulation with flocking, resource gathering, and emergent behaviors
- **LLM Integration**: Connect to Qwen 3.6 27B via llama.cpp for AI-driven swarm control
- **WebSocket Communication**: Real-time state updates to frontend clients
- **Persistent Storage**: SQLite database for agent state, metrics, and LLM conversations
- **REST API**: Full HTTP API for state management and control
- **Multi-client Support**: Multiple frontend clients can connect simultaneously

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Frontend (React - Port 5173)               │
│         - Visualization & User Interface                │
└────────────────────┬────────────────────────────────────┘
                     │ WebSocket + REST API
                     ▼
┌─────────────────────────────────────────────────────────┐
│           Backend Server (Node.js - Port 3001)          │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Agent Orchestrator                              │  │
│  │  - Manages agent lifecycle                       │  │
│  │  - Coordinates swarm behavior                    │  │
│  │  - Updates world state                           │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  LLM Service                                     │  │
│  │  - Connects to llama.cpp (localhost:8080)        │  │
│  │  - Qwen 3.6 27B as swarm brain                   │  │
│  │  - Strategic recommendations                     │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  SQLite Database                                 │  │
│  │  - Agent state persistence                       │  │
│  │  - Metrics history                               │  │
│  │  - LLM conversation logs                         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  WebSocket Server                                │  │
│  │  - Real-time state broadcasting                  │  │
│  │  - Client command handling                       │  │
│  │  - LLM chat integration                          │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **RTX 5090** GPU (or similar) for LLM inference
- **32GB RAM** minimum
- **llama.cpp** server running with Qwen 3.6 27B model

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Start llama.cpp Server

In a separate terminal, start your llama.cpp server:

```bash
cd /path/to/llama.cpp
./server -m /path/to/qwen-3.6-27b.gguf \
  -c 4096 \
  --host 0.0.0.0 \
  --port 8080 \
  -ngl 99
```

**Important flags:**
- `-c 4096`: Context size (adjust based on your VRAM)
- `-ngl 99`: Offload all layers to GPU (RTX 5090 has 32GB VRAM)
- `--port 8080`: Port must match `LLM_ENDPOINT` in `.env`

### 3. Configure Environment

Edit `.env` file:

```env
PORT=3001
LLM_ENDPOINT=http://localhost:8080
LLM_MODEL=qwen-3.6-27b
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=512
LLM_ENABLED=true
```

### 4. Start Backend Server

```bash
npm run dev
```

The server will start on `http://localhost:3001`

### 5. Start Frontend (in another terminal)

```bash
cd ..
npm run dev
```

The frontend will connect to the backend automatically.

## 📡 API Endpoints

### Health & Status

```bash
# Health check
GET /api/health

# Full state
GET /api/state

# LLM status
GET /api/llm/status
```

### Agents

```bash
# Get all agents
GET /api/agents

# Add agent
POST /api/agents
{
  "role": "explorer" | "worker" | "coordinator" | "scout" | "carrier"
}

# Remove agent
DELETE /api/agents/:id
```

### Resources

```bash
# Get all resources
GET /api/resources

# Add resource
POST /api/resources
```

### Configuration

```bash
# Get config
GET /api/config

# Update config
POST /api/config
{
  "behavior": "flocking",
  "agentCount": 50,
  "separationWeight": 1.5,
  ...
}
```

### Simulation Control

```bash
# Reset simulation
POST /api/reset
```

### LLM Integration

```bash
# Test LLM connection
POST /api/llm/test

# Chat with LLM
POST /api/llm/chat
{
  "message": "What should the swarm do next?"
}

# Get strategic recommendation
POST /api/llm/recommend
```

### Metrics & World

```bash
# Get metrics
GET /api/metrics

# Get world state
GET /api/world
```

## 🔌 WebSocket API

Connect to `ws://localhost:3001`

### Client → Server Messages

```javascript
// Chat with LLM
{
  "type": "llm_chat",
  "message": "Analyze the swarm behavior"
}
```

### Server → Client Messages

```javascript
// State update (every 100ms)
{
  "type": "state_update",
  "payload": {
    "agents": [...],
    "resources": [...],
    "structures": [...],
    "threats": [...],
    "config": {...},
    "worldState": {...},
    "metrics": {...}
  },
  "timestamp": 1234567890
}

// Metrics update (every 1s)
{
  "type": "metrics_update",
  "payload": {
    "avgSpeed": 2.5,
    "swarmCoherence": 0.85,
    ...
  },
  "timestamp": 1234567890
}

// LLM response
{
  "type": "llm_response",
  "payload": {
    "content": "The swarm should...",
    "tokensUsed": 150,
    "latency": 2500,
    "success": true
  },
  "timestamp": 1234567890
}
```

## 🗄️ Database Schema

SQLite database at `./data/swarm.db`

### Tables

- **agents**: Agent state (position, velocity, role, traits, brain, memory)
- **resources**: Resource locations and amounts
- **structures**: Built structures
- **threats**: Active threats
- **events**: Event log
- **world_state**: Current world state
- **swarm_config**: Configuration
- **metrics_history**: Historical metrics
- **llm_conversations**: LLM chat history

## 🧠 LLM Integration

The backend connects to your local llama.cpp server running Qwen 3.6 27B.

### Setup llama.cpp

```bash
# Clone llama.cpp
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp

# Build with CUDA (for RTX 5090)
make GGML_CUDA=1

# Download Qwen model
# (Place your qwen-3.6-27b.gguf in the llama.cpp directory)

# Start server
./server -m qwen-3.6-27b.gguf \
  -c 4096 \
  --host 0.0.0.0 \
  --port 8080 \
  -ngl 99
```

### LLM Features

- **Strategic Recommendations**: Get AI-powered suggestions for swarm optimization
- **Behavior Analysis**: Ask the LLM to analyze swarm behavior
- **Autonomous Control**: Let the LLM make decisions for the swarm
- **Conversation History**: All LLM interactions are logged

## 📊 Performance

With RTX 5090 and 32GB RAM:

- **Agents**: 100-200 agents at 60 FPS
- **LLM Inference**: ~2-5 seconds per response
- **Database**: ~1000 writes/second
- **WebSocket**: 10+ concurrent clients

## 🔧 Development

### Run in Development Mode

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm start
```

### Initialize Database

```bash
npm run db:init
```

## 📝 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Server port |
| `LLM_ENDPOINT` | http://localhost:8080 | llama.cpp server URL |
| `LLM_MODEL` | qwen-3.6-27b | Model name |
| `LLM_TEMPERATURE` | 0.7 | LLM temperature |
| `LLM_MAX_TOKENS` | 512 | Max tokens per response |
| `LLM_ENABLED` | true | Enable/disable LLM |
| `DB_PATH` | ./data/swarm.db | Database path |
| `LOG_LEVEL` | info | Logging level |

## 🐛 Troubleshooting

### LLM Connection Failed

```bash
# Check if llama.cpp is running
curl http://localhost:8080/v1/models

# Check logs
tail -f backend/logs/server.log
```

### Database Errors

```bash
# Reset database
rm ./data/swarm.db
npm run db:init
```

### WebSocket Connection Issues

```bash
# Check if server is running
curl http://localhost:3001/api/health

# Check WebSocket endpoint
wscat -c ws://localhost:3001
```

## 📚 Documentation

- [Backend Architecture](./docs/ARCHITECTURE.md)
- [API Reference](./docs/API.md)
- [LLM Integration](./docs/LLM.md)
- [Database Schema](./docs/DATABASE.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **llama.cpp**: Local LLM inference
- **Qwen**: Language model
- **Express**: Web framework
- **SQLite**: Database
- **WebSocket**: Real-time communication

---

**Built with ❤️ for advanced multi-agent systems**
