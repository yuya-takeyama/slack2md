import type { Usergroup } from "@slack/web-api/dist/types/response/UsergroupsListResponse.js";
import { getSlackClient } from "./client.js";
import type { UserGroup } from "../types/db.js";

export async function fetchAllUserGroups(): Promise<Usergroup[]> {
  const client = getSlackClient();
  const response = await client.usergroups.list({ include_disabled: true });
  return response.usergroups ?? [];
}

export function usergroupToUserGroup(usergroup: Usergroup): UserGroup {
  return {
    id: usergroup.id ?? "",
    name: usergroup.handle ?? usergroup.name ?? "",
    raw: JSON.stringify(usergroup),
  };
}
