# 👁️ Qwen3.6-27B Vision Capabilities Guide

## Important: Native Multimodal Support

**Qwen3.6-27B has built-in vision capabilities** - you do NOT need a separate "VL" (Vision-Language) model!

### What This Means

1. **Single Model** - Use `qwen-3.6-27b` for both text AND images
2. **No Qwen-VL Needed** - The older separate VL model is obsolete
3. **Native Integration** - Vision is built into the base model architecture

---

## How to Use Vision with Qwen3.6-27B

### API Format (llama.cpp server)

```bash
# Start llama.cpp with your Qwen3.6-27B GGUF
./server -m unsloth/Qwen3.6-27B-GGUF/Qwen3.6-27B-Q6_K_XL.gguf \
         --port 8080 \
         -ngl 99 \
         --flash-attn \
         --ctx-size 16384
```

### Sending Images

```python
import requests
import base64

# Load and encode image
with open("screenshot.png", "rb") as f:
    image_base64 = base64.b64encode(f.read()).decode()

# Send to Qwen3.6-27B (native vision)
response = requests.post(
    "http://localhost:8080/v1/chat/completions",
    json={
        "model": "qwen-3.6-27b",  # NOT "qwen-vl"!
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "What do you see in this image?"},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_base64}"}}
                ]
            }
        ],
        "max_tokens": 512
    }
)

print(response.json()['choices'][0]['message']['content'])
```

---

## Your Agent Swarm Configuration

### Current Setup (✅ Corrected)

Your `enhanced_real_world_executor.py` now uses:
- ✅ Model: `qwen-3.6-27b` (native vision)
- ✅ Screenshot capture with PIL
- ✅ Base64 encoding for API
- ✅ ChromaDB memory integration
- ✅ Critic agent verification

### Test Commands

Try these with your swarm:

```
"Take a screenshot and describe what's on my screen"
"What applications are currently open?"
"Read the text from this dialog box"
"Is there a video playing? What's it about?"
```

---

## RTX 5090 Optimization

Maximize performance with these llama.cpp flags:

```bash
./server -m Qwen3.6-27B-Q6_K_XL.gguf \
         -ngl 99 \                    # Full GPU offload
         --flash-attn \               # Flash Attention
         --ctx-size 16384 \           # Large context
         --batch-size 512 \           # Batch processing
         --ubatch-size 512 \
         --threads $(nproc) \         # Use all CPU threads
         -tg 256                      # Token generation batch
```

Expected Performance on RTX 5090:
- **Text-only**: ~40-50 tokens/sec
- **Vision + Text**: ~25-35 tokens/sec (first token ~2-3s)
- **VRAM Usage**: ~20GB (Q6_K_XL quantization)

---

## Key Differences: Qwen3.6-27B vs Old Qwen-VL

| Feature | Qwen3.6-27B | Old Qwen-VL |
|---------|-------------|-------------|
| Architecture | Unified multimodal | Separate vision encoder |
| Image Resolution | Up to 1280x1280 | Limited to lower res |
| OCR Capability | Excellent | Good |
| Reasoning | Advanced CoT | Basic |
| Context Window | 32K+ | 8K max |
| Speed | Faster (unified) | Slower (dual pass) |

---

## Troubleshooting

### "Model doesn't support images"
→ Ensure you're using the correct Qwen3.6-27B GGUF with vision support
→ Check llama.cpp version (must be recent, supports multimodal)

### "Slow vision inference"
→ Enable Flash Attention (`--flash-attn`)
→ Reduce image resolution before sending
→ Use JPEG instead of PNG for screenshots

### "Out of VRAM"
→ Use lower quantization (Q5_K_M instead of Q6_K_XL)
→ Reduce context size if not needed
→ Close other GPU applications

---

## Resources

- **HuggingFace**: Search for `Qwen3.6-27B` or `Qwen3.5-32B` models
- **llama.cpp**: https://github.com/ggerganov/llama.cpp
- **GGUF Models**: https://huggingface.co/unsloth

**Remember**: Qwen3.6-27B = Text + Vision in ONE model! 🎉
