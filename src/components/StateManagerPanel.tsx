import React, { useState } from 'react';
import { StateManager, SavedState } from '../utils/stateManager';
import { SwarmConfig } from '../types/swarm';

interface StateManagerPanelProps {
  stateManager: StateManager;
  currentConfig: SwarmConfig;
  onLoadState: (config: SwarmConfig) => void;
  currentMetrics?: any;
}

export const StateManagerPanel: React.FC<StateManagerPanelProps> = ({
  stateManager,
  currentConfig,
  onLoadState,
  currentMetrics,
}) => {
  const [savedStates, setSavedStates] = useState<SavedState[]>(stateManager.getAllStates());
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [importJson, setImportJson] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const refreshStates = () => {
    setSavedStates(stateManager.getAllStates());
  };

  const handleSave = () => {
    if (!saveName.trim()) {
      showMessage('error', 'Please enter a name');
      return;
    }

    stateManager.saveState(
      saveName.trim(),
      saveDescription.trim(),
      currentConfig,
      currentMetrics
    );

    refreshStates();
    setShowSaveDialog(false);
    setSaveName('');
    setSaveDescription('');
    showMessage('success', 'State saved successfully!');
  };

  const handleLoad = (index: number) => {
    const state = stateManager.loadState(index);
    if (state) {
      onLoadState(state.config);
      showMessage('success', `Loaded: ${state.name}`);
    }
  };

  const handleDelete = (index: number) => {
    if (confirm('Are you sure you want to delete this saved state?')) {
      stateManager.deleteState(index);
      refreshStates();
      showMessage('success', 'State deleted');
    }
  };

  const handleExport = (index: number) => {
    const json = stateManager.exportState(index);
    downloadJson(json, `swarm-state-${Date.now()}.json`);
    showMessage('success', 'State exported!');
  };

  const handleExportAll = () => {
    const json = stateManager.exportAllStates();
    downloadJson(json, `swarm-all-states-${Date.now()}.json`);
    showMessage('success', 'All states exported!');
  };

  const handleImport = () => {
    if (!importJson.trim()) {
      showMessage('error', 'Please paste JSON data');
      return;
    }

    const state = stateManager.importState(importJson);
    if (state) {
      refreshStates();
      setShowImportDialog(false);
      setImportJson('');
      showMessage('success', 'State imported successfully!');
    } else {
      showMessage('error', 'Failed to import: Invalid JSON format');
    }
  };

  const handleImportAll = () => {
    if (!importJson.trim()) {
      showMessage('error', 'Please paste JSON data');
      return;
    }

    const count = stateManager.importAllStates(importJson);
    if (count > 0) {
      refreshStates();
      setShowImportDialog(false);
      setImportJson('');
      showMessage('success', `Imported ${count} state(s)!`);
    } else {
      showMessage('error', 'Failed to import: Invalid JSON format');
    }
  };

  const downloadJson = (json: string, filename: string) => {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const storageSize = stateManager.getStorageSize();

  return (
    <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-xl p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-1.5">
          💾 State Manager
        </h3>
        <div className="text-[9px] text-gray-500">
          {savedStates.length} saved | {storageSize.toFixed(1)} KB
        </div>
      </div>

      {/* Message Toast */}
      {message && (
        <div className={`text-[10px] px-2 py-1 rounded ${
          message.type === 'success' 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {message.text}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowSaveDialog(true)}
          className="flex-1 px-2 py-1 rounded text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all"
        >
          💾 Save Current
        </button>
        <button
          onClick={() => setShowImportDialog(true)}
          className="flex-1 px-2 py-1 rounded text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 transition-all"
        >
          📥 Import
        </button>
        {savedStates.length > 0 && (
          <button
            onClick={handleExportAll}
            className="px-2 py-1 rounded text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-all"
            title="Export all states"
          >
            📤
          </button>
        )}
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="bg-gray-800/50 border border-gray-700/30 rounded-lg p-2 space-y-2">
          <input
            type="text"
            placeholder="State name *"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            className="w-full px-2 py-1 rounded text-[10px] bg-gray-900 border border-gray-700 text-gray-300 focus:border-cyan-500 focus:outline-none"
          />
          <textarea
            placeholder="Description (optional)"
            value={saveDescription}
            onChange={(e) => setSaveDescription(e.target.value)}
            className="w-full px-2 py-1 rounded text-[10px] bg-gray-900 border border-gray-700 text-gray-300 focus:border-cyan-500 focus:outline-none resize-none"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 px-2 py-1 rounded text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30"
            >
              Save
            </button>
            <button
              onClick={() => {
                setShowSaveDialog(false);
                setSaveName('');
                setSaveDescription('');
              }}
              className="px-2 py-1 rounded text-[10px] bg-gray-700 text-gray-400 border border-gray-600 hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="bg-gray-800/50 border border-gray-700/30 rounded-lg p-2 space-y-2">
          <textarea
            placeholder="Paste JSON data here..."
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            className="w-full px-2 py-1 rounded text-[10px] bg-gray-900 border border-gray-700 text-gray-300 focus:border-purple-500 focus:outline-none resize-none font-mono"
            rows={4}
          />
          <div className="flex gap-2">
            <button
              onClick={handleImport}
              className="flex-1 px-2 py-1 rounded text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30"
            >
              Import Single
            </button>
            <button
              onClick={handleImportAll}
              className="flex-1 px-2 py-1 rounded text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30"
            >
              Import All
            </button>
            <button
              onClick={() => {
                setShowImportDialog(false);
                setImportJson('');
              }}
              className="px-2 py-1 rounded text-[10px] bg-gray-700 text-gray-400 border border-gray-600 hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Saved States List */}
      <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
        {savedStates.length === 0 ? (
          <div className="text-[10px] text-gray-600 text-center py-4">
            No saved states yet
          </div>
        ) : (
          savedStates.map((state, index) => (
            <div
              key={index}
              className="bg-gray-800/30 border border-gray-700/30 rounded-lg p-2 space-y-1 hover:border-cyan-500/30 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-semibold text-gray-300 truncate">
                    {state.name}
                  </div>
                  {state.description && (
                    <div className="text-[9px] text-gray-500 truncate">
                      {state.description}
                    </div>
                  )}
                  <div className="text-[8px] text-gray-600">
                    {formatDate(state.timestamp)}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleLoad(index)}
                    className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30"
                    title="Load this state"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => handleExport(index)}
                    className="px-1.5 py-0.5 rounded text-[9px] bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                    title="Export this state"
                  >
                    📤
                  </button>
                  <button
                    onClick={() => handleDelete(index)}
                    className="px-1.5 py-0.5 rounded text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                    title="Delete this state"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              {state.metrics && (
                <div className="flex gap-2 text-[8px] text-gray-500 pt-1 border-t border-gray-700/30">
                  <span>Speed: {state.metrics.avgSpeed?.toFixed(1)}</span>
                  <span>Coherence: {((state.metrics.swarmCoherence || 0) * 100).toFixed(0)}%</span>
                  <span>Links: {state.metrics.activeConnections}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
