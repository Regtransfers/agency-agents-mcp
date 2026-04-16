# 🎯 MCP Server Testing Guide

## ✅ You Are Successfully Debugging!

When you see:
```
Debugger listening on ws://0.0.0.0:9229/bc92de6e-7e4c-42b3-9011-6b8502327cd3
For help, see: https://nodejs.org/en/docs/inspector
```

**You're successfully debugging!** The Node.js debugger is active on port 9229.

## Understanding MCP Communication

The MCP (Model Context Protocol) server uses **stdio (stdin/stdout)** for communication, NOT HTTP endpoints.

### How It Works

```
Client                    MCP Server
  |                           |
  |  JSON-RPC Request         |
  |  (via stdin)              |
  |-------------------------->|
  |                           |
  |                           | Process request
  |                           | Load agents
  |                           | Execute tool
  |                           |
  |  JSON-RPC Response        |
  |  (via stdout)             |
  |<--------------------------|
  |                           |
```

### Message Format

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "list_agents",
    "arguments": {}
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "## Available Agents (144)\n\n..."
      }
    ]
  }
}
```

## Available Tools (Endpoints)

### 1. `list_agents` - List all available agents

**Request:**
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_agents","arguments":{}}}' | \
  docker exec -i agency-agents-mcp-debug node server.mjs 2>/dev/null
```

**With category filter:**
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_agents","arguments":{"category":"engineering"}}}' | \
  docker exec -i agency-agents-mcp-debug node server.mjs 2>/dev/null
```

**Categories:** `engineering`, `design`, `marketing`, `testing`, `sales`, `product`, `academic`, `support`, `game-development`, `specialized`, `project-management`, `paid-media`, `spatial-computing`

### 2. `search_agents` - Search agents by keyword

**Request:**
```bash
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"search_agents","arguments":{"keyword":"security"}}}' | \
  docker exec -i agency-agents-mcp-debug node server.mjs 2>/dev/null
```

**Parameters:**
- `keyword` (string, required): Search term
- `limit` (number, optional): Max results (default: 10)

### 3. `activate_agent` - Activate a specific agent

**Request:**
```bash
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"activate_agent","arguments":{"query":"backend architect"}}}' | \
  docker exec -i agency-agents-mcp-debug node server.mjs 2>/dev/null
```

**Parameters:**
- `query` (string, required): Agent name or slug

**Examples:**
- `"backend architect"` - Matches by name
- `"engineering-backend-architect"` - Matches by slug
- `"security"` - Fuzzy search

### 4. `get_shared_instructions` - Get shared standards

**Request:**
```bash
echo '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"get_shared_instructions","arguments":{}}}' | \
  docker exec -i agency-agents-mcp-debug node server.mjs 2>/dev/null
```

Returns the clean code standards applied to all agents.

## Quick Test Commands

### List All Agents (first 30 lines)
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_agents","arguments":{}}}' | \
  docker exec -i agency-agents-mcp-debug node server.mjs 2>/dev/null | \
  jq -r '.result.content[0].text' | head -30
```

### Search for "security" agents
```bash
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"search_agents","arguments":{"keyword":"security"}}}' | \
  docker exec -i agency-agents-mcp-debug node server.mjs 2>/dev/null | \
  jq -r '.result.content[0].text'
```

### Activate Backend Architect
```bash
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"activate_agent","arguments":{"query":"backend architect"}}}' | \
  docker exec -i agency-agents-mcp-debug node server.mjs 2>/dev/null | \
  jq -r '.result.content[0].text' | head -100
```

### Get Shared Instructions
```bash
echo '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"get_shared_instructions","arguments":{}}}' | \
  docker exec -i agency-agents-mcp-debug node server.mjs 2>/dev/null | \
  jq -r '.result.content[0].text' | head -50
```

## Using the Test Scripts

### Automated Test Suite
```bash
# Run all tests
./test-mcp-endpoints.sh
```

This script tests all four MCP tools and shows you the responses.

### Interactive Test Client
```bash
# Copy the client into the container
docker cp test-mcp-client.mjs agency-agents-mcp-debug:/app/

# List all agents
echo "list" | docker exec -i agency-agents-mcp-debug node /app/test-mcp-client.mjs | node server.mjs

# Search for agents
echo "search security" | docker exec -i agency-agents-mcp-debug node /app/test-mcp-client.mjs | node server.mjs

# Activate an agent
echo "activate \"backend architect\"" | docker exec -i agency-agents-mcp-debug node /app/test-mcp-client.mjs | node server.mjs
```

## Debugging with IDE

### VS Code
1. The debugger is already listening on port 9229
2. Open VS Code
3. Go to Run & Debug (Ctrl+Shift+D)
4. Select "Docker: Attach to Running Container"
5. Press F5
6. Set breakpoints in `server.mjs`
7. Send a test request (use commands above)
8. Your breakpoints will hit!

### JetBrains Rider
1. The debugger is already listening on port 9229
2. Open Rider
3. Select "Attach to Docker Debugger" from run configurations
4. Click debug (Shift+F9)
5. Set breakpoints in `server.mjs`
6. Send a test request
7. Debug!

## Common Testing Patterns

### Test a specific function
```bash
# Set breakpoint at line where list_agents is called
# Then send request:
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_agents","arguments":{}}}' | \
  docker exec -i agency-agents-mcp-debug node server.mjs
```

### Watch logs in real-time
```bash
docker-compose -f docker-compose.debug.yml logs -f
```

### Inspect container
```bash
# Get a shell in the container
docker exec -it agency-agents-mcp-debug sh

# Check agents are loaded
ls /app/agents/*.md | wc -l

# Check server file exists
ls -la /app/server.mjs

# Exit
exit
```

## Troubleshooting

### "Cannot connect to debugger"
- Check container is running: `docker ps | grep agency-agents-mcp-debug`
- Check port 9229 is exposed: `docker port agency-agents-mcp-debug 9229`
- Restart container: `docker-compose -f docker-compose.debug.yml restart`

### "No response from server"
- Check container logs: `docker logs agency-agents-mcp-debug`
- Verify JSON is valid: Use `jq` to validate your request
- Ensure proper escaping in shell commands

### "jq: command not found"
```bash
# Install jq (optional, for pretty JSON output)
# On Ubuntu/Debian:
sudo apt install jq

# On macOS:
brew install jq

# Or just view raw JSON without jq
```

## Response Format Details

All responses follow this structure:

```json
{
  "jsonrpc": "2.0",
  "id": <request-id>,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "<response-text>"
      }
    ]
  }
}
```

For errors:
```json
{
  "jsonrpc": "2.0",
  "id": <request-id>,
  "error": {
    "code": -32600,
    "message": "Invalid request"
  }
}
```

## Performance Testing

### Measure response time
```bash
time echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_agents","arguments":{}}}' | \
  docker exec -i agency-agents-mcp-debug node server.mjs > /dev/null 2>&1
```

### Test concurrent requests
```bash
for i in {1..5}; do
  echo '{"jsonrpc":"2.0","id":'$i',"method":"tools/call","params":{"name":"list_agents","arguments":{}}}' | \
    docker exec -i agency-agents-mcp-debug node server.mjs &
done
wait
```

## What's Next?

1. ✅ **You're debugging** - Debugger is active on port 9229
2. ✅ **Server works** - All 4 tools responding correctly
3. ✅ **144 agents loaded** - All agent definitions available
4. ✅ **Shared instructions loaded** - Clean code standards active

### Try These:
- Set breakpoints in `server.mjs` and step through code
- Modify an agent file and reload
- Test error handling with invalid requests
- Monitor memory usage under load

## Summary

**MCP Server Status:** ✅ Running and responding  
**Debugger Status:** ✅ Active on port 9229  
**Agents Loaded:** ✅ 144 agents  
**Tools Available:** ✅ 4 (list, search, activate, get_shared)  
**IDE Debug:** ✅ Ready (VS Code & Rider configs)  

**You're ready to debug!** 🎉

