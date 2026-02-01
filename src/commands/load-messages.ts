import { program } from "commander";
import { initializeDatabase, closeDatabase } from "../db/index.js";
import { upsertMessages } from "../db/repositories/messages.js";
import {
  fetchChannelMessages,
  fetchThreadReplies,
  slackMessageToMessage,
  hasThread,
} from "../api/messages.js";
import { parseDateRange } from "../utils/date.js";
import type { Message } from "../types/db.js";

program
  .requiredOption("--channels <ids>", "Comma-separated channel IDs")
  .requiredOption("--from <date>", "Start date (YYYY-MM-DD)")
  .requiredOption("--to <date>", "End date (YYYY-MM-DD)")
  .requiredOption("--timezone <tz>", "Timezone (e.g., Asia/Tokyo)")
  .parse();

const options = program.opts<{
  channels: string;
  from: string;
  to: string;
  timezone: string;
}>();

async function main() {
  const channelIds = options.channels.split(",").map((id) => id.trim());
  const { oldest, latest } = parseDateRange(
    options.from,
    options.to,
    options.timezone,
  );

  console.log(`Loading messages from ${options.from} to ${options.to}`);
  console.log(`Timezone: ${options.timezone}`);
  console.log(`Channels: ${channelIds.join(", ")}`);

  initializeDatabase();

  let totalMessages = 0;
  let totalThreadReplies = 0;

  for (const channelId of channelIds) {
    console.log(`\nProcessing channel ${channelId}...`);

    const messages: Message[] = [];
    const threadStarters: { channelId: string; threadTs: string }[] = [];

    for await (const slackMessage of fetchChannelMessages(
      channelId,
      oldest,
      latest,
    )) {
      const message = slackMessageToMessage(slackMessage, channelId, null);
      messages.push(message);

      if (hasThread(slackMessage) && slackMessage.ts) {
        threadStarters.push({ channelId, threadTs: slackMessage.ts });
      }
    }

    upsertMessages(messages);
    totalMessages += messages.length;
    console.log(`  Saved ${messages.length} channel messages`);

    console.log(`  Fetching ${threadStarters.length} threads...`);
    for (const { channelId: chId, threadTs } of threadStarters) {
      const replies: Message[] = [];
      const threadId = `${chId}-${threadTs}`;

      for await (const reply of fetchThreadReplies(chId, threadTs)) {
        const message = slackMessageToMessage(reply, chId, threadId);
        replies.push(message);
      }

      upsertMessages(replies);
      totalThreadReplies += replies.length;
    }
    console.log(`  Saved ${totalThreadReplies} thread replies`);
  }

  closeDatabase();
  console.log(
    `\nDone! Total: ${totalMessages} messages, ${totalThreadReplies} thread replies`,
  );
}

main().catch((error) => {
  console.error("Error:", error);
  closeDatabase();
  process.exit(1);
});
