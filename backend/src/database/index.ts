import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../data/swarm.db');

let db: Database.Database;

export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
  }
  return db;
}

export function initializeDatabase(): void {
  const db = getDatabase();

  // Agents table
  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      position_x REAL NOT NULL,
      position_y REAL NOT NULL,
      velocity_x REAL NOT NULL,
      velocity_y REAL NOT NULL,
      role TEXT NOT NULL,
      state TEXT NOT NULL,
      energy REAL NOT NULL,
      fitness REAL NOT NULL,
      age INTEGER NOT NULL,
      traits TEXT NOT NULL,
      brain TEXT NOT NULL,
      memory TEXT NOT NULL,
      sub_swarm_id INTEGER,
      updated_at INTEGER NOT NULL
    )
  `);

  // Resources table
  db.exec(`
    CREATE TABLE IF NOT EXISTS resources (
      id TEXT PRIMARY KEY,
      position_x REAL NOT NULL,
      position_y REAL NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      discovered INTEGER NOT NULL,
      discovered_by TEXT,
      depletion_rate REAL NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Structures table
  db.exec(`
    CREATE TABLE IF NOT EXISTS structures (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      position_x REAL NOT NULL,
      position_y REAL NOT NULL,
      size REAL NOT NULL,
      progress REAL NOT NULL,
      completed INTEGER NOT NULL,
      builder_ids TEXT NOT NULL,
      color TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Threats table
  db.exec(`
    CREATE TABLE IF NOT EXISTS threats (
      id TEXT PRIMARY KEY,
      position_x REAL NOT NULL,
      position_y REAL NOT NULL,
      radius REAL NOT NULL,
      severity REAL NOT NULL,
      type TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

  // Events table
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      type TEXT NOT NULL,
      agent_id TEXT,
      description TEXT NOT NULL,
      position_x REAL,
      position_y REAL,
      severity TEXT NOT NULL
    )
  `);

  // World state table
  db.exec(`
    CREATE TABLE IF NOT EXISTS world_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      time REAL NOT NULL,
      time_of_day TEXT NOT NULL,
      day INTEGER NOT NULL,
      season TEXT NOT NULL,
      weather TEXT NOT NULL,
      temperature REAL NOT NULL,
      visibility REAL NOT NULL,
      resource_abundance REAL NOT NULL,
      threat_level REAL NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Swarm config table
  db.exec(`
    CREATE TABLE IF NOT EXISTS swarm_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      config TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Metrics history table
  db.exec(`
    CREATE TABLE IF NOT EXISTS metrics_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      metrics TEXT NOT NULL
    )
  `);

  // LLM conversations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS llm_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      tokens_used INTEGER,
      latency INTEGER
    )
  `);

  // Create indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_agents_updated ON agents(updated_at);
    CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
    CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
    CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics_history(timestamp);
    CREATE INDEX IF NOT EXISTS idx_llm_timestamp ON llm_conversations(timestamp);
  `);

  console.log('✅ Database initialized successfully');
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    console.log('✅ Database closed');
  }
}
