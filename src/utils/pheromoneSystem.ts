import { Vector2D } from '../types/swarm';

export interface PheromoneGrid {
  data: Float32Array;
  width: number;
  height: number;
  cellSize: number;
}

export function createPheromoneGrid(width: number, height: number, cellSize: number = 10): PheromoneGrid {
  const gridW = Math.ceil(width / cellSize);
  const gridH = Math.ceil(height / cellSize);
  return {
    data: new Float32Array(gridW * gridH),
    width: gridW,
    height: gridH,
    cellSize,
  };
}

export function depositPheromone(grid: PheromoneGrid, pos: Vector2D, amount: number): void {
  const gx = Math.floor(pos.x / grid.cellSize);
  const gy = Math.floor(pos.y / grid.cellSize);
  if (gx >= 0 && gx < grid.width && gy >= 0 && gy < grid.height) {
    const idx = gy * grid.width + gx;
    grid.data[idx] = Math.min(1, grid.data[idx] + amount);
  }
}

export function getPheromoneStrength(grid: PheromoneGrid, pos: Vector2D): number {
  const gx = Math.floor(pos.x / grid.cellSize);
  const gy = Math.floor(pos.y / grid.cellSize);
  if (gx >= 0 && gx < grid.width && gy >= 0 && gy < grid.height) {
    return grid.data[gy * grid.width + gx];
  }
  return 0;
}

export function getPheromoneGradient(grid: PheromoneGrid, pos: Vector2D): Vector2D {
  const gx = Math.floor(pos.x / grid.cellSize);
  const gy = Math.floor(pos.y / grid.cellSize);

  if (gx <= 0 || gx >= grid.width - 1 || gy <= 0 || gy >= grid.height - 1) {
    return { x: 0, y: 0 };
  }

  const left = grid.data[gy * grid.width + (gx - 1)];
  const right = grid.data[gy * grid.width + (gx + 1)];
  const up = grid.data[(gy - 1) * grid.width + gx];
  const down = grid.data[(gy + 1) * grid.width + gx];

  return {
    x: (right - left) * 2,
    y: (down - up) * 2,
  };
}

export function decayPheromone(grid: PheromoneGrid, decayRate: number): void {
  for (let i = 0; i < grid.data.length; i++) {
    grid.data[i] *= (1 - decayRate);
    if (grid.data[i] < 0.001) grid.data[i] = 0;
  }
}

export function diffusePheromone(grid: PheromoneGrid, diffusionRate: number): void {
  const newData = new Float32Array(grid.data.length);
  
  for (let y = 1; y < grid.height - 1; y++) {
    for (let x = 1; x < grid.width - 1; x++) {
      const idx = y * grid.width + x;
      const neighbors = (
        grid.data[(y - 1) * grid.width + x] +
        grid.data[(y + 1) * grid.width + x] +
        grid.data[y * grid.width + (x - 1)] +
        grid.data[y * grid.width + (x + 1)]
      ) / 4;
      
      newData[idx] = grid.data[idx] * (1 - diffusionRate) + neighbors * diffusionRate;
    }
  }
  
  grid.data = newData;
}

export function getTotalPheromoneIntensity(grid: PheromoneGrid): number {
  let total = 0;
  for (let i = 0; i < grid.data.length; i++) {
    total += grid.data[i];
  }
  return total;
}
