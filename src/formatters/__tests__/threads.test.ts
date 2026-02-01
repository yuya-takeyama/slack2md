import { describe, it, expect } from "vitest";
import { formatThreads, type ThreadGroup } from "../threads.js";
import { type FormatContext } from "../channel-messages.js";
import type { Message, User, UserGroup, Channel } from "../../types/db.js";

describe("formatThreads", () => {
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

  it("formats single thread with replies", () => {
    const threads: ThreadGroup[] = [
      {
        threadId: "C12345678-1234567890.123456",
        starterMessage: {
          id: "C12345678-1234567890.123456",
          channel_id: "C12345678",
          thread_id: null,
          user_id: "U12345678",
          text: "Thread starter",
          timestamp: 1704067200000,
          raw: JSON.stringify({}),
        },
        replies: [
          {
            id: "C12345678-1234567890.123457",
            channel_id: "C12345678",
            thread_id: "C12345678-1234567890.123456",
            user_id: "U87654321",
            text: "Reply message",
            timestamp: 1704067260000,
            raw: JSON.stringify({}),
          },
        ],
      },
    ];

    const result = formatThreads(channel, threads, "2024-W01", context);

    expect(result).toContain("# general (C12345678) - Threads - 2024-W01");
    expect(result).toContain("<slack_thread");
    expect(result).toContain("## by alice@example.com");
    expect(result).toContain("Thread starter");
    expect(result).toContain("### by bob@example.com");
    expect(result).toContain("Reply message");
    expect(result).toContain("</slack_thread>");
  });

  it("formats thread with multiple replies", () => {
    const threads: ThreadGroup[] = [
      {
        threadId: "C12345678-1",
        starterMessage: {
          id: "C12345678-1",
          channel_id: "C12345678",
          thread_id: null,
          user_id: "U12345678",
          text: "Question",
          timestamp: 1704067200000,
          raw: JSON.stringify({}),
        },
        replies: [
          {
            id: "C12345678-2",
            channel_id: "C12345678",
            thread_id: "C12345678-1",
            user_id: "U87654321",
            text: "First reply",
            timestamp: 1704067260000,
            raw: JSON.stringify({}),
          },
          {
            id: "C12345678-3",
            channel_id: "C12345678",
            thread_id: "C12345678-1",
            user_id: "U12345678",
            text: "Second reply",
            timestamp: 1704067320000,
            raw: JSON.stringify({}),
          },
        ],
      },
    ];

    const result = formatThreads(channel, threads, "2024-W01", context);

    expect(result).toContain("First reply");
    expect(result).toContain("Second reply");
    expect((result.match(/### by/g) || []).length).toBe(2);
  });

  it("converts mentions in thread messages", () => {
    const threads: ThreadGroup[] = [
      {
        threadId: "C12345678-1",
        starterMessage: {
          id: "C12345678-1",
          channel_id: "C12345678",
          thread_id: null,
          user_id: "U12345678",
          text: "Hey <@U87654321>",
          timestamp: 1704067200000,
          raw: JSON.stringify({}),
        },
        replies: [
          {
            id: "C12345678-2",
            channel_id: "C12345678",
            thread_id: "C12345678-1",
            user_id: "U87654321",
            text: "Check <#C12345678>",
            timestamp: 1704067260000,
            raw: JSON.stringify({}),
          },
        ],
      },
    ];

    const result = formatThreads(channel, threads, "2024-W01", context);

    expect(result).toContain("Hey @bob@example.com");
    expect(result).toContain("Check #general");
  });

  it("formats thread with attachments", () => {
    const threads: ThreadGroup[] = [
      {
        threadId: "C12345678-1",
        starterMessage: {
          id: "C12345678-1",
          channel_id: "C12345678",
          thread_id: null,
          user_id: "U12345678",
          text: "Check this",
          timestamp: 1704067200000,
          raw: JSON.stringify({
            attachments: [
              {
                title: "Link Title",
                title_link: "https://example.com",
              },
            ],
          }),
        },
        replies: [],
      },
    ];

    const result = formatThreads(channel, threads, "2024-W01", context);

    expect(result).toContain("> **URL**: https://example.com");
    expect(result).toContain("> **Title**: Link Title");
  });

  it("formats multiple threads", () => {
    const threads: ThreadGroup[] = [
      {
        threadId: "C12345678-1",
        starterMessage: {
          id: "C12345678-1",
          channel_id: "C12345678",
          thread_id: null,
          user_id: "U12345678",
          text: "Thread 1",
          timestamp: 1704067200000,
          raw: JSON.stringify({}),
        },
        replies: [],
      },
      {
        threadId: "C12345678-2",
        starterMessage: {
          id: "C12345678-2",
          channel_id: "C12345678",
          thread_id: null,
          user_id: "U87654321",
          text: "Thread 2",
          timestamp: 1704067260000,
          raw: JSON.stringify({}),
        },
        replies: [],
      },
    ];

    const result = formatThreads(channel, threads, "2024-W01", context);

    expect(result).toContain("Thread 1");
    expect(result).toContain("Thread 2");
    expect((result.match(/<slack_thread/g) || []).length).toBe(2);
    expect((result.match(/<\/slack_thread>/g) || []).length).toBe(2);
  });

  it("formats empty threads array", () => {
    const result = formatThreads(channel, [], "2024-W01", context);

    expect(result).toContain("# general (C12345678) - Threads - 2024-W01");
    expect(result).not.toContain("<slack_thread");
  });
});
