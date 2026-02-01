import { describe, it, expect } from "vitest";
import {
  formatChannelMessages,
  type FormatContext,
} from "../channel-messages.js";
import type { Message, User, UserGroup, Channel, Bot } from "../../types/db.js";

describe("formatChannelMessages", () => {
  const context: FormatContext = {
    users: new Map<string, User>([
      [
        "U12345678",
        {
          id: "U12345678",
          email: "alice@example.com",
          name: "Alice",
          raw: "{}",
        },
      ],
      [
        "U87654321",
        {
          id: "U87654321",
          email: "bob@example.com",
          name: "Bob",
          raw: "{}",
        },
      ],
    ]),
    userGroups: new Map<string, UserGroup>(),
    channels: new Map<string, Channel>([
      [
        "C12345678",
        {
          id: "C12345678",
          name: "general",
          raw: "{}",
        },
      ],
    ]),
    timezone: "UTC",
  };

  const channel: Channel = {
    id: "C12345678",
    name: "general",
    raw: "{}",
  };

  it("formats single message", () => {
    const messages: Message[] = [
      {
        id: "C12345678-1234567890.123456",
        channel_id: "C12345678",
        thread_id: null,
        user_id: "U12345678",
        text: "Hello world!",
        timestamp: 1704067200000, // 2024-01-01 00:00:00 UTC
        raw: JSON.stringify({}),
      },
    ];

    const result = formatChannelMessages(
      channel,
      messages,
      "2024-W01",
      context,
    );

    expect(result).toContain("# general (C12345678) - 2024-W01");
    expect(result).toContain("## by alice@example.com on 2024-01-01 00:00:00");
    expect(result).toContain("Hello world!");
  });

  it("formats multiple messages", () => {
    const messages: Message[] = [
      {
        id: "C12345678-1",
        channel_id: "C12345678",
        thread_id: null,
        user_id: "U12345678",
        text: "First message",
        timestamp: 1704067200000,
        raw: JSON.stringify({}),
      },
      {
        id: "C12345678-2",
        channel_id: "C12345678",
        thread_id: null,
        user_id: "U87654321",
        text: "Second message",
        timestamp: 1704067260000,
        raw: JSON.stringify({}),
      },
    ];

    const result = formatChannelMessages(
      channel,
      messages,
      "2024-W01",
      context,
    );

    expect(result).toContain("## by alice@example.com");
    expect(result).toContain("First message");
    expect(result).toContain("## by bob@example.com");
    expect(result).toContain("Second message");
  });

  it("converts mentions in message text", () => {
    const messages: Message[] = [
      {
        id: "C12345678-1",
        channel_id: "C12345678",
        thread_id: null,
        user_id: "U12345678",
        text: "Hey <@U87654321>, check <#C12345678>",
        timestamp: 1704067200000,
        raw: JSON.stringify({}),
      },
    ];

    const result = formatChannelMessages(
      channel,
      messages,
      "2024-W01",
      context,
    );

    expect(result).toContain("Hey @bob@example.com, check #general");
  });

  it("formats message with attachments", () => {
    const messages: Message[] = [
      {
        id: "C12345678-1",
        channel_id: "C12345678",
        thread_id: null,
        user_id: "U12345678",
        text: "Check this out",
        timestamp: 1704067200000,
        raw: JSON.stringify({
          attachments: [
            {
              title: "Article Title",
              title_link: "https://example.com",
              text: "Article preview",
            },
          ],
        }),
      },
    ];

    const result = formatChannelMessages(
      channel,
      messages,
      "2024-W01",
      context,
    );

    expect(result).toContain("Check this out");
    expect(result).toContain("> **URL**: https://example.com");
    expect(result).toContain("> **Title**: Article Title");
    expect(result).toContain("> Article preview");
  });

  it("uses 'unknown' for missing user", () => {
    const messages: Message[] = [
      {
        id: "C12345678-1",
        channel_id: "C12345678",
        thread_id: null,
        user_id: "UUNKNOWN",
        text: "Hello",
        timestamp: 1704067200000,
        raw: JSON.stringify({}),
      },
    ];

    const result = formatChannelMessages(
      channel,
      messages,
      "2024-W01",
      context,
    );

    expect(result).toContain("## by unknown on");
  });

  it("formats bot message with bot name", () => {
    const contextWithBot: FormatContext = {
      ...context,
      bots: new Map<string, Bot>([
        [
          "B12345678",
          {
            id: "B12345678",
            name: "daily-reminder",
            raw: "{}",
          },
        ],
      ]),
    };

    const messages: Message[] = [
      {
        id: "C12345678-1",
        channel_id: "C12345678",
        thread_id: null,
        user_id: "B12345678",
        text: "Daily reminder message",
        timestamp: 1704067200000,
        raw: JSON.stringify({}),
      },
    ];

    const result = formatChannelMessages(
      channel,
      messages,
      "2024-W01",
      contextWithBot,
    );

    expect(result).toContain("## by daily-reminder[Bot] on");
    expect(result).toContain("Daily reminder message");
  });

  it("uses 'unknown bot' for missing bot", () => {
    const contextWithBot: FormatContext = {
      ...context,
      bots: new Map<string, Bot>(),
    };

    const messages: Message[] = [
      {
        id: "C12345678-1",
        channel_id: "C12345678",
        thread_id: null,
        user_id: "BUNKNOWN",
        text: "Hello from bot",
        timestamp: 1704067200000,
        raw: JSON.stringify({}),
      },
    ];

    const result = formatChannelMessages(
      channel,
      messages,
      "2024-W01",
      contextWithBot,
    );

    expect(result).toContain("## by unknown[Bot] on");
  });

  it("formats empty messages array", () => {
    const result = formatChannelMessages(channel, [], "2024-W01", context);

    expect(result).toContain("# general (C12345678) - 2024-W01");
    expect(result).not.toContain("## by");
  });
});
