import type { User, UserGroup } from "../types/db.js";

export function convertMentions(
  text: string,
  users: Map<string, User>,
  userGroups: Map<string, UserGroup>
): string {
  let result = text;

  // <@U12345678> or <@U12345678|display_name> -> @email
  result = result.replace(/<@(U[A-Z0-9]+)(?:\|[^>]+)?>/g, (_, userId) => {
    const user = users.get(userId);
    return user?.email ? `@${user.email}` : `@unknown`;
  });

  // <!subteam^S12345678|@handle> -> @handle
  result = result.replace(
    /<!subteam\^(S[A-Z0-9]+)(?:\|@([^>]+))?>/g,
    (_, groupId, handle) => {
      if (handle) return `@${handle}`;
      const userGroup = userGroups.get(groupId);
      return userGroup ? `@${userGroup.name}` : `@unknown-group`;
    }
  );

  // <!here>, <!channel>, <!everyone>
  result = result.replace(/<!here>/g, "@here");
  result = result.replace(/<!channel>/g, "@channel");
  result = result.replace(/<!everyone>/g, "@everyone");

  return result;
}
