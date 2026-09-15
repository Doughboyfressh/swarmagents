import { Agent, Vector2D, SubSwarm } from '../types/swarm';
import { dist, add, div } from './swarmEngine';

const SUB_SWARM_COLORS = [
  '#00d4ff', '#00ff88', '#ff6b00', '#ff0066', '#aa66ff',
  '#ffdd00', '#00ffcc', '#ff4488', '#44ffaa', '#8866ff',
];

export function detectSubSwarms(agents: Agent[], threshold: number = 100): SubSwarm[] {
  const assigned = new Set<string>();
  const clusters: SubSwarm[] = [];
  let clusterId = 0;

  for (const agent of agents) {
    if (assigned.has(agent.id)) continue;

    const cluster: string[] = [];
    const queue = [agent];
    assigned.add(agent.id);

    while (queue.length > 0) {
      const current = queue.shift()!;
      cluster.push(current.id);

      for (const other of agents) {
        if (!assigned.has(other.id) && dist(current.position, other.position) < threshold) {
          assigned.add(other.id);
          queue.push(other);
        }
      }
    }

    if (cluster.length >= 2) {
      const clusterAgents = agents.filter(a => cluster.includes(a.id));
      const center = clusterAgents.reduce(
        (acc, a) => ({ x: acc.x + a.position.x, y: acc.y + a.position.y }),
        { x: 0, y: 0 }
      );
      center.x /= clusterAgents.length;
      center.y /= clusterAgents.length;

      clusters.push({
        id: clusterId,
        agentIds: cluster,
        center,
        color: SUB_SWARM_COLORS[clusterId % SUB_SWARM_COLORS.length],
        purpose: getClusterPurpose(clusterAgents),
      });
      clusterId++;
    }
  }

  for (const cluster of clusters) {
    for (const agentId of cluster.agentIds) {
      const agent = agents.find(a => a.id === agentId);
      if (agent) agent.subSwarmId = cluster.id;
    }
  }

  for (const agent of agents) {
    if (!assigned.has(agent.id)) agent.subSwarmId = -1;
  }

  return clusters;
}

function getClusterPurpose(agents: Agent[]): string {
  const roles = agents.map(a => a.role);
  const explorers = roles.filter(r => r === 'explorer' || r === 'scout').length;
  const workers = roles.filter(r => r === 'worker' || r === 'carrier').length;
  if (explorers > workers) return 'Exploration';
  if (workers > explorers) return 'Collection';
  return 'Mixed';
}
