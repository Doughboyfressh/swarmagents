# 🚀 Install llama.cpp for Windows

Quick guide to install llama.cpp with CUDA support for your RTX 5090.

## 📥 Method 1: Automated Installation (Recommended)

**Just double-click `install-llama.bat`**

This will:
1. ✅ Download latest llama.cpp release
2. ✅ Extract files automatically
3. ✅ Copy server.exe to your model directory
4. ✅ Ready to use!

---

## 🔧 Method 2: Manual Installation

### Step 1: Download llama.cpp

1. Go to: https://github.com/ggerganov/llama.cpp/releases
2. Find the latest release
3. Download: **`llama-bXXXX-bin-win-cuda-cu12.4-x64.zip`**
   - Make sure it says **cuda** and **cu12.x** (for CUDA 12)
   - File size: ~100-200 MB

### Step 2: Extract Files

1. Create directory: `C:\Users\Dough\Desktop\llama.cpp`
2. Extract the ZIP file to that directory
3. You should see multiple files including `server.exe`

### Step 3: Copy server.exe

Copy `server.exe` to your model directory:

```cmd
copy C:\Users\Dough\Desktop\llama.cpp\server.exe C:\Users\Dough\Desktop\Qwen3.6-27B\server.exe
```

### Step 4: Verify Installation

```cmd
cd C:\Users\Dough\Desktop\Qwen3.6-27B
dir server.exe
```

You should see `server.exe` in the directory.

---

## ✅ Verify Installation

Test that server.exe works:

```cmd
cd C:\Users\Dough\Desktop\Qwen3.6-27B
server.exe --version
```

Expected output:
```
version: XXXX (commit XXXXXXX)
built with cc (RevXX, ...) for Windows
```

---

## 🚀 Start the Server

Now you can start the LLM server:

```cmd
start-llm.bat
```

Or manually:

```cmd
cd C:\Users\Dough\Desktop\Qwen3.6-27B

server.exe -m Qwen3.6-27B-UD-Q6_K_XL.gguf ^
  -c 4096 ^
  --host 0.0.0.0 ^
  --port 8080 ^
  -ngl 99 ^
  --n-batch 512
```

---

## 🐛 Troubleshooting

### Issue: server.exe not found

**Solution:**
1. Verify you downloaded the correct file (should have "cuda" in name)
2. Check extraction was successful
3. Copy server.exe manually to model directory

### Issue: CUDA not available

**Symptom:**
```
error: no CUDA devices found
```

**Solution:**
1. Install CUDA Toolkit: https://developer.nvidia.com/cuda-downloads
2. Install cuDNN: https://developer.nvidia.com/cudnn
3. Restart your computer
4. Try again

### Issue: DLL errors

**Symptom:**
```
The program can't start because cublas64_XX.dll is missing
```

**Solution:**
1. Install CUDA Toolkit
2. Add CUDA to PATH: `C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.x\bin`
3. Restart command prompt

### Issue: Out of memory

**Symptom:**
```
error: out of memory
```

**Solution:**
1. Reduce context size: `-c 2048` instead of `-c 4096`
2. Reduce GPU layers: `-ngl 80` instead of `-ngl 99`
3. Close other GPU applications

---

## 📊 Monitor GPU Usage

Check if llama.cpp is using your GPU:

```cmd
nvidia-smi
```

You should see:
- GPU utilization: 80-95%
- Memory usage: ~28GB / 32GB
- Process: server.exe

---

## 🎯 Next Steps

After installation:

1. **Start LLM server**: `start-llm.bat`
2. **Verify it's running**: `curl http://localhost:8080/v1/models`
3. **Start full system**: `start-system.bat`
4. **Open browser**: http://localhost:5173

---

## 📚 Additional Resources

- **llama.cpp GitHub**: https://github.com/ggerganov/llama.cpp
- **Windows Setup Guide**: `WINDOWS_SETUP.md`
- **LLM Configuration**: `LLM_CONFIGURED.md`

---

**Need help?** Check the troubleshooting section above or see `WINDOWS_SETUP.md` for detailed instructions.
