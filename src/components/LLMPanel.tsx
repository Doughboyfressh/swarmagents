import { useState, useEffect, useRef } from 'react';
import { LLMService } from '../utils/llmService';
import { SwarmMetrics } from '../types/swarm';

interface LLMPanelProps {
  llmService: LLMService;
  getContext: () => SwarmMetrics;
}

export default function LLMPanel({ llmService, getContext }: LLMPanelProps) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState(llmService.getStats());
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState(llmService.getConfig());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const history = llmService.getHistory().filter(m => m.role !== 'system');
    setMessages(history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(llmService.getStats());
      setIsConnected(llmService.getStats().isConnected);
    }, 1000);
    return () => clearInterval(interval);
  }, [llmService]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const context = getContext();
      const response = await llmService.chat(userMessage, context);

      // Display action if LLM returned one
      if (response.action) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `🔧 **Executing Action**: ${JSON.stringify(response.action, null, 2)}` 
        }]);
        
        // Execute the action via backend
        try {
          const result = await fetch('http://localhost:3001/api/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: response.action.action,
              params: response.action.params
            }),
          });
          const executionResult = await result.json();
          
          if (executionResult.success) {
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              content: `✅ **Action Completed**: ${executionResult.message || JSON.stringify(executionResult)}` 
            }]);
          } else {
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              content: `❌ **Action Failed**: ${executionResult.error}` 
            }]);
          }
        } catch (execError) {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: `❌ **Execution Error**: ${execError instanceof Error ? execError.message : 'Unknown error'}` 
          }]);
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', content: response.content }]);
      setStats(llmService.getStats());
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error communicating with LLM server.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    const connected = await llmService.testConnection();
    setIsConnected(connected);
    setStats(llmService.getStats());
  };

  const handleConfigUpdate = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    llmService.updateConfig(newConfig);
  };

  const handleClearHistory = () => {
    llmService.clearHistory();
    setMessages([]);
  };

  return (
    <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-xl p-3 space-y-2 flex flex-col h-[400px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">💬 Qwen Chat</h3>
          <span className="text-[9px] text-gray-500">Ask questions</span>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 hover:text-gray-300 border border-gray-700/50"
        >
          ⚙️
        </button>
      </div>

      {showSettings && (
        <div className="bg-gray-800/50 rounded-lg p-2 space-y-2 border border-gray-700/30">
          <div className="flex items-center gap-2">
            <label className="text-[9px] text-gray-500 w-16">Endpoint:</label>
            <input
              type="text"
              value={config.endpoint}
              onChange={(e) => handleConfigUpdate('endpoint', e.target.value)}
              className="flex-1 px-2 py-0.5 rounded text-[10px] bg-gray-900 border border-gray-700 text-gray-300 focus:border-cyan-500 focus:outline-none"
              placeholder="http://localhost:8080"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[9px] text-gray-500 w-16">Temp:</label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={config.temperature}
              onChange={(e) => handleConfigUpdate('temperature', parseFloat(e.target.value))}
              className="flex-1 h-1 bg-gray-700 rounded appearance-none cursor-pointer accent-cyan-500"
            />
            <span className="text-[9px] text-gray-400 w-6 text-right">{config.temperature}</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[9px] text-gray-500 w-16">Max Tokens:</label>
            <input
              type="number"
              value={config.maxTokens}
              onChange={(e) => handleConfigUpdate('maxTokens', parseInt(e.target.value))}
              className="flex-1 px-2 py-0.5 rounded text-[10px] bg-gray-900 border border-gray-700 text-gray-300 focus:border-cyan-500 focus:outline-none"
              min="64"
              max="4096"
            />
          </div>
          <button
            onClick={handleTestConnection}
            className="w-full px-2 py-1 rounded text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30"
          >
            Test Connection
          </button>
          <button
            onClick={handleClearHistory}
            className="w-full px-2 py-1 rounded text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
          >
            Clear History
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {messages.length === 0 && (
          <div className="text-center text-[10px] text-gray-600 py-8">
            <div className="text-2xl mb-2">🧠</div>
            <div>Chat with your swarm intelligence</div>
            <div className="text-[9px] mt-1">Ask questions about the swarm</div>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`rounded-lg p-2 text-[10px] ${
              msg.role === 'user'
                ? 'bg-blue-500/10 border border-blue-500/20 text-blue-200 ml-4'
                : 'bg-gray-800/50 border border-gray-700/30 text-gray-300 mr-4'
            }`}
          >
            <div className="font-semibold text-[9px] mb-0.5 opacity-60">
              {msg.role === 'user' ? 'You' : 'Qwen'}
            </div>
            <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
          </div>
        ))}
        {isLoading && (
          <div className="bg-gray-800/50 border border-gray-700/30 rounded-lg p-2 mr-4">
            <div className="flex items-center gap-2 text-[10px] text-gray-400">
              <div className="flex gap-0.5">
                <div className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span>Qwen is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-1">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about the swarm..."
          disabled={isLoading || !config.enabled}
          className="flex-1 px-2 py-1 rounded text-[10px] bg-gray-800 border border-gray-700 text-gray-300 placeholder-gray-600 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim() || !config.enabled}
          className="px-3 py-1 rounded text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ➤
        </button>
      </div>

      <div className="flex justify-between text-[8px] text-gray-600 pt-1 border-t border-gray-800">
        <span>Calls: {stats.totalCalls} | Failed: {stats.failedCalls}</span>
        <span>Tokens: {stats.totalTokens}</span>
      </div>
    </div>
  );
}
