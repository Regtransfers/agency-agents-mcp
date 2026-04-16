So# HTTP Bridge Setup - Quick Guide

## What is mcp-http-bridge.mjs?

A **standalone** stdio-to-HTTPS bridge that lets your IDE connect to the hosted MCP server **without cloning the project**.

## Installation (One Command)

```bash
# Linux/macOS
curl -o ~/.local/bin/mcp-http-bridge https://raw.githubusercontent.com/Regtransfers/agency-agents-mcp/main/mcp-http-bridge.mjs && chmod +x ~/.local/bin/mcp-http-bridge

# Windows (PowerShell)
$dir = "$env:LOCALAPPDATA\mcp-bridge"; New-Item -ItemType Directory -Force -Path $dir | Out-Null; Invoke-WebRequest -Uri "https://raw.githubusercontent.com/Regtransfers/agency-agents-mcp/main/mcp-http-bridge.mjs" -OutFile "$dir\mcp-http-bridge.mjs"
```

## Where Does It Live?

**NOT in the project!** It's a standalone script you install once:

- **Linux/macOS:** `~/.local/bin/mcp-http-bridge`
- **Windows:** `%LOCALAPPDATA%\mcp-bridge\mcp-http-bridge.mjs`

**No project clone needed!** ✅

## Why Is It Needed?

1. **IDE expects stdio** - Copilot plugin communicates via stdin/stdout
2. **Server is HTTPS** - Hosted at https://agency-agents-mcp.regtransfers.dev/
3. **Bridge converts** - stdio ↔ HTTPS

```
Rider → stdio → bridge (in ~/.local/bin) → HTTPS → hosted server
```

## Configure Your IDE

**Rider/IntelliJ:**
```bash
mkdir -p ~/.config/github-copilot/intellij && cat > ~/.config/github-copilot/intellij/mcp.json << 'EOF'
{
    "servers": {
        "agency-agents": {
            "type": "stdio",
            "command": "/home/$USER/.local/bin/mcp-http-bridge",
            "env": {
                "MCP_URL": "https://agency-agents-mcp.regtransfers.dev"
            }
        }
    }
}
EOF
```

**VS Code:**
```bash
# Same as above, change 'intellij' to 'vscode'
```

## Testing It

```bash
# Test the bridge
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"healthz","arguments":{}}}' | \
  ~/.local/bin/mcp-http-bridge
```

Should return healthy status from the remote server.

## Protocol Support

The MCP server and bridge support:

✅ **Supported Methods:**
- `initialize` - MCP handshake
- `tools/list` - List all available tools (9 tools: list_agents, activate_agent, search_agents, etc.)
- `tools/call` - Execute a tool
- `notifications/initialized` - Protocol notification

❌ **Unsupported Methods (returns "Method not found"):**
- `resources/list` - Not implemented (MCP optional)
- `prompts/list` - Not implemented (MCP optional)
- `resources/read` - Not implemented (MCP optional)
- `prompts/get` - Not implemented (MCP optional)

This is **normal behavior** - the server focuses on tools-only functionality for agent/skill management.

## Troubleshooting

**Bridge not connecting:**
```bash
# Test if bridge is executable
ls -la ~/.local/bin/mcp-http-bridge

# Test with debug output
DEBUG=1 echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | ~/.local/bin/mcp-http-bridge
```

**IDE can't find skills:**
- Verify MCP_URL is set correctly in mcp.json
- Check IDE logs for MCP connection errors
- Test bridge manually (see above)
- Restart IDE after config changes

**"Method not found" errors:**
- If error is for `resources/list` or `prompts/list` - this is normal
- If error is for `tools/list` - check server deployment
- Verify remote server is running: `curl https://agency-agents-mcp.regtransfers.dev/health`

## For Team Members

**Setup takes 2 minutes:**

1. **Download bridge:** One curl command
2. **Create config:** One command to generate mcp.json
3. **Restart IDE:** Done!

**No:**
- ❌ No git clone
- ❌ No npm install
- ❌ No project setup
- ❌ No dependencies

**Just:**
- ✅ Download one script
- ✅ Point IDE at it
- ✅ Use 144 agents + 1,412 skills

## For Developers (Local Development)

If you're working on the MCP server itself, clone the project and use local server:

```json
{
    "servers": {
        "agency-agents": {
            "type": "stdio",
            "command": "/usr/bin/node",
            "args": ["/path/to/agency-agents-mcp/server.mjs"]
        }
    }
}
```

## Summary

**The bridge is a standalone script** installed once in your system PATH. It acts as a lightweight proxy between your IDE and the hosted server, maintaining a persistent connection with proper MCP protocol support.

**What it does:**
- Maintains persistent connection to remote MCP server
- Handles MCP initialization handshake automatically
- Supports all standard MCP methods (tools/list, resources/list, prompts/list, etc.)
- Forwards JSON-RPC messages over HTTPS
- Returns proper "Method not found" for unsupported methods

**User Installation:**
- **Linux/macOS:** `~/.local/bin/mcp-http-bridge`
- **Windows:** `%LOCALAPPDATA%\mcp-bridge\mcp-http-bridge.mjs`

**Server Implementation:**
- **Source:** `/home/aaron/github/agency-agents-mcp/mcp-http-bridge.mjs` (for reference)
- **Remote URL:** `https://raw.githubusercontent.com/Regtransfers/agency-agents-mcp/main/mcp-http-bridge.mjs`
- **Status:** ✅ Deployed and production-ready

---

See also:
- [RIDER-SETUP-CONFIRMED.md](RIDER-SETUP-CONFIRMED.md) - Full setup verification
- [README.md](README.md) - Main documentation
- [HTTPS-TEST-RESULTS.md](HTTPS-TEST-RESULTS.md) - Server testing results




