# Manual Setup

Use this guide if you are installing the server manually — for example, to use it with Claude Code (the CLI) rather than Claude Desktop.

## Prerequisites

- Node.js 18 or later
- A Trello account with API access

## 1. Build the server

```bash
git clone https://github.com/michael-eaton-portswigger/trello-mcp.git
cd trello-mcp
npm install
npm run build
```

Run `npm run build` again after pulling updates.

## 2. Get your Trello credentials

### API Key

1. Go to [https://trello.com/app-key](https://trello.com/app-key)
2. Copy the **API Key** shown at the top of the page

### Personal Token

1. On the same page, click the **Token** link
2. Click **Allow** to grant access
3. Copy the token from the resulting page

> Set tokens to **Never** expire unless you have a specific reason to rotate them.

### Board ID

Run the following command, substituting your key and token:

```bash
curl "https://api.trello.com/1/members/me/boards?key=YOUR_KEY&token=YOUR_TOKEN&fields=id,name"
```

Copy the `id` value for the board you want to use.

> The short ID in the Trello board URL (e.g. `trello.com/b/abc123/...`) is **not** the same as the full board ID returned by the API. Use the `id` field from the API response.

## 3. Configure Claude Code

Add the following block to `~/.claude/settings.json` under `mcpServers`:

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

Replace `/path/to/trello-mcp` with the absolute path to where you cloned the repo.

## Configure Claude Desktop (manual)

If you prefer not to use the `.mcpb` installer, add the same block to:

```
~/Library/Application Support/Claude/claude_desktop_config.json
```
