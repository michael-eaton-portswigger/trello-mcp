# trello-mcp

An MCP server that lets Claude view, create, and manage your Trello cards.

[![CI](https://github.com/michael-eaton-portswigger/trello-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/michael-eaton-portswigger/trello-mcp/actions/workflows/ci.yml)

## Installation

| Method | Best for |
|---|---|
| [.mcpb bundle](docs/installing-via-mcpb.md) | Claude Desktop — one-click install, no build step |
| [Manual setup](docs/manual-setup.md) | Claude Code (CLI) or building from source |

## Tools

### Board & Lists

| Tool | Description |
|---|---|
| `list_boards` | List all accessible Trello boards |
| `get_board` | Get the configured board with its lists and card counts |
| `get_list_cards` | Get all open cards in a named list |
| `search_cards` | Search cards across all lists by keyword |

### Cards

| Tool | Description |
|---|---|
| `get_card` | Get full card details including description, due date, labels, checklists, and comments |
| `create_card` | Create a card in a named list |
| `update_card` | Update a card's name, description, or due date (pass `null` to clear the due date) |
| `move_card` | Move a card to a different list |
| `archive_card` | Archive a card — recoverable from the Trello UI |
| `add_label` | Add a label to a card by name or colour |
| `remove_label` | Remove a label from a card |

### Checklists

| Tool | Description |
|---|---|
| `get_checklists` | Get all checklists and their items for a card |
| `create_checklist` | Add a new checklist to a card |
| `add_checklist_item` | Add an item to a checklist |
| `update_checklist_item` | Mark an item complete or incomplete, or rename it |

### Comments

| Tool | Description |
|---|---|
| `get_comments` | List comments on a card, newest first |
| `add_comment` | Post a comment on a card |

### Members & Attachments

| Tool | Description |
|---|---|
| `get_board_members` | List all members on the configured board |
| `assign_member` | Assign a member to a card by username or full name |
| `unassign_member` | Remove a member from a card |
| `get_attachments` | List URL attachments on a card |
| `add_url_attachment` | Attach a URL to a card |

## Design decisions

- **One board per instance** — the server is scoped to a single board, set via `TRELLO_BOARD_ID`. Use `list_boards` to find IDs.
- **Archive, not delete** — cards are archived (soft delete) rather than permanently deleted, keeping them recoverable from the Trello UI.
- **No list management** — creating or deleting lists is out of scope; manage board structure from the Trello UI.
- **URL attachments only** — file uploads are not supported.

## Development

```bash
npm test          # run the test suite
npm run build     # compile TypeScript to dist/
npx tsc --noEmit  # type-check without building
```

## API reference

This server uses the [Trello REST API](https://developer.atlassian.com/cloud/trello/rest/api-group-actions/).

## Licence

MIT
