import subprocess
import json
import os
import pyautogui
import pyperclip
import requests
from pathlib import Path
from typing import Any, Dict, Optional

# Configure PyAutoGUI for safety (failsafe by moving mouse to corner)
pyautogui.FAILSAFE = True
pyautogui.PAUSE = 0.5 

class RealWorldExecutor:
    def __init__(self, allowed_dirs: list[str] = None):
        # Security: Restrict file operations to specific directories
        self.allowed_dirs = allowed_dirs or [os.path.expanduser("~")]
        
    def _is_safe_path(self, path: str) -> bool:
        abs_path = os.path.abspath(path)
        return any(abs_path.startswith(d) for d in self.allowed_dirs)

    def execute_action(self, action_type: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        The main entry point. The LLM sends a JSON object like:
        { "action": "run_shell", "params": { "command": "echo hello" } }
        """
        try:
            if action_type == "run_shell":
                return self.run_shell_command(params.get("command", ""))
            
            elif action_type == "file_write":
                return self.write_file(
                    params.get("path"), 
                    params.get("content")
                )
            
            elif action_type == "file_read":
                return self.read_file(params.get("path"))
            
            elif action_type == "browser_open":
                return self.open_browser(params.get("url"))
            
            elif action_type == "type_text":
                return self.type_text(params.get("text"))
            
            elif action_type == "click_mouse":
                return self.click_mouse(params.get("x"), params.get("y"))
            
            elif action_type == "get_system_info":
                return self.get_system_info()
                
            else:
                return {"success": False, "error": f"Unknown action: {action_type}"}
                
        except Exception as e:
            return {"success": False, "error": str(e)}

    def run_shell_command(self, command: str) -> Dict[str, Any]:
        # SECURITY WARNING: In production, validate commands strictly
        # For now, we allow powershell/cmd execution
        print(f"[EXECUTOR] Running shell: {command}")
        try:
            result = subprocess.run(
                command, 
                shell=True, 
                capture_output=True, 
                text=True, 
                timeout=30
            )
            return {
                "success": True, 
                "stdout": result.stdout, 
                "stderr": result.stderr,
                "return_code": result.returncode
            }
        except subprocess.TimeoutExpired:
            return {"success": False, "error": "Command timed out"}

    def write_file(self, path: str, content: str) -> Dict[str, Any]:
        if not self._is_safe_path(path):
            return {"success": False, "error": "Access denied: Path outside allowed directories"}
        
        print(f"[EXECUTOR] Writing to: {path}")
        try:
            Path(os.path.dirname(path)).mkdir(parents=True, exist_ok=True)
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            return {"success": True, "message": f"File written to {path}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def read_file(self, path: str) -> Dict[str, Any]:
        if not self._is_safe_path(path):
            return {"success": False, "error": "Access denied"}
        
        print(f"[EXECUTOR] Reading: {path}")
        try:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            return {"success": True, "content": content}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def open_browser(self, url: str) -> Dict[str, Any]:
        print(f"[EXECUTOR] Opening browser: {url}")
        try:
            os.startfile(url)  # Windows specific
            return {"success": True, "message": f"Opened {url}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def type_text(self, text: str) -> Dict[str, Any]:
        print(f"[EXECUTOR] Typing text: {text[:20]}...")
        pyautogui.write(text)
        return {"success": True, "message": "Text typed"}

    def click_mouse(self, x: Optional[int] = None, y: Optional[int] = None) -> Dict[str, Any]:
        if x and y:
            pyautogui.click(x, y)
            return {"success": True, "message": f"Clicked at {x},{y}"}
        else:
            pyautogui.click()
            return {"success": True, "message": "Clicked at current position"}

    def get_system_info(self) -> Dict[str, Any]:
        import psutil
        return {
            "success": True,
            "cpu_percent": psutil.cpu_percent(),
            "ram_percent": psutil.virtual_memory().percent,
            "disk_usage": psutil.disk_usage('C:\\').percent,
            "cwd": os.getcwd()
        }

# Example usage for testing directly
if __name__ == "__main__":
    executor = RealWorldExecutor()
    
    # Test 1: System Info
    print(json.dumps(executor.execute_action("get_system_info", {}), indent=2))
    
    # Test 2: Create a file
    test_file = os.path.join(os.path.expanduser("~"), "agent_test.txt")
    print(json.dumps(executor.execute_action("file_write", {
        "path": test_file,
        "content": "Hello from the Real Agent Swarm!"
    }), indent=2))
    
    # Test 3: Run a safe command
    print(json.dumps(executor.execute_action("run_shell", {
        "command": "echo Hello from PowerShell"
    }), indent=2))
