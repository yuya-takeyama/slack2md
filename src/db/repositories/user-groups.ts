import { getDatabase } from "../index.js";
import type { UserGroup } from "../../types/db.js";

export function upsertUserGroup(userGroup: UserGroup): void {
  const db = getDatabase();
  db.prepare(
    `
    INSERT INTO user_groups (id, name, raw)
    VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      raw = excluded.raw
    `
  ).run(userGroup.id, userGroup.name, userGroup.raw);
}

export function upsertUserGroups(userGroups: UserGroup[]): void {
  const db = getDatabase();
  const stmt = db.prepare(
    `
    INSERT INTO user_groups (id, name, raw)
    VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      raw = excluded.raw
    `
  );

  const transaction = db.transaction((userGroups: UserGroup[]) => {
    for (const userGroup of userGroups) {
      stmt.run(userGroup.id, userGroup.name, userGroup.raw);
    }
  });

  transaction(userGroups);
}

export function getAllUserGroups(): UserGroup[] {
  const db = getDatabase();
  return db.prepare("SELECT * FROM user_groups").all() as UserGroup[];
}

export function getUserGroupById(id: string): UserGroup | undefined {
  const db = getDatabase();
  return db.prepare("SELECT * FROM user_groups WHERE id = ?").get(id) as
    | UserGroup
    | undefined;
}

export function getUserGroupsMap(): Map<string, UserGroup> {
  const userGroups = getAllUserGroups();
  return new Map(userGroups.map((ug) => [ug.id, ug]));
}
