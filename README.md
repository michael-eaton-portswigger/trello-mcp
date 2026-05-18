# trello-mcp

An MCP server for Trello. Lets Claude view, create, and manage your Trello cards directly.

## Prerequisites

- Node.js 18 or later
- A Trello account with API access

## Installation

```bash
git clone https://github.com/michael-eaton-portswigger/trello-mcp.git
cd trello-mcp
npm install
npm run build
```

The build step compiles the TypeScript to `dist/`. The MCP config below points at the compiled output, so you must build before first use (and after pulling updates).

## Getting Trello Credentials

### API Key

1. Go to [https://trello.com/app-key](https://trello.com/app-key)
2. Copy the **API Key** shown at the top

### Personal Token

1. On the same page, click the **Token** link
2. Click **Allow** to grant access
3. Copy the token from the resulting page

> Set tokens to **Never** expire unless you have a specific reason to rotate them.

### Board ID

Run the following curl command with your key and token to list your boards and find the ID you want:

```bash
curl "https://api.trello.com/1/members/me/boards?key=YOUR_KEY&token=YOUR_TOKEN&fields=id,name"
```

Copy the `id` value for the board you want to use.

> The short ID in the Trello board URL (e.g. `trello.com/b/abc123/...`) is not the same as the full board ID returned by the API. Use the API response `id` field.

## Claude Code Setup

Add the following to your `~/.claude/settings.json` under `mcpServers`, replacing the path and credentials with your own:

```json
{
  "mcpServers": {
    "trello": {
      "command": "node",
      "args": ["/path/to/trello-mcp/dist/index.js"],
      "env": {
        "TRELLO_API_KEY": "your_api_key",
        "TRELLO_TOKEN": "your_personal_token",
        "TRELLO_BOARD_ID": "your_board_id"
      }
    }
  }
}
```

Replace `/path/to/trello-mcp` with the absolute path to where you cloned this repo (e.g. `/Users/yourname/vcs/trello-mcp`).

## Claude Desktop Setup

Add the same block to `~/Library/Application Support/Claude/claude_desktop_config.json` under `mcpServers`.

## Available Tools

### Board & Lists

| Tool | Description |
|---|---|
| `list_boards` | List all accessible Trello boards |
| `get_board` | Get the configured board with its lists and card counts |
| `get_list_cards` | Get all open cards in a named list |
| `search_cards` | Search cards across all lists by keyword (max 1000 results) |

### Cards

| Tool | Description |
|---|---|
| `get_card` | Get full card details (description, due date, labels, checklists, comments) |
| `create_card` | Create a card in a named list |
| `update_card` | Update a card's name, description, or due date (pass `null` to clear due date) |
| `move_card` | Move a card to a different list |
| `archive_card` | Archive a card (recoverable from the Trello UI) |
| `add_label` | Add a label to a card by name or colour |
| `remove_label` | Remove a label from a card |

### Checklists

| Tool | Description |
|---|---|
| `get_checklists` | Get all checklists and items on a card |
| `create_checklist` | Add a checklist to a card |
| `add_checklist_item` | Add an item to a checklist |
| `update_checklist_item` | Mark an item complete/incomplete or rename it |

### Comments

| Tool | Description |
|---|---|
| `get_comments` | List comments on a card (newest first) |
| `add_comment` | Post a comment on a card |

### Members & Attachments

| Tool | Description |
|---|---|
| `get_board_members` | List all members on the configured board |
| `assign_member` | Assign a member to a card by username or full name |
| `unassign_member` | Remove a member from a card |
| `get_attachments` | List attachments on a card |
| `add_url_attachment` | Attach a URL to a card |

## Development

```bash
# Run tests
npm test

# Type-check without building
npx tsc --noEmit

# Rebuild after making changes
npm run build
```

## Notes

- **One board**: the server is configured around a single board. Use `list_boards` to find board IDs, set `TRELLO_BOARD_ID`, and leave it.
- **No hard delete**: cards are archived (soft delete), not permanently deleted. Recover them from the Trello UI.
- **No list management**: creating or deleting lists is intentionally out of scope. Manage your board structure from the Trello UI.
- **URL attachments only**: file uploads are not supported.
- **Real-time**: the server is request/response only. Claude won't be notified of external board changes between tool calls.

## Licence

MIT
