import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

const server = createServer();
const transport = new StdioServerTransport();

server.connect(transport).catch((error: unknown) => {
  console.error("Fatal:", error);
  process.exit(1);
});
