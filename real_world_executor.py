"""
Enhanced Real World Executor with Vision Capabilities
Designed for Qwen3.6-27B on RTX 5090

Note: On Linux/WSL without display, mouse/keyboard functions will be disabled
"""
import os

# Handle headless environments (Linux servers, WSL without X11)
HEADLESS_MODE = False
if os.name != 'nt' and 'DISPLAY' not in os.environ:
    HEADLESS_MODE = True
    print("⚠️  Running in headless mode - GUI functions disabled")

from flask import Flask, request, jsonify
from flask_cors import CORS
import pyperclip
import psutil
import subprocess
import base64
import io
import time
import json

# Only import pyautogui and PIL if we have a display
pyautogui = None
Image = None

if not HEADLESS_MODE:
    try:
        import pyautogui
        from PIL import Image
        print("✅ GUI modules loaded successfully")
    except Exception as e:
        print(f"⚠️  Could not load GUI modules: {e}")
        HEADLESS_MODE = True
else:
    # Mock classes for headless mode
    class ImageMock:
        @staticmethod
        def new(*args, **kwargs):
            return None
    
    Image = ImageMock

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Configuration
ALLOWED_ROOTS = [os.path.expanduser("~"), os.getcwd(), "C:\\\\"]
ENABLE_VISION = not HEADLESS_MODE
SCREENSHOT_QUALITY = 85  # JPEG quality for faster transmission

def is_safe_path(path):
    """Prevent path traversal attacks"""
    real_path = os.path.realpath(path)
    return any(real_path.startswith(root) for root in ALLOWED_ROOTS)

def capture_screen(region=None):
    """Capture screenshot and return base64 string"""
    if HEADLESS_MODE or pyautogui is None:
        return None
    
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
        print(f"❌ Screenshot error: {e}")
        return None

@app.route('/api/vision/screenshot', methods=['POST'])
def api_screenshot():
    """Take a screenshot and return base64 image"""
    if not ENABLE_VISION:
        return jsonify({'success': False, 'error': 'Vision disabled in headless mode'}), 400
    
    img_data = capture_screen()
    if img_data:
        return jsonify({'success': True, 'image': img_data})
    return jsonify({'success': False, 'error': 'Failed to capture screen'}), 500

@app.route('/api/vision/analyze', methods=['POST'])
def api_analyze_screen():
    """Analyze current screen with LLM (requires external LLM service)"""
    if not ENABLE_VISION:
        return jsonify({'success': False, 'error': 'Vision disabled'}), 400
    
    img_data = capture_screen()
    if not img_data:
        return jsonify({'success': False, 'error': 'Screenshot failed'}), 500
    
    # This would call your Qwen3.6-27B model
    # For now, return the image for external processing
    return jsonify({
        'success': True,
        'image': img_data,
        'message': 'Image captured. Send to Qwen3.6-27B for analysis.'
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'headless_mode': HEADLESS_MODE,
        'vision_enabled': ENABLE_VISION,
        'timestamp': time.time()
    })

@app.route('/execute', methods=['POST'])
def execute_action():
    """Execute a single action"""
    data = request.get_json()
    
    if not data or 'action' not in data:
        return jsonify({'success': False, 'error': 'No action specified'}), 400
    
    action = data['action']
    params = data.get('params', {})
    
    try:
        result = execute_single_action(action, params)
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def execute_single_action(action: str, params: dict):
    """Execute a single action based on type"""
    
    if action == 'run_shell':
        cmd = params.get('command', '')
        if not cmd:
            return {'success': False, 'error': 'No command specified'}
        
        try:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=60)
            return {
                'success': True,
                'stdout': result.stdout,
                'stderr': result.stderr,
                'returncode': result.returncode
            }
        except subprocess.TimeoutExpired:
            return {'success': False, 'error': 'Command timed out'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    elif action == 'file_write':
        path = params.get('path', '')
        content = params.get('content', '')
        
        if not path or not is_safe_path(path):
            return {'success': False, 'error': 'Invalid or unsafe path'}
        
        try:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            return {'success': True, 'path': path, 'bytes_written': len(content)}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    elif action == 'file_read':
        path = params.get('path', '')
        
        if not path or not is_safe_path(path):
            return {'success': False, 'error': 'Invalid or unsafe path'}
        
        try:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            return {'success': True, 'path': path, 'content': content}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    elif action == 'get_system_info':
        cpu = psutil.cpu_percent(interval=0.5)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        return {
            'success': True,
            'cpu_percent': cpu,
            'memory_percent': memory.percent,
            'memory_available_gb': round(memory.available / (1024**3), 2),
            'memory_total_gb': round(memory.total / (1024**3), 2),
            'disk_percent': disk.percent,
            'disk_free_gb': round(disk.free / (1024**3), 2),
            'cwd': os.getcwd(),
            'python_version': sys.version,
            'platform': os.name,
            'headless_mode': HEADLESS_MODE
        }
    
    elif action == 'take_screenshot':
        if not ENABLE_VISION:
            return {'success': False, 'error': 'Vision disabled in headless mode'}
        
        img_data = capture_screen()
        if img_data:
            return {'success': True, 'image': img_data}
        return {'success': False, 'error': 'Screenshot failed'}
    
    elif action == 'browser_open':
        url = params.get('url', '')
        if not url:
            return {'success': False, 'error': 'No URL specified'}
        
        try:
            if os.name == 'nt':
                os.startfile(url)
            else:
                subprocess.Popen(['xdg-open', url])
            return {'success': True, 'url': url}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    elif action == 'type_text':
        if HEADLESS_MODE or pyautogui is None:
            return {'success': False, 'error': 'Keyboard control disabled in headless mode'}
        
        text = params.get('text', '')
        try:
            pyperclip.copy(text)
            # pyautogui.hotkey('ctrl', 'v')  # Would work with display
            return {'success': True, 'message': f'Text copied to clipboard ({len(text)} chars)', 'headless_warning': 'Paste manually in headless mode'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    elif action == 'click_mouse':
        if HEADLESS_MODE or pyautogui is None:
            return {'success': False, 'error': 'Mouse control disabled in headless mode'}
        
        x = params.get('x')
        y = params.get('y')
        try:
            # In headless mode, just report what would happen
            if x is not None and y is not None:
                return {'success': True, 'message': f'Would click at ({x}, {y})', 'headless_warning': 'Mouse control disabled'}
            return {'success': True, 'message': 'Would click at current position', 'headless_warning': 'Mouse control disabled'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    else:
        return {'success': False, 'error': f'Unknown action: {action}'}

# Import sys for version info
import sys

if __name__ == '__main__':
    print("🚀 Starting Real World Executor API Server...")
    print(f"   Headless Mode: {HEADLESS_MODE}")
    print(f"   Vision Enabled: {ENABLE_VISION}")
    print(f"   Allowed paths: {ALLOWED_ROOTS}")
    print("\n   Endpoints:")
    print("   - GET  /health          - Health check")
    print("   - POST /execute         - Execute action")
    print("   - POST /api/vision/screenshot - Take screenshot")
    print("   - POST /api/vision/analyze  - Analyze screen")
    print("\n   Running on http://localhost:5000")
    print("   Press Ctrl+C to stop\n")
    
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
