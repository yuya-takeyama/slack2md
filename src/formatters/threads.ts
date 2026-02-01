import type { Message, Channel } from "../types/db.js";
import { convertMentions } from "./mentions.js";
import { convertChannelRefs } from "./channel-refs.js";
import { formatAttachments, type Attachment } from "./attachments.js";
import { formatTimestamp } from "../utils/date.js";
import { type FormatContext, getAuthorLabel } from "./channel-messages.js";

export interface ThreadGroup {
  threadId: string;
  starterMessage: Message;
  replies: Message[];
}

function getThreadUrl(
  channelId: string,
  threadTs: string,
  workspaceUrl?: string,
): string {
  const tsForUrl = threadTs.replace(".", "");
  if (workspaceUrl) {
    return `${workspaceUrl}/archives/${channelId}/p${tsForUrl}`;
  }
  return `slack://channel?team=&id=${channelId}&message=${threadTs}`;
}

export function formatSingleThread(
  thread: ThreadGroup,
  channel: Channel,
  context: FormatContext,
): string {
  const lines: string[] = [];

  const starterLabel = getAuthorLabel(
    thread.starterMessage.user_id,
    context.users,
    context.bots,
  );
  const starterTimestamp = formatTimestamp(
    thread.starterMessage.timestamp,
    context.timezone,
  );

  const threadTs = thread.starterMessage.id.split("-").pop() ?? "";
  const threadUrl = getThreadUrl(channel.id, threadTs);

  lines.push(`<slack_thread thread_url="${threadUrl}">`);
  lines.push("");
  lines.push(`## by ${starterLabel} on ${starterTimestamp}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  let starterText = thread.starterMessage.text;
  starterText = convertMentions(starterText, context.users, context.userGroups);
  starterText = convertChannelRefs(starterText, context.channels);
  lines.push(starterText);
  lines.push("");

  const starterRaw = JSON.parse(thread.starterMessage.raw);
  if (starterRaw.attachments && starterRaw.attachments.length > 0) {
    const attachmentsStr = formatAttachments(
      starterRaw.attachments as Attachment[],
      {
        users: context.users,
        userGroups: context.userGroups,
        channels: context.channels,
      },
    );
    lines.push(attachmentsStr);
  }

  for (const reply of thread.replies) {
    const replyLabel = getAuthorLabel(
      reply.user_id,
      context.users,
      context.bots,
    );
    const replyTimestamp = formatTimestamp(reply.timestamp, context.timezone);

    lines.push(`### by ${replyLabel} on ${replyTimestamp}`);
    lines.push("");

    let replyText = reply.text;
    replyText = convertMentions(replyText, context.users, context.userGroups);
    replyText = convertChannelRefs(replyText, context.channels);
    lines.push(replyText);
    lines.push("");

    const replyRaw = JSON.parse(reply.raw);
    if (replyRaw.attachments && replyRaw.attachments.length > 0) {
      const attachmentsStr = formatAttachments(
        replyRaw.attachments as Attachment[],
        {
          users: context.users,
          userGroups: context.userGroups,
          channels: context.channels,
        },
      );
      lines.push(attachmentsStr);
    }
  }

  lines.push("</slack_thread>");
  lines.push("");

  return lines.join("\n");
}

export function formatThreads(
  channel: Channel,
  threads: ThreadGroup[],
  partitionKey: string,
  context: FormatContext,
): string {
  const lines: string[] = [];

  lines.push(`# ${channel.name} (${channel.id}) - Threads - ${partitionKey}`);
  lines.push("");

  for (const thread of threads) {
    lines.push(formatSingleThread(thread, channel, context));
  }

  return lines.join("\n");
}
