import fs from "node:fs";
import path from "node:path";

export const SIZE_THRESHOLD_BYTES = 40 * 1024; // 40KB - start new file
export const SIZE_LIMIT_BYTES = 50 * 1024; // 50KB - hard limit

export function getByteLength(str: string): number {
  return Buffer.byteLength(str, "utf-8");
}

export function formatPartNumber(num: number): string {
  return `p${String(num).padStart(2, "0")}`;
}

export interface Chunk {
  partNumber: number;
  content: string;
  byteSize: number;
}

export interface ChunkBuilderOptions {
  generateHeader: (partNumber: number) => string;
  thresholdBytes?: number;
  limitBytes?: number;
}

/**
 * Pure class for building chunks without I/O.
 * Testable with custom thresholds.
 */
export class ChunkBuilder {
  private options: Required<ChunkBuilderOptions>;
  private currentPartNumber: number = 1;
  private currentContent: string = "";
  private currentByteSize: number = 0;
  private headerByteSize: number = 0;
  private chunks: Chunk[] = [];

  constructor(options: ChunkBuilderOptions) {
    this.options = {
      generateHeader: options.generateHeader,
      thresholdBytes: options.thresholdBytes ?? SIZE_THRESHOLD_BYTES,
      limitBytes: options.limitBytes ?? SIZE_LIMIT_BYTES,
    };
    this.startNewPart();
  }

  private startNewPart(): void {
    const header = this.options.generateHeader(this.currentPartNumber);
    this.currentContent = header;
    this.currentByteSize = getByteLength(header);
    this.headerByteSize = this.currentByteSize;
  }

  private hasContentBeyondHeader(): boolean {
    return this.currentByteSize > this.headerByteSize;
  }

  private saveCurrentChunk(): void {
    if (!this.hasContentBeyondHeader()) return;

    this.chunks.push({
      partNumber: this.currentPartNumber,
      content: this.currentContent,
      byteSize: this.currentByteSize,
    });
  }

  /**
   * Add content to the current chunk.
   * If adding would exceed threshold, starts a new part first.
   *
   * @param content - The content to add
   */
  add(content: string): void {
    const contentByteSize = getByteLength(content);
    const projectedSize = this.currentByteSize + contentByteSize;

    // Edge case: single item exceeds limit
    if (contentByteSize > this.options.limitBytes) {
      // Still add it, but in its own chunk if current has content
      if (this.hasContentBeyondHeader()) {
        this.saveCurrentChunk();
        this.currentPartNumber++;
        this.startNewPart();
      }
      this.currentContent += content;
      this.currentByteSize += contentByteSize;
      this.saveCurrentChunk();
      this.currentPartNumber++;
      this.startNewPart();
      return;
    }

    // Would exceed threshold? Start new part first
    if (
      projectedSize > this.options.thresholdBytes &&
      this.hasContentBeyondHeader()
    ) {
      this.saveCurrentChunk();
      this.currentPartNumber++;
      this.startNewPart();
    }

    this.currentContent += content;
    this.currentByteSize += contentByteSize;
  }

  build(): Chunk[] {
    if (this.hasContentBeyondHeader()) {
      this.saveCurrentChunk();
    }
    return this.chunks;
  }
}

/**
 * Pure function to build chunks from items.
 * Fully testable without I/O.
 */
export function buildChunks(
  items: string[],
  generateHeader: (partNumber: number) => string,
  options?: { thresholdBytes?: number; limitBytes?: number }
): Chunk[] {
  const builder = new ChunkBuilder({
    generateHeader,
    thresholdBytes: options?.thresholdBytes,
    limitBytes: options?.limitBytes,
  });

  for (const item of items) {
    builder.add(item);
  }

  return builder.build();
}

// ========================================
// File I/O layer (for actual file writing)
// ========================================

export interface ChunkResult {
  partNumber: number;
  filepath: string;
  byteSize: number;
}

export interface ChunkedWriterOptions {
  outputDir: string;
  baseFilename: string;
  generateHeader: (partNumber: number) => string;
  thresholdBytes?: number;
  limitBytes?: number;
}

/**
 * Wrapper that uses ChunkBuilder and writes to files.
 */
export class ChunkedWriter {
  private builder: ChunkBuilder;
  private options: ChunkedWriterOptions;

  constructor(options: ChunkedWriterOptions) {
    this.options = options;
    this.builder = new ChunkBuilder({
      generateHeader: options.generateHeader,
      thresholdBytes: options.thresholdBytes,
      limitBytes: options.limitBytes,
    });
  }

  add(content: string): void {
    this.builder.add(content);
  }

  finalize(): ChunkResult[] {
    const chunks = this.builder.build();
    const results: ChunkResult[] = [];

    for (const chunk of chunks) {
      const filename = `${this.options.baseFilename}-${formatPartNumber(chunk.partNumber)}.md`;
      const filepath = path.join(this.options.outputDir, filename);
      fs.writeFileSync(filepath, chunk.content, "utf-8");

      results.push({
        partNumber: chunk.partNumber,
        filepath,
        byteSize: chunk.byteSize,
      });
    }

    return results;
  }
}
