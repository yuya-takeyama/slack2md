import type { User, UserGroup, Channel } from "../types/db.js";
import { convertMentions } from "./mentions.js";
import { convertChannelRefs } from "./channel-refs.js";

export interface Attachment {
  title?: string;
  title_link?: string;
  text?: string;
  fallback?: string;
  from_url?: string;
}

export interface AttachmentContext {
  users: Map<string, User>;
  userGroups: Map<string, UserGroup>;
  channels: Map<string, Channel>;
}

export function formatAttachment(
  attachment: Attachment,
  context: AttachmentContext
): string {
  const lines: string[] = [];

  const url = attachment.title_link ?? attachment.from_url;
  if (url) {
    lines.push(`> **URL**: ${url}`);
  }

  if (attachment.title) {
    lines.push(`> **Title**: ${attachment.title}`);
  }

  let text = attachment.text ?? attachment.fallback;
  if (text) {
    text = convertMentions(text, context.users, context.userGroups);
    text = convertChannelRefs(text, context.channels);
    lines.push(">");
    const escapedText = text.replace(/\n/g, "\n> ");
    lines.push(`> ${escapedText}`);
  }

  lines.push("---");
  return lines.join("\n");
}

export function formatAttachments(
  attachments: Attachment[],
  context: AttachmentContext
): string {
  if (attachments.length === 0) return "";
  return attachments.map((a) => formatAttachment(a, context)).join("\n");
}
