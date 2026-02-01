import { describe, it, expect } from "vitest";
import {
  formatAttachment,
  formatAttachments,
  type Attachment,
  type AttachmentContext,
} from "../attachments.js";
import type { User, UserGroup, Channel } from "../../types/db.js";

describe("formatAttachment", () => {
  const context: AttachmentContext = {
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
  };

  it("formats attachment with URL and title", () => {
    const attachment: Attachment = {
      title: "Example Article",
      title_link: "https://example.com/article",
    };
    const result = formatAttachment(attachment, context);
    expect(result).toBe(
      `> **URL**: https://example.com/article
> **Title**: Example Article
---`,
    );
  });

  it("formats attachment with text", () => {
    const attachment: Attachment = {
      title: "Note",
      text: "This is the content",
    };
    const result = formatAttachment(attachment, context);
    expect(result).toBe(
      `> **Title**: Note
>
> This is the content
---`,
    );
  });

  it("formats attachment with multiline text", () => {
    const attachment: Attachment = {
      text: "Line 1\nLine 2\nLine 3",
    };
    const result = formatAttachment(attachment, context);
    expect(result).toBe(
      `>
> Line 1
> Line 2
> Line 3
---`,
    );
  });

  it("uses from_url when title_link is not present", () => {
    const attachment: Attachment = {
      from_url: "https://example.com/page",
    };
    const result = formatAttachment(attachment, context);
    expect(result).toBe(
      `> **URL**: https://example.com/page
---`,
    );
  });

  it("uses fallback when text is not present", () => {
    const attachment: Attachment = {
      fallback: "Fallback content",
    };
    const result = formatAttachment(attachment, context);
    expect(result).toBe(
      `>
> Fallback content
---`,
    );
  });

  it("converts user mentions in attachment text", () => {
    const attachment: Attachment = {
      text: "Hey <@U12345678>, please check this",
    };
    const result = formatAttachment(attachment, context);
    expect(result).toBe(
      `>
> Hey @alice@example.com, please check this
---`,
    );
  });

  it("converts channel references in attachment text", () => {
    const attachment: Attachment = {
      text: "Posted in <#C12345678>",
    };
    const result = formatAttachment(attachment, context);
    expect(result).toBe(
      `>
> Posted in #general
---`,
    );
  });

  it("formats empty attachment", () => {
    const attachment: Attachment = {};
    const result = formatAttachment(attachment, context);
    expect(result).toBe("---");
  });
});

describe("formatAttachments", () => {
  const context: AttachmentContext = {
    users: new Map(),
    userGroups: new Map(),
    channels: new Map(),
  };

  it("formats multiple attachments", () => {
    const attachments: Attachment[] = [{ title: "First" }, { title: "Second" }];
    const result = formatAttachments(attachments, context);
    expect(result).toBe(
      `> **Title**: First
---
> **Title**: Second
---`,
    );
  });

  it("returns empty string for empty array", () => {
    const result = formatAttachments([], context);
    expect(result).toBe("");
  });
});
