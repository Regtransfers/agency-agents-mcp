#!/bin/bash
# Quick MCP Status Check for Rider

echo "🔍 MCP Configuration Status Check"
echo "=================================="
echo ""

# 1. Check if Rider is running
echo "1️⃣  Checking if Rider is running..."
if pgrep -f "Rider" > /dev/null; then
    echo "   ⚠️  Rider IS RUNNING (PID: $(pgrep -f Rider | head -1))"
    echo "   ⚠️  You MUST restart Rider for MCP config to take effect!"
else
    echo "   ✅ Rider is not running"
fi
echo ""

# 2. Check mcpConfigPath
echo "2️⃣  Checking mcpConfigPath in github-copilot.xml..."
if grep -q "mcpConfigPath" ~/.config/JetBrains/Rider2025.3/options/github-copilot.xml 2>/dev/null; then
    echo "   ✅ mcpConfigPath is set:"
    grep "mcpConfigPath" ~/.config/JetBrains/Rider2025.3/options/github-copilot.xml | sed 's/^/      /'
else
    echo "   ❌ mcpConfigPath NOT FOUND - run fix-copilot-config.sh"
fi
echo ""

# 3. Check mcp.json exists
echo "3️⃣  Checking MCP server config..."
if [ -f ~/.config/github-copilot/intellij/mcp.json ]; then
    echo "   ✅ mcp.json exists"
    cat ~/.config/github-copilot/intellij/mcp.json | sed 's/^/      /'
else
    echo "   ❌ mcp.json NOT FOUND"
fi
echo ""

# 4. Check wrapper script
echo "4️⃣  Checking wrapper script..."
if [ -x ~/.local/bin/mcp-agency-agents ]; then
    echo "   ✅ Wrapper script exists and is executable"
else
    echo "   ❌ Wrapper script missing or not executable"
fi
echo ""

# 5. Test wrapper
echo "5️⃣  Testing wrapper script..."
if timeout 5 ~/.local/bin/mcp-agency-agents <<< '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' 2>/dev/null | grep -q "list_agents"; then
    echo "   ✅ Wrapper works! Returns tools correctly"
else
    echo "   ❌ Wrapper test failed"
fi
echo ""

# 6. Check remote server
echo "6️⃣  Checking remote server..."
if curl -s -m 5 https://agency-agents-mcp.regtransfers.dev/health | grep -q "ok"; then
    echo "   ✅ Remote server is UP"
else
    echo "   ❌ Remote server is DOWN or unreachable"
fi
echo ""

echo "=================================="
echo "📋 Summary:"
echo ""

if pgrep -f "Rider" > /dev/null; then
    echo "🚨 ACTION REQUIRED: Close and restart Rider!"
    echo "   The config is correct, but Rider needs to reload it."
    echo ""
    echo "   Steps:"
    echo "   1. Save your work"
    echo "   2. Close Rider completely"
    echo "   3. Restart Rider"
    echo "   4. Start a NEW Copilot chat (+ button)"
    echo "   5. Ask: 'list available agents'"
else
    echo "✅ Configuration looks good! Start Rider and test MCP."
fi

