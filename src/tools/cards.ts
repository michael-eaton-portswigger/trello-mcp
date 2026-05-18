import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { TrelloClient } from "../trello/client.js";
import { resolveList } from "./lists.js";

export function registerCardTools(server: McpServer, client: TrelloClient): void {
  server.tool(
    "get_card",
    "Get full details for a card by ID",
    { card_id: z.string().describe("Trello card ID") },
    async ({ card_id }) => {
      const [card, checklists, comments, attachments] = await Promise.all([
        client.getCard(card_id),
        client.getChecklists(card_id),
        client.getComments(card_id),
        client.getAttachments(card_id),
      ]);

      const lines: string[] = [
        `**${card.name}**`,
        `ID: ${card.id}`,
        `URL: ${card.url}`,
      ];
      if (card.desc) lines.push(`\nDescription:\n${card.desc}`);
      if (card.due) lines.push(`\nDue: ${new Date(card.due).toLocaleDateString()}${card.dueComplete ? " ✓" : ""}`);
      if (card.labels.length > 0) lines.push(`Labels: ${card.labels.map((l) => l.name || l.color).join(", ")}`);
      if (checklists.length > 0) {
        lines.push(`\nChecklists:`);
        for (const cl of checklists) {
          const done = cl.checkItems.filter((i) => i.state === "complete").length;
          lines.push(`  ${cl.name} (${done}/${cl.checkItems.length})`);
        }
      }
      if (comments.length > 0) lines.push(`\nComments: ${comments.length}`);
      if (attachments.length > 0) lines.push(`Attachments: ${attachments.length}`);

      return { content: [{ type: "text", text: lines.join("\n") }] };
    },
  );

  server.tool(
    "create_card",
    "Create a new card in a named list",
    {
      list_name: z.string().describe("Name of the list to add the card to"),
      name: z.string().describe("Card title"),
      description: z.string().optional().describe("Card description"),
      due_date: z.string().optional().describe("Due date in ISO 8601 format (e.g. 2026-06-01)"),
    },
    async ({ list_name, name, description, due_date }) => {
      const list = await resolveList(client, list_name);
      const card = await client.createCard({
        idList: list.id,
        name,
        desc: description,
        due: due_date,
      });
      return {
        content: [{ type: "text", text: `Card created: **${card.name}** (ID: ${card.id})\nURL: ${card.url}` }],
      };
    },
  );

  server.tool(
    "update_card",
    "Update a card's name, description, or due date",
    {
      card_id: z.string().describe("Trello card ID"),
      name: z.string().optional().describe("New card title"),
      description: z.string().optional().describe("New description"),
      due_date: z
        .string()
        .nullable()
        .optional()
        .describe("New due date (ISO 8601), or null to clear it"),
    },
    async ({ card_id, name, description, due_date }) => {
      const fields: Record<string, string | null> = {};
      if (name !== undefined) fields.name = name;
      if (description !== undefined) fields.desc = description;
      if (due_date !== undefined) fields.due = due_date;
      const card = await client.updateCard(card_id, fields);
      return { content: [{ type: "text", text: `Updated card: **${card.name}** (ID: ${card.id})` }] };
    },
  );

  server.tool(
    "move_card",
    "Move a card to a different list",
    {
      card_id: z.string().describe("Trello card ID"),
      list_name: z.string().describe("Name of the destination list"),
    },
    async ({ card_id, list_name }) => {
      const list = await resolveList(client, list_name);
      const card = await client.updateCard(card_id, { idList: list.id });
      return {
        content: [{ type: "text", text: `Moved **${card.name}** to "${list.name}".` }],
      };
    },
  );

  server.tool(
    "archive_card",
    "Archive a card (soft delete — recoverable from Trello UI)",
    { card_id: z.string().describe("Trello card ID") },
    async ({ card_id }) => {
      const card = await client.updateCard(card_id, { closed: true });
      return { content: [{ type: "text", text: `Archived card: **${card.name}**` }] };
    },
  );

  server.tool(
    "add_label",
    "Add a label to a card by label name or colour",
    {
      card_id: z.string().describe("Trello card ID"),
      label: z.string().describe("Label name or colour (e.g. 'Bug', 'red')"),
    },
    async ({ card_id, label }) => {
      const boardLabels = await client.getBoardLabels();
      const match = boardLabels.find(
        (l) =>
          l.name.toLowerCase() === label.toLowerCase() ||
          (l.color ?? "").toLowerCase() === label.toLowerCase(),
      );
      if (!match) {
        const valid = boardLabels.map((l) => `"${l.name || l.color}"`).join(", ");
        throw new Error(`No label matching "${label}". Available: ${valid}`);
      }
      await client.addLabelToCard(card_id, match.id);
      return { content: [{ type: "text", text: `Added label "${match.name || match.color}" to card.` }] };
    },
  );

  server.tool(
    "remove_label",
    "Remove a label from a card by label name or colour",
    {
      card_id: z.string().describe("Trello card ID"),
      label: z.string().describe("Label name or colour to remove"),
    },
    async ({ card_id, label }) => {
      const card = await client.getCard(card_id);
      const match = card.labels.find(
        (l) =>
          l.name.toLowerCase() === label.toLowerCase() ||
          (l.color ?? "").toLowerCase() === label.toLowerCase(),
      );
      if (!match) {
        const current = card.labels.map((l) => `"${l.name || l.color}"`).join(", ");
        throw new Error(
          `Card has no label matching "${label}". Current labels: ${current || "none"}`,
        );
      }
      await client.removeLabelFromCard(card_id, match.id);
      return { content: [{ type: "text", text: `Removed label "${match.name || match.color}" from card.` }] };
    },
  );
}
