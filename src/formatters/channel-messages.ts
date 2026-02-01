import type { Message, User, UserGroup, Channel } from "../types/db.js";
import { convertMentions } from "./mentions.js";
import { convertChannelRefs } from "./channel-refs.js";
import { formatAttachments, type Attachment } from "./attachments.js";
import { formatTimestamp } from "../utils/date.js";

export interface FormatContext {
  users: Map<string, User>;
  userGroups: Map<string, UserGroup>;
  channels: Map<string, Channel>;
  timezone: string;
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
    const user = context.users.get(message.user_id);
    const email = user?.email ?? "unknown";
    const timestamp = formatTimestamp(message.timestamp, context.timezone);

    lines.push(`## by ${email} on ${timestamp}`);
    lines.push("");

    let text = message.text;
    text = convertMentions(text, context.users, context.userGroups);
    text = convertChannelRefs(text, context.channels);
    lines.push(text);
    lines.push("");

    const raw = JSON.parse(message.raw);
    if (raw.attachments && raw.attachments.length > 0) {
      const attachmentsStr = formatAttachments(raw.attachments as Attachment[]);
      lines.push(attachmentsStr);
    }

    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}
