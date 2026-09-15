# 🧬 Agent Swarm Intelligence System

A sophisticated multi-agent simulation system featuring emergent collective behavior, neural networks, evolutionary algorithms, and advanced swarm intelligence patterns.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![Vite](https://img.shields.io/badge/Vite-6.4-646cff)

## 🎯 Overview

This system simulates autonomous agents that exhibit complex emergent behaviors through simple local rules. Watch as agents flock together, gather resources, form patterns, and adapt to their environment in real-time.

## ✨ Features

### Core Simulation
- **Boids Algorithm**: Classic separation, alignment, and cohesion behaviors
- **Multiple Behavior Modes**: 8 different swarm behaviors including flocking, search & rescue, resource gathering, V-formation, patrol, consensus, predator/prey, and neural evolution
- **Real-time Physics**: Vector-based movement with forces, acceleration, and velocity
- **Energy System**: Agents consume energy and must gather resources to survive
- **Trail Rendering**: Visualize agent paths with fading trails

### Advanced Intelligence
- **Neural Networks**: Each agent has its own neural network brain (6→8→4 architecture)
- **Evolutionary Algorithms**: Agents evolve through natural selection with mutation and crossover
- **Personality Traits**: Agents have unique personalities (curiosity, sociability, aggression, caution, efficiency)
- **Fitness-Based Selection**: The fittest agents survive and reproduce
- **Adaptive Behavior**: Agents learn and adapt through Q-learning

### Visualization
- **Real-time Canvas Rendering**: Smooth 60 FPS visualization
- **Agent States**: Visual indicators for different agent states (idle, moving, communicating, working, fleeing, alert)
- **Resource Visualization**: Animated resources with glow effects and type indicators
- **Connection Lines**: Show agent communication networks
- **Energy Bars**: Real-time energy level display for each agent
- **Directional Indicators**: Agents point in their direction of movement

### Interactive Controls
- **Behavior Selection**: Switch between 8 different swarm behaviors
- **Parameter Tuning**: Adjust separation, alignment, cohesion, exploration, perception radius, and speed
- **Agent Management**: Add or remove agents dynamically (5-120 agents)
- **Visualization Toggles**: Enable/disable trails, connections, and perception ranges
- **Pause/Resume**: Control simulation timing
- **Reset**: Start fresh with new random configuration

### Metrics & Analytics
- **Real-time Statistics**: Speed, coherence, fitness, connections, messages, resources, energy
- **Performance Monitoring**: Track swarm performance metrics
- **Visual Indicators**: Color-coded stat cards with progress bars

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd agent-swarm

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Usage

1. **Open the application** in your browser (default: http://localhost:5173)
2. **Select a behavior mode** from the left panel
3. **Adjust parameters** to see how they affect swarm behavior
4. **Click on the canvas** to add resources for agents to gather
5. **Watch the swarm** exhibit emergent collective behavior

## 🎮 Behavior Modes

### 🐦 Flocking
Classic boids algorithm with separation, alignment, and cohesion. Agents form natural flocking patterns.

### 🔍 Search & Rescue
Explorers spread out to discover resources while workers converge on discovered locations.

### ⛏️ Resource Gathering
Agents efficiently locate and collect scattered resources, demonstrating optimization behavior.

### ✈️ V-Formation
Agents maintain a V-shaped formation, mimicking bird flight patterns for aerodynamic efficiency.

### 🛡️ Grid Patrol
Agents systematically cover the environment in a grid pattern, ensuring complete area coverage.

### 🤝 Consensus
All agents converge on a moving target point, demonstrating collective decision-making.

### 🐺 Predator/Prey
Scouts chase the swarm while workers flee, creating dynamic chase patterns.

### 🧠 Neural Evolution
Agents use neural networks to make decisions, evolving better strategies over generations.

## 🧠 Technical Architecture

### Core Components

#### Swarm Engine (`src/utils/swarmEngine.ts`)
- Vector mathematics (add, sub, mul, div, normalize, limit)
- Boids algorithm implementation
- Agent creation and update logic
- Behavior-specific force calculations
- Metrics calculation

#### Types (`src/types/swarm.ts`)
- Agent interface with neural networks, memory, traits
- Resource and environment types
- Configuration and metrics interfaces
- Event and state management types

#### Visualization (`src/components/SwarmCanvas.tsx`)
- Canvas-based rendering
- Agent visualization with glow effects
- Resource rendering with animations
- Connection line drawing
- Trail rendering

#### Main Application (`src/App.tsx`)
- Simulation loop with requestAnimationFrame
- State management for agents, resources, and config
- Control panel with parameter adjustments
- Metrics display and quick stats

### Key Algorithms

#### Boids Algorithm
```typescript
// Separation: Avoid crowding neighbors
separation(agent, neighbors) → steer away from nearby agents

// Alignment: Steer towards average heading of neighbors
alignment(agent, neighbors) → match velocity with neighbors

// Cohesion: Steer towards average position of neighbors
cohesion(agent, neighbors) → move toward center of mass
```

#### Neural Network
```typescript
// 6 inputs → 8 hidden (tanh) → 4 outputs
inputs: [distance, angle, energy, neighbors, pheromone, speed]
outputs: [steerX, steerY, exploreBias, commDesire]
```

#### Evolution
```typescript
// Fitness-based selection
fitness = resourcesFound * 10 + messagesSent * 2 + energy * 0.5

// Mutation with configurable rate
mutate(weights, rate) → add random noise to weights

// Crossover between parents
crossover(parent1, parent2) → combine weights randomly
```

## 🎨 Customization

### Adding New Behaviors

1. Add behavior type to `SwarmBehavior` in `src/types/swarm.ts`
2. Implement behavior logic in `getBehaviorForce()` in `src/utils/swarmEngine.ts`
3. Add behavior to the behaviors array in `src/App.tsx`

### Modifying Agent Appearance

Edit the `renderSwarm()` function in `src/components/SwarmCanvas.tsx`:
- Change agent shape (currently directional triangle)
- Modify colors and glow effects
- Adjust trail rendering
- Customize energy bar appearance

### Adjusting Simulation Parameters

Modify `defaultConfig` in `src/App.tsx`:
```typescript
const defaultConfig: SwarmConfig = {
  agentCount: 40,
  perceptionRadius: 80,
  separationWeight: 1.5,
  alignmentWeight: 1.0,
  cohesionWeight: 1.0,
  // ... more parameters
};
```

## 📊 Performance

- **Agents**: Supports 5-120 agents at 60 FPS
- **Canvas**: 900x600 pixels (responsive)
- **Memory**: Efficient object pooling and trail management
- **CPU**: Optimized neighbor searches and force calculations

## 🔬 Research Applications

This system can be used to study:
- **Swarm Intelligence**: Emergent collective behavior from simple rules
- **Multi-Agent Systems**: Coordination and cooperation strategies
- **Evolutionary Computing**: Natural selection and adaptation
- **Neural Networks**: Reinforcement learning in dynamic environments
- **Complex Systems**: Self-organization and pattern formation
- **Robotics**: Path planning and formation control

## 🛠️ Development

### Project Structure
```
src/
├── components/
│   └── SwarmCanvas.tsx       # Canvas rendering
├── types/
│   └── swarm.ts              # Type definitions
├── utils/
│   └── swarmEngine.ts        # Core simulation logic
├── App.tsx                   # Main application
├── main.tsx                  # Entry point
└── index.css                 # Global styles
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🎓 Learning Resources

- [Boids Algorithm](https://en.wikipedia.org/wiki/Boids) - Craig Reynolds' flocking simulation
- [Swarm Intelligence](https://en.wikipedia.org/wiki/Swarm_intelligence) - Collective behavior of decentralized systems
- [Neural Networks](https://en.wikipedia.org/wiki/Neural_network) - Biologically inspired computing
- [Evolutionary Algorithms](https://en.wikipedia.org/wiki/Evolutionary_algorithm) - Optimization through natural selection

## 🤝 Contributing

Contributions are welcome! Areas for improvement:
- Additional behavior modes
- Advanced neural network architectures
- Machine learning integration
- 3D visualization
- Multi-swarm interactions
- Performance optimizations
- New visualization effects

## 📝 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Craig Reynolds for the Boids algorithm
- The React and Vite teams for excellent tooling
- The swarm intelligence research community

## 📧 Contact

For questions, suggestions, or collaborations, please open an issue on GitHub.

---

**Built with ❤️ using React, TypeScript, and Vite**

*Watch intelligence emerge from simplicity* 🧬✨
