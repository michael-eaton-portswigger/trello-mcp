# Installing Trello MCP via .mcpb

The easiest way to add this MCP server to Claude is using the pre-built `.mcpb` bundle published with each release. This installs everything in a few clicks — no cloning, no `npm install`, no JSON editing.

## Step 1 — Download the bundle

Go to the [Releases page](https://github.com/michael-eaton-portswigger/trello-mcp/releases) and download the `trello-mcp.mcpb` file from the latest release.

## Step 2 — Open the bundle

Double-click the downloaded `trello-mcp.mcpb` file. Claude Desktop will open and display an installation dialog.

> If double-clicking does not open Claude Desktop, right-click the file and choose **Open With → Claude**.

## Step 3 — Fill in the configuration form

The installation dialog will ask for three values:

### Trello API Key

1. Go to [https://trello.com/app-key](https://trello.com/app-key)
2. Copy the **API Key** shown at the top of the page

### Trello Token

1. On the same page, click the **Token** link
2. Click **Allow** to grant access
3. Copy the token from the resulting page

> Set tokens to **Never** expire unless you have a specific reason to rotate them.

### Trello Board ID

Run the following command in your terminal, substituting your key and token:

```bash
curl "https://api.trello.com/1/members/me/boards?key=YOUR_KEY&token=YOUR_TOKEN&fields=id,name"
```

This returns a JSON array of your boards. Copy the `id` value for the board you want to use.

> The short ID visible in the Trello board URL (e.g. `trello.com/b/abc123/...`) is **not** the same as the full board ID returned by the API. Use the `id` field from the API response.

## Step 4 — Confirm installation

Click **Install** in the dialog. Claude Desktop will register the server and it will be available immediately — no restart required.

## Verifying it works

Open a conversation in Claude Desktop and ask:

> "Show me my Trello board"

Claude should call `get_board` and return your board's lists and card counts.

---

## Updating

When a new release is published, download the new `trello-mcp.mcpb` and double-click it. Claude Desktop will update the existing installation in place.

---

## Alternative: manual setup for Claude Code

If you are using Claude Code (the CLI) rather than Claude Desktop, the `.mcpb` installation method is not applicable. Follow the [manual setup instructions](../README.md#claude-code-setup) in the README instead.
