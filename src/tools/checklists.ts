import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { TrelloClient } from "../trello/client.js";

export function registerChecklistTools(server: McpServer, client: TrelloClient): void {
  server.tool(
    "get_checklists",
    "Get all checklists and their items for a card",
    { card_id: z.string().describe("Trello card ID") },
    async ({ card_id }) => {
      const checklists = await client.getChecklists(card_id);
      if (checklists.length === 0) {
        return { content: [{ type: "text", text: "No checklists on this card." }] };
      }
      const lines: string[] = [];
      for (const cl of checklists) {
        const done = cl.checkItems.filter((i) => i.state === "complete").length;
        lines.push(`**${cl.name}** (${done}/${cl.checkItems.length}) — ID: ${cl.id}`);
        const sorted = [...cl.checkItems].sort((a, b) => a.pos - b.pos);
        for (const item of sorted) {
          const tick = item.state === "complete" ? "☑" : "☐";
          lines.push(`  ${tick} ${item.name} (ID: ${item.id})`);
        }
      }
      return { content: [{ type: "text", text: lines.join("\n") }] };
    },
  );

  server.tool(
    "create_checklist",
    "Add a new checklist to a card",
    {
      card_id: z.string().describe("Trello card ID"),
      name: z.string().describe("Name of the checklist"),
    },
    async ({ card_id, name }) => {
      const cl = await client.createChecklist(card_id, name);
      return {
        content: [{ type: "text", text: `Created checklist "${cl.name}" (ID: ${cl.id}) on card.` }],
      };
    },
  );

  server.tool(
    "add_checklist_item",
    "Add an item to a checklist",
    {
      checklist_id: z.string().describe("Trello checklist ID"),
      name: z.string().describe("Item text"),
    },
    async ({ checklist_id, name }) => {
      const item = await client.addChecklistItem(checklist_id, name);
      return {
        content: [{ type: "text", text: `Added checklist item "${item.name}" (ID: ${item.id}).` }],
      };
    },
  );

  server.tool(
    "update_checklist_item",
    "Mark a checklist item complete or incomplete, or rename it",
    {
      card_id: z.string().describe("Trello card ID that owns the checklist"),
      checklist_item_id: z.string().describe("Checklist item ID"),
      state: z
        .enum(["complete", "incomplete"])
        .optional()
        .describe("New completion state"),
      name: z.string().optional().describe("New item text"),
    },
    async ({ card_id, checklist_item_id, state, name }) => {
      const fields: Partial<{ name: string; state: "complete" | "incomplete" }> = {};
      if (state !== undefined) fields.state = state;
      if (name !== undefined) fields.name = name;
      const item = await client.updateChecklistItem(card_id, checklist_item_id, fields);
      return {
        content: [
          {
            type: "text",
            text: `Updated item "${item.name}" — ${item.state === "complete" ? "☑ complete" : "☐ incomplete"}.`,
          },
        ],
      };
    },
  );
}
