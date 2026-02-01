import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { SCHEMA } from "./schema.js";

const DEFAULT_DB_PATH = path.join(process.cwd(), "data", "slack2md.db");

let db: Database.Database | null = null;

export function initializeDatabase(
  dbPath: string = DEFAULT_DB_PATH,
): Database.Database {
  if (db) return db;

  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(SCHEMA);

  return db;
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error("Database not initialized. Call initializeDatabase first.");
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
