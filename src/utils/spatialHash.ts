import { Agent, Vector2D } from '../types/swarm';

export class SpatialHash<T extends { position: Vector2D; id: string }> {
  private cellSize: number;
  private grid: Map<string, T[]> = new Map();

  constructor(cellSize: number = 80) {
    this.cellSize = cellSize;
  }

  private getKey(x: number, y: number): string {
    return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
  }

  clear(): void { this.grid.clear(); }

  insert(entity: T): void {
    const key = this.getKey(entity.position.x, entity.position.y);
    if (!this.grid.has(key)) this.grid.set(key, []);
    this.grid.get(key)!.push(entity);
  }

  insertAll(entities: T[]): void {
    this.clear();
    for (const entity of entities) this.insert(entity);
  }

  queryRadius(position: Vector2D, radius: number): T[] {
    const results: T[] = [];
    const cellRadius = Math.ceil(radius / this.cellSize);
    const cx = Math.floor(position.x / this.cellSize);
    const cy = Math.floor(position.y / this.cellSize);

    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dy = -cellRadius; dy <= cellRadius; dy++) {
        const key = `${cx + dx},${cy + dy}`;
        const cell = this.grid.get(key);
        if (cell) {
          for (const entity of cell) {
            const distSq = (entity.position.x - position.x) ** 2 + (entity.position.y - position.y) ** 2;
            if (distSq <= radius * radius) results.push(entity);
          }
        }
      }
    }
    return results;
  }
}
