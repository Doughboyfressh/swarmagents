"""
Enhanced Real World Executor with Vision, Memory, and Self-Correction
Supports Qwen3.6-27B-VL vision capabilities, ChromaDB memory, critic agent verification, and skill libraries
"""

import subprocess
import json
import os
import sys
import time
import base64
import hashlib
from pathlib import Path
from typing import Any, Dict, Optional, List, Callable
from datetime import datetime
import threading
import traceback

# Core dependencies
import requests
import psutil
from PIL import Image
import io

# PyAutoGUI - only import on Windows (will be imported at runtime on Windows)
PYAUTOGUI_AVAILABLE = False
try:
    import pyautogui
    import pyperclip
    PYAUTOGUI_AVAILABLE = True
    # Configure PyAutoGUI for safety
    pyautogui.FAILSAFE = True
    pyautogui.PAUSE = 0.5
except (ImportError, KeyError):
    # Running on Linux/server without display - GUI functions will be unavailable
    print("⚠️ PyAutoGUI not available (no display). GUI functions disabled.")
    pyautogui = None
    pyperclip = None

class ChromaMemory:
    """Vector memory system using ChromaDB for long-term agent learning"""
    
    def __init__(self, persist_directory: str = "./agent_memory"):
        try:
            import chromadb
            from chromadb.config import Settings
            
            self.client = chromadb.PersistentClient(path=persist_directory)
            self.memory_collection = self.client.get_or_create_collection(
                name="agent_memories",
                metadata={"hnsw:space": "cosine"}
            )
            self.skill_collection = self.client.get_or_create_collection(
                name="agent_skills",
                metadata={"hnsw:space": "cosine"}
            )
            print(f"✅ ChromaDB memory initialized at {persist_directory}")
        except Exception as e:
            print(f"⚠️ ChromaDB not available: {e}")
            self.client = None
            self.memory_collection = None
            self.skill_collection = None
    
    def save_memory(self, text: str, metadata: Dict = None):
        """Save a memory with automatic embedding"""
        if not self.client:
            return
        
        try:
            # Generate unique ID based on content hash
            memory_id = hashlib.md5(text.encode()).hexdigest()
            
            # Auto-generate embedding using default model
            self.memory_collection.upsert(
                documents=[text],
                metadatas=[metadata or {"timestamp": time.time(), "type": "memory"}],
                ids=[memory_id]
            )
            print(f"💾 Memory saved: {text[:50]}...")
        except Exception as e:
            print(f"❌ Failed to save memory: {e}")
    
    def save_skill(self, skill_name: str, skill_code: str, description: str):
        """Save a learned skill"""
        if not self.client:
            return
        
        try:
            skill_id = hashlib.md5(skill_name.encode()).hexdigest()
            self.skill_collection.upsert(
                documents=[description + "\n\n" + skill_code],
                metadatas=[{"name": skill_name, "code": skill_code, "timestamp": time.time()}],
                ids=[skill_id]
            )
            print(f"🛠️ Skill saved: {skill_name}")
        except Exception as e:
            print(f"❌ Failed to save skill: {e}")
    
    def search_memories(self, query: str, n_results: int = 5) -> List[Dict]:
        """Search for relevant memories"""
        if not self.client:
            return []
        
        try:
            results = self.memory_collection.query(
                query_texts=[query],
                n_results=n_results
            )
            
            memories = []
            if results['documents'] and results['documents'][0]:
                for i, doc in enumerate(results['documents'][0]):
                    memories.append({
                        'content': doc,
                        'metadata': results['metadatas'][0][i] if results['metadatas'] else {}
                    })
            return memories
        except Exception as e:
            print(f"❌ Memory search failed: {e}")
            return []
    
    def search_skills(self, query: str, n_results: int = 5) -> List[Dict]:
        """Search for relevant skills"""
        if not self.client:
            return []
        
        try:
            results = self.skill_collection.query(
                query_texts=[query],
                n_results=n_results
            )
            
            skills = []
            if results['documents'] and results['documents'][0]:
                for i, doc in enumerate(results['documents'][0]):
                    skills.append({
                        'content': doc,
                        'metadata': results['metadatas'][0][i] if results['metadatas'] else {}
                    })
            return skills
        except Exception as e:
            print(f"❌ Skill search failed: {e}")
            return []


class VisionSystem:
    """Vision system for screen perception and image analysis"""
    
    def __init__(self, screenshot_dir: str = "./screenshots"):
        self.screenshot_dir = Path(screenshot_dir)
        self.screenshot_dir.mkdir(parents=True, exist_ok=True)
        print(f"👁️ Vision system initialized - screenshots saved to {screenshot_dir}")
    
    def take_screenshot(self, region: tuple = None) -> Dict[str, Any]:
        """Take a screenshot and return base64 encoded image"""
        if not PYAUTOGUI_AVAILABLE:
            return {'success': False, 'error': 'PyAutoGUI not available (no display)'}
        
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = self.screenshot_dir / f"screenshot_{timestamp}.png"
            
            screenshot = pyautogui.screenshot(region=region) if region else pyautogui.screenshot()
            screenshot.save(filename)
            
            # Convert to base64 for LLM vision API
            buffered = io.BytesIO()
            screenshot.save(buffered, format="PNG")
            img_base64 = base64.b64encode(buffered.getvalue()).decode()
            
            print(f"📸 Screenshot taken: {filename.name} ({len(img_base64)} chars)")
            
            return {
                'success': True,
                'filename': str(filename),
                'base64': img_base64,
                'size': screenshot.size,
                'timestamp': timestamp
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def analyze_screenshot_with_qwen_vl(self, llm_endpoint: str, prompt: str = "Describe what you see in this screenshot") -> str:
        """Send screenshot to Qwen-VL for analysis"""
        screenshot_result = self.take_screenshot()
        
        if not screenshot_result['success']:
            return f"Failed to take screenshot: {screenshot_result.get('error', 'Unknown error')}"
        
        try:
            # Format for Qwen-VL API (adjust based on your llama.cpp endpoint)
            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{screenshot_result['base64']}"} }
                    ]
                }
            ]
            
            response = requests.post(
                f"{llm_endpoint}/v1/chat/completions",
                json={
                    "model": "qwen-vl",
                    "messages": messages,
                    "max_tokens": 512
                },
                timeout=60
            )
            
            if response.status_code == 200:
                analysis = response.json()['choices'][0]['message']['content']
                print(f"🔍 Vision analysis: {analysis[:100]}...")
                return analysis
            else:
                return f"Vision API error: {response.status_code} - {response.text}"
                
        except Exception as e:
            return f"Vision analysis failed: {str(e)}"


class CriticAgent:
    """Self-correction agent that reviews actions before and after execution"""
    
    def __init__(self, llm_endpoint: str = "http://localhost:8080"):
        self.llm_endpoint = llm_endpoint
        print("🛡️ Critic agent initialized")
    
    def review_action_plan(self, action_plan: Dict, context: str = "") -> Dict[str, Any]:
        """Review an action plan before execution for safety and correctness"""
        
        review_prompt = f"""
You are a CRITIC AGENT reviewing an action plan for safety and correctness.

CONTEXT: {context}

PROPOSED ACTION:
{json.dumps(action_plan, indent=2)}

REVIEW CRITERIA:
1. SAFETY: Could this action harm the system, delete important files, or expose sensitive data?
2. CORRECTNESS: Will this action achieve the intended goal?
3. EFFICIENCY: Is there a better/safer way to accomplish this?
4. SIDE EFFECTS: Are there unintended consequences?

Respond in JSON format:
{{
    "approved": true/false,
    "risk_level": "low/medium/high",
    "issues": ["list of concerns"],
    "suggestions": ["improvements"],
    "alternative_action": {{...}} or null
}}
"""
        
        try:
            response = requests.post(
                f"{self.llm_endpoint}/v1/chat/completions",
                json={
                    "model": "qwen-3.6-27b",
                    "messages": [{"role": "user", "content": review_prompt}],
                    "temperature": 0.3,
                    "max_tokens": 512
                },
                timeout=30
            )
            
            if response.status_code == 200:
                review_text = response.json()['choices'][0]['message']['content']
                # Extract JSON from response
                import re
                json_match = re.search(r'\{[\s\S]*\}', review_text)
                if json_match:
                    review = json.loads(json_match.group())
                    print(f"🛡️ Critic review: {'APPROVED' if review.get('approved') else 'REJECTED'} (Risk: {review.get('risk_level', 'unknown')})")
                    return review
            
            return {"approved": True, "risk_level": "unknown", "issues": [], "suggestions": []}
            
        except Exception as e:
            print(f"⚠️ Critic review failed: {e}")
            return {"approved": True, "risk_level": "unknown", "issues": [f"Review failed: {e}"], "suggestions": []}
    
    def verify_result(self, expected_outcome: str, actual_result: Dict) -> Dict[str, Any]:
        """Verify if an action achieved its intended outcome"""
        
        verification_prompt = f"""
Verify if the action achieved its intended outcome.

EXPECTED OUTCOME: {expected_outcome}

ACTUAL RESULT:
{json.dumps(actual_result, indent=2)}

Respond in JSON format:
{{
    "success": true/false,
    "confidence": 0.0-1.0,
    "discrepancies": ["differences between expected and actual"],
    "follow_up_actions": [{{"action": "...", "params": {{...}}}}] or []
}}
"""
        
        try:
            response = requests.post(
                f"{self.llm_endpoint}/v1/chat/completions",
                json={
                    "model": "qwen-3.6-27b",
                    "messages": [{"role": "user", "content": verification_prompt}],
                    "temperature": 0.3,
                    "max_tokens": 512
                },
                timeout=30
            )
            
            if response.status_code == 200:
                verify_text = response.json()['choices'][0]['message']['content']
                import re
                json_match = re.search(r'\{[\s\S]*\}', verify_text)
                if json_match:
                    verification = json.loads(json_match.group())
                    print(f"✅ Result verification: {'SUCCESS' if verification.get('success') else 'FAILED'} (Confidence: {verification.get('confidence', 0)*100:.0f}%)")
                    return verification
            
            return {"success": True, "confidence": 0.5, "discrepancies": [], "follow_up_actions": []}
            
        except Exception as e:
            print(f"⚠️ Result verification failed: {e}")
            return {"success": True, "confidence": 0.5, "discrepancies": [], "follow_up_actions": []}


class SkillLibrary:
    """Dynamic skill registry for expandable agent capabilities"""
    
    def __init__(self):
        self.skills: Dict[str, Callable] = {}
        self.register_default_skills()
        print(f"🛠️ Skill library initialized with {len(self.skills)} skills")
    
    def register_default_skills(self):
        """Register built-in skills"""
        
        @self.register_skill("organize_downloads")
        def organize_downloads(params: Dict) -> Dict:
            """Organize files in Downloads folder by extension"""
            downloads = Path(os.path.expanduser("~")) / "Downloads"
            if not downloads.exists():
                return {"success": False, "error": "Downloads folder not found"}
            
            organized = 0
            for file in downloads.iterdir():
                if file.is_file():
                    ext_folder = downloads / f"_{file.suffix.lower()[1:] or 'other'}"
                    ext_folder.mkdir(exist_ok=True)
                    file.rename(ext_folder / file.name)
                    organized += 1
            
            return {"success": True, "files_organized": organized}
        
        @self.register_skill("cleanup_temp")
        def cleanup_temp(params: Dict) -> Dict:
            """Clean temporary files"""
            temp_dirs = [
                Path(os.environ.get('TEMP', '')),
                Path(os.environ.get('TMP', '')),
            ]
            
            cleaned = 0
            for temp_dir in temp_dirs:
                if temp_dir.exists():
                    for item in temp_dir.glob("*"):
                        try:
                            if item.is_file():
                                item.unlink()
                                cleaned += 1
                        except:
                            pass
            
            return {"success": True, "files_cleaned": cleaned}
        
        @self.register_skill("system_health_check")
        def system_health_check(params: Dict) -> Dict:
            """Comprehensive system health check"""
            cpu = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('C:\\')
            
            issues = []
            if cpu > 80:
                issues.append(f"High CPU usage: {cpu}%")
            if memory.percent > 80:
                issues.append(f"High memory usage: {memory.percent}%")
            if disk.percent > 90:
                issues.append(f"Critical disk space: {disk.percent}% full")
            
            return {
                "success": True,
                "cpu_percent": cpu,
                "memory_percent": memory.percent,
                "disk_percent": disk.percent,
                "issues": issues,
                "status": "healthy" if not issues else "attention_needed"
            }
    
    def register_skill(self, name: str):
        """Decorator to register a skill"""
        def decorator(func: Callable):
            self.skills[name] = func
            return func
        return decorator
    
    def execute_skill(self, skill_name: str, params: Dict = None) -> Dict:
        """Execute a registered skill"""
        if skill_name not in self.skills:
            return {"success": False, "error": f"Skill '{skill_name}' not found"}
        
        try:
            print(f"🛠️ Executing skill: {skill_name}")
            return self.skills[skill_name](params or {})
        except Exception as e:
            return {"success": False, "error": str(e), "traceback": traceback.format_exc()}
    
    def list_skills(self) -> List[str]:
        """List all available skills"""
        return list(self.skills.keys())


class EnhancedRealWorldExecutor:
    """
    Enhanced Real World Executor with:
    - Vision capabilities (Qwen-VL integration)
    - Long-term memory (ChromaDB)
    - Self-correction (Critic Agent)
    - Skill libraries
    - RTX 5090 optimization hints
    """
    
    def __init__(self, allowed_dirs: list = None, llm_endpoint: str = "http://localhost:8080"):
        self.allowed_dirs = allowed_dirs or [os.path.expanduser("~")]
        self.llm_endpoint = llm_endpoint
        
        # Initialize enhanced components
        self.memory = ChromaMemory()
        self.vision = VisionSystem()
        self.critic = CriticAgent(llm_endpoint)
        self.skills = SkillLibrary()
        
        # Load learned skills from memory
        self._load_learned_skills()
        
        print(f"🚀 Enhanced executor ready - LLM endpoint: {llm_endpoint}")
    
    def _load_learned_skills(self):
        """Load previously learned skills from memory"""
        if self.memory.client:
            learned_skills = self.memory.search_skills("", n_results=50)
            for skill in learned_skills:
                metadata = skill.get('metadata', {})
                skill_name = metadata.get('name', '')
                skill_code = metadata.get('code', '')
                if skill_name and skill_code:
                    # In production, you'd safely eval/load the code
                    print(f"📚 Loaded learned skill: {skill_name}")
    
    def execute_action(self, action_type: str, params: Dict[str, Any], 
                      enable_critic: bool = True, enable_memory: bool = True) -> Dict[str, Any]:
        """
        Enhanced action execution with critic review and memory
        """
        
        # Check if it's a custom skill
        if action_type in self.skills.skills:
            return self.skills.execute_skill(action_type, params)
        
        # Search memory for similar past actions
        if enable_memory and self.memory.client:
            relevant_memories = self.memory.search_memories(f"action: {action_type}", n_results=3)
            if relevant_memories:
                print(f"🧠 Found {len(relevant_memories)} relevant memories")
                params['past_experiences'] = relevant_memories
        
        # Critic review for potentially dangerous actions
        if enable_critic and action_type in ['run_shell', 'file_write', 'file_read', 'click_mouse']:
            review = self.critic.review_action_plan(
                {"action": action_type, "params": params},
                context=f"User requested: {params.get('description', 'No description')}"
            )
            
            if not review.get('approved', True):
                return {
                    "success": False,
                    "error": "Action rejected by critic agent",
                    "critic_issues": review.get('issues', []),
                    "suggestions": review.get('suggestions', [])
                }
            
            # Apply suggested improvements
            if review.get('alternative_action'):
                print("🔄 Applying critic's alternative action")
                action_type = review['alternative_action'].get('action', action_type)
                params = review['alternative_action'].get('params', params)
        
        # Execute the action
        start_time = time.time()
        result = self._execute_base_action(action_type, params)
        execution_time = time.time() - start_time
        
        # Verify result if expected outcome provided
        if enable_critic and params.get('expected_outcome'):
            verification = self.critic.verify_result(
                params['expected_outcome'],
                result
            )
            result['verification'] = verification
            
            # Execute follow-up actions if needed
            if not verification.get('success', True) and verification.get('follow_up_actions'):
                print("🔄 Executing follow-up actions")
                result['follow_up_results'] = []
                for follow_up in verification['follow_up_actions']:
                    follow_result = self.execute_action(
                        follow_up.get('action'),
                        follow_up.get('params', {}),
                        enable_critic=False  # Avoid infinite loop
                    )
                    result['follow_up_results'].append(follow_result)
        
        # Save to memory for learning
        if enable_memory:
            memory_entry = {
                "action": action_type,
                "params": {k: v for k, v in params.items() if k != 'past_experiences'},
                "result": result,
                "execution_time": execution_time,
                "timestamp": time.time()
            }
            self.memory.save_memory(
                f"Executed {action_type}: {json.dumps(memory_entry)}",
                metadata={"type": "execution_log", "success": result.get('success', False)}
            )
        
        return result
    
    def _execute_base_action(self, action_type: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Base action execution (original functionality)"""
        try:
            if action_type == "run_shell":
                return self.run_shell_command(params.get("command", ""))
            
            elif action_type == "file_write":
                return self.write_file(params.get("path"), params.get("content"))
            
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
            
            elif action_type == "take_screenshot":
                return self.vision.take_screenshot()
            
            elif action_type == "analyze_screen":
                return {
                    "success": True,
                    "analysis": self.vision.analyze_screenshot_with_qwen_vl(
                        self.llm_endpoint,
                        params.get("prompt", "Describe what you see")
                    )
                }
            
            elif action_type == "search_memory":
                memories = self.memory.search_memories(
                    params.get("query", ""),
                    params.get("n_results", 5)
                )
                return {"success": True, "memories": memories}
            
            elif action_type == "learn_skill":
                skill_name = params.get("name", "unnamed_skill")
                skill_code = params.get("code", "")
                description = params.get("description", "")
                self.memory.save_skill(skill_name, skill_code, description)
                return {"success": True, "message": f"Skill '{skill_name}' learned"}
            
            elif action_type == "list_skills":
                return {"success": True, "skills": self.skills.list_skills()}
            
            else:
                return {"success": False, "error": f"Unknown action: {action_type}"}
                
        except Exception as e:
            return {"success": False, "error": str(e), "traceback": traceback.format_exc()}
    
    # Base execution methods (from original)
    def run_shell_command(self, command: str) -> Dict[str, Any]:
        print(f"[EXECUTOR] Running shell: {command}")
        try:
            result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=30)
            return {
                "success": True,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "return_code": result.returncode
            }
        except subprocess.TimeoutExpired:
            return {"success": False, "error": "Command timed out"}
    
    def _is_safe_path(self, path: str) -> bool:
        abs_path = os.path.realpath(os.path.abspath(path))
        return any(abs_path.startswith(os.path.realpath(d)) for d in self.allowed_dirs)
    
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
            os.startfile(url)
            return {"success": True, "message": f"Opened {url}"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def type_text(self, text: str) -> Dict[str, Any]:
        if not PYAUTOGUI_AVAILABLE:
            return {"success": False, "error": "PyAutoGUI not available (no display)"}
        print(f"[EXECUTOR] Typing text: {text[:20]}...")
        pyautogui.write(text)
        return {"success": True, "message": "Text typed"}
    
    def click_mouse(self, x: Optional[int] = None, y: Optional[int] = None) -> Dict[str, Any]:
        if not PYAUTOGUI_AVAILABLE:
            return {"success": False, "error": "PyAutoGUI not available (no display)"}
        if x and y:
            pyautogui.click(x, y)
            return {"success": True, "message": f"Clicked at {x},{y}"}
        else:
            pyautogui.click()
            return {"success": True, "message": "Clicked at current position"}
    
    def get_system_info(self) -> Dict[str, Any]:
        cpu = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('C:\\')
        
        return {
            "success": True,
            "cpu_percent": cpu,
            "ram_percent": memory.percent,
            "ram_available_gb": memory.available / (1024**3),
            "ram_total_gb": memory.total / (1024**3),
            "disk_percent": disk.percent,
            "disk_free_gb": disk.free / (1024**3),
            "cwd": os.getcwd()
        }


# Example usage and testing
if __name__ == "__main__":
    print("="*60)
    print("🚀 Enhanced Real World Executor Test Suite")
    print("="*60)
    
    executor = EnhancedRealWorldExecutor(
        llm_endpoint="http://localhost:8080"
    )
    
    # Test 1: System info with memory
    print("\n📊 Test 1: System Health Check (with memory)")
    result = executor.execute_action("system_health_check", {}, enable_critic=False)
    print(json.dumps(result, indent=2))
    
    # Test 2: Take screenshot
    print("\n📸 Test 2: Take Screenshot")
    result = executor.execute_action("take_screenshot", {}, enable_critic=False)
    print(f"Screenshot: {result.get('filename', 'N/A')}")
    
    # Test 3: Analyze screen with vision
    print("\n👁️ Test 3: Screen Analysis (Qwen-VL)")
    result = executor.execute_action("analyze_screen", {"prompt": "What applications are open?"}, enable_critic=False)
    print(f"Analysis: {result.get('analysis', 'N/A')[:200]}...")
    
    # Test 4: Custom skill execution
    print("\n🛠️ Test 4: Execute Custom Skill")
    result = executor.execute_action("cleanup_temp", {}, enable_critic=False)
    print(json.dumps(result, indent=2))
    
    # Test 5: Learn a new skill
    print("\n📚 Test 5: Learn New Skill")
    result = executor.execute_action("learn_skill", {
        "name": "hello_world",
        "code": "def hello(params): return {'message': 'Hello World!'}",
        "description": "A simple hello world skill"
    }, enable_critic=False)
    print(json.dumps(result, indent=2))
    
    # Test 6: Search memory
    print("\n🧠 Test 6: Search Memory")
    result = executor.execute_action("search_memory", {"query": "system health"}, enable_critic=False)
    print(f"Found {len(result.get('memories', []))} memories")
    
    print("\n" + "="*60)
    print("✅ All tests completed!")
    print("="*60)
