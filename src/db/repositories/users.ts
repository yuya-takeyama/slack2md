import { getDatabase } from "../index.js";
import type { User } from "../../types/db.js";

export function upsertUser(user: User): void {
  const db = getDatabase();
  db.prepare(
    `
    INSERT INTO users (id, email, name, raw)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      email = excluded.email,
      name = excluded.name,
      raw = excluded.raw
    `
  ).run(user.id, user.email, user.name, user.raw);
}

export function upsertUsers(users: User[]): void {
  const db = getDatabase();
  const stmt = db.prepare(
    `
    INSERT INTO users (id, email, name, raw)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      email = excluded.email,
      name = excluded.name,
      raw = excluded.raw
    `
  );

  const transaction = db.transaction((users: User[]) => {
    for (const user of users) {
      stmt.run(user.id, user.email, user.name, user.raw);
    }
  });

  transaction(users);
}

export function getAllUsers(): User[] {
  const db = getDatabase();
  return db.prepare("SELECT * FROM users").all() as User[];
}

export function getUserById(id: string): User | undefined {
  const db = getDatabase();
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as
    | User
    | undefined;
}

export function getUsersMap(): Map<string, User> {
  const users = getAllUsers();
  return new Map(users.map((u) => [u.id, u]));
}
