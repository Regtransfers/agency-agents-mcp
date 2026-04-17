#!/bin/bash
# Force refresh of MCP tools in Rider 2026.1

echo "=== MCP Tools Refresh for Rider 2026.1 ==="
echo ""

# Step 1: Get tools list from MCP server
echo "1. Querying agency-agents MCP server for tools..."
INIT_RESPONSE=$(echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"refresh","version":"1.0"}}}' | /home/aaron/.local/bin/mcp-agency-agents 2>&1)

echo "2. Getting tools list..."
TOOLS_RESPONSE=$(echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | timeout 5 /home/aaron/.local/bin/mcp-agency-agents 2>&1)

echo "$TOOLS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$TOOLS_RESPONSE"

echo ""
echo "3. Current MCP server configuration in Rider:"
echo "   llm.mcpServers.xml:"
cat /home/aaron/.config/JetBrains/Rider2026.1/options/llm.mcpServers.xml

echo ""
echo "4. MCP Tools Store (McpToolsStoreService.xml):"
cat /home/aaron/.config/JetBrains/Rider2026.1/options/McpToolsStoreService.xml

echo ""
echo "=== IMPORTANT ==="
echo "The agency-agents server is configured but tools are NOT in McpToolsStoreService.xml"
echo "This might be why the tools don't appear in the UI."
echo ""
echo "Possible solutions:"
echo "1. Restart Rider completely (File → Exit, then reopen)"
echo "2. Use Copilot Chat and explicitly ask: 'What MCP tools are available?'"
echo "3. Check if there's a 'Refresh MCP Servers' action in Tools menu"
echo "4. The tools might be accessible even if not shown in the store - try using them!"
echo ""

