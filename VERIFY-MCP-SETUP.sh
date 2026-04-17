#!/bin/bash

echo "========================================="
echo "MCP Setup Verification Script"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "1. Checking wrapper script..."
if [ -x ~/.local/bin/mcp-agency-agents ]; then
    echo -e "${GREEN}✓${NC} Wrapper script exists and is executable"
else
    echo -e "${RED}✗${NC} Wrapper script missing or not executable"
    echo "   Run: curl -o ~/.local/bin/mcp-agency-agents https://..."
fi

echo ""
echo "2. Checking bridge script..."
if [ -x ~/.local/bin/mcp-http-bridge ]; then
    echo -e "${GREEN}✓${NC} Bridge script exists and is executable"
else
    echo -e "${RED}✗${NC} Bridge script missing or not executable"
    echo "   Run: curl -o ~/.local/bin/mcp-http-bridge https://..."
fi

echo ""
echo "3. Checking Rider MCP config..."
if [ -f ~/.config/JetBrains/Rider2025.3/mcp_config.json ]; then
    echo -e "${GREEN}✓${NC} Rider MCP config exists"
    cat ~/.config/JetBrains/Rider2025.3/mcp_config.json
else
    echo -e "${RED}✗${NC} Rider MCP config missing"
fi

echo ""
echo "4. Testing wrapper script manually..."
RESULT=$(~/.local/bin/mcp-agency-agents <<< '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' 2>&1)
if echo "$RESULT" | grep -q '"name":"list_agents"'; then
    echo -e "${GREEN}✓${NC} Wrapper script works! Returns 9 tools"
else
    echo -e "${RED}✗${NC} Wrapper script failed or returned unexpected output"
    echo "$RESULT" | head -5
fi

echo ""
echo "5. Checking Rider MCP logs..."
if [ -f ~/.cache/JetBrains/Rider2025.3/log/mcp/agency-agents.log ]; then
    LAST_LOG=$(tail -1 ~/.cache/JetBrains/Rider2025.3/log/mcp/agency-agents.log)
    echo -e "${YELLOW}Last log entry:${NC}"
    echo "$LAST_LOG"
else
    echo -e "${YELLOW}⚠${NC} No MCP log file yet - Rider hasn't tried to start MCP"
    echo "   This is NORMAL if you haven't opened Copilot Chat yet"
fi

echo ""
echo "========================================="
echo "Status Summary:"
echo "========================================="
echo ""
echo "If all checks pass but you don't see agents in Copilot:"
echo ""
echo "1. Open GitHub Copilot Chat in Rider"
echo "2. Ask: 'List available agents'"
echo "3. This will trigger MCP server startup"
echo "4. Check logs again: tail -f ~/.cache/JetBrains/Rider2025.3/log/mcp/agency-agents.log"
echo ""
echo "The MCP server starts ON-DEMAND when you use Copilot Chat,"
echo "not when Rider starts!"
echo ""

