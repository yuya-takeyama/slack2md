import type { MessageElement as SlackMessage } from "@slack/web-api/dist/types/response/ConversationsHistoryResponse.js";
import { getSlackClient } from "./client.js";
import type { Message } from "../types/db.js";

export async function* fetchChannelMessages(
  channelId: string,
  oldest?: number,
  latest?: number
): AsyncGenerator<SlackMessage> {
  const client = getSlackClient();
  let cursor: string | undefined;

  do {
    const response = await client.conversations.history({
      channel: channelId,
      cursor,
      limit: 200,
      oldest: oldest ? String(oldest / 1000) : undefined,
      latest: latest ? String(latest / 1000) : undefined,
    });

    if (response.messages) {
      for (const message of response.messages) {
        yield message;
      }
    }

    cursor = response.response_metadata?.next_cursor;
  } while (cursor);
}

export async function* fetchThreadReplies(
  channelId: string,
  threadTs: string
): AsyncGenerator<SlackMessage> {
  const client = getSlackClient();
  let cursor: string | undefined;

  do {
    const response = await client.conversations.replies({
      channel: channelId,
      ts: threadTs,
      cursor,
      limit: 200,
    });

    if (response.messages) {
      for (const message of response.messages) {
        if (message.ts !== threadTs) {
          yield message;
        }
      }
    }

    cursor = response.response_metadata?.next_cursor;
  } while (cursor);
}

export function slackMessageToMessage(
  slackMessage: SlackMessage,
  channelId: string,
  threadId: string | null = null
): Message {
  const ts = slackMessage.ts ?? "";
  const timestampMs = Math.floor(parseFloat(ts) * 1000);

  return {
    id: `${channelId}-${ts}`,
    channel_id: channelId,
    thread_id: threadId,
    user_id: slackMessage.user ?? slackMessage.bot_id ?? "",
    text: slackMessage.text ?? "",
    timestamp: timestampMs,
    raw: JSON.stringify(slackMessage),
  };
}

export function hasThread(message: SlackMessage): boolean {
  return (
    message.thread_ts !== undefined &&
    message.reply_count !== undefined &&
    message.reply_count > 0
  );
}
