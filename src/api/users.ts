import type { Member } from "@slack/web-api/dist/types/response/UsersListResponse.js";
import { getSlackClient } from "./client.js";
import type { User } from "../types/db.js";

export async function* fetchAllUsers(): AsyncGenerator<Member> {
  const client = getSlackClient();
  let cursor: string | undefined;

  do {
    const response = await client.users.list({ cursor, limit: 200 });

    if (response.members) {
      for (const member of response.members) {
        yield member;
      }
    }

    cursor = response.response_metadata?.next_cursor;
  } while (cursor);
}

export function memberToUser(member: Member): User {
  return {
    id: member.id ?? "",
    email: member.profile?.email ?? "",
    name: member.real_name ?? member.name ?? "",
    raw: JSON.stringify(member),
  };
}
