import { describe, it, expect } from "vitest";
import { convertChannelRefs } from "../channel-refs.js";
import type { Channel } from "../../types/db.js";

describe("convertChannelRefs", () => {
  const channels = new Map<string, Channel>([
    [
      "C12345678",
      {
        id: "C12345678",
        name: "general",
        raw: "{}",
      },
    ],
    [
      "C87654321",
      {
        id: "C87654321",
        name: "random",
        raw: "{}",
      },
    ],
  ]);

  it("converts channel reference to channel name", () => {
    const input = "Check <#C12345678> for details";
    const result = convertChannelRefs(input, channels);
    expect(result).toBe("Check #general for details");
  });

  it("converts channel reference with name hint", () => {
    const input = "Check <#C12345678|general> for details";
    const result = convertChannelRefs(input, channels);
    expect(result).toBe("Check #general for details");
  });

  it("uses name hint when channel not in map", () => {
    const input = "Check <#CUNKNOWN|secret-channel> for details";
    const result = convertChannelRefs(input, channels);
    expect(result).toBe("Check #secret-channel for details");
  });

  it("converts multiple channel references", () => {
    const input = "<#C12345678> and <#C87654321>";
    const result = convertChannelRefs(input, channels);
    expect(result).toBe("#general and #random");
  });

  it("converts unknown channel to #unknown-channel", () => {
    const input = "Check <#CUNKNOWN>";
    const result = convertChannelRefs(input, channels);
    expect(result).toBe("Check #unknown-channel");
  });

  it("handles text without channel references", () => {
    const input = "Hello world!";
    const result = convertChannelRefs(input, channels);
    expect(result).toBe("Hello world!");
  });

  it("handles empty string", () => {
    const input = "";
    const result = convertChannelRefs(input, channels);
    expect(result).toBe("");
  });
});
