#!/bin/bash

# This script fixes the llm.mcpServers.xml file that Rider keeps resetting
# Run this AFTER closing Rider completely

set -e

echo "========================================="
echo "Rider MCP Configuration Fixer"
echo "========================================="
echo ""

# Check if Rider is running
if pgrep -f "rider.*agency-agents-mcp" > /dev/null; then
    echo "❌ ERROR: Rider is still running!"
    echo ""
    echo "You MUST close Rider completely before running this script."
    echo "Rider overwrites these files on exit, so changes made while"
    echo "Rider is running will be lost."
    echo ""
    echo "1. Close Rider completely"
    echo "2. Wait 5 seconds"
    echo "3. Run this script again"
    exit 1
fi

echo "✓ Rider is not running"
echo ""

CONFIG_FILE="$HOME/.config/JetBrains/Rider2025.3/options/llm.mcpServers.xml"

# Backup the file
echo "Creating backup..."
cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
echo "✓ Backup created"
echo ""

# Fix the file
echo "Fixing llm.mcpServers.xml..."
cat > "$CONFIG_FILE" << 'EOF'
<application>
  <component name="McpApplicationServerCommands" modifiable="true" autoEnableExternalChanges="false">
    <commands>
      <McpServerConfigurationProperties>
        <option name="allowedToolsNames" />
        <option name="command" value="/home/aaron/.local/bin/mcp-agency-agents" />
        <option name="enabled" value="true" />
        <option name="name" value="agency-agents" />
      </McpServerConfigurationProperties>
    </commands>
    <urls />
  </component>
</application>
EOF

echo "✓ File fixed!"
echo ""
echo "Verifying..."
if grep -q 'option name="command"' "$CONFIG_FILE"; then
    echo "✓ Command option is present"
else
    echo "❌ ERROR: Command option not found!"
    exit 1
fi

echo ""
echo "========================================="
echo "SUCCESS!"
echo "========================================="
echo ""
echo "Now you can:"
echo "1. Start Rider"
echo "2. Open Copilot Chat"
echo "3. Ask: 'List available agents'"
echo ""
echo "The MCP server should start and load 160+ agents."
echo ""

