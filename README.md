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
```

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

Run the server once (after configuring your credentials), then ask Claude to call `list_boards`. Your board's ID will be in the output. Alternatively, open your Trello board in a browser — the URL contains the board's short ID (e.g. `trello.com/b/abc123/my-board`), but the full ID shown by the API is what you need.

## Configuration

The server reads three environment variables:

```
TRELLO_API_KEY=your_api_key
TRELLO_TOKEN=your_personal_token
TRELLO_BOARD_ID=your_board_id
```

## Claude Code Setup

Add the following to your `~/.claude/settings.json` under `mcpServers`:

```json
{
  "mcpServers": {
    "trello": {
      "command": "npx",
      "args": ["tsx", "/path/to/trello-mcp/src/index.ts"],
      "env": {
        "TRELLO_API_KEY": "your_api_key",
        "TRELLO_TOKEN": "your_personal_token",
        "TRELLO_BOARD_ID": "your_board_id"
      }
    }
  }
}
```

Replace `/path/to/trello-mcp` with the actual path where you cloned this repo.

## Available Tools

### Board & Lists

| Tool | Description |
|---|---|
| `list_boards` | List all accessible Trello boards (useful for finding your board ID) |
| `get_board` | Get the configured board with its lists and card counts |
| `get_list_cards` | Get all open cards in a named list |
| `search_cards` | Search cards across all lists by keyword |

### Cards

| Tool | Description |
|---|---|
| `get_card` | Get full card details (description, due date, labels, checklists, comments) |
| `create_card` | Create a card in a named list |
| `update_card` | Update a card's name, description, or due date |
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
| `assign_member` | Assign a member to a card |
| `unassign_member` | Remove a member from a card |
| `get_attachments` | List attachments on a card |
| `add_url_attachment` | Attach a URL to a card |

## Development

```bash
# Run with live reload
npm run dev

# Type-check
npx tsc --noEmit

# Run tests
npm test
```

## Notes

- **One board**: this server is designed around a single configured board. Use `list_boards` to find your board ID, then set `TRELLO_BOARD_ID` and leave it.
- **No hard delete**: cards are archived (soft delete), not permanently deleted. You can recover them from the Trello UI.
- **No list management**: creating or deleting lists is intentionally out of scope. Manage your list structure (workflow states) from the Trello UI.
- **URL attachments only**: file uploads are not supported. Attachments are URL-based.
- **Real-time**: the server is request/response only. Claude won't be notified of external board changes between tool calls.

## Licence

MIT
