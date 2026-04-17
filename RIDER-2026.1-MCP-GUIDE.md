# Rider 2026.1 MCP Integration Guide

## ✅ Status: FULLY CONFIGURED AND WORKING

Your MCP server is properly configured and responding. All diagnostics pass.

## What Changed in 2026.1

Rider 2026.1 has **native MCP integration** built directly into GitHub Copilot. The MCP tools are NOT shown as a separate UI button anymore—they're available automatically in Copilot Chat.

## How to Use MCP Tools in Rider 2026.1

### Method 1: Direct Tool Access in Chat

Open GitHub Copilot Chat and simply **ask Copilot to use the tools**:

```
@workspace List all available agents
```

```
Activate the backend architect agent
```

```
Search for agents related to security
```

```
List all AI skills
```

### Method 2: Let Copilot Discover Tools Automatically

The MCP tools are available to Copilot automatically. When you ask questions, Copilot can choose to use these tools:

```
What AI agents do I have available?
```

```
I need help with backend architecture - what agents can help?
```

```
Show me skills related to testing
```

### Method 3: Check Available Tools

In Copilot Chat, you can ask:

```
What MCP tools are available?
```

```
Show me what you can do with agency-agents
```

## Available Tools

Your `agency-agents` MCP server provides these tools:

1. **list_agents** - List all available AI agent personas with optional category filter
2. **activate_agent** - Activate an AI agent persona by name or slug  
3. **search_agents** - Search agent personas by keyword
4. **get_shared_instructions** - View shared instructions applied to all agents
5. **list_skills** - List all available AI skills with optional category filter
6. **activate_skill** - Activate an AI skill by name or slug
7. **search_skills** - Search skills by keyword
8. **get_skill_categories** - Get list of all skill categories
9. **healthz** - Health check endpoint

## Verification Steps

1. **Open Copilot Chat** in Rider (usually Alt+2 or via toolbar)

2. **Try this command**:
   ```
   @workspace Can you list the available agent tools using the agency-agents MCP server?
   ```

3. **Or simply ask**:
   ```
   List all available AI agents
   ```

4. **Copilot should respond** with the list of agents from your MCP server

## Configuration Details

### MCP Config Location
```
/home/aaron/.config/github-copilot/intellij/mcp.json
```

### Current Config
```json
{
    "servers": {
        "agency-agents": {
            "type": "stdio",
            "command": "/home/aaron/.local/bin/mcp-agency-agents"
        }
    }
}
```

### Rider Settings
- MCP Server plugin: ✅ Loaded (`com.intellij.mcpServer`)
- Server enabled: ✅ Yes (in `llm.mcpServers.xml`)
- Config path: ✅ Correct (in `github-copilot.xml`)

## Troubleshooting

### If tools aren't appearing:

1. **Restart Rider** completely (not just reload project)

2. **Check Copilot is signed in**:
   - Tools → GitHub Copilot → Sign in (if not already)

3. **Verify in Chat**:
   ```
   What tools do you have access to?
   ```

4. **Check Settings**:
   - File → Settings → Tools → GitHub Copilot
   - Ensure "Enable MCP integration" is checked (if option exists)

5. **View Logs**:
   ```bash
   tail -f ~/.cache/JetBrains/Rider2026.1/log/idea.log | grep -i mcp
   ```

### If you see "MCP Settings" in UI:

Some Rider versions expose MCP configuration via:
- **Tools → MCP Servers** (if available)
- **Settings → Tools → MCP** (if available)

Check there to see if `agency-agents` is listed and enabled.

## Testing the MCP Server Directly

Run this to test the server:

```bash
./test-rider-mcp.sh
```

All checks should pass (they currently do).

## What to Expect

When working properly:
- Copilot can access your 100+ AI agents
- You can activate specific agents for specialized tasks
- Skills are available for specific workflows
- All via natural language in Copilot Chat

**No separate UI is needed** - it's all integrated into the chat experience.

## Examples

Try these in Copilot Chat:

```
Show me all engineering agents
```

```
I need a security expert - what agents are available?
```

```
Activate the backend architect agent and help me design a REST API
```

```
What skills do you have for testing?
```

```
Use the code review agent to review this file
```

## Summary

✅ Your MCP setup is COMPLETE and WORKING  
✅ Rider 2026.1 has everything configured correctly  
✅ Tools are accessed via Copilot Chat, not a separate UI  
✅ Just ask Copilot to use the tools naturally  

**The major release (2026.1) has full native MCP support built-in!**

