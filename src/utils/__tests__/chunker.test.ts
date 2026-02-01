import { describe, it, expect } from "vitest";
import {
  getByteLength,
  formatPartNumber,
  buildChunks,
  ChunkBuilder,
} from "../chunker.js";

describe("getByteLength", () => {
  it("returns correct byte length for ASCII", () => {
    expect(getByteLength("hello")).toBe(5);
    expect(getByteLength("")).toBe(0);
  });

  it("returns correct byte length for multi-byte UTF-8 (Japanese)", () => {
    // Japanese characters are 3 bytes each in UTF-8
    expect(getByteLength("あ")).toBe(3);
    expect(getByteLength("あいう")).toBe(9);
  });

  it("returns correct byte length for emoji", () => {
    // Most emojis are 4 bytes in UTF-8
    expect(getByteLength("😀")).toBe(4);
  });
});

describe("formatPartNumber", () => {
  it("formats single digit with leading zero", () => {
    expect(formatPartNumber(1)).toBe("p01");
    expect(formatPartNumber(9)).toBe("p09");
  });

  it("formats double digit without leading zero", () => {
    expect(formatPartNumber(10)).toBe("p10");
    expect(formatPartNumber(99)).toBe("p99");
  });
});

describe("ChunkBuilder", () => {
  const simpleHeader = (n: number) =>
    `# Header - p${String(n).padStart(2, "0")}\n\n`;

  it("creates single chunk when under threshold", () => {
    const builder = new ChunkBuilder({
      generateHeader: simpleHeader,
      thresholdBytes: 100,
      limitBytes: 200,
    });

    builder.add("Small content\n");
    const chunks = builder.build();

    expect(chunks).toHaveLength(1);
    expect(chunks[0].partNumber).toBe(1);
    expect(chunks[0].content).toContain("# Header - p01");
    expect(chunks[0].content).toContain("Small content");
  });

  it("splits into multiple chunks when threshold exceeded", () => {
    const builder = new ChunkBuilder({
      generateHeader: simpleHeader,
      thresholdBytes: 50,
      limitBytes: 100,
    });

    // Each add is ~20 bytes, header is ~16 bytes
    // After header (16) + first item (~20) = 36 bytes
    // After adding second (~20) = 56 bytes > 50 threshold
    builder.add("Content item one.\n");
    builder.add("Content item two.\n");
    builder.add("Content item three.\n");

    const chunks = builder.build();

    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks[0].partNumber).toBe(1);
    expect(chunks[1].partNumber).toBe(2);
    expect(chunks[0].content).toContain("p01");
    expect(chunks[1].content).toContain("p02");
  });

  it("handles single item exceeding limit by putting it in its own chunk", () => {
    const builder = new ChunkBuilder({
      generateHeader: simpleHeader,
      thresholdBytes: 30,
      limitBytes: 40,
    });

    // Add small item first
    builder.add("Small\n");
    // Add huge item that exceeds limit
    builder.add("This is a very long content that exceeds the limit bytes\n");

    const chunks = builder.build();

    // Should have at least 2 chunks: one for small, one for large
    expect(chunks.length).toBeGreaterThanOrEqual(2);
  });

  it("creates no chunks when no content is added", () => {
    const builder = new ChunkBuilder({
      generateHeader: simpleHeader,
      thresholdBytes: 100,
      limitBytes: 200,
    });

    const chunks = builder.build();

    expect(chunks).toHaveLength(0);
  });

  it("calculates byte size correctly", () => {
    const builder = new ChunkBuilder({
      generateHeader: simpleHeader,
      thresholdBytes: 1000,
      limitBytes: 2000,
    });

    builder.add("Hello\n");
    const chunks = builder.build();

    expect(chunks[0].byteSize).toBe(getByteLength(chunks[0].content));
  });
});

describe("buildChunks", () => {
  const simpleHeader = (n: number) => `# Part ${n}\n\n`;

  it("builds chunks from items array", () => {
    const items = ["Item 1\n", "Item 2\n", "Item 3\n"];
    const chunks = buildChunks(items, simpleHeader, {
      thresholdBytes: 1000,
      limitBytes: 2000,
    });

    expect(chunks).toHaveLength(1);
    expect(chunks[0].content).toContain("Item 1");
    expect(chunks[0].content).toContain("Item 2");
    expect(chunks[0].content).toContain("Item 3");
  });

  it("splits items when threshold exceeded", () => {
    const items = [
      "First item with some content\n",
      "Second item with content\n",
      "Third item with content\n",
    ];
    const chunks = buildChunks(items, simpleHeader, {
      thresholdBytes: 40,
      limitBytes: 100,
    });

    expect(chunks.length).toBeGreaterThanOrEqual(2);
  });

  it("returns empty array for empty items", () => {
    const chunks = buildChunks([], simpleHeader);
    expect(chunks).toHaveLength(0);
  });
});
