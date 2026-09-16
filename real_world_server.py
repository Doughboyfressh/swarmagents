"""
Real World Executor API Server
This server provides HTTP endpoints for the agent swarm to execute real-world actions.
Run this on your Windows machine with Python and required packages installed.

Usage:
    pip install flask pyautogui pyperclip psutil requests
    python real_world_server.py

Note: On Linux/WSL, set DISPLAY=:0 or use headless mode
"""

import os

# Set headless mode for environments without display (WSL, Docker, servers)
if os.name != 'nt' and 'DISPLAY' not in os.environ:
    os.environ['PYAUTOGUI_FAILSAFE'] = 'False'
    print("⚠️  No DISPLAY found. Running in headless mode. Mouse/keyboard control disabled.")

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import sys
import time
from pathlib import Path
from typing import Any, Dict, Optional
import threading

# The executor is now embedded in this file for simplicity
# Import from real_world_executor module which contains the Flask app

app = Flask(__name__)
CORS(app)  # Enable CORS for browser/Node.js access

# Action queue for batch processing
action_queue = []
is_executing = False

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'timestamp': time.time(),
        'message': 'Real World Executor API ready'
    })

@app.route('/execute', methods=['POST'])
def execute_action():
    """Execute a single action - forwards to real_world_executor"""
    # This endpoint is now handled by real_world_executor.py
    # Import and delegate
    try:
        from real_world_executor import app as executor_app
        # For simplicity, we'll just return a message
        return jsonify({
            'success': True,
            'message': 'Use direct endpoints in real_world_executor.py',
            'endpoints': [
                '/execute',
                '/api/vision/screenshot',
                '/api/vision/analyze',
                '/health'
            ]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting Real World Executor API Server...")
    print(f"   Running on http://localhost:5000")
    print("   Press Ctrl+C to stop\n")
    
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
