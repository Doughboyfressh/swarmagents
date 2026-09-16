"""
Real World Executor API Server
This server provides HTTP endpoints for the agent swarm to execute real-world actions.
Run this on your Windows machine with Python and required packages installed.

Usage:
    pip install flask pyautogui pyperclip psutil requests
    python real_world_server.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, Optional
import threading

# Import the executor
from real_world_executor import RealWorldExecutor

app = Flask(__name__)
CORS(app)  # Enable CORS for browser/Node.js access

# Initialize executor with safe directories
executor = RealWorldExecutor(
    allowed_dirs=[
        os.path.expanduser("~"),  # User home directory
        os.path.join(os.path.expanduser("~"), "Documents"),
        os.path.join(os.path.expanduser("~"), "Desktop"),
        os.getcwd(),  # Current working directory
    ]
)

# Action queue for batch processing
action_queue = []
is_executing = False

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'timestamp': time.time(),
        'executor_ready': True,
        'queue_size': len(action_queue)
    })

@app.route('/execute', methods=['POST'])
def execute_action():
    """
    Execute a single action immediately.
    
    Expected JSON body:
    {
        "action": "action_type",
        "params": { ... }
    }
    
    Example actions:
    - run_shell: {"command": "dir"}
    - file_write: {"path": "C:\\Users\\You\\test.txt", "content": "hello"}
    - file_read: {"path": "C:\\Users\\You\\test.txt"}
    - browser_open: {"url": "https://google.com"}
    - type_text: {"text": "Hello World"}
    - click_mouse: {"x": 100, "y": 200}
    - get_system_info: {}
    """
    try:
        data = request.get_json()
        
        if not data or 'action' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing "action" field in request'
            }), 400
        
        action_type = data['action']
        params = data.get('params', {})
        
        print(f"\n[API] Received action: {action_type}")
        print(f"[API] Params: {json.dumps(params, indent=2)}")
        
        result = executor.execute_action(action_type, params)
        
        print(f"[API] Result: {json.dumps(result, indent=2)}")
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/execute/batch', methods=['POST'])
def execute_batch():
    """
    Execute multiple actions in sequence.
    
    Expected JSON body:
    {
        "actions": [
            {"action": "action1", "params": {...}},
            {"action": "action2", "params": {...}},
            ...
        ]
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'actions' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing "actions" array in request'
            }), 400
        
        actions = data['actions']
        results = []
        
        for i, action_item in enumerate(actions):
            action_type = action_item.get('action')
            params = action_item.get('params', {})
            
            if not action_type:
                results.append({
                    'index': i,
                    'success': False,
                    'error': 'Missing action type'
                })
                continue
            
            print(f"\n[API] Batch action {i+1}/{len(actions)}: {action_type}")
            result = executor.execute_action(action_type, params)
            result['index'] = i
            results.append(result)
            
            # Stop on first failure if specified
            if data.get('stop_on_failure', False) and not result.get('success', False):
                break
        
        return jsonify({
            'success': True,
            'results': results,
            'completed': len([r for r in results if r.get('success', False)]),
            'total': len(actions)
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/queue/add', methods=['POST'])
def add_to_queue():
    """Add action to execution queue"""
    global action_queue
    
    try:
        data = request.get_json()
        
        if not data or 'action' not in data:
            return jsonify({'success': False, 'error': 'Invalid action'}), 400
        
        action_queue.append(data)
        
        return jsonify({
            'success': True,
            'queue_size': len(action_queue),
            'position': len(action_queue)
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/queue/status', methods=['GET'])
def queue_status():
    """Get current queue status"""
    return jsonify({
        'queue_size': len(action_queue),
        'is_executing': is_executing,
        'actions': action_queue[:10]  # Return first 10 for preview
    })

@app.route('/queue/clear', methods=['POST'])
def clear_queue():
    """Clear the action queue"""
    global action_queue
    action_queue = []
    return jsonify({'success': True, 'message': 'Queue cleared'})

@app.route('/system/info', methods=['GET'])
def system_info():
    """Get detailed system information"""
    import psutil
    
    try:
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('C:\\')
        
        return jsonify({
            'success': True,
            'cpu_percent': cpu_percent,
            'memory_percent': memory.percent,
            'memory_available_gb': memory.available / (1024**3),
            'memory_total_gb': memory.total / (1024**3),
            'disk_percent': disk.percent,
            'disk_free_gb': disk.free / (1024**3),
            'cwd': os.getcwd(),
            'python_version': sys.version,
            'platform': sys.platform
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/files/list', methods=['POST'])
def list_files():
    """List files in a directory"""
    try:
        data = request.get_json()
        path = data.get('path', os.getcwd())
        
        if not executor._is_safe_path(path):
            return jsonify({
                'success': False,
                'error': 'Access denied: Path outside allowed directories'
            }), 403
        
        files = os.listdir(path)
        file_info = []
        
        for f in files:
            full_path = os.path.join(path, f)
            try:
                stat = os.stat(full_path)
                file_info.append({
                    'name': f,
                    'is_directory': os.path.isdir(full_path),
                    'size': stat.st_size if os.path.isfile(full_path) else None,
                    'modified': stat.st_mtime
                })
            except:
                pass
        
        return jsonify({
            'success': True,
            'path': path,
            'files': file_info,
            'count': len(file_info)
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    print("""
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🌍 Real World Executor API Server                      ║
║                                                           ║
║   Server running on: http://localhost:5000               ║
║                                                           ║
║   Endpoints:                                              ║
║   • POST /execute         - Execute single action        ║
║   • POST /execute/batch   - Execute multiple actions     ║
║   • POST /queue/add       - Add to execution queue       ║
║   • GET  /queue/status    - Get queue status             ║
║   • POST /queue/clear     - Clear queue                  ║
║   • GET  /system/info     - System information           ║
║   • POST /files/list      - List directory contents      ║
║   • GET  /health          - Health check                 ║
║                                                           ║
║   Press Ctrl+C to stop                                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    """)
    
    # Run Flask server
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
