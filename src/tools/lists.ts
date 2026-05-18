import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { TrelloClient } from "../trello/client.js";
import { formatDate, labelDisplay } from "../trello/types.js";
import type { TrelloCard, TrelloList } from "../trello/types.js";

export function registerListTools(server: McpServer, client: TrelloClient): void {
  server.tool("list_boards", "List all Trello boards accessible to your account", {}, async () => {
    const boards = await client.listBoards();
    const text = boards
      .map((b) => `• ${b.name} (ID: ${b.id})${b.closed ? " [archived]" : ""}`)
      .join("\n");
    return { content: [{ type: "text", text: text || "No open boards found." }] };
  });

  server.tool(
    "get_board",
    "Get the configured board with its lists and card counts",
    {},
    async () => {
      const [board, lists, allCards] = await Promise.all([
        client.getBoard(),
        client.getLists(),
        client.getBoardCards(),
      ]);

      const cardsByList = new Map<string, number>();
      for (const card of allCards) {
        cardsByList.set(card.idList, (cardsByList.get(card.idList) ?? 0) + 1);
      }

      const lines = [
        `**${board.name}**`,
        `URL: ${board.url}`,
        "",
        "Lists:",
        ...lists.map((l) => {
          const count = cardsByList.get(l.id) ?? 0;
          return `• ${l.name} — ${count} card${count !== 1 ? "s" : ""}`;
        }),
      ];
      return { content: [{ type: "text", text: lines.join("\n") }] };
    },
  );

  server.tool(
    "get_list_cards",
    "Get all open cards in a named list",
    { list_name: z.string().describe("Name of the list (case-insensitive)") },
    async ({ list_name }) => {
      const list = await resolveList(client, list_name);
      const cards = await client.getListCards(list.id);
      if (cards.length === 0) {
        return { content: [{ type: "text", text: `No open cards in "${list.name}".` }] };
      }
      const text = cards.map(formatCardSummary).join("\n\n");
      return { content: [{ type: "text", text: `**${list.name}** (${cards.length} cards)\n\n${text}` }] };
    },
  );

  server.tool(
    "search_cards",
    "Search cards across all lists by keyword, label name, or member username (max 1000 results)",
    { query: z.string().describe("Search query") },
    async ({ query }) => {
      const cards = await client.searchCards(query);
      if (cards.length === 0) {
        return { content: [{ type: "text", text: `No cards found matching "${query}".` }] };
      }
      const text = cards.map(formatCardSummary).join("\n\n");
      const suffix = cards.length === 1000 ? "\n\n_(Results capped at 1000 — refine your query to narrow further.)_" : "";
      return { content: [{ type: "text", text: `Found ${cards.length} card(s):\n\n${text}${suffix}` }] };
    },
  );
}

export async function resolveList(client: TrelloClient, name: string): Promise<TrelloList> {
  const lists = await client.getLists();
  const match = lists.find((l) => l.name.toLowerCase() === name.toLowerCase());
  if (!match) {
    const valid = lists.map((l) => `"${l.name}"`).join(", ");
    throw new Error(`No list named "${name}". Valid lists: ${valid}`);
  }
  return match;
}

function formatCardSummary(card: TrelloCard): string {
  const parts = [`**${card.name}** (ID: ${card.id})`];
  if (card.due) parts.push(`Due: ${formatDate(card.due)}`);
  if (card.idLabels.length > 0) parts.push(`Labels: ${card.idLabels.map(labelDisplay).join(", ")}`);
  return parts.join(" · ");
}
