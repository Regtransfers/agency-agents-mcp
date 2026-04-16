#!/usr/bin/env bash

# Quick MCP Testing Reference
# Run this to see quick examples

cat << 'EOF'
╔══════════════════════════════════════════════════════════════════════════════╗
║                    MCP Server Quick Reference                                ║
╚══════════════════════════════════════════════════════════════════════════════╝

✅ YES - You're Debugging!
   Debugger is listening on port 9229

📡 MCP Communication: stdin/stdout (JSON-RPC), NOT HTTP

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 Quick Test Commands:

1️⃣  LIST ALL AGENTS:
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_agents","arguments":{}}}' | \
  docker exec -i agency-agents-mcp-debug node server.mjs 2>/dev/null | \
  jq -r '.result.content[0].text' | head -20

2️⃣  SEARCH FOR "SECURITY" AGENTS:
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"search_agents","arguments":{"keyword":"security"}}}' | \
  docker exec -i agency-agents-mcp-debug node server.mjs 2>/dev/null | \
  jq -r '.result.content[0].text'

3️⃣  ACTIVATE BACKEND ARCHITECT:
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"activate_agent","arguments":{"query":"backend architect"}}}' | \
  docker exec -i agency-agents-mcp-debug node server.mjs 2>/dev/null | \
  jq -r '.result.content[0].text' | head -50

4️⃣  GET SHARED INSTRUCTIONS:
echo '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"get_shared_instructions","arguments":{}}}' | \
  docker exec -i agency-agents-mcp-debug node server.mjs 2>/dev/null | \
  jq -r '.result.content[0].text' | head -30

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🐛 Debug with IDE:

VS Code:
  1. Open project in VS Code
  2. Press Ctrl+Shift+D (Run & Debug)
  3. Select "Docker: Attach to Running Container"
  4. Press F5
  5. Set breakpoints in server.mjs

JetBrains Rider:
  1. Open project in Rider
  2. Select "Attach to Docker Debugger"
  3. Press Shift+F9
  4. Set breakpoints in server.mjs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Status Check:

docker ps | grep agency-agents-mcp-debug
docker logs agency-agents-mcp-debug | tail -5
docker port agency-agents-mcp-debug

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 Documentation:

  MCP-TESTING.md       - Complete testing guide
  DEBUG.md             - Debugging guide
  DEBUG-COMPLETE.md    - Debug setup summary

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 Current Status:
   ✅ Debugger active on port 9229
   ✅ Server responding to requests
   ✅ 144 agents loaded
   ✅ 4 tools available (list, search, activate, get_shared)
   ✅ Ready to debug!

EOF

