import { getDatabase } from "../index.js";
import type { Bot } from "../../types/db.js";

export function upsertBot(bot: Bot): void {
  const db = getDatabase();
  db.prepare(
    `
    INSERT INTO bots (id, name, raw)
    VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      raw = excluded.raw
    `,
  ).run(bot.id, bot.name, bot.raw);
}

export function upsertBots(bots: Bot[]): void {
  const db = getDatabase();
  const stmt = db.prepare(
    `
    INSERT INTO bots (id, name, raw)
    VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      raw = excluded.raw
    `,
  );

  const transaction = db.transaction((bots: Bot[]) => {
    for (const bot of bots) {
      stmt.run(bot.id, bot.name, bot.raw);
    }
  });

  transaction(bots);
}

export function getAllBots(): Bot[] {
  const db = getDatabase();
  return db.prepare("SELECT * FROM bots").all() as Bot[];
}

export function getBotById(id: string): Bot | undefined {
  const db = getDatabase();
  return db.prepare("SELECT * FROM bots WHERE id = ?").get(id) as
    | Bot
    | undefined;
}

export function getBotsMap(): Map<string, Bot> {
  const bots = getAllBots();
  return new Map(bots.map((b) => [b.id, b]));
}
