import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { TrelloClient } from "../trello/client.js";
import { formatDateTime } from "../trello/types.js";

export function registerCommentTools(server: McpServer, client: TrelloClient): void {
  server.tool(
    "get_comments",
    "Get comments on a card (newest first)",
    { card_id: z.string().describe("Trello card ID") },
    async ({ card_id }) => {
      const comments = await client.getComments(card_id);
      if (comments.length === 0) {
        return { content: [{ type: "text", text: "No comments on this card." }] };
      }
      const lines = comments.map((c) => {
        return `**${c.memberCreator.fullName}** (${formatDateTime(c.date)}):\n${c.data.text}`;
      });
      return { content: [{ type: "text", text: lines.join("\n\n---\n\n") }] };
    },
  );

  server.tool(
    "add_comment",
    "Post a comment on a card",
    {
      card_id: z.string().describe("Trello card ID"),
      text: z.string().describe("Comment text"),
    },
    async ({ card_id, text }) => {
      await client.addComment(card_id, text);
      return { content: [{ type: "text", text: "Comment posted." }] };
    },
  );
}
