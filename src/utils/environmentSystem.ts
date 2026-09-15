import { Vector2D, Agent } from '../types/swarm';

export interface Environment {
  windField: Vector2D[][];
  obstacles: Obstacle[];
  temperature: number;
  time: number;
}

export interface Obstacle {
  id: string;
  position: Vector2D;
  radius: number;
  type: 'static' | 'dynamic' | 'attractor';
  velocity?: Vector2D;
}

export function createEnvironment(width: number, height: number): Environment {
  return {
    windField: generateWindField(width, height, 40),
    obstacles: [],
    temperature: 20,
    time: 0,
  };
}

function generateWindField(width: number, height: number, cellSize: number): Vector2D[][] {
  const cols = Math.ceil(width / cellSize);
  const rows = Math.ceil(height / cellSize);
  const field: Vector2D[][] = [];

  for (let y = 0; y < rows; y++) {
    field[y] = [];
    for (let x = 0; x < cols; x++) {
      const nx = x / cols;
      const ny = y / rows;
      field[y][x] = {
        x: Math.sin(nx * 4 + ny * 2) * 0.5 + Math.cos(ny * 3) * 0.3,
        y: Math.cos(ny * 4 + nx * 2) * 0.5 + Math.sin(nx * 3) * 0.3,
      };
    }
  }

  return field;
}

export function getWindForce(env: Environment, pos: Vector2D, strength: number, direction: number): Vector2D {
  const cellSize = 40;
  const gx = Math.floor(pos.x / cellSize);
  const gy = Math.floor(pos.y / cellSize);

  if (gy >= 0 && gy < env.windField.length && gx >= 0 && gx < env.windField[0].length) {
    const baseWind = env.windField[gy][gx];
    const globalX = Math.cos(direction) * strength * 0.3;
    const globalY = Math.sin(direction) * strength * 0.3;
    return {
      x: (baseWind.x + globalX) * strength * 0.1,
      y: (baseWind.y + globalY) * strength * 0.1,
    };
  }

  return { x: 0, y: 0 };
}

export function updateEnvironment(env: Environment, dt: number): void {
  env.time += dt;
  
  for (const obs of env.obstacles) {
    if (obs.type === 'dynamic' && obs.velocity) {
      obs.position.x += obs.velocity.x * dt;
      obs.position.y += obs.velocity.y * dt;
    }
  }
  
  if (Math.floor(env.time) % 60 === 0) {
    const rows = env.windField.length;
    const cols = env.windField[0]?.length || 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        env.windField[y][x].x += (Math.random() - 0.5) * 0.01;
        env.windField[y][x].y += (Math.random() - 0.5) * 0.01;
        env.windField[y][x].x = Math.max(-1, Math.min(1, env.windField[y][x].x));
        env.windField[y][x].y = Math.max(-1, Math.min(1, env.windField[y][x].y));
      }
    }
  }
}

export function addObstacle(env: Environment, pos: Vector2D, radius: number, type: Obstacle['type'] = 'static'): Obstacle {
  const obstacle: Obstacle = {
    id: `obs-${env.obstacles.length}`,
    position: { ...pos },
    radius,
    type,
    velocity: type === 'dynamic' ? {
      x: (Math.random() - 0.5) * 0.5,
      y: (Math.random() - 0.5) * 0.5,
    } : undefined,
  };
  env.obstacles.push(obstacle);
  return obstacle;
}

export function removeObstacle(env: Environment, id: string): void {
  env.obstacles = env.obstacles.filter(o => o.id !== id);
}
