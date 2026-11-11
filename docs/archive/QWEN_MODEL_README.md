# Qwen 3.6 27B Model Directory

This directory contains the Qwen 3.6 27B language model for use with the Agent Swarm Intelligence System.

## 📁 Contents

- `server.exe` - llama.cpp server executable (copy from llama.cpp release)
- `*.gguf` - Qwen model file in GGUF format

## 🚀 Quick Start

### Start LLM Server

**Option 1: Use Batch Script**
```cmd
start-llm.bat
```

**Option 2: Manual Start**
```cmd
server.exe -m *.gguf -c 4096 --host 0.0.0.0 --port 8080 -ngl 99
```

### Verify Server
```cmd
curl http://localhost:8080/v1/models
```

## ⚙️ Configuration

### For RTX 5090 (32GB VRAM)
```cmd
server.exe -m *.gguf -c 4096 --port 8080 -ngl 99 --n-batch 512
```

### For RTX 4090 (24GB VRAM)
```cmd
server.exe -m *.gguf -c 2048 --port 8080 -ngl 80 --n-batch 512
```

### For RTX 3090 (24GB VRAM)
```cmd
server.exe -m *.gguf -c 2048 --port 8080 -ngl 70 --n-batch 512
```

## 📊 Performance Monitoring

Check GPU usage:
```cmd
nvidia-smi
```

Expected VRAM usage:
- RTX 5090: ~28GB
- RTX 4090: ~20GB
- RTX 3090: ~18GB

## 🔗 Integration

The Agent Swarm backend connects to this server at:
- **Endpoint**: `http://localhost:8080`
- **API**: OpenAI-compatible `/v1/chat/completions`
- **Model**: Automatically detected from loaded model

## 📖 Documentation

See `WINDOWS_SETUP.md` in project root for complete setup guide.

## 🐛 Troubleshooting

### Server Won't Start
- Verify `server.exe` exists in this directory
- Check `.gguf` model file is present
- Ensure no other process is using port 8080

### High VRAM Usage
- Reduce context size: `-c 2048`
- Reduce GPU layers: `-ngl 70`
- Close other GPU applications

### Slow Response
- Check GPU temperature with `nvidia-smi`
- Reduce batch size: `--n-batch 256`
- Ensure model is fully loaded to GPU

## 📝 Notes

- Model must be in GGUF format
- server.exe must be from llama.cpp with CUDA support
- Port 8080 must be available
- Sufficient VRAM required for model + context

---

**Model**: Qwen 3.6 27B  
**Format**: GGUF  
**Backend**: llama.cpp with CUDA  
**Integration**: Agent Swarm Intelligence System
