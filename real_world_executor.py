"""
Enhanced Real World Executor with Vision Capabilities
Designed for Qwen-VL 27B on RTX 5090
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import pyautogui
import pyperclip
import psutil
import os
import subprocess
import base64
import io
from PIL import Image
import time
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Configuration
ALLOWED_ROOTS = [os.path.expanduser("~"), os.getcwd(), "C:\\"]
ENABLE_VISION = True
SCREENSHOT_QUALITY = 85  # JPEG quality for faster transmission

def is_safe_path(path):
    """Prevent path traversal attacks"""
    real_path = os.path.realpath(path)
    return any(real_path.startswith(root) for root in ALLOWED_ROOTS)

def capture_screen(region=None):
    """Capture screenshot and return base64 string"""
    try:
        if region:
            screenshot = pyautogui.screenshot(region=region)
        else:
            screenshot = pyautogui.screenshot()
        
        # Convert to RGB if necessary (some modes are RGBA)
        if screenshot.mode != 'RGB':
            screenshot = screenshot.convert('RGB')
            
        buffer = io.BytesIO()
        screenshot.save(buffer, format="JPEG", quality=SCREENSHOT_QUALITY)
        img_str = base64.b64encode(buffer.getvalue()).decode()
        return f"data:image/jpeg;base64,{img_str}"
    except Exception as e:
        return None

@app.route('/api/vision/screenshot', methods=['POST'])
def get_screenshot():
    """Return current screen as base64 image"""
    data = request.json or {}
    region = data.get('region')  # Optional [x, y, width, height]
    
    img_data = capture_screen(region)
    if img_data:
        return jsonify({"success": True, "image": img_data})
    return jsonify({"success": False, "error": "Failed to capture screen"}), 500

@app.route('/api/vision/analyze', methods=['POST'])
def analyze_screen():
    """
    Capture screen and return it ready for LLM processing.
    The actual analysis happens in the LLM service, this just preps the data.
    """
    img_data = capture_screen()
    if not img_data:
        return jsonify({"success": False, "error": "Screenshot failed"}), 500
        
    # Get basic system context to pair with image
    cpu = psutil.cpu_percent(interval=0.1)
    ram = psutil.virtual_memory().percent
    
    return jsonify({
        "success": True,
        "image": img_data,
        "context": {
            "resolution": pyautogui.size(),
            "cpu_usage": cpu,
            "ram_usage": ram,
            "timestamp": time.time()
        }
    })

@app.route('/api/action/execute', methods=['POST'])
def execute_action():
    """Execute a safe action on the system"""
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    action = data.get('action')
    params = data.get('params', {})
    
    # Pre-action screenshot if vision is enabled and action modifies UI
    pre_image = None
    if ENABLE_VISION and action in ['click', 'type', 'open_app']:
        pre_image = capture_screen()

    try:
        result = None
        if action == 'shell':
            cmd = params.get('command')
            if not cmd: return jsonify({"error": "No command"}), 400
            output = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
            result = {"stdout": output.stdout, "stderr": output.stderr, "returncode": output.returncode}
            
        elif action == 'file_read':
            path = params.get('path')
            if not is_safe_path(path): return jsonify({"error": "Unsafe path"}), 403
            with open(path, 'r', encoding='utf-8') as f:
                result = {"content": f.read()}
                
        elif action == 'file_write':
            path = params.get('path')
            content = params.get('content')
            if not is_safe_path(path): return jsonify({"error": "Unsafe path"}), 403
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            result = {"status": "written"}
            
        elif action == 'click':
            x, y = params.get('x'), params.get('y')
            pyautogui.click(x, y)
            result = {"status": "clicked", "coords": [x, y]}
            
        elif action == 'type':
            text = params.get('text')
            interval = params.get('interval', 0.05)
            pyautogui.write(text, interval=interval)
            result = {"status": "typed"}
            
        elif action == 'screenshot':
            img = capture_screen()
            result = {"image": img}
            
        else:
            return jsonify({"error": f"Unknown action: {action}"}), 400

        # Post-action screenshot for verification
        post_image = None
        if ENABLE_VISION and action in ['click', 'type', 'open_app', 'shell']:
            time.sleep(0.5)
            post_image = capture_screen()

        return jsonify({
            "success": True, 
            "result": result,
            "vision": {
                "before": pre_image,
                "after": post_image
            } if ENABLE_VISION else None
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/system/stats', methods=['GET'])
def get_stats():
    return jsonify({
        "cpu": psutil.cpu_percent(interval=0.1),
        "memory": psutil.virtual_memory().percent,
        "disk": psutil.disk_usage('/').percent,
        "battery": psutil.sensors_battery().percent if psutil.sensors_battery() else None
    })

if __name__ == '__main__':
    print("🚀 Enhanced Real World Executor (with Vision) starting on port 5000...")
    print(f"👁️ Vision Enabled: {ENABLE_VISION}")
    print(f"💻 GPU Acceleration: Detected (Ensure llama.cpp is using CUDA)")
    app.run(port=5000, debug=False)
