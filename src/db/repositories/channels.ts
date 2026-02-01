import { getDatabase } from "../index.js";
import type { Channel } from "../../types/db.js";

export function upsertChannel(channel: Channel): void {
  const db = getDatabase();
  db.prepare(
    `
    INSERT INTO channels (id, name, raw)
    VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      raw = excluded.raw
    `
  ).run(channel.id, channel.name, channel.raw);
}

export function upsertChannels(channels: Channel[]): void {
  const db = getDatabase();
  const stmt = db.prepare(
    `
    INSERT INTO channels (id, name, raw)
    VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      raw = excluded.raw
    `
  );

  const transaction = db.transaction((channels: Channel[]) => {
    for (const channel of channels) {
      stmt.run(channel.id, channel.name, channel.raw);
    }
  });

  transaction(channels);
}

export function getAllChannels(): Channel[] {
  const db = getDatabase();
  return db.prepare("SELECT * FROM channels").all() as Channel[];
}

export function getChannelById(id: string): Channel | undefined {
  const db = getDatabase();
  return db.prepare("SELECT * FROM channels WHERE id = ?").get(id) as
    | Channel
    | undefined;
}

export function getChannelsMap(): Map<string, Channel> {
  const channels = getAllChannels();
  return new Map(channels.map((c) => [c.id, c]));
}
