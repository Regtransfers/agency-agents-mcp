# JetBrains Rider MCP Setup Guide

## Quick Setup

Add this to your Rider MCP settings:

### Location
**Settings → Tools → Model Context Protocol**

Or edit the config file directly at:
- Linux: `~/.config/JetBrains/Rider{version}/mcp_config.json`
- macOS: `~/Library/Application Support/JetBrains/Rider{version}/mcp_config.json`

### Configuration

```json
{
  "mcpServers": {
    "agency-agents": {
      "command": "/home/aaron/.local/bin/mcp-http-bridge",
      "env": {
        "MCP_URL": "https://agency-agents-mcp.regtransfers.dev"
      }
    }
  }
}
```

## After Setup

1. Restart Rider
2. Open AI Assistant
3. You should now have access to these tools:
   - `list_agents` - List all 144 available agents
   - `activate_agent` - Load a specific agent persona
   - `search_agents` - Search agents by keyword
   - `list_skills` - List all 1400+ available skills
   - `activate_skill` - Load a specific skill
   - `search_skills` - Search skills by keyword
   - `get_shared_instructions` - View shared instructions
   - `get_skill_categories` - List skill categories
   - `healthz` - Health check

## Verify It Works

In the AI Assistant chat, you should be able to say:
- "List available agents"
- "Show me all skills"
- "Activate the backend architect agent"

And I'll use the MCP tools directly without any terminal commands.

## Troubleshooting

If tools don't appear:
1. Verify the bridge is executable: `chmod +x ~/.local/bin/mcp-http-bridge`
2. Test the bridge manually: `echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | ~/.local/bin/mcp-http-bridge`
3. Check Rider logs for MCP errors
4. Ensure the remote server is up: `curl https://agency-agents-mcp.regtransfers.dev`

## Why This Setup?

- **No project clone needed** - The bridge connects to the remote server
- **Globally available** - Works in any Rider project
- **Always up-to-date** - Uses the live server with latest agents/skills
- **Zero maintenance** - No local server to run or update

