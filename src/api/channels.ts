import type { Channel as SlackChannel } from "@slack/web-api/dist/types/response/ConversationsListResponse.js";
import { getSlackClient } from "./client.js";
import type { Channel } from "../types/db.js";

export async function* fetchAllChannels(): AsyncGenerator<SlackChannel> {
  const client = getSlackClient();
  let cursor: string | undefined;

  do {
    const response = await client.conversations.list({
      cursor,
      limit: 200,
      types: "public_channel,private_channel",
    });

    if (response.channels) {
      for (const channel of response.channels) {
        yield channel;
      }
    }

    cursor = response.response_metadata?.next_cursor;
  } while (cursor);
}

export function slackChannelToChannel(slackChannel: SlackChannel): Channel {
  return {
    id: slackChannel.id ?? "",
    name: slackChannel.name ?? "",
    raw: JSON.stringify(slackChannel),
  };
}
