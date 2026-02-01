import { initializeDatabase, closeDatabase } from "../db/index.js";
import { upsertUsers } from "../db/repositories/users.js";
import { upsertChannels } from "../db/repositories/channels.js";
import { upsertUserGroups } from "../db/repositories/user-groups.js";
import { fetchAllUsers, memberToUser } from "../api/users.js";
import { fetchAllChannels, slackChannelToChannel } from "../api/channels.js";
import {
  fetchAllUserGroups,
  usergroupToUserGroup,
} from "../api/user-groups.js";
import type { User, Channel, UserGroup } from "../types/db.js";

async function main() {
  console.log("Initializing database...");
  initializeDatabase();

  console.log("Fetching users from Slack...");
  const users: User[] = [];
  for await (const member of fetchAllUsers()) {
    users.push(memberToUser(member));
  }
  upsertUsers(users);
  console.log(`  Saved ${users.length} users`);

  console.log("Fetching channels from Slack...");
  const channels: Channel[] = [];
  for await (const slackChannel of fetchAllChannels()) {
    channels.push(slackChannelToChannel(slackChannel));
  }
  upsertChannels(channels);
  console.log(`  Saved ${channels.length} channels`);

  console.log("Fetching user groups from Slack...");
  const slackUserGroups = await fetchAllUserGroups();
  const userGroups: UserGroup[] = slackUserGroups.map(usergroupToUserGroup);
  upsertUserGroups(userGroups);
  console.log(`  Saved ${userGroups.length} user groups`);

  closeDatabase();
  console.log("Done!");
}

main().catch((error) => {
  console.error("Error:", error);
  closeDatabase();
  process.exit(1);
});
