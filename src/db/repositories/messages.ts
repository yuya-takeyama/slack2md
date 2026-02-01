import { getDatabase } from "../index.js";
import type { Message } from "../../types/db.js";

export function upsertMessage(message: Message): void {
  const db = getDatabase();
  db.prepare(
    `
    INSERT INTO messages (id, channel_id, thread_id, user_id, text, timestamp, raw)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO NOTHING
    `
  ).run(
    message.id,
    message.channel_id,
    message.thread_id,
    message.user_id,
    message.text,
    message.timestamp,
    message.raw
  );
}

export function upsertMessages(messages: Message[]): void {
  const db = getDatabase();
  const stmt = db.prepare(
    `
    INSERT INTO messages (id, channel_id, thread_id, user_id, text, timestamp, raw)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO NOTHING
    `
  );

  const transaction = db.transaction((messages: Message[]) => {
    for (const message of messages) {
      stmt.run(
        message.id,
        message.channel_id,
        message.thread_id,
        message.user_id,
        message.text,
        message.timestamp,
        message.raw
      );
    }
  });

  transaction(messages);
}

export function getChannelMessages(channelId: string): Message[] {
  const db = getDatabase();
  return db
    .prepare(
      `
      SELECT * FROM messages
      WHERE channel_id = ? AND thread_id IS NULL
      ORDER BY timestamp ASC
      `
    )
    .all(channelId) as Message[];
}

export function getChannelMessagesByDateRange(
  channelId: string,
  from: number,
  to: number
): Message[] {
  const db = getDatabase();
  return db
    .prepare(
      `
      SELECT * FROM messages
      WHERE channel_id = ? AND thread_id IS NULL
        AND timestamp >= ? AND timestamp < ?
      ORDER BY timestamp ASC
      `
    )
    .all(channelId, from, to) as Message[];
}

export function getThreadMessages(threadId: string): Message[] {
  const db = getDatabase();
  return db
    .prepare(
      `
      SELECT * FROM messages
      WHERE thread_id = ?
      ORDER BY timestamp ASC
      `
    )
    .all(threadId) as Message[];
}

export function getThreadStarters(channelId: string): Message[] {
  const db = getDatabase();
  return db
    .prepare(
      `
      SELECT DISTINCT m1.*
      FROM messages m1
      INNER JOIN messages m2 ON m1.id = m2.thread_id
      WHERE m1.channel_id = ?
      ORDER BY m1.timestamp ASC
      `
    )
    .all(channelId) as Message[];
}

export function getThreadStartersByDateRange(
  channelId: string,
  from: number,
  to: number
): Message[] {
  const db = getDatabase();
  return db
    .prepare(
      `
      SELECT DISTINCT m1.*
      FROM messages m1
      INNER JOIN messages m2 ON m1.id = m2.thread_id
      WHERE m1.channel_id = ?
        AND m1.timestamp >= ? AND m1.timestamp < ?
      ORDER BY m1.timestamp ASC
      `
    )
    .all(channelId, from, to) as Message[];
}

export function getAllMessages(): Message[] {
  const db = getDatabase();
  return db
    .prepare("SELECT * FROM messages ORDER BY timestamp ASC")
    .all() as Message[];
}

export function getDistinctChannelIds(): string[] {
  const db = getDatabase();
  const rows = db
    .prepare("SELECT DISTINCT channel_id FROM messages")
    .all() as { channel_id: string }[];
  return rows.map((r) => r.channel_id);
}
