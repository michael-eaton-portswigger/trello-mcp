import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { TrelloClient } from "../trello/client.js";
import type { TrelloMember } from "../trello/types.js";

export function registerMemberTools(server: McpServer, client: TrelloClient): void {
  server.tool(
    "get_board_members",
    "List all members on the configured board",
    {},
    async () => {
      const members = await client.getBoardMembers();
      const text = members
        .map((m) => `• ${m.fullName} (@${m.username}) — ID: ${m.id}`)
        .join("\n");
      return { content: [{ type: "text", text: text || "No members found." }] };
    },
  );

  server.tool(
    "assign_member",
    "Assign a board member to a card by username or full name",
    {
      card_id: z.string().describe("Trello card ID"),
      member: z.string().describe("Member username or full name"),
    },
    async ({ card_id, member }) => {
      const m = await resolveMember(client, member);
      await client.assignMember(card_id, m.id);
      return { content: [{ type: "text", text: `Assigned ${m.fullName} to card.` }] };
    },
  );

  server.tool(
    "unassign_member",
    "Remove a member from a card",
    {
      card_id: z.string().describe("Trello card ID"),
      member: z.string().describe("Member username or full name"),
    },
    async ({ card_id, member }) => {
      const m = await resolveMember(client, member);
      await client.unassignMember(card_id, m.id);
      return { content: [{ type: "text", text: `Removed ${m.fullName} from card.` }] };
    },
  );

  server.tool(
    "get_attachments",
    "List attachments on a card",
    { card_id: z.string().describe("Trello card ID") },
    async ({ card_id }) => {
      const attachments = await client.getAttachments(card_id);
      if (attachments.length === 0) {
        return { content: [{ type: "text", text: "No attachments on this card." }] };
      }
      const text = attachments
        .map((a) => `• **${a.name}** — ${a.url}`)
        .join("\n");
      return { content: [{ type: "text", text: text }] };
    },
  );

  server.tool(
    "add_url_attachment",
    "Add a URL attachment to a card",
    {
      card_id: z.string().describe("Trello card ID"),
      url: z.string().url().describe("URL to attach"),
      name: z.string().optional().describe("Display name for the link"),
    },
    async ({ card_id, url, name }) => {
      const att = await client.addUrlAttachment(card_id, url, name);
      return {
        content: [{ type: "text", text: `Attached "${att.name}" to card.` }],
      };
    },
  );
}

async function resolveMember(client: TrelloClient, query: string): Promise<TrelloMember> {
  const members = await client.getBoardMembers();
  const match = members.find(
    (m) =>
      m.username.toLowerCase() === query.toLowerCase() ||
      m.fullName.toLowerCase() === query.toLowerCase(),
  );
  if (!match) {
    const valid = members.map((m) => `"${m.fullName}" (@${m.username})`).join(", ");
    throw new Error(`No board member matching "${query}". Members: ${valid}`);
  }
  return match;
}
