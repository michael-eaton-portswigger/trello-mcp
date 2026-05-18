import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TrelloClient } from "./trello/client.js";
import { registerCardTools } from "./tools/cards.js";
import { registerChecklistTools } from "./tools/checklists.js";
import { registerCommentTools } from "./tools/comments.js";
import { registerListTools } from "./tools/lists.js";
import { registerMemberTools } from "./tools/members.js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

export function createServer(): McpServer {
  const apiKey = requireEnv("TRELLO_API_KEY");
  const token = requireEnv("TRELLO_TOKEN");
  const boardId = requireEnv("TRELLO_BOARD_ID");

  const client = new TrelloClient(apiKey, token, boardId);

  const server = new McpServer({
    name: "trello-mcp",
    version: "1.0.0",
  });

  registerListTools(server, client);
  registerCardTools(server, client);
  registerChecklistTools(server, client);
  registerCommentTools(server, client);
  registerMemberTools(server, client);

  return server;
}
