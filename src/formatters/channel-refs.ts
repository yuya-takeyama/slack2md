import type { Channel } from "../types/db.js";

export function convertChannelRefs(
  text: string,
  channels: Map<string, Channel>,
): string {
  // <#C12345678> or <#C12345678|channel-name> -> #channel-name
  return text.replace(
    /<#(C[A-Z0-9]+)(?:\|([^>]+))?>/g,
    (_, channelId, name) => {
      if (name) return `#${name}`;
      const channel = channels.get(channelId);
      return channel ? `#${channel.name}` : `#unknown-channel`;
    },
  );
}
