#!/bin/bash
# Test Rider 2026.1 MCP Integration

echo "=== Rider 2026.1 MCP Diagnostic ==="
echo ""

echo "1. MCP Server Executable:"
ls -lh /home/aaron/.local/bin/mcp-agency-agents
echo ""

echo "2. Testing MCP Server Response:"
(echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'; sleep 0.3) | /home/aaron/.local/bin/mcp-agency-agents 2>&1 | head -1
echo ""
echo "   Testing tools/list (showing first 3 tools):"
(echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'; echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'; sleep 0.3) | /home/aaron/.local/bin/mcp-agency-agents 2>&1 | grep -o '"name":"[^"]*"' | head -9
echo ""

echo "3. Rider 2026.1 MCP Config Location:"
echo "   Config path from github-copilot.xml:"
grep "mcpConfigPath" /home/aaron/.config/JetBrains/Rider2026.1/options/github-copilot.xml
echo ""

echo "4. MCP Config Content:"
cat /home/aaron/.config/github-copilot/intellij/mcp.json
echo ""

echo "5. MCP Server Settings (llm.mcpServers.xml):"
cat /home/aaron/.config/JetBrains/Rider2026.1/options/llm.mcpServers.xml
echo ""

echo "6. Checking if MCP plugin is loaded:"
grep -i "mcpserver" /home/aaron/.cache/JetBrains/Rider2026.1/log/idea.log | head -3
echo ""

echo "=== End of Diagnostic ==="

