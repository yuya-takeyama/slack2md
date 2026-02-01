import fs from "node:fs";
import path from "node:path";
import { program } from "commander";
import { initializeDatabase, closeDatabase } from "../db/index.js";
import { getUsersMap } from "../db/repositories/users.js";
import { getChannelsMap, getChannelById } from "../db/repositories/channels.js";
import { getUserGroupsMap } from "../db/repositories/user-groups.js";
import { getBotsMap } from "../db/repositories/bots.js";
import {
  getDistinctChannelIds,
  getChannelMessages,
  getThreadStarters,
  getThreadMessages,
} from "../db/repositories/messages.js";
import { getPartitionKey, type PartitionType } from "../utils/date.js";
import {
  formatSingleMessage,
  formatSingleThread,
  generateHeader,
  type FormatContext,
  type ThreadGroup,
} from "../formatters/index.js";
import { ChunkedWriter } from "../utils/chunker.js";
import type { Message } from "../types/db.js";

program
  .requiredOption(
    "--partition <type>",
    "Partition type: daily, weekly, or monthly",
  )
  .requiredOption("--output-dir <dir>", "Output directory")
  .option("--timezone <tz>", "Timezone for formatting", "Asia/Tokyo")
  .parse();

const options = program.opts<{
  partition: PartitionType;
  outputDir: string;
  timezone: string;
}>();

function groupByPartition(
  messages: Message[],
  partition: PartitionType,
  timezone: string,
): Map<string, Message[]> {
  const groups = new Map<string, Message[]>();

  for (const message of messages) {
    const key = getPartitionKey(message.timestamp, partition, timezone);
    const group = groups.get(key) ?? [];
    group.push(message);
    groups.set(key, group);
  }

  return groups;
}

async function main() {
  console.log(`Partition: ${options.partition}`);
  console.log(`Output directory: ${options.outputDir}`);
  console.log(`Timezone: ${options.timezone}`);

  if (!fs.existsSync(options.outputDir)) {
    fs.mkdirSync(options.outputDir, { recursive: true });
  }

  initializeDatabase();

  const users = getUsersMap();
  const channels = getChannelsMap();
  const userGroups = getUserGroupsMap();
  const bots = getBotsMap();

  const context: FormatContext = {
    users,
    channels,
    userGroups,
    bots,
    timezone: options.timezone,
  };

  const channelIds = getDistinctChannelIds();
  let fileCount = 0;

  for (const channelId of channelIds) {
    const channel = getChannelById(channelId);
    if (!channel) {
      console.warn(`Channel ${channelId} not found in database, skipping...`);
      continue;
    }

    console.log(`\nProcessing channel: ${channel.name}`);

    // Channel messages
    const channelMessages = getChannelMessages(channelId);
    const channelGroups = groupByPartition(
      channelMessages,
      options.partition,
      options.timezone,
    );

    for (const [partitionKey, messages] of channelGroups) {
      const baseFilename = `${channel.name}-channel-${partitionKey}`;

      const writer = new ChunkedWriter({
        outputDir: options.outputDir,
        baseFilename,
        generateHeader: (partNumber) =>
          generateHeader({
            channel,
            partitionKey,
            partNumber,
            isThread: false,
          }),
      });

      for (const message of messages) {
        const formatted = formatSingleMessage(message, context);
        writer.add(formatted);
      }

      const results = writer.finalize();
      for (const result of results) {
        fileCount++;
        console.log(
          `  Created: ${path.basename(result.filepath)} (${result.byteSize} bytes)`,
        );
      }
    }

    // Thread messages
    const threadStarters = getThreadStarters(channelId);
    const threadGroups = groupByPartition(
      threadStarters,
      options.partition,
      options.timezone,
    );

    for (const [partitionKey, starters] of threadGroups) {
      const threads: ThreadGroup[] = [];

      for (const starter of starters) {
        const replies = getThreadMessages(starter.id);
        threads.push({
          threadId: starter.id,
          starterMessage: starter,
          replies,
        });
      }

      if (threads.length === 0) continue;

      const baseFilename = `${channel.name}-threads-${partitionKey}`;

      const writer = new ChunkedWriter({
        outputDir: options.outputDir,
        baseFilename,
        generateHeader: (partNumber) =>
          generateHeader({
            channel,
            partitionKey,
            partNumber,
            isThread: true,
          }),
      });

      for (const thread of threads) {
        const formatted = formatSingleThread(thread, channel, context);
        writer.add(formatted);
      }

      const results = writer.finalize();
      for (const result of results) {
        fileCount++;
        console.log(
          `  Created: ${path.basename(result.filepath)} (${result.byteSize} bytes)`,
        );
      }
    }
  }

  closeDatabase();
  console.log(`\nDone! Created ${fileCount} files.`);
}

main().catch((error) => {
  console.error("Error:", error);
  closeDatabase();
  process.exit(1);
});
