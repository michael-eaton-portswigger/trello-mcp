# Contributing to trello-mcp

## Prerequisites

- Node.js 22+
- A Trello account with an API key and token ([get them here](https://trello.com/app-key))
- A Trello board ID to test against

## Setup

```bash
git clone https://github.com/michael-eaton-portswigger/trello-mcp.git
cd trello-mcp
npm install
```

Copy your credentials into the environment before running anything:

```bash
export TRELLO_API_KEY=your_key
export TRELLO_TOKEN=your_token
export TRELLO_BOARD_ID=your_board_id
```

## Development workflow

```bash
npm run dev          # run the MCP server with tsx (no build step)
npm test             # run the full test suite
npm run test:watch   # re-run tests on file change
npx tsc --noEmit     # type-check without building
npm run build        # compile TypeScript to dist/
```

CI runs `npm test`, `npm run build`, and validates `manifest.json` on every push and pull request.

## Project structure

```
src/
  index.ts           # entry point — reads env, builds client, starts server
  server.ts          # MCP server setup, registers all tool groups
  tools/
    cards.ts         # card tools: get, create, update, move, archive, labels
    checklists.ts    # checklist tools
    comments.ts      # comment tools
    lists.ts         # list resolution helper + list/board tools
    members.ts       # member and attachment tools
  trello/
    client.ts        # typed HTTP client wrapping the Trello REST API
    types.ts         # TypeScript types + display helpers (formatDate, labelDisplay)
tests/
  client.test.ts     # TrelloClient unit tests
  tools.test.ts      # tool handler unit tests (via TrelloClient stub)
```

## Adding a new tool

Each tool group is a `register*Tools(server, client)` function. Follow this pattern:

**1. Add the API method to `TrelloClient` in `src/trello/client.ts`** if you need a new Trello endpoint.

**2. Register the tool in the appropriate `src/tools/*.ts` file:**

```typescript
server.tool(
  "tool_name",
  "Short description shown to Claude",
  {
    card_id: z.string().describe("Trello card ID"),
    name:    z.string().describe("Human-readable description of this field"),
  },
  async ({ card_id, name }) => {
    const result = await client.someMethod(card_id, name);
    return { content: [{ type: "text", text: `Done: ${result.name}` }] };
  },
);
```

**3. Export the tool from `src/server.ts`** by calling your register function there.

**4. Update `manifest.json`** — add the new tool name to the `tools` array so it appears in the published bundle.

**5. Write tests** (see below).

### Conventions

- **Zod schemas are the contract.** Every parameter needs a `.describe()` string — Claude reads these.
- **Error messages should be actionable.** When a lookup fails, tell the caller what values are valid: `No list named "X". Available: "To Do", "In Progress", "Done"`.
- **Use `null` to clear optional fields**, not empty string. The `update_card` tool passes `null` for due date removal; follow the same pattern elsewhere.
- **No list or board management** — creating/deleting lists is out of scope. Direct users to the Trello UI.
- **No file uploads** — URL attachments only.

## Testing

Tests live in `tests/` and use [Vitest](https://vitest.dev/).

The `makeClient()` helper in `tools.test.ts` builds a fully-stubbed `TrelloClient` with `vi.fn()` for every method. Override only what the test needs:

```typescript
const client = makeClient({
  getLists: vi.fn().mockResolvedValue(lists),
});
```

For tool handler tests, capture the handler by intercepting `server.tool`:

```typescript
let handler: (args: Record<string, unknown>) => Promise<unknown>;
const server = {
  tool: vi.fn((name, _desc, _schema, h) => {
    if (name === "your_tool") handler = h;
  }),
};
registerYourTools(server as never, client);
const result = await handler!({ card_id: "c1" });
```

Cover the happy path, case-insensitive matching where applicable, and the error message for each failure mode.

## Pull requests

- **One concern per PR.** A bug fix, a new tool, or a refactor — not all three.
- **Tests required** for any new tool or changed behaviour.
- **Pass CI before requesting review** — `npm test` and `npx tsc --noEmit` must be clean.
- Commit messages should use the imperative mood and explain *why* when the reason isn't obvious (`fix: use idLabels instead of labels to avoid undefined on label display`).

## Releases

Releases are automated. When a version tag is pushed (`v1.2.3`), the release workflow builds the project, packs a `.mcpb` bundle, and creates a GitHub release with it attached. To cut a release:

1. Update the version in `package.json`.
2. Commit and push.
3. Tag the commit: `git tag v1.x.y && git push --tags`.
