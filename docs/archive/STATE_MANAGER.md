# 💾 State Manager - Export/Import System

## Overview

The State Manager is a comprehensive save/load system that lets you bookmark interesting swarm configurations, share them with others, and build a library of your favorite configurations.

## Features

### 🎯 Save States
- **Name your saves** - Give each state a descriptive name
- **Add descriptions** - Document what makes this configuration interesting
- **Auto-capture metrics** - Automatically saves current swarm metrics (speed, coherence, connections)
- **Timestamp tracking** - Know exactly when each state was saved

### 📥 Import States
- **Import single states** - Load individual configurations from JSON
- **Import all states** - Bulk import multiple configurations at once
- **Validation** - Automatic validation of imported JSON format
- **Version tracking** - States include version info for future compatibility

### 📤 Export States
- **Export single state** - Download individual configurations as JSON files
- **Export all states** - Backup your entire state library
- **Human-readable JSON** - Pretty-printed JSON for easy editing
- **Share with others** - Send configurations to friends or colleagues

### 🗂️ State Library
- **Visual list** - See all your saved states in a clean, scrollable list
- **Quick load** - One-click load any saved state
- **Delete states** - Remove outdated or incorrect saves
- **Storage tracking** - See how much space your states are using
- **Persistent** - States survive browser restarts (localStorage)

## How to Use

### Saving a State

1. Configure your swarm to an interesting configuration
2. Click the **💾 Save Current** button in the State Manager panel
4. Enter a name (e.g., "High Cohesion Flocking")
6. Add an optional description (e.g., "Agents form perfect circles with cohesion=2.5")
8. Click **Save**

Your state is now saved with:
- All swarm parameters
- Current metrics snapshot
- Timestamp
- Your name and description

### Loading a State

1. Find the state you want in the saved states list
2. Click the **Load** button
3. The swarm will automatically:
   - Apply all saved parameters
   - Reinitialize with the saved settings
   - Log the state change in the event log

### Exporting States

**Export Single State:**
1. Find the state in your library
3. Click the 📤 export button
5. A JSON file will download with the state configuration

**Export All States:**
1. Click the 📤 button in the header
3. All your states will be exported as a single JSON file
5. Great for backups or sharing your entire library

### Importing States

**Import Single State:**
1. Click the **📥 Import** button
3. Open the JSON file you received
5. Paste the contents into the import dialog
7. Click **Import Single**
9. The state will be added to your library

**Import All States:**
1. Click the **📥 Import** button
3. Open the JSON file with multiple states
5. Paste the contents into the import dialog
7. Click **Import All**
9. All states will be added to your library

## JSON Format

### Single State Format

```json
{
  "version": "1.0.0",
  "timestamp": 1703456789012,
  "name": "High Cohesion Flocking",
  "description": "Agents form perfect circles with cohesion=2.5",
  "config": {
    "agentCount": 50,
    "perceptionRadius": 80,
    "separationWeight": 1.5,
    "alignmentWeight": 1.0,
    "cohesionWeight": 2.5,
    "explorationWeight": 0.5,
    "communicationRange": 120,
    "maxSpeed": 3,
    "behavior": "flocking",
    "showTrails": true,
    "showConnections": true,
    "showPerception": false,
    "speed": 1,
    "showSubSwarms": true,
    "obstacleMode": false,
    "pheromoneEnabled": false,
    "pheromoneDecay": 0.005,
    "pheromoneDiffusion": 0.01,
    "neuralNetEnabled": false,
    "evolutionEnabled": false,
    "evolutionRate": 0.05,
    "memoryEnabled": true,
    "environmentEnabled": false,
    "windStrength": 0.5,
    "windDirection": 0,
    "showHeatmap": false,
    "showFlowField": false,
    "lifecycleEnabled": false,
    "constructionEnabled": false,
    "qLearningEnabled": false
  },
  "metrics": {
    "avgSpeed": 2.3,
    "swarmCoherence": 0.85,
    "activeConnections": 127
  }
}
```

### Multiple States Format

```json
[
  {
    "version": "1.0.0",
    "timestamp": 1703456789012,
    "name": "State 1",
    "description": "First configuration",
    "config": {...},
    "metrics": {...}
  },
  {
    "version": "1.0.0",
    "timestamp": 1703456789013,
    "name": "State 2",
    "description": "Second configuration",
    "config": {...},
    "metrics": {...}
  }
]
```

## Storage

- **Location**: Browser localStorage
- **Key**: `swarm-saved-states`
- **Limit**: Depends on browser (usually 5-10 MB)
- **Persistence**: States persist across browser sessions
- **Size Display**: Panel shows current storage usage in KB

## Use Cases

### 📚 Configuration Library
Build a library of interesting swarm configurations:
- "Perfect V-Formation"
- "Chaotic Predator Chase"
- "Efficient Resource Gathering"
- "Neural Network Emergence"

### 🎓 Educational Examples
Save configurations that demonstrate specific concepts:
- "Separation vs Cohesion Balance"
- "Pheromone Trail Formation"
- "Sub-Swarm Emergence"
- "Evolution in Action"

### 🔬 Research Documentation
Document configurations for research:
- Save baseline setups
- Document parameter changes
- Track metric improvements
- Share with research collaborators

### 🎮 Scenario Sharing
Share configurations with friends:
- Export interesting setups
- Import configurations from others
- Build scenario libraries
- Create configuration challenges

### 💼 Backup & Restore
Protect your work:
- Export entire state library as backup
- Import states on different devices
- Recover from browser data loss
- Migrate to new browsers

## Technical Implementation

### StateManager Class
- **File**: `src/utils/stateManager.ts`
- **Storage**: localStorage with automatic persistence
- **Validation**: Automatic JSON structure validation
- **Versioning**: Includes version field for compatibility
- **Error Handling**: Graceful handling of storage errors

### StateManagerPanel Component
- **File**: `src/components/StateManagerPanel.tsx`
- **UI**: Clean, intuitive panel with dialogs
- **Feedback**: Success/error messages
- **Responsive**: Scrollable list for many states
- **Accessible**: Clear labels and buttons

## Tips & Best Practices

### 📝 Naming Conventions
Use descriptive names:
- ✅ "High Cohesion Flocking - 50 agents"
- ✅ "Pheromone Trail - Ant Colony Behavior"
- ❌ "Test 1"
- ❌ "Config"

### 📖 Descriptions
Add helpful descriptions:
- What makes this configuration interesting?
- What parameters are notable?
- What behavior does it demonstrate?
- Any special setup required?

### 🔄 Regular Backups
Export your states regularly:
- Click 📤 to export all states
- Save the JSON file somewhere safe
- Import if you lose your data

### 🧹 Cleanup
Delete outdated states:
- Remove test configurations
- Clean up duplicates
- Keep your library organized

## Future Enhancements

Potential improvements:
- **Tags & Categories** - Organize states with tags
- **Search & Filter** - Find states quickly
- **State Comparison** - Compare two states side-by-side
- **Auto-Save** - Automatically save interesting configurations
- **Cloud Sync** - Sync states across devices
- **State Versioning** - Track changes to configurations
- **Import from URL** - Load states from shared links
- **State Templates** - Pre-built starting configurations

## Examples

### Example 1: Sharing a Configuration

**Alice creates an interesting configuration:**
1. Sets up perfect V-formation with 30 agents
2. Saves it as "Perfect V-Formation"
3. Exports the state as JSON
4. Sends the JSON file to Bob

**Bob imports the configuration:**
1. Opens the State Manager
2. Clicks Import
3. Pastes the JSON
4. Clicks Import Single
5. Loads the "Perfect V-Formation" state
6. Sees the same V-formation Alice created

### Example 2: Building a Library

**Researcher builds a configuration library:**
1. Saves "Baseline Flocking" - basic parameters
2. Saves "High Cohesion" - increased cohesion
3. Saves "Low Separation" - decreased separation
4. Saves "Pheromone Enabled" - with pheromones
5. Saves "Neural Evolution" - with neural nets
6. Exports all states as backup
7. Uses the library for systematic research

### Example 3: Educational Use

**Teacher creates example library:**
1. Saves "Separation Demo" - shows separation force
2. Saves "Alignment Demo" - shows alignment force
3. Saves "Cohesion Demo" - shows cohesion force
4. Saves "All Forces Combined" - balanced flocking
5. Shares the library with students
6. Students import and explore each example

## Conclusion

The State Manager transforms your swarm configurations from ephemeral experiments into a persistent, shareable library. Whether you're researching swarm behavior, teaching concepts, or just having fun, the ability to save, load, export, and import states makes the system infinitely more powerful and useful.

Start building your state library today! 💾✨
