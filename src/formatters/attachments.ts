export interface Attachment {
  title?: string;
  title_link?: string;
  text?: string;
  fallback?: string;
  from_url?: string;
}

export function formatAttachment(attachment: Attachment): string {
  const lines: string[] = [];

  const url = attachment.title_link ?? attachment.from_url;
  if (url) {
    lines.push(`> **URL**: ${url}`);
  }

  if (attachment.title) {
    lines.push(`> **Title**: ${attachment.title}`);
  }

  const text = attachment.text ?? attachment.fallback;
  if (text) {
    lines.push(">");
    const escapedText = text.replace(/\n/g, "\n> ");
    lines.push(`> ${escapedText}`);
  }

  lines.push("---");
  return lines.join("\n");
}

export function formatAttachments(attachments: Attachment[]): string {
  if (attachments.length === 0) return "";
  return attachments.map(formatAttachment).join("\n");
}
