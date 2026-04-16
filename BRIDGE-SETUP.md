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

**The bridge lives in your project root** and acts as a lightweight proxy between your IDE and the hosted server. It's a 55-line Node.js script that forwards JSON-RPC messages over HTTPS.

**Location:** `/home/aaron/github/agency-agents-mcp/mcp-http-bridge.mjs`
**Status:** ✅ Created, tested, and ready to commit
**Purpose:** Connect Rider to hosted MCP server via stdio ↔ HTTPS

---

See also:
- [RIDER-SETUP-CONFIRMED.md](RIDER-SETUP-CONFIRMED.md) - Full setup verification
- [README.md](README.md) - Main documentation
- [HTTPS-TEST-RESULTS.md](HTTPS-TEST-RESULTS.md) - Server testing results


