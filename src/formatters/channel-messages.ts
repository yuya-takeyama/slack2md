import type { Message, User, UserGroup, Channel, Bot } from "../types/db.js";
import { convertMentions } from "./mentions.js";
import { convertChannelRefs } from "./channel-refs.js";
import { formatAttachments, type Attachment } from "./attachments.js";
import { formatTimestamp } from "../utils/date.js";

export interface FormatContext {
  users: Map<string, User>;
  userGroups: Map<string, UserGroup>;
  channels: Map<string, Channel>;
  bots?: Map<string, Bot>;
  timezone: string;
}

export function getAuthorLabel(
  userId: string,
  users: Map<string, User>,
  bots?: Map<string, Bot>
): string {
  if (userId.startsWith("B")) {
    const bot = bots?.get(userId);
    return `${bot?.name ?? "unknown"}[Bot]`;
  }
  const user = users.get(userId);
  return user?.email ?? "unknown";
}

export function formatChannelMessages(
  channel: Channel,
  messages: Message[],
  partitionKey: string,
  context: FormatContext
): string {
  const lines: string[] = [];

  lines.push(`# ${channel.name} (${channel.id}) - ${partitionKey}`);
  lines.push("");

  for (const message of messages) {
    const authorLabel = getAuthorLabel(message.user_id, context.users, context.bots);
    const timestamp = formatTimestamp(message.timestamp, context.timezone);

    lines.push(`## by ${authorLabel} on ${timestamp}`);
    lines.push("");

    let text = message.text;
    text = convertMentions(text, context.users, context.userGroups);
    text = convertChannelRefs(text, context.channels);
    lines.push(text);
    lines.push("");

    const raw = JSON.parse(message.raw);
    if (raw.attachments && raw.attachments.length > 0) {
      const attachmentsStr = formatAttachments(raw.attachments as Attachment[], {
        users: context.users,
        userGroups: context.userGroups,
        channels: context.channels,
      });
      lines.push(attachmentsStr);
    }

    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}
