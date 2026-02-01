import { describe, it, expect } from "vitest";
import { convertMentions } from "../mentions.js";
import type { User, UserGroup } from "../../types/db.js";

describe("convertMentions", () => {
  const users = new Map<string, User>([
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
  ]);

  const userGroups = new Map<string, UserGroup>([
    [
      "S12345678",
      {
        id: "S12345678",
        name: "engineering",
        raw: "{}",
      },
    ],
  ]);

  it("converts user mention to email", () => {
    const input = "Hello <@U12345678>!";
    const result = convertMentions(input, users, userGroups);
    expect(result).toBe("Hello @alice@example.com!");
  });

  it("converts user mention with display name to email", () => {
    const input = "Hello <@U12345678|Alice>!";
    const result = convertMentions(input, users, userGroups);
    expect(result).toBe("Hello @alice@example.com!");
  });

  it("converts multiple user mentions", () => {
    const input = "<@U12345678> and <@U87654321> are here";
    const result = convertMentions(input, users, userGroups);
    expect(result).toBe("@alice@example.com and @bob@example.com are here");
  });

  it("converts unknown user to @unknown", () => {
    const input = "Hello <@UUNKNOWN>!";
    const result = convertMentions(input, users, userGroups);
    expect(result).toBe("Hello @unknown!");
  });

  it("converts subteam mention with handle", () => {
    const input = "cc <!subteam^S12345678|@engineering>";
    const result = convertMentions(input, users, userGroups);
    expect(result).toBe("cc @engineering");
  });

  it("converts subteam mention without handle", () => {
    const input = "cc <!subteam^S12345678>";
    const result = convertMentions(input, users, userGroups);
    expect(result).toBe("cc @engineering");
  });

  it("converts @here mention", () => {
    const input = "<!here> please check this";
    const result = convertMentions(input, users, userGroups);
    expect(result).toBe("@here please check this");
  });

  it("converts @channel mention", () => {
    const input = "<!channel> important announcement";
    const result = convertMentions(input, users, userGroups);
    expect(result).toBe("@channel important announcement");
  });

  it("converts @everyone mention", () => {
    const input = "<!everyone> hello all";
    const result = convertMentions(input, users, userGroups);
    expect(result).toBe("@everyone hello all");
  });

  it("handles text without mentions", () => {
    const input = "Hello world!";
    const result = convertMentions(input, users, userGroups);
    expect(result).toBe("Hello world!");
  });

  it("handles empty string", () => {
    const input = "";
    const result = convertMentions(input, users, userGroups);
    expect(result).toBe("");
  });
});
