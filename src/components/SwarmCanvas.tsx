import { Agent, Resource, SwarmConfig, Vector2D } from '../types/swarm';
import { dist, mag } from '../utils/swarmEngine';

interface SwarmCanvasProps {
  agents: Agent[];
  resources: Resource[];
  config: SwarmConfig;
  width: number;
  height: number;
  onCanvasClick?: (pos: Vector2D) => void;
}

export default function SwarmCanvas({
  agents,
  resources,
  config,
  width,
  height,
  onCanvasClick,
}: SwarmCanvasProps) {
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onCanvasClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    onCanvasClick({ x, y });
  };

  return (
    <div className="relative">
      <canvas
        width={width}
        height={height}
        onClick={handleClick}
        className="border border-gray-700 rounded-lg cursor-crosshair bg-gray-900"
        style={{ width: '100%', height: 'auto' }}
      />
      <div className="absolute top-2 left-2 text-xs text-gray-400 bg-gray-900/80 px-2 py-1 rounded">
        Agents: {agents.length} | Resources: {resources.filter(r => r.discovered).length}/{resources.length}
      </div>
    </div>
  );
}

// Canvas rendering logic
export function renderSwarm(
  ctx: CanvasRenderingContext2D,
  agents: Agent[],
  resources: Resource[],
  config: SwarmConfig,
  width: number,
  height: number,
  time: number
) {
  // Clear canvas
  ctx.fillStyle = '#0a0e1a';
  ctx.fillRect(0, 0, width, height);

  // Draw grid
  ctx.strokeStyle = '#1a1f2e';
  ctx.lineWidth = 0.5;
  const gridSize = 50;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Draw resources
  for (const resource of resources) {
    const pulse = Math.sin(time * 0.005 + resource.position.x) * 0.3 + 0.7;
    const size = 8 + (resource.amount / 100) * 8;

    const colors: Record<string, string> = {
      energy: '#ffdd00',
      data: '#00ffcc',
      material: '#ff6600',
    };
    const color = colors[resource.type];

    // Glow
    const glow = ctx.createRadialGradient(
      resource.position.x,
      resource.position.y,
      0,
      resource.position.x,
      resource.position.y,
      size * 3
    );
    glow.addColorStop(0, `${color}${resource.discovered ? '40' : '20'}`);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(resource.position.x, resource.position.y, size * 3, 0, Math.PI * 2);
    ctx.fill();

    // Resource shape
    ctx.save();
    ctx.translate(resource.position.x, resource.position.y);
    ctx.rotate(time * 0.002);

    ctx.beginPath();
    if (resource.type === 'energy') {
      ctx.moveTo(0, -size * pulse);
      ctx.lineTo(size * pulse, 0);
      ctx.lineTo(0, size * pulse);
      ctx.lineTo(-size * pulse, 0);
    } else if (resource.type === 'data') {
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const x = Math.cos(angle) * size * pulse;
        const y = Math.sin(angle) * size * pulse;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    } else {
      const s = size * pulse * 0.8;
      ctx.rect(-s, -s, s * 2, s * 2);
    }
    ctx.closePath();

    ctx.fillStyle = `${color}${resource.discovered ? 'cc' : '44'}`;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();

    if (resource.discovered) {
      ctx.fillStyle = `${color}88`;
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(resource.amount)}`, resource.position.x, resource.position.y + size + 12);
    }
  }

  // Draw connections
  if (config.showConnections) {
    for (const agent of agents) {
      for (const connId of agent.connections) {
        const other = agents.find(a => a.id === connId);
        if (!other) continue;
        const d = dist(agent.position, other.position);
        const alpha = Math.max(0.05, 0.2 * (1 - d / config.communicationRange));

        ctx.beginPath();
        ctx.moveTo(agent.position.x, agent.position.y);
        ctx.lineTo(other.position.x, other.position.y);
        ctx.strokeStyle = `rgba(100, 180, 255, ${alpha})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }

  // Draw trails
  if (config.showTrails) {
    for (const agent of agents) {
      if (agent.trail.length < 2) continue;

      for (let i = 1; i < agent.trail.length; i++) {
        const alpha = (i / agent.trail.length) * 0.3;
        ctx.beginPath();
        ctx.moveTo(agent.trail[i - 1].x, agent.trail[i - 1].y);
        ctx.lineTo(agent.trail[i].x, agent.trail[i].y);
        ctx.strokeStyle = `${agent.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 1 + (i / agent.trail.length);
        ctx.stroke();
      }
    }
  }

  // Draw agents
  for (const agent of agents) {
    const pulse = Math.sin(time * 0.008 + agent.pulsePhase) * 0.3 + 0.7;
    const angle = Math.atan2(agent.velocity.y, agent.velocity.x);
    const speed = mag(agent.velocity);

    ctx.save();
    ctx.translate(agent.position.x, agent.position.y);
    ctx.rotate(angle);

    // Glow
    const glowSize = agent.radius * 3 * pulse;
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
    glow.addColorStop(0, `${agent.color}25`);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
    ctx.fill();

    // Body
    const size = agent.radius * (agent.state === 'alert' ? 1.3 : agent.state === 'fleeing' ? 1.1 : 1);
    ctx.beginPath();
    ctx.moveTo(size * 1.5, 0);
    ctx.lineTo(-size, -size * 0.8);
    ctx.lineTo(-size * 0.5, 0);
    ctx.lineTo(-size, size * 0.8);
    ctx.closePath();

    const stateColors: Record<string, string> = {
      idle: `${agent.color}88`,
      moving: `${agent.color}cc`,
      communicating: `${agent.color}ff`,
      working: `${agent.color}ee`,
      returning: `${agent.color}aa`,
      alert: '#ff0000dd',
      fleeing: '#ff4444cc',
      learning: '#aa66ffcc',
    };
    ctx.fillStyle = stateColors[agent.state] || `${agent.color}cc`;
    ctx.fill();
    ctx.strokeStyle = agent.color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Energy bar
    ctx.rotate(-angle);
    const barWidth = 16;
    const barHeight = 2;
    const barY = -size - 6;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(-barWidth / 2, barY, barWidth, barHeight);
    const energyColor = agent.energy > 60 ? '#00ff88' : agent.energy > 30 ? '#ffdd00' : '#ff3344';
    ctx.fillStyle = energyColor;
    ctx.fillRect(-barWidth / 2, barY, barWidth * (agent.energy / 100), barHeight);

    ctx.restore();
  }
}
